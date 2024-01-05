// requires:
// 	 instance_id
// 	 status (online, offline, maintenance)
routerAdd('POST', '/toggleinstance', async (c) => {
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
	if (!data?.instance_id) {
		return c.json(200, { data: null, error: 'instance_id is required' })
	}
	if (!data?.status) {
		return c.json(200, { data: null, error: 'status is required' })
	}
	if (data?.status !== 'online' && data?.status !== 'offline' && data?.status !== 'maintenance') {
		return c.json(200, { data: null, error: 'invalid status' })
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
				`select id, port, site_domain, domain, owner, ownertype from instance_view where id = '${data?.instance_id}'`
			)
			.all(instanceData) // throw an error on db failure
		// console.log('toggleinstance instanceData', JSON.stringify(instanceData, null, 2))
		if (instanceData.length !== 1) {
			return c.json(200, { data: null, error: 'instance not found' })
		}
		if (instanceData[0].owner !== user.id) {
			return c.json(200, { data: null, error: 'not your project' })
		}
	} catch (instanceDataError) {
		console.log('instanceDataError', instanceDataError)
		return c.json(200, { data: null, error: instanceDataError?.value?.error() || instanceDataError })
	}
	// console.log('setting site_domain, domain, port, status')
	let site_domain = instanceData[0].site_domain;
	let domain = instanceData[0].domain;
	let port = instanceData[0].port;
	let status = '';
	switch (data?.status) {
		case 'online':
			status = port.toString();
			break;
		case 'offline':
			status = '9999'
			break;
		case 'maintenance':
			status = '9998'
			break;
		default:
			return c.json(200, { data: null, error: 'invalid status' })
	}
	// get the site info
	try {
		const res = $http.send({
			url: `http://${site_domain}:5000/toggleinstance`,
			method: 'POST',
			body: JSON.stringify({
				domain: domain + '.' + site_domain,
				port: port.toString(),
				status: status, 
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
	} catch (toggleinstanceError) {
		console.log('toggleinstanceError', toggleinstanceError)
		return c.json(200, { data: null, error: toggleinstanceError?.value?.error() || toggleinstanceError })		
	}
	// update the instance record
	try {
		$app
			.dao()
			.db()
			.newQuery(
				`update project_instance set instance_status = '${data?.status}' where id = '${data?.instance_id}'`
			)
			.execute() // throw an error on db failure
		return c.json(200, { data: 'ok', error: null })
	} catch (instanceUpdateError) {
		console.log('instanceUpdateError', instanceUpdateError)
		return c.json(200, { data: null, error: instanceUpdateError?.value?.error() || instanceUpdateError })
	}
})


