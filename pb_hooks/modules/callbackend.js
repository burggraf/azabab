const updateroutes = (project_id, current_user_id) => {
	const { select } = require(`${__hooks}/modules/sql.js`)
    console.log('updateroutes 01')
	const { data: instanceData, error: instanceError } = 
		select({port: 0, site_domain: '', domain: '', owner: '', ownertype: '', project_metadata: {}, instance_status: ''},
		`select port, site_domain, domain, owner, ownertype, project_metadata, instance_status 
         from instance_view 
         where project_id = '${project_id}' 
         order by type`);
    console.log('updateroutes 02')
    console.log('instanceData', JSON.stringify(instanceData, null, 2))
    console.log('instanceError', JSON.stringify(instanceError, null, 2))
    if (instanceError) return { data: null, error: instanceError };
	if (instanceData.length === 0) return { data: null, error: 'instance(s) not found' };
	if (instanceData[0].owner !== current_user_id) return { data: null, error: 'not your project' };	
    console.log('updateroutes 03')
    for (let i = 0; i < instanceData.length; i++) {
        const instance = instanceData[i];
        const port = instance.port.toString();
        const domain = instance.domain;
        const site_domain = instance.site_domain;
        const pb_version = instance.project_metadata?.pb_version || 'v0.20.6';
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
        console.log('calling updateroute', port, domain, site_domain, pb_version, otherServers, instance_status)
        const { data, error } = updateroute(port, domain, site_domain, pb_version, otherServers, instance_status);
        if (error) return { data: null, error: error };
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
        `    server ${otherServer.site_domain}_${otherServer.port} ${otherServer.domain}.${otherServer.site_domain}:443 check ssl verify none cookie s${i+3}\n`;
    }
    frontendRoute = frontendRoute.replace(/\[OTHER_SERVERS\]/g, otherServersString);
    backendRoute = backendRoute.replace(/\[OTHER_SERVERS\]/g, otherServersString);

    console.log(`calling http://${site_domain}:5000/updateroute`)
    // put the routing file on the server
    try {
        const res = $http.send({
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
        console.log('updateroute res', JSON.stringify(res, null, 2));
        if (res.json?.error) {
            return { data: null, error: res.json.error || res.json || res.raw };                
        }  else {
            const ts = +new Date();
            let healthy = false;
            let tries = 0;
            while (!healthy && ts - (+new Date()) < 10000) {
                // only perform check once per second for 10 seconds
                const elapsed = (+new Date()) - ts;
                if (elapsed > (tries * 1000)) {
                    console.log('check health', tries);
                    const result = checkHealth(domain + '.' + site_domain);
                    if (result === 200) {
                        console.log('health check passed, continuing...')
                        healthy = true;
                        // return { data: res, error: null };
                    }
                    tries++;    
                }
            }
            if (!healthy) {
                console.log('health check failed, returning...');
                return { data: null, error: 'health check failed' };    
            } else {
                console.log('we should now move on to the next instance...')
                return { data: res, error: null };
            }
        }
    } catch (updaterouteError) {
        console.log('updaterouteError', updaterouteError);
        return { data: null, error: updaterouteError?.value?.error() || updaterouteError };		
    }

}

const checkHealth = (domain) => {
    console.log('**** checkHealth domain', domain)
    const test = $http.send({
        url: `https://${domain}/api/health`,
        method: 'GET',
        timeout: 120, // in seconds                    
    })
    console.log('**** checkHealth test results', JSON.stringify(test, null, 2))
    return test.statusCode;
}
const frontendRouteTemplate = `
    acl is_[PORT]_local hdr(host) -i [LOCAL_FQD]
    acl is_[PORT]_global hdr(host) -i [GLOBAL_FQD] 

    # Define the condition for primary server down
    acl primary_down_[PORT] nbsrv(backend_[PORT]_global) lt 2


    # Backend selection based on ACLs
    use_backend backend_[PORT]_local if is_[PORT]_local
    use_backend backend_[PORT]_global if is_[PORT]_global
`;
const backendRouteTemplate = `
# Backend for alpha_lax_hh_azabab_com
backend backend_[PORT]_local
    http-request set-header X-Original-URI %[url]
    http-request set-header X-Original-Port [PORT]
    http-request set-header X-PB-Version v0.20.6
    server local_app_[PORT] 127.0.0.1:[STATUSPORT] check
    server local_error_handler_[PORT] 127.0.0.1:5000 backup

# Backend for backend_[PORT]_global
backend backend_[PORT]_global
    http-request set-header X-Original-URI %[url]
    http-request set-header X-Original-Port [PORT]
    http-request set-header X-PB-Version v0.20.6
    balance roundrobin
    stick-table type string len 50 size 200k expire 30m
    stick on cookie(SERVERID)
    server global_app_[PORT] 127.0.0.1:[STATUSPORT] check cookie s1
    server global_error_handler_[PORT] 127.0.0.1:5000 backup cookie s2
    # other servers below
[OTHER_SERVERS]
`;

const sync = async (site_domain, port, direction) => {
    console.log('callbackend sync 01', site_domain, port, direction)
    if (typeof port !== 'string') port = port.toString()
    try {
        console.log('callbackend sync 02', `http://${site_domain}:5000/sync`)

        const res = $http.send({
            url: `http://${site_domain}:5000/sync`,
            method: 'POST',
            body: JSON.stringify({
                direction: direction,
                port: port,
                destination: 'la', // los angeles (for now)
            }),
            headers: {
                'content-type': 'application/json',
                Authorization: 'your_predefined_auth_token',
            },
            timeout: 120, // in seconds
        })
        console.log('callbackend sync 03', JSON.stringify(res, null, 2))
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

const changeversion = (domain, site_domain, port, pb_version) => {
    if (typeof port !== 'string') port = port.toString();
    try {
        const res = $http.send({
            url: `http://${site_domain}:5000/changeversion`,
            method: 'POST',
            body: JSON.stringify({
                domain: domain + '.' + site_domain,
                port: port.toString(),
                pb_version: pb_version, 
            }),
            headers: {
                'content-type': 'application/json',
                Authorization: 'your_predefined_auth_token',
            },
            timeout: 120, // in seconds
        })
        if (res.json?.error) {
            return { data: null, error: res.json.error || res.json || res.raw };
        } else {
            return { data: res, error: null };
        }
    } catch (changeversionError) {
        return { data: null, error: changeversionError?.value?.error() || changeversionError }	
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
    console.log('callbackend configureserver 01', fqd, rclone_conf.length, nats_server_conf.length)
    // key: {username,port,ssh_key_string, site}
    let res;
    console.log(`http://${fqd}:5000/configureserver`);
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
        console.log('res', JSON.stringify(res, null, 2))
        console.log('returning: ', JSON.stringify({data: res.raw, error: null}, null, 2))
        return {data: res.raw, error: null};
    } catch (httpError) {
        console.log('configureserver, httpError', JSON.stringify(httpError,null, 2))
        return {data: null, error: httpError.value.error() };
    }
}

module.exports = { updateroutes, sync, changeversion, createuser, configureserver }