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
	if (!data?.project_instance?.site_id) {
		return c.json(200, { data: null, error: 'site id is required' })
	}
	if (!data?.project_instance?.domain) {
		return c.json(200, { data: null, error: 'domain is required' })
	}
	if (
		data?.project_instance?.type !== 'primary' &&
		data?.project_instance?.type !== 'replica'
	) {
		return c.json(200, { data: null, error: 'type must be "primary" or "replica"' })
	}
	try {
		// create the project record
		const projectInsert = arrayOf(
			new DynamicModel({
				id: '',
				port: 0
			})
		)
		$app
			.dao()
			.db()
			.newQuery(
				`insert into projects (name, owner, ownertype, domain, port) 
                    values ('${data?.project?.name}', '${data?.project?.owner}', '${data?.project?.ownertype}', '${data?.project?.domain}',
					(select coalesce(max(port)+1,10001) from projects))
                    returning id, port`
			)
			.all(projectInsert) // throw an error on db failure
		if (projectInsert.length !== 1) {
			return c.json(200, { data: null, error: 'project insert failed' })
		}
		// get the id of the newly inserted project
		const newId = projectInsert[0].id
		const newPort = projectInsert[0].port
		// create the project_instance record
		const project_instancesInsert = arrayOf(
			new DynamicModel({
				id: '',
			})
		)
		$app
			.dao()
			.db()
			.newQuery(
				`insert into project_instance (project_id, site_id, port, type, domain, instance_status) 
                    values ('${newId}', 
                    '${data?.project_instance?.site_id}',
					${newPort}, 
                    '${data?.project_instance?.type}',
                    '${data?.project_instance?.domain}',
					'online')
                    returning id`
			)
			.all(project_instancesInsert) // throw an error on db failure
		if (project_instancesInsert.length !== 1) {
			return c.json(200, { data: null, error: 'project_instances insert failed' })
		}
		const newProjectInstanceId = project_instancesInsert[0].id
		// now use (data?.project?.domain) and (newPort) to create the nginx config file
		console.log('now create new entry for:')
		console.log('domain', data?.project_instance?.domain)
		console.log('port', newPort)
		console.log('site domain', data?.project_instance?.site_domain)
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
			url: `http://${data?.project_instance?.site_domain}:5000/createproject`,
			method: 'POST',
			body: JSON.stringify({
				domain: data?.project_instance?.domain + '.' + data?.project_instance?.site_domain,
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
			return c.json(200, { data: newProjectInstanceId, error: null })
		}
		// reload domain_ports.txt file to update domain port mappings
		// ssh ubuntu@$1  "sudo kill -HUP \$(cat /var/run/nginx.pid)"
	} catch (projectInsertError) {
		console.log('projectInsertError', projectInsertError)
		return c.json(200, { data: null, error: projectInsertError?.value?.error() || projectInsertError })
	}
})


