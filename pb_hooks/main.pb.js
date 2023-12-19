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

routerAdd('GET', '/importstats', async (c) => {
	const convertUnits = (str) => {
		console.log('convertUnits', str)
		// sample: 5.75kB
		// need to strip the units and convert to bytes
		// get units by looking for letters in the string
		const arr = str.split(/([a-zA-Z]+)/)
		console.log('arr', JSON.stringify(arr))
		if (arr.length < 2) {
			return 0
		}
		const num = parseFloat(arr[0])
		const unit = arr[1]
		console.log('num', num)
		console.log('unit', unit)
		if (unit === 'B') {
			return num
		} else if (unit === 'kB') {
			return num * 1000
		} else if (unit === 'MB') {
			return num * 1000000
		} else if (unit === 'GB') {
			return num * 1000000000
		} else if (unit === 'TB') {
			return num * 1000000000000
		} else if (unit === 'KiB') {
			return num * 1024
		} else if (unit === 'MiB') {
			return num * 1048576
		} else if (unit === 'GiB') {
			return num * 1073741824
		} else if (unit === 'TiB') {
			return num * 1099511627776
		} else {
			return 0
		}
	}

	try {
		let counter = 0
		let records_inserted = 0;
		while (counter < 1000) {
			// read the body via the cached request object
			// (this method is commonly used in hook handlers because it allows reading the body more than once)
			const res = await $http.send({
				url: 'http://west-2.azabab.com:3030/getfile',
				method: 'GET',
				// body:    JSON.stringify({"domain": data?.project?.domain + '.' + data?.site?.domain, "port": newPort.toString()}),
				headers: {
					'content-type': 'application/json',
					Authorization: 'YourSecretToken',
				},
				timeout: 120, // in seconds
			})
			if (res.statusCode !== 200) {
				if (res.statusCode === 404 && res.raw === 'No file found') {
					// break out of loop here -- no more files to process
					break
				} else {
					console.log('getfile error:')
					console.log('res', JSON.stringify(res, null, 2))
					return c.json(res.statusCode, { data: null, error: res.json?.error || res.raw })	
				}
			}
			// console.log('getfile response', JSON.stringify(res, null, 2))
			const contents = res.json?.contents
			const filename = res.json?.name
			const f = filename.split('/')[filename.split('/').length - 1]
			const arr = contents.split('\n')
			for (let i = 0; i < arr.length; i++) {
				if (arr[i].length < 1) {
					continue // empty line
				}
				const record = arr[i].split('\t')
				if (record.length < 10) {
					console.log(`file ${f} line ${i + 1} skipping record.length < 10`, record.length)
					continue
				} else {
					const rec = {}
					rec.ts = record[0]
					rec.event = record[1]
					rec.port = record[2]
					rec.cpu_usage = record[3].replace('%', '')
					rec.mem_usage = record[4].replace('MiB', '')
					rec.mem_max = record[5].replace('MiB', '')
					rec.net_in = convertUnits(record[6])
					rec.net_out = convertUnits(record[7])
					rec.disk_read = convertUnits(record[8])
					rec.disk_write = convertUnits(record[9])

					const result_record = arrayOf(
						new DynamicModel({
							id: '',
						})
					)
					$app
						.dao()
						.db()
						.newQuery(
							`insert into stats (ts, event, port, cpu_usage, mem_usage, mem_max, net_in, net_out, disk_write, disk_read) 
                    values ('${rec.ts}', '${rec.event}', '${rec.port}', '${rec.cpu_usage}', '${rec.mem_usage}', '${rec.mem_max}', '${rec.net_in}', '${rec.net_out}', '${rec.disk_write}', '${rec.disk_read}')
					returning id`
						)
						.all(result_record) // throw an error on db failure
					records_inserted++
				}
			}
			// delete file
			const delete_res = await $http.send({
				url: `http://west-2.azabab.com:3030/deletefile/${f}`,
				method: 'GET',
				// body:    JSON.stringify({"domain": data?.project?.domain + '.' + data?.site?.domain, "port": newPort.toString()}),
				headers: {
					'content-type': 'application/json',
					Authorization: 'YourSecretToken',
				},
				timeout: 120, // in seconds
			})
			if (delete_res.statusCode !== 200) {
				console.log(`${filename} delete file error`, JSON.stringify(delete_res, null, 2))
				return c.json(delete_res.statusCode, { data: null, error: delete_res.json.error })
			}
			counter++;
		}
		return c.json(200, { data: `SUCCESS: ${counter} files processed, ${records_inserted} records inserted.`, error: null })
	} catch (err) {
		return c.json(200, { ERROR: JSON.stringify(err) })
	}
})

routerAdd('GET', '/test', async (c) => {
	console.log('** ls')
	try {
		const domains = arrayOf(
			new DynamicModel({
				// describe the shape of the data (used also as initial values)
				domain: '',
				port: 0,
			})
		)

		$app.dao().db().newQuery('SELECT domain, port FROM domain_mappings').all(domains) // throw an error on db failure

		console.log('domains', JSON.stringify(domains, null, 2))

		const cmd = $os.cmd('ssh', 'ubuntu@west-2.azabab.com', 'ls')
		// const error = String.fromCharCode(...cmd.stderr());
		console.log(JSON.stringify(cmd, null, 2))
		const output = String.fromCharCode(...cmd.output())
		console.log('output', output)
		return c.json(200, { result: output })
	} catch (err) {
		console.log('err', err)
		const cmd = $os.cmd('ls', '-alt')
		return c.json(200, { 'got err': JSON.stringify(err) })
	}
})
routerAdd('GET', '/hello/:name', (c) => {
	let name = c.pathParam('name')

	return c.json(200, { message: 'Hello ' + name })
})
routerAdd(
	'GET',
	'/sample_hook',
	(c) => {
		// let name = c.pathParam("name")
		function randomString() {
			const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
			let result = ''
			for (let i = 15; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)]
			return result
		}

		const result = new DynamicModel({
			a: '',
			b: '',
			c: '',
			category: '',
			d: '',
			difficulty: '',
			id: '',
			question: '',
			subcategory: '',
		})

		try {
			const user = c.get('authRecord') // empty if not authenticated as regular auth record
			if (user === null) {
				console.log('user is null')
				try {
					$app
						.dao()
						.db()
						.newQuery(
							`SELECT trivia.a,trivia.b,trivia.c,trivia.d,trivia.category,trivia.difficulty,trivia.subcategory,trivia.id,trivia.question FROM trivia where trivia.id >= '${randomString()}' order by trivia.id asc LIMIT 1`
						)
						.one(result) // throw an error on db failure or missing row
				} catch (forwarderror) {
					console.log('forwarderror:', forwarderror)
					try {
						if (forwarderror.value.error() === 'sql: no rows in result set') {
							$app
								.dao()
								.db()
								.newQuery(
									`SELECT trivia.a,trivia.b,trivia.c,trivia.d,trivia.category,trivia.difficulty,trivia.subcategory,trivia.id,trivia.question FROM trivia where trivia.id <= '${randomString()}' order by trivia.id asc LIMIT 1`
								)
								.one(result) // throw an error on db failure or missing row
						}
					} catch (finalerror) {
						console.log('finalerror:', finalerror)
						return c.json(200, { error: finalerror })
					}
				}
			} else {
				console.log('user is: ', user?.id)
				try {
					$app
						.dao()
						.db()
						.newQuery(
							`SELECT trivia.a,trivia.b,trivia.c,trivia.d,trivia.category,trivia.difficulty,trivia.subcategory,trivia.id,trivia.question FROM trivia left outer join trivia_log on trivia_log.user = '${
								user?.id
							}' and trivia_log.question = trivia.id where trivia.id >= '${randomString()}' and trivia_log.id is null order by trivia.id asc LIMIT 1`
						)
						.one(result) // throw an error on db failure or missing row
				} catch (forwarderror) {
					console.log('forwarderror:', forwarderror)
					try {
						if (forwarderror.value.error() === 'sql: no rows in result set') {
							$app
								.dao()
								.db()
								.newQuery(
									`SELECT trivia.a,trivia.b,trivia.c,trivia.d,trivia.category,trivia.difficulty,trivia.subcategory,trivia.id,trivia.question FROM trivia left outer join trivia_log on trivia_log.user = '${
										user?.id
									}' and trivia_log.question = trivia.id where trivia.id <= '${randomString()}' and trivia_log.id is null order by trivia.id asc LIMIT 1`
								)
								.one(result) // throw an error on db failure or missing row
						}
					} catch (finalerror) {
						console.log('finalerror:', finalerror)
						return c.json(200, { error: finalerror })
					}
				}
			}
			return c.json(200, { result })
		} catch (err) {
			console.log('err:', err)
			return c.json(200, { error: err })
		}
	} /* optional middlewares */
)

// fires only for "users" (not) "managers" auth collections
// onRecordAfterConfirmVerificationRequest((e) => {
//     console.log('onRecordAfterConfirmVerificationRequest: e.httpContext',JSON.stringify(e.httpContext,null,2))
//     console.log('onRecordAfterConfirmVerificationRequest: e.record',JSON.stringify(e.record,null,2))
//     // e.redirect(200, "http://localhost:8100/welcome");
// }, "users")

onRealtimeConnectRequest((e) => {
	////console.log('onRealtimeConnectRequest', JSON.stringify(e,null,2))
	// for (let attr in e.httpContext) {
	//     console.log(`httpContext.${attr} = ${e.httpContext[attr]}`)
	// }
	/*
2023/12/02 08:07:03 client.channel = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.discard = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.get = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.hasSubscription = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.id = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.isDiscarded = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.send = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.set = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.subscribe = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.subscriptions = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.unset = function reflect.methodValueCall() { [native code] }
2023/12/02 08:07:03 client.unsubscribe = function reflect.methodValueCall() { [native code] }

2023/12/02 08:20:08 httpContext.attachment = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.bind = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.blob = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.cookie = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.cookies = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.echo = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.error = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.file = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.fileFS = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.formFile = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.formValue = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.formValueDefault = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.formValues = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.get = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.html = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.htmlBlob = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.inline = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.isTLS = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.isWebSocket = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.json = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.jsonBlob = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.jsonp = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.jsonpBlob = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.jsonPretty = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.multipartForm = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.noContent = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.path = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.pathParam = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.pathParamDefault = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.pathParams = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.queryParam = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.queryParamDefault = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.queryParams = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.queryString = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.rawPathParams = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.realIP = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.redirect = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.render = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.request = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.reset = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.response = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.routeInfo = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.scheme = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.set = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setCookie = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setPath = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setPathParams = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setRawPathParams = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setRequest = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setResponse = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.setRouteInfo = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.stream = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.string = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.validate = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.xml = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.xmlBlob = function reflect.methodValueCall() { [native code] }
2023/12/02 08:20:08 httpContext.xmlPretty = function reflect.methodValueCall() { [native code] }


*/
})

onRealtimeDisconnectRequest((e) => {
	////console.log('onRealtimeDisconnectRequest', JSON.stringify(e,null,2))
})
