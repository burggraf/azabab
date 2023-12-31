/// <reference path="../pb_data/types.d.ts" />

// **** add ssh keys to an instance ****
routerAdd('GET', '/setup-marmot/:project_id', (c) => {
	console.log('**** setup-marmot ****')
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
	let ENDPOINT = ''
	let ACCESS_KEY = ''
	let SECRET = ''
	let BUCKET = 'azabab'
	try {
		// get S3 bucket info
		const s3Data = arrayOf(
			new DynamicModel({
				access_key_id: '',
				secret_access_key: '',
				endpoint: '',
			})
		)
		$app
			.dao()
			.db()
			.newQuery(
				`SELECT access_key_id, secret_access_key, endpoint
				from s3
				where location = 'Los Angeles' limit 1` 
			)
			.all(s3Data) // throw an error on db failure
		if (s3Data.length === 0) {
			return c.json(200, { data: null, error: 's3 bucket not found' })
		} else {
			ENDPOINT = s3Data[0].endpoint
			ACCESS_KEY = s3Data[0].access_key_id
			SECRET = s3Data[0].secret_access_key
		}
	} catch (e) {
		return c.json(200, { data: null, error: e.value.error() || e })
	}
	try {
		const projectData = arrayOf(
			new DynamicModel({
				domain: '',
				type: '',
				owner: '',
				ownertype: '',
				port: 0,
				site_domain: '',
				node: 0,
			})
		)
		$app
			.dao()
			.db()
			.newQuery(
				`SELECT domain, type, owner, ownertype, port, site_domain, node
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
		const template = `
# Variables to be replaced:
# <PORT> (e.g. 10001)
# <HOST> (nats server, e.g. west-1.azabab.com)
# <NODE> (e.g. 1)
# <READWRITE> (e.g. true or false for READONLY)
# <ENDPOINT> (S3 endpoint)
# <ACCESS_KEY> (S3 access key)
# <SECRET> (S3 secret)
# <BUCKET> (S3 bucket)
seq_map_path="/marmot/marmot.cbor"
db_path="/home/pocketbase/pb_data/data.db"
node_id=<NODE>

replicate=true
publish=<READWRITE>

[snapshot]
enabled=false
#store="s3"
#interval=3600000

#[snapshot.s3]
#endpoint="<ENDPOINT>"
#path="marmot/<PORT>"
#use_ssl=true
#access_key="<ACCESS_KEY>"
#secret="<SECRET>"
#bucket="<BUCKET>"

[nats]
urls=["nats://<HOST>:5222"]
#server_config=""
subject_prefix="change-log-<PORT>"
stream_prefix="changes-<PORT>"
`;
		let counter = 0;
		for (let i = 0; i < projectData.length; i++) {
			const instance = projectData[i]
			// make a copy of the template
			let config_file = template
			// replace the variables
			config_file = config_file.replace(/<PORT>/g, instance.port.toString())
			config_file = config_file.replace(/<HOST>/g, instance.site_domain)
			config_file = config_file.replace(/<NODE>/g, instance.node.toString())
			config_file = config_file.replace(/<READWRITE>/g, (instance.type === 'read write replica' || instance.type === 'primary') ? 'true' : 'false')
			config_file = config_file.replace(/<ENDPOINT>/g, ENDPOINT)
			config_file = config_file.replace(/<ACCESS_KEY>/g, ACCESS_KEY)
			config_file = config_file.replace(/<SECRET>/g, SECRET)
			config_file = config_file.replace(/<BUCKET>/g, BUCKET)

			console.log('*********************************************')
			console.log(`calling: http://${instance.site_domain}:5000/setupmarmot`)
			console.log('POST DATA:')
			console.log('typeof config_file', typeof config_file)
			console.log('config_file.length', config_file.length)
			console.log('port', instance.port.toString())
			console.log('*********************************************')
			try {
				const res = $http.send({
					url:     `http://${instance.site_domain}:5000/setupmarmot`,
					method:  "POST",
					body:    JSON.stringify({
						"config_file": config_file,
						"port": instance.port.toString(),
					}),
					headers: {
						"content-type": "application/json",
						"Authorization": "your_predefined_auth_token"
					},
					timeout: 120, // in seconds
				})	
				console.log('res', JSON.stringify(res,null,2))
				if (res.statusCode === 200) {
					counter++
				} else {
					return c.json(200, { data: null, error: res })
				}
			} catch (httpError) {
				// console.log('httpError', httpError)
				return c.json(200, { data: null, error: httpError.value.error() })
			}
		}
		return c.json(200, { data: 'ok:' + counter + ' instances processed', error: null })
	} catch (e){
		return c.json(200, { data: null, error: e.value.error() || e })
	}
		
})
