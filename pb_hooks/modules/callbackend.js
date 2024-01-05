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

module.exports = { toggleinstance }