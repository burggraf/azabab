// requires:
// 	 instance_id
// 	 status (online, offline, maintenance)
routerAdd('POST', '/toggleinstance', async (c) => {
	const { toggleinstance } = require(`${__hooks}/modules/callbackend.js`)
	const { execute, select } = require(`${__hooks}/modules/sql.js`)
	// console.log('toggleinstance got module toggleinstance', toggleinstance)
	// console.log('toggleinstance got module execute', execute)
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
	console.log('toggleinstance', data?.instance_id, data?.status)
	const { data: instanceData, error: instanceError } = 
		select({id: '',port: 0, site_domain: '', domain: '', owner: '', ownertype: ''},
		`select id, port, site_domain, domain, owner, ownertype from instance_view where id = '${data?.instance_id}'`);
	if (instanceError) return c.json(200, { data: null, error: instanceError })
	if (instanceData.length !== 1) {
		return c.json(200, { data: null, error: 'instance not found' })
	}
	if (instanceData[0].owner !== user.id) {
		return c.json(200, { data: null, error: 'not your project' })
	}
	console.log('toggleinstance instanceData', JSON.stringify(instanceData, null, 2))
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
	// take the instance online, offline, or into maintenance mode
	const { data: d1, error: e1 } = toggleinstance(domain, site_domain, port.toString(), status);
	if (e1) return c.json(200, { data: null, error: e1 })
	
	// update the instance record
	const { data: updateData, error: updateError } = 
		execute(`update project_instance set instance_status = '${data?.status}' where id = '${data?.instance_id}'`);
	if (updateError) return c.json(200, { data: null, error: updateError })
	else return c.json(200, { data: 'ok', error: null })
})


