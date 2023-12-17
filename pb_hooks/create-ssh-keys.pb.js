/// <reference path="../pb_data/types.d.ts" />
// **** add ssh keys to an instance ****
routerAdd('GET', '/create-ssh-keys/:project_instance_id', (c) => {
	const project_instance_id = c.pathParam('project_instance_id')
	if (!project_instance_id) {
		return c.json(200, { data: null, error: 'project_instance_id is required' })
	}
	const info = $apis.requestInfo(c)
	const admin = info.admin // empty if not authenticated as admin
	let user = info.authRecord // empty if not authenticated as regular auth record
	if (!user) {
		//return c.json(200, { data: null, error: 'not logged in' })
		user = {id: 'e70ftyk6ne8j19h'}
	}

	const keys = arrayOf(
		new DynamicModel({
			site: '',
			username: '',
			port: 0,
			key: '',
		})
	)
	$app
		.dao()
		.db()
		.newQuery(
			`SELECT sites.domain as site,project_instance.domain as username,port,key from project_instance_keys 
			join project_instance on project_instance.id = project_instance_keys.project_instance_id 
			join user_keys on user_keys.user_id = project_instance_keys.user_id 
				and user_keys.id = project_instance_keys.user_keys_id
			join sites on project_instance.site_id = sites.id
			where project_instance_keys.project_instance_id = '${project_instance_id}' 
				and project_instance_keys.user_id = '${user.id}'`
		)
		.all(keys) // throw an error on db failure
		console.log('keys', JSON.stringify(keys,null,2))
	let ssh_key_string = ''
	for (const kkey of keys) {
		ssh_key_string += kkey.key
	}

	if (keys.length === 0) {
		$app
		.dao()
		.db()
		.newQuery(
			`SELECT sites.domain as site,project_instance.domain as username,port,'' as key 
			from project_instance join sites on sites.id = project_instance.site_id 
			join projects on projects.id = project_instance.project_id 
			where project_instance.id = '${project_instance_id}' 
			and projects.owner = '${user.id}'`
		)
		.all(keys) // throw an error on db failure		
		// 
	}

	// console.log('ssh_key_string', ssh_key_string)
	// if (ssh_key_string.length === 0) {
	// 	return c.json(200, { data: null, error: 'no keys found' })
	// }

	console.log('keys[0].site', keys[0].site)
	console.log('keys[0].username', keys[0].username)
	console.log('keys[0].port', keys[0].port)
	console.log('ssh_key_string', ssh_key_string)
	console.log('ssh_key_string.length', ssh_key_string.length)
	try {
		let res;
		try {
			res = $http.send({
				url:     "http://west-2.azabab.com:5000/createuser",
				method:  "POST",
				body:    JSON.stringify({
					"username": keys[0].username, 
					"port": keys[0].port.toString(),
					"ssh_keys": ssh_key_string,
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
        console.log('res', JSON.stringify(res,null,2))
		return c.json(res.statusCode, res.json)
	
	} catch (e) {
		console.log('e', createUserError.value.error())
		return c.json(200, { data: null, error: createUserError.value.error() })
	}

		
})

