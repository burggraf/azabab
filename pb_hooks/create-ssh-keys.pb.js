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
	console.log('ssh_key_string', ssh_key_string)
	if (ssh_key_string.length === 0) {
		return c.json(200, { data: null, error: 'no keys found' })
	}
	console.log('keys[0].site', keys[0].site)
	console.log('keys[0].username', keys[0].username)
	console.log('keys[0].port', keys[0].port)
	//ssh_key_string = ssh_key_string.replace(/\n/g, '\\n')
	console.log('ssh_key_string', ssh_key_string)
	//ssh_key_string = 'xxx'

	try {
		const cmd = $os.cmd(
			'ssh',
			// `-t`,
			`ubuntu@${keys[0].site}`,
			`/home/ubuntu/create-ssh-keys.sh`, 
			`${keys[0].username}`,
			`${keys[0].port}`,
			`\"${ssh_key_string}\"`
		)
		console.log('cmd', cmd)
		//const error = String.fromCharCode(...cmd.stderr());
		//console.log('error', error)
		//console.log(JSON.stringify(cmd, null, 2))
		const output = String.fromCharCode(...cmd.output())
		console.log('------------')
		console.log('output', output)
		console.log('------------')
		return c.json(200, { data: "OK", error: null })
	
	} catch (e) {
		console.log('e', projectInsertError.value.error())
		return c.json(200, { data: null, error: projectInsertError.value.error() })
	}

		
})

