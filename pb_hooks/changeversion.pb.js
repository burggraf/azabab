// requires:
// 	 instance_id
// 	 status (online, offline, maintenance)
routerAdd('POST', '/changeversion', async (c) => {
	// read the body via the cached request object
	// (this method is commonly used in hook handlers because it allows reading the body more than once)
	const data = $apis.requestInfo(c).data

	const info = $apis.requestInfo(c)
	// const admin  = info.admin;      // empty if not authenticated as admin
	const user = info.authRecord // empty if not authenticated as regular auth record
	// console.log('info', JSON.stringify(info, null, 2));
	// console.log('admin', JSON.stringify(admin, null, 2));
	if (!user) {
		return c.json(200, { data: null, error: 'not logged in' })
	}
	if (!data?.project_id) {
		return c.json(200, { data: null, error: 'project_id is required' })
	}
	if (!data?.pb_version) {
		return c.json(200, { data: null, error: 'pb_version is required' })
	}
	// console.log('toggleinstance', JSON.stringify(data, null, 2))
	let instanceData;
	try {
		// create the projectData record
		instanceData = arrayOf(
			new DynamicModel({
				id: '',
				port: 0,
				site_domain: '',
				domain: '',
				owner: '',
				ownertype: ''
			})
		)
		$app
			.dao()
			.db()
			.newQuery(
				`select id, port, site_domain, domain, owner, ownertype from instance_view where project_id = '${data?.project_id}'`
			)
			.all(instanceData) // throw an error on db failure
		// console.log('toggleinstance instanceData', JSON.stringify(instanceData, null, 2))
		if (instanceData.length < 1) {
			return c.json(200, { data: null, error: 'instance not found' })
		}
		if (instanceData[0].owner !== user.id) {
			return c.json(200, { data: null, error: 'not your project' })
		}
	} catch (instanceDataError) {
		console.log('instanceDataError', instanceDataError)
		return c.json(200, { data: null, error: instanceDataError?.value?.error() || instanceDataError })
	}
	for (let i = 0; i < instanceData.length; i++) {
		const instance = instanceData[i];
		// console.log('setting site_domain, domain, port, status')
		let site_domain = instance.site_domain;
		let domain = instance.domain;
		let port = instance.port;
		let pb_version = data?.pb_version;
		// get the site info
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
				return c.json(200, { data: null, error: res.json.error || res.json })
			} 
		} catch (changeversionError) {
			console.log('changeversionError', changeversionError)
			return c.json(200, { data: null, error: changeversionError?.value?.error() || changeversionError })		
		}

	}
	return c.json(200, { data: 'ok', error: null })
})


