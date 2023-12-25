routerAdd('POST', '/update-streaming-backup-settings', async (c) => {
	const data = $apis.requestInfo(c).data
	const info = $apis.requestInfo(c)
	const user = info.authRecord // empty if not authenticated as regular auth record
	if (!user) {
		return c.json(200, { data: null, error: 'not logged in' })
	}
	if (!data?.instance_id) {
		return c.json(200, { data: null, error: 'instance_id is required' })
	}
	if (typeof data?.data?.db_streaming_backup_location === 'undefined') {
		return c.json(200, { data: null, error: 'data.db_streaming_backup_location is required' })
	}
	if (typeof data?.data?.logs_streaming_backup_location === 'undefined') {
		return c.json(200, { data: null, error: 'data.logs_streaming_backup_location is required' })
	}
	if (typeof data?.data?.db_streaming_backup_retention === 'undefined') {
		return c.json(200, { data: null, error: 'data.db_streaming_backup_retention is required' })
	}
	if (typeof data?.data?.logs_streaming_backup_retention === 'undefined') {
		return c.json(200, { data: null, error: 'data.logs_streaming_backup_retention is required' })
	}
	let port = 0;
	let site_domain = '';
	const db_streaming_backup_location = data?.data?.db_streaming_backup_location
	const logs_streaming_backup_location = data?.data?.logs_streaming_backup_location
	const db_streaming_backup_retention = data?.data?.db_streaming_backup_retention
	const logs_streaming_backup_retention = data?.data?.logs_streaming_backup_retention
	try {
		// check if the user is the owner of the instance
		const projectOwner = arrayOf(
			new DynamicModel({
				owner: '',
				port: 0,
				site_domain: ''
			})
		)
		$app
			.dao()
			.db()
			.newQuery(
				`select owner, port, site_domain from instance_view where id = '${data?.instance_id}'`
			)
			.all(projectOwner) // throw an error on db failure
		if (projectOwner.length === 0) {
			return c.json(200, { data: null, error: 'project instance not found' })
		}
		// get the id of the newly inserted project
		if (projectOwner[0].owner !== user?.id) {
			return c.json(200, { data: null, error: 'not the owner of this project' })
		} else {
			port = projectOwner[0].port
			site_domain = projectOwner[0].site_domain
		}
	} catch (projectOwnerError) {
		const error_to_return = projectOwnerError.value.error()
		return c.json(200, {
			data: null,
			error: error_to_return || JSON.stringify(projectOwnerError),
		})
	}
	// get the s3 values we need later...
	let s3arr = [];
	let db_streaming_backup_location_s3 = {};
	let logs_streaming_backup_location_s3 = {};
	try {
		const s3 = arrayOf(
			new DynamicModel({
				id: '', name: '', location: '', access_key_id: '', 
				secret_access_key: '', endpoint: ''
			})
		)
		$app
			.dao()
			.db()
			.newQuery(
				`select id, name, location, access_key_id, secret_access_key, endpoint from s3`
			)
			.all(s3) // throw an error on db failure
		s3arr = s3;
		if (s3.length === 0) {
			return c.json(200, { data: null, error: 'no s3 buckets found' })
		}
		// look for an s3arr entry with the same id as db_streaming_backup_location
		db_streaming_backup_location_s3 = s3arr.find((s3) => s3.id === db_streaming_backup_location)
		if (!db_streaming_backup_location_s3) {
			return c.json(200, { data: null, error: 'db_streaming_backup_location not found' })
		}
		// look for an s3arr entry with the same id as logs_streaming_backup_location
		logs_streaming_backup_location_s3 = s3arr.find((s3) => s3.id === logs_streaming_backup_location)
		if (!logs_streaming_backup_location_s3) {
			return c.json(200, { data: null, error: 'logs_streaming_backup_location not found' })
		}
	} catch (getS3ValuesError) {
		const error_to_return = getS3ValuesError.value.error()
		return c.json(200, {
			data: null,
			error: error_to_return || JSON.stringify(getS3ValuesError),
		})
	}
	// update the project_instance record
	try {
		$app
		.dao()
		.db()
		.newQuery(
			`update project_instance 
				set db_streaming_backup_location = '${data?.data?.db_streaming_backup_location}',
				logs_streaming_backup_location = '${data?.data?.logs_streaming_backup_location}',
				db_streaming_backup_retention = '${data?.data?.db_streaming_backup_retention}',
				logs_streaming_backup_retention = '${data?.data?.logs_streaming_backup_retention}'
			where id = '${data?.instance_id}'`
		).execute()
	} catch (update_project_instance_error) {
			//removeProjectInstanceError.value.error()
			const error_to_return = update_project_instance_error.value.error()
			return c.json(200, {
				data: null,
				error: error_to_return || JSON.stringify(update_project_instance_error),
			})
	}
	// *************************************************************
	// console.log('db_streaming_backup_location_s3', JSON.stringify(db_streaming_backup_location_s3, null, 2))
	// console.log('logs_streaming_backup_location_s3', JSON.stringify(logs_streaming_backup_location_s3, null, 2))
	// *************************************************************
	const payload = {
		db_access_key_id: db_streaming_backup_location_s3.access_key_id,
		db_endpoint: db_streaming_backup_location_s3.endpoint,
		db_secret_access_key: db_streaming_backup_location_s3.secret_access_key,
		logs_access_key_id: logs_streaming_backup_location_s3.access_key_id,
		logs_endpoint: logs_streaming_backup_location_s3.endpoint,
		logs_secret_access_key: logs_streaming_backup_location_s3.secret_access_key,
		port: port.toString(),
		site_domain
	}

	const res = $http.send({
			url: `http://${site_domain}:5000/update-streaming-backup-settings`,
			method: 'POST',
			body: JSON.stringify(payload
				// {
				// domain: data?.project_instance?.domain + '.' + data?.project_instance?.site_domain,
				// port: newPort.toString(),
				// }
			),
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
			return c.json(200, { data: res, error: null })
		}
		// reload domain_ports.txt file to update domain port mappings
		// ssh ubuntu@$1  "sudo kill -HUP \$(cat /var/run/nginx.pid)"
})


