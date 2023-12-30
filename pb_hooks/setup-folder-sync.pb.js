/// <reference path="../pb_data/types.d.ts" />

// **** add ssh keys to an instance ****
routerAdd('GET', '/setup-folder-sync/:project_id', (c) => {
	console.log('**** setup-folder-sync ****')
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

	const projectData = arrayOf(
		new DynamicModel({
			domain: '',
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
			`SELECT domain, type, owner, ownertype, port, site_domain
			from instance_view
			where project_id = '${project_id}' order by type, site_domain` 
		)
		.all(projectData) // throw an error on db failure
		console.log('projectData', JSON.stringify(projectData,null,2))
	if (projectData.length === 0) {
		return c.json(200, { data: null, error: 'project not found' })
	}
	if (projectData[0].owner !== user.id) {
		return c.json(200, { data: null, error: 'you are not the project owner' })
	}
	let primary_site_domain = ''
	let port = ''
	let config_file = ''
	const template = `
sync {
	default.rsync,
	source = "/data/<PORT>",
	target = "ubuntu@<HOST>:/home/ubuntu/data/<PORT>",
	exclude   = { "pb_data" },
	rsync = myRsync
}
	`;
	console.log('****** template ******')
	console.log(template)
	console.log('****** template ******')
	for (let i = 0; i < projectData.length; i++) {
		console.log('i', i)
		console.log('projectData[i]', JSON.stringify(projectData[i]))
		console.log('******** config_file before ********')
		console.log(config_file)
		console.log('******** config_file after ********')
			if (projectData[i].type === 'primary') {
			primary_site_domain = projectData[i].site_domain
			port = projectData[i].port.toString()
		} else {
			const newChunk = template.replace(/<PORT>/g, projectData[i].port.toString()).replace(/<HOST>/g, projectData[i].site_domain)
			console.log('newChunk', newChunk)
			config_file += newChunk; //template.replace(/<PORT>/g, projectData[i].port.toString()).replace(/<HOST>/g, projectData[i].site_domain)
		}
		console.log('******** config_file final ********')
		console.log(config_file)
		console.log('******** config_file final ********')
		}
	console.log('primary_site_domain', primary_site_domain)
	console.log('port', port)
	console.log('******** config_file complete ********')
	console.log(config_file)
	console.log('******** config_file complete ********')
	try {
		let res;
		try {
			res = $http.send({
				url:     `http://${primary_site_domain}:5000/setupfoldersync`,
				method:  "POST",
				body:    JSON.stringify({
					"config_file": config_file,
					"port": port,
				}),
				headers: {
					"content-type": "application/json",
					"Authorization": "your_predefined_auth_token"
				},
				timeout: 120, // in seconds
			})	
		} catch (httpError) {
			// console.log('httpError', httpError)
			return c.json(200, { data: null, error: httpError.value.error() })
		}
		return c.json(res.statusCode, res.json)
	
	} catch (e) {
		return c.json(200, { data: null, error: createUserError.value.error() })
	}

		
})

