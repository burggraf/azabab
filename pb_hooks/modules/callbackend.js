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
        console.log('callbackend toggleinstance res', JSON.stringify(res, null, 2))
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

module.exports = { toggleinstance, sync, changeversion, createuser }