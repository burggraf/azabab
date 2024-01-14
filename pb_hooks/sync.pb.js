/// <reference path="../pb_data/types.d.ts" />

// **** add ssh keys to an instance ****
routerAdd('GET', '/sync/:instance_id/:direction', (c) => {
	const instance_id = c.pathParam('instance_id')
	const direction = c.pathParam('direction')
	console.log('**** sync ****', instance_id, direction)
	if (!instance_id) {
		return c.json(200, { data: null, error: 'instance_id is required' })
	}
	if (!direction || (direction !== 'up' && direction !== 'down')) {
		return c.json(200, { data: null, error: 'direction must be up or down' })
	}
	const info = $apis.requestInfo(c)
	const admin = info.admin // empty if not authenticated as admin
	let user = info.authRecord // empty if not authenticated as regular auth record
	if (!user) {
		return c.json(200, { data: null, error: 'not logged in' })
	}
	try {
		const instanceData = arrayOf(
			new DynamicModel({
				type: '',
				owner: '',
				ownertype: '',
				port: 0,
				site_domain: '',
			})
		)
		$app
			.dao()
			.db()
			.newQuery(
				`SELECT type, owner, ownertype, port, site_domain
				from instance_view
				where id = '${instance_id}' limit 1` 
			)
			.all(instanceData) // throw an error on db failure
		if (instanceData.length === 0) {
			return c.json(200, { data: null, error: 'instance not found' })
		}
		if (instanceData[0].owner !== user.id) {
			return c.json(200, { data: null, error: 'you are not the project instance owner' })
		}
		const instance = instanceData[0]
		let res;
		try {
			console.log(`http://${instance.site_domain}:5000/sync`);
			console.log('direction', direction)
			console.log('port', instance.port.toString())
			console.log('destination', 'la')
			res = $http.send({
				url:     `http://${instance.site_domain}:5000/sync`,
				method:  "POST",
				body:    JSON.stringify({
					"direction": direction,
					"port": instance.port.toString(),
					"destination": "la" // los angeles (for now)
				}),
				headers: {
					"content-type": "application/json",
					"Authorization": "your_predefined_auth_token"
				},
				timeout: 120, // in seconds
			})	
			console.log('res', JSON.stringify(res,null,2))
		} catch (httpError) {
			// console.log('httpError', httpError)
			return c.json(200, { data: null, error: httpError.value.error() })
		}		
		return c.json(200, { data: res?.json?.data || "ok", error: null })
	} catch (e){
		return c.json(200, { data: null, error: e.value.error() || e })
	}
		
})

