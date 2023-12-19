routerAdd('POST', '/createproject', async (c) => {
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
	if (data?.project?.owner !== user?.id) {
		return c.json(200, { data: null, error: 'not your project' })
	}
	if (!data?.project?.name) {
		return c.json(200, { data: null, error: 'project name is required' })
	}
	if (data?.project?.ownertype !== 'person' && data?.project?.ownertype !== 'org') {
		return c.json(200, { data: null, error: 'ownertype must be "person" or "org"' })
	}
	if (!data?.project?.domain) {
		return c.json(200, { data: null, error: 'domain is required' })
	}
	if (!data?.project_instances[0]?.id) {
		return c.json(200, { data: null, error: 'site id is required' })
	}
	if (
		data?.project_instances[0]?.type !== 'primary' &&
		data?.project_instances[0]?.type !== 'replica'
	) {
		return c.json(200, { data: null, error: 'type must be "primary" or "replica"' })
	}
	try {
		// create the project record
		const projectInsert = arrayOf(
			new DynamicModel({
				id: '',
			})
		)
		$app
			.dao()
			.db()
			.newQuery(
				`insert into projects (name, owner, ownertype, domain) 
                    values ('${data?.project?.name}', '${data?.project?.owner}', '${data?.project?.ownertype}', '${data?.project?.domain}')
                    returning id`
			)
			.all(projectInsert) // throw an error on db failure
		// get the id of the newly inserted project
		const newId = projectInsert[0].id
		// create the project_instances record
		const project_instancesInsert = arrayOf(
			new DynamicModel({
				port: 0,
			})
		)
		$app
			.dao()
			.db()
			.newQuery(
				`insert into project_instance (project_id, site_id, port, type, domain) 
                    values ('${newId}', 
                    '${data?.project_instances[0]?.id}', 
                    (select coalesce((select max(port)+1 FROM project_instance where site_id = '${data?.project_instances[0]?.id}'),10001)),
                    '${data?.project_instances[0]?.type}',
                    '${data?.project?.domain}')
                    returning port`
			)
			.all(project_instancesInsert) // throw an error on db failure

		const newPort = project_instancesInsert[0].port
		// now use (data?.project?.domain) and (newPort) to create the nginx config file
		console.log('now create new entry for:')
		console.log('domain', data?.project?.domain)
		console.log('port', newPort)
		console.log('site domain', data?.site?.domain)
		// update: /etc/nginx/domain_ports.txt
		/*
        const cmd = $os.cmd(
			'ssh',
			`ubuntu@${data?.site?.domain}`,
			`echo "${data?.project?.domain}.${data?.site?.domain}  ${newPort};" | sudo tee -a /etc/nginx/domain_ports.txt && sudo kill -HUP \$(cat /var/run/nginx.pid)`
		)
		console.log(JSON.stringify(cmd, null, 2))
		const output = String.fromCharCode(...cmd.output())
        */
		const res = $http.send({
			url: `http://${data?.project_instances[0]?.site_domain}:5000/createproject`,
			method: 'POST',
			body: JSON.stringify({
				domain: data?.project?.domain + '.' + data?.site?.domain,
				port: newPort.toString(),
			}),
			headers: {
				'content-type': 'application/json',
				Authorization: 'your_predefined_auth_token',
			},
			timeout: 120, // in seconds
		})
		console.log('res', JSON.stringify(res, null, 2))
		if (res.json?.error) {
			return c.json(200, { data: null, error: res.json.error })
		} else {
			return c.json(200, { data: newId, error: null })
		}
		// reload domain_ports.txt file to update domain port mappings
		// ssh ubuntu@$1  "sudo kill -HUP \$(cat /var/run/nginx.pid)"
	} catch (projectInsertError) {
		console.log('projectInsertError', projectInsertError)
		for (let attr in projectInsertError) {
			console.log('attr', attr)
			console.log(`projectInsertError.${attr} = ${projectInsertError[attr]}`)
		}
		for (let attr in projectInsertError.value) {
			console.log('attr', attr)
			console.log(`projectInsertError.value.${attr} = ${projectInsertError.value[attr]}`)
		}
		console.log(
			'projectInsertError.value',
			projectInsertError.value,
			typeof projectInsertError.value
		)
		return c.json(200, { data: null, error: projectInsertError.value.error() })
	}
})


