/// <reference path="../pb_data/types.d.ts" />
// **** add ssh keys to an instance ****
routerAdd('GET', '/resync/:project_id', (c) => {
	const { toggleinstance, sync } = require(`${__hooks}/modules/callbackend.js`)
	const { execute, select } = require(`${__hooks}/modules/sql.js`)

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
	let instances
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
	const toggleStatus = async (site_domain, port, status, instance_id) => {
		let newStatus = ''
		switch (status) {
			case 'online':
				newStatus = port.toString()
				break
			case 'offline':
				newStatus = '9999'
				break
			case 'maintenance':
				newStatus = '9998'
				break
			default:
				return c.json(200, { data: null, error: 'invalid status: ' + status })
		}

		const { data: d1, error: e1 } = toggleinstance(domain, site_domain, port.toString(), newStatus)
		if (e1) return c.json(200, { data: null, error: e1 })

		// update the instance record
		const { data: updateData, error: updateError } = execute(
			`update project_instance set instance_status = '${status}' where id = '${instance_id}'`
		)
		if (updateError) return c.json(200, { data: null, error: updateError })

		// sync the primary instance to S3
		const sync_all_instances = async () => {
			try {
				// take all instances offline
				for (let i = 0; i < instances.length; i++) {
					const instance = instances[i]
					toggleStatus(instance.site_domain, instance.port, 'offline', instance.id)
				}
			} catch (toggleinstanceError) {
				return c.json(200, {
					data: null,
					error: toggleinstanceError?.value?.error() || toggleinstanceError,
				})
			}
			try {
				const { data: primarySyncData, error: primarySyncError } = sync(primary.site_domain, primary.port, 'up')
				if (primarySyncError) {
					return c.json(200, { data: null, error: primarySyncError })
				}
				for (let i = 1; i < instances.length; i++) {
					const instance = instances[i]
					if (instance.type === 'primary') {
						continue
					}
					const { data: syncData, error: syncError } = 
						sync(instance.site_domain, instance.port, 'down')
					if (syncError) {
						return c.json(200, { data: null, error: syncError })
					}
				}
			} catch (err) {
				return c.json(200, { data: null, error: err?.value?.error() || err })
			}
			try {
				// take all instances offline
				for (let i = 0; i < instances.length; i++) {
					const instance = instances[i]
					toggleStatus(instance.site_domain, instance.port, 'online', instance.id)
				}
			} catch (toggleinstanceError) {
				return c.json(200, {
					data: null,
					error: toggleinstanceError?.value?.error() || toggleinstanceError,
				})
			}

			return c.json(200, { data: `resynced ${instances.length} instances`, error: null })
		}
		sync_all_instances()
	}
})