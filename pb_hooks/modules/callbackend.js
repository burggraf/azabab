const updateroutes = (project_id, current_user_id) => {
	const { select } = require(`${__hooks}/modules/sql.js`)
	const { data: instanceData, error: instanceError } = 
		select({port: 0, site_domain: '', domain: '', owner: '', ownertype: '', project_metadata: {}, instance_status: ''},
		`select port, site_domain, domain, owner, ownertype, project_metadata, instance_status 
         from instance_view 
         where project_id = '${project_id}' 
         order by type`);
    if (instanceError) return { data: null, error: instanceError };
	if (instanceData.length === 0) return { data: null, error: 'instance(s) not found' };
	if (instanceData[0].owner !== current_user_id) return { data: null, error: 'not your project' };	
    for (let i = 0; i < instanceData.length; i++) {
        const instance = instanceData[i];
        const port = instance.port.toString();
        const domain = instance.domain;
        const site_domain = instance.site_domain;
        const pb_version = instance.project_metadata?.get("pb_version") || 'v0.20.6';
        const otherServers = [];
        const instance_status = instance.instance_status;
        for (let j = 0; j < instanceData.length; j++) {
            const otherInstance = instanceData[j];
            if (otherInstance.site_domain !== instance.site_domain) {
                otherServers.push({
                    domain: otherInstance.domain,
                    site_domain: otherInstance.site_domain,
                    port: otherInstance.port,
                })
            }
        }
        let updateRouteTrials = 0;
        let updatedRoute = false;
        if (updateRouteTrials <= 3 && !updatedRoute) {
            const { data, error } = updateroute(port, domain, site_domain, pb_version, otherServers, instance_status);
            if (error) {
                console.log('got error from updateroute (port, domain, site_domain, error)',
                port, domain, site_domain, error)
                console.log('updateRouteTrials', updateRouteTrials)
                updateRouteTrials++;
                if (updateRouteTrials === 3) return { data: null, error: error };
            } else {
                updatedRoute = true;   
            }
        }
    } 
    return { data: 'OK', error: null };
}
const updateroute = (port, domain, site_domain, pb_version, otherServers, instance_status) => {
    let frontendRoute = frontendRouteTemplate;
    let backendRoute = backendRouteTemplate;
    let statusPort = port; // the standard port
    switch (instance_status) {
        case 'maintenance':
            statusPort = '9998';
            break;
        case 'offline':
            statusPort = '9999';
            break;
        default:
            statusPort = port;
    }
    frontendRoute = frontendRoute.replace(/\[PORT\]/g, port);
    frontendRoute = frontendRoute.replace(/\[STATUSPORT\]/g, statusPort);
    frontendRoute = frontendRoute.replace(/\[LOCAL_FQD\]/g, domain + '.' + site_domain);
    frontendRoute = frontendRoute.replace(/\[GLOBAL_FQD\]/g, domain + '.' + 'azabab.com');
    frontendRoute = frontendRoute.replace(/\[PB_VERSION\]/g, pb_version);
    backendRoute = backendRoute.replace(/\[PORT\]/g, port);
    backendRoute = backendRoute.replace(/\[STATUSPORT\]/g, statusPort);
    backendRoute = backendRoute.replace(/\[LOCAL_FQD\]/g, domain + '.' + site_domain);
    backendRoute = backendRoute.replace(/\[GLOBAL_FQD\]/g, domain + '.' + 'azabab.com');
    backendRoute = backendRoute.replace(/\[PB_VERSION\]/g, pb_version);
    let otherServersString = '';
    for (let i = 0; i < otherServers.length; i++) {
        const otherServer = otherServers[i];
        otherServersString += 
        `    server ${otherServer.site_domain}_${otherServer.port} ${otherServer.domain}.${otherServer.site_domain}:80 check\n`;
    }
    frontendRoute = frontendRoute.replace(/\[OTHER_SERVERS\]/g, otherServersString);
    backendRoute = backendRoute.replace(/\[OTHER_SERVERS\]/g, otherServersString);
    let retryCount = 0;
    // put the routing file on the server
    let updateRouteResponse;
    try {
        updateRouteResponse = $http.send({
            url: `http://${site_domain}:5000/updateroute`,
            method: 'POST',
            body: JSON.stringify({
                port: port,
                frontend: frontendRoute,
                backend: backendRoute,
            }),
            headers: {
                'content-type': 'application/json',
                Authorization: 'your_predefined_auth_token',
            },
            timeout: 120, // in seconds
        })
        if (updateRouteResponse.json?.error) {
            console.log('**********************************************')
            console.log('update route error (port, domain, site_domain, pb_version, otherServers, instance_status)', 
                    port, domain, site_domain, pb_version, otherServers, instance_status)
            console.log('**********************************************')
            return { data: null, error: updateRouteResponse.json.error || updateRouteResponse.json || updateRouteResponse.raw };                
        }  else {
            const ts = +new Date();
            let healthy = false;
            let tries = 0;
            while (!healthy && (+new Date()) - ts < 20000) {
                // only perform check once per second for 20 seconds
                const elapsed = (+new Date()) - ts;
                if (elapsed > (tries * 1000)) {
                    const result = checkHealth(domain + '.' + site_domain);
                    if (result === 200) {
                        healthy = true;
                        // return { data: res, error: null };
                    }
                    tries++;    
                }
            }
            if (!healthy) {
                return { data: null, error: 'health check failed' };    
            } else {
                return { data: updateRouteResponse, error: null };
            }
        }
    } catch (updaterouteError) {
        console.log('updaterouteError', updaterouteError);
        console.log('updateRouteResponse', JSON.stringify(updateRouteResponse, null, 2))
        return { data: null, error: updaterouteError?.value?.error() || updaterouteError };		
    }
}

const checkHealth = (domain) => {
    console.log('checkHealth: ',`https://${domain}/api/health`)
    const test = $http.send({
        url: `https://${domain}/api/health`,
        method: 'GET',
        timeout: 120, // in seconds                    
    })
    if (test.statusCode !== 200) console.log(`checkHealth https://${domain}/api/health status code ${test.statusCode}`)
    return test.statusCode;
}
const frontendRouteTemplate = `
    acl is_[PORT]_local hdr(host) -i [LOCAL_FQD]
    acl is_[PORT]_global hdr(host) -i [GLOBAL_FQD] 

    # Define the condition for primary server down
    acl primary_down_[PORT] nbsrv(backend_global_[PORT]_[GLOBAL_FQD]) lt 2

    # Backend selection based on ACLs
    use_backend backend_local_[PORT]_[LOCAL_FQD] if is_[PORT]_local
    use_backend backend_global_[PORT]_[GLOBAL_FQD] if is_[PORT]_global
`;
const backendRouteTemplate = `
# Backend for alpha_lax_hh_azabab_com
backend backend_local_[PORT]_[LOCAL_FQD]
    http-request set-header X-Original-URI %[url]
    http-request set-header X-Original-Port [PORT]
    http-request set-header X-PB-Version [PB_VERSION]
    server local_app_[PORT] 127.0.0.1:[STATUSPORT] check cookie [LOCAL_FQD]
    server local_error_handler_[PORT] 127.0.0.1:5000 backup cookie [LOCAL_FQD]

# Backend for backend_global_[PORT]_[GLOBAL_FQD]
backend backend_global_[PORT]_[GLOBAL_FQD]
    http-request set-header X-Original-URI %[url]
    http-request set-header X-Original-Port [PORT]
    http-request set-header X-PB-Version [PB_VERSION]

    balance roundrobin
    # option ssl-hello-chk
    stick-table type string len 50 size 30k expire 30m 
    stick on src

    # other servers below
    server global_app_[PORT] 127.0.0.1:[STATUSPORT] check
[OTHER_SERVERS]
    server global_error_handler_[PORT] 127.0.0.1:5000 backup
`;

const sync = async (sync_command, site_domain) => {
    console.log('**********************************************')
    console.log('callbackend: sync_command', sync_command);
    console.log('**********************************************')
    console.log('sync 01')
    try {
        console.log('sync 02')
        const data = {
            command: sync_command
        };
        console.log('sync 03')
        console.log('**********************************************')
        console.log(`calling: http://${site_domain}:5000/sync`)
        console.log('with data', JSON.stringify(data, null, 2));
        console.log('**********************************************')
        console.log('sync 04')
        const res = $http.send({
            url: `http://${site_domain}:5000/sync`,
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json',
                Authorization: 'your_predefined_auth_token',
            },
            timeout: 120, // in seconds
        })
        console.log('sync 05')
        console.log('**********************************************')
        console.log('callbackend: sync res', JSON.stringify(res, null, 2));
        console.log('**********************************************')
        if (res.json?.data !== 'Sync operation complete') {
            return { data: null, error: res.json?.error || res.raw };
        }
        else {
            return { data: res, error: null };        
        }
    } catch (httpError) {
        return { data: null, error: httpError?.value?.error() || httpError };
    }
}

const createuser = async (key) => {
    // key: {username,port,ssh_key_string, site}
    if (typeof key.port !== 'string') key.port = key.port.toString();
    let res;
    try {
        res = await $http.send({
            url:     `http://${key.site}:5000/createuser`,
            method:  "POST",
            body:    JSON.stringify({
                "username": key.username, 
                "port": key.port,
                "ssh_keys": key.ssh_key_string,
            }),
            headers: {
                "content-type": "application/json",
                "Authorization": "your_predefined_auth_token"
            },
            timeout: 120, // in seconds
        })	
        return c.json(res.statusCode, JSON.stringify(res.json))
    } catch (httpError) {
        console.log('createuser failuser, httpError', JSON.stringify(httpError,null, 2))
        return {data: null, error: httpError.value.error() }
    }
	
}
const configureserver = async (fqd, rclone_conf, nats_server_conf) => {
    // key: {username,port,ssh_key_string, site}
    let res;
    try {
        res = await $http.send({
            url:     `http://${fqd}:5000/configureserver`,
            method:  "POST",
            body:    JSON.stringify({
                rclone_conf: rclone_conf,
                nats_server_conf: nats_server_conf,
            }),
            headers: {
                "content-type": "application/json",
                "Authorization": "your_predefined_auth_token"
            },
            timeout: 120, // in seconds
        })	
        return {data: res.raw, error: null};
    } catch (httpError) {
        console.log('configureserver, httpError', JSON.stringify(httpError,null, 2))
        return {data: null, error: httpError.value.error() };
    }
}

module.exports = { updateroutes, sync, createuser, configureserver }