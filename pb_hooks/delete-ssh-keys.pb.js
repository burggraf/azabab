/// <reference path="../pb_data/types.d.ts" />
// **** add ssh keys to an instance ****
routerAdd('GET', '/delete-ssh-keys/:project_instance_id', (c) => {
	const project_instance_id = c.pathParam('project_instance_id')
	console.log('project_instance_id', project_instance_id)
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
	const instance_info = arrayOf(
		new DynamicModel({
			site: '',
			owner: '',
			username: '',
			port: 0,
		})
	)
	$app
		.dao()
		.db()
		.newQuery(
			`select sites.domain as site,owner, project_instance.domain as username, port from project_instance 
			join projects on projects.id = project_instance.project_id 
			join sites on project_instance.site_id = sites.id
			where project_instance.id = '${project_instance_id}'`
		)
		.all(instance_info) // throw an error on db failure

	if (instance_info.length === 0) {
		return c.json(200, { data: null, error: 'no instance found' })
	}
	if (instance_info[0].owner !== user.id) {
		return c.json(200, { data: null, error: 'not your instance' })
	}
	const username = instance_info[0].username
	const port = instance_info[0].port
	const site = instance_info[0].site
	try {
		console.log('ready to run cmd')
		const cmd = $os.cmd(
			'ssh',
			`-t`,
			`ubuntu@${site}`,
			`/home/ubuntu/delete-ssh-keys.sh`,
			`${username}`,
			`${port}`
		)
		console.log('cmd', cmd)
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

