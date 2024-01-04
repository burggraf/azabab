/// <reference path="../pb_data/types.d.ts" />
// **** add ssh keys to an instance ****
routerAdd('GET', '/resync/:project_id', (c) => {
	const project_id = c.pathParam('project_id')
	if (!project_id) {
		return c.json(200, { data: null, error: 'project_id is required' })
	}
	const info = $apis.requestInfo(c)
	const admin = info.admin // empty if not authenticated as admin
	let user = info.authRecord // empty if not authenticated as regular auth record
	if (!user) {
		return c.json(200, { data: null, error: 'not logged in' })
	}
	let instances;
	try {
		instances = arrayOf(
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
				`select type, owner, ownertype, port, site_domain from instance_view where project_id = '${project_id}' order by type`
			)
			.all(instances) // throw an error on db failure
			if (instances.length < 2) {
				return c.json(200, { data: null, error: 'less than 2 instances found' })
			}	
	} catch (instancesErr) {
		return c.json(200, { data: null, error: instancesErr?.value?.error() || instancesErr })
	}
	if (instances[0].owner !== user.id) {
		return c.json(200, { data: null, error: 'not your project' })
	}
	const primary = instances[0]
	if (primary.type !== 'primary') {
		return c.json(200, { data: null, error: 'first instance is not a primary instance' })
	}
	const sync = async (site_domain, port, direction, type) => {
		try {
			const res = $http.send({
				url:     `http://${site_domain}:5000/sync`,
				method:  "POST",
				body:    JSON.stringify({
					"direction": direction,
					"port": port.toString(),
					"destination": "la" // los angeles (for now)
				}),
				headers: {"content-type": "application/json",
						  "Authorization": "your_predefined_auth_token"
						},
				timeout: 120, // in seconds
			})
			if (res.json?.data !== "Sync operation complete") {
				console.log('sync failed for port ' + port + ' ' + direction + ' on ' + site_domain)
				console.log('res', JSON.stringify(res, null, 2))
				return c.json(200, { data: null, error: res.json?.error || res.raw })
			}
		} catch (httpError) {
			console.log('httpError', JSON.stringify(httpError))
			return c.json(200, { data: null, error: httpError?.value?.error() || httpError })
		}			
	}
	// sync the primary instance to S3
	const sync_all_instances = async () => {
		try {
			const primary_sync = sync(primary.site_domain, primary.port, 'up', primary.type)
			for (let i = 1; i < instances.length; i++) {
				const instance = instances[i]
				if (instance.type === 'primary') {
					continue
				}
				await sync(instance.site_domain, instance.port, 'down', instance.type)
			}	
		} catch (err) {
			return c.json(200, { data: null, error: err?.value?.error() || err })
		}
		return c.json(200, { data: `resynced ${instances.length} instances`, error: null })
	
	}
	sync_all_instances();

})

