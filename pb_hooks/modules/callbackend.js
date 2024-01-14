const updateroutes = (project_id, current_user_id) => {
    let ts = +new Date();
	const { select } = require(`${__hooks}/modules/sql.js`)
	const { data: instanceData, error: instanceError } = 
		select({port: 0, site_domain: '', domain: '', owner: '', ownertype: '', project_metadata: {}},
		`select port, site_domain, domain, owner, ownertype, project_metadata 
         from instance_view 
         where project_id = '${project_id}' 
         order by type`);
	if (instanceError) return { data: null, error: instanceError };
	if (instanceData.length === 0) return { data: null, error: 'instance(s) not found' };
	if (instanceData[0].owner !== current_user_id) return { data: null, error: 'not your project' };	
    for (let i = 0; i < instanceData.length; i++) {
        const instance = instanceData[i];
        let frontendRoute = frontendRouteTemplate;
        let backendRoute = backendRouteTemplate;
        frontendRoute = frontendRoute.replace(/\[PORT\]/g, instance.port.toString());
        frontendRoute = frontendRoute.replace(/\[LOCAL_FQD\]/g, instance.domain + '.' + instance.site_domain);
        frontendRoute = frontendRoute.replace(/\[GLOBAL_FQD\]/g, instance.domain + '.' + 'azabab.com');
        frontendRoute = frontendRoute.replace(/\[PB_VERSION\]/g, instance.project_metadata?.pb_version || 'v0.20.5');
        backendRoute = backendRoute.replace(/\[PORT\]/g, instance.port.toString());
        backendRoute = backendRoute.replace(/\[LOCAL_FQD\]/g, instance.domain + '.' + instance.site_domain);
        backendRoute = backendRoute.replace(/\[GLOBAL_FQD\]/g, instance.domain + '.' + 'azabab.com');
        backendRoute = backendRoute.replace(/\[PB_VERSION\]/g, instance.project_metadata?.pb_version || 'v0.20.5');
        let otherServers = '';
        for (let j = 0; j < instanceData.length; j++) {
            const otherInstance = instanceData[j];
            if (otherInstance.site_domain !== instance.site_domain) {
                otherServers += 
                `server ${otherInstance.site_domain}_${otherInstance.port} ${otherInstance.domain}.${otherInstance.site_domain}:443 check ssl verify none\n`;
            }
        }
        frontendRoute = frontendRoute.replace(/\[OTHER_SERVERS\]/g, otherServers);
        backendRoute = backendRoute.replace(/\[OTHER_SERVERS\]/g, otherServers);
            
        // put the routing file on the server
        try {
            const res = $http.send({
                url: `http://${instance.site_domain}:5000/updateroute`,
                method: 'POST',
                body: JSON.stringify({
                    port: instance.port.toString(),
                    frontend: frontendRoute,
                    backend: backendRoute,
                }),
                headers: {
                    'content-type': 'application/json',
                    Authorization: 'your_predefined_auth_token',
                },
                timeout: 120, // in seconds
            })
            if (res.json?.error) {
                return { data: null, error: res.json.error || res.json || res.raw };                
            }  else {
                let tries = 0;
                while (tries < 5) {
                    const result = checkHealth(instance.domain + '.' + instance.site_domain);
                    if (result === 200) {
                        return { data: res, error: null };
                    }
                    tries++;
                }
                return { data: null, error: 'health check failed' };
            }
        } catch (updaterouteError) {
            return { data: null, error: updaterouteError?.value?.error() || updaterouteError };		
        }
    }

    return { data: 'OK', error: null };
}
const checkHealth = (domain) => {
    const test = $http.send({
        url: `https://${domain}/api/health`,
        method: 'GET',
        timeout: 120, // in seconds                    
    })
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
    http-request set-header X-PB-Version v0.20.5
    server local_app_[PORT] 127.0.0.1:[PORT] check
    server local_error_handler_[PORT] 127.0.0.1:5000 backup

# Backend for backend_[PORT]_global
backend backend_[PORT]_global
    http-request set-header X-Original-URI %[url]
    http-request set-header X-Original-Port [PORT]
    http-request set-header X-PB-Version v0.20.5
    balance roundrobin
    stick-table type string len 50 size 200k expire 30m
    stick on cookie(SERVERID)
    server global_app_[PORT] 127.0.0.1:[PORT] check
    server global_error_handler_[PORT] 127.0.0.1:5000 backup

    # add any other servers below
    [OTHER_SERVERS]
    #server west-3_[PORT] alpha.west-3.azabab.com:443 check ssl verify none
    #server west-4_[PORT] alpha.west-4.azabab.com:443 check ssl verify none
`;

const toggleinstance = (domain, site_domain, port, status) => {
    if (typeof port !== 'string') port = port.toString();
    try {
        const res = $http.send({
            url: `http://${site_domain}:5000/toggleinstance`,
            method: 'POST',
            body: JSON.stringify({
                domain: domain + '.' + site_domain,
                port: port,
                status: status, 
            }),
            headers: {
                'content-type': 'application/json',
                Authorization: 'your_predefined_auth_token',
            },
            timeout: 120, // in seconds
        })
        if (res.json?.error) {
            return { data: null, error: res.json.error || res.json || res.raw };
        }  else {
            return { data: res, error: null };
        }
    } catch (toggleinstanceError) {
        return { data: null, error: toggleinstanceError?.value?.error() || toggleinstanceError };		
    }
}

const sync = async (site_domain, port, direction) => {
    if (typeof port !== 'string') port = port.toString()
    try {
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

module.exports = { updateroutes, toggleinstance, sync, changeversion, createuser }