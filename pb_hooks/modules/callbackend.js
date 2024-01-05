const toggleinstance = (domain, site_domain, port, status) => {
    console.log('callbackend toggleinstance domain', domain)
    console.log('callbackend toggleinstance site_domain', site_domain)
    console.log('callbackend toggleinstance port', port)
    console.log('callbackend toggleinstance status', status)
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


module.exports = { toggleinstance, sync }