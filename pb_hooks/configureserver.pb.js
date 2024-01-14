/// <reference path="../pb_data/types.d.ts" />
// **** add ssh keys to an instance ****
routerAdd('GET', '/configureserver/:fqd', async (c) => {
	const { configureserver } = require(`${__hooks}/modules/callbackend.js`)
	console.log('configureserver callback is', typeof configureserver)
	console.log('/configureserver/:fqd')
	console.log('c', JSON.stringify(c, null, 2))
	const token = c.request().header.get("Authorization")
	console.log('token', token)
	if (!token || token !== 'my_secret_token') {
		return c.json(200, { data: null, error: 'not authorized' })
	}

	const { select } = require(`${__hooks}/modules/sql.js`)
	
	const fqd = c.pathParam('fqd')
	console.log('fqd', fqd)
	if (!fqd) {
		return c.json(200, { data: null, error: 'fqd is required' })
	}
	const info = $apis.requestInfo(c)
	const admin = info.admin // empty if not authenticated as admin

	const { data:s3, error:s3err } = 
	  select({code: '', access_key_id: '', secret_access_key: '', endpoint: ''}, 
	  `select code,access_key_id,secret_access_key,endpoint from s3`)
	if (s3err) {
		return c.json(200, { data: null, error: s3err?.value?.error() || s3err })
	}
	let rcloneConf = ''
	// create /root/.config/rclone/rclone.conf file
	for (let i = 0; i < s3.length; i++) {
		rcloneConf += `[${s3[i].code}]\n`
		rcloneConf += `type = s3\n`
		rcloneConf += `provider = IDrive\n`
		rcloneConf += `access_key_id = ${s3[i].access_key_id}\n`
		rcloneConf += `secret_access_key = ${s3[i].secret_access_key}\n`
		rcloneConf += `endpoint = ${s3[i].endpoint}\n`
	}
	// next, create the /home/ubuntu/nats-server/nats-server.conf file
	/*
	listen: 0.0.0.0:4222
	http: 6222

	cluster {
	name: "azabab"
	listen: 0.0.0.0:5222
	routes: ["nats://lax-hh.azabab.com:5222"]
	}

	jetstream {
	store_dir: "/home/ubuntu/jetstream"
	}


	server_name: "lax"
	*/
	const { data:sites, error:sitesError } = 
	  select({domain: ''}, 
	  `select domain from sites where active is true`)
	if (sitesError) {
		return c.json(200, { data: null, error: sitesError?.value?.error() || sitesError })
	}
	let natsServerConf = ''
	natsServerConf += `listen: 0.0.0.0:4222\n`;
	natsServerConf += `http: 6222\n`;
	natsServerConf += `\n`;
	natsServerConf += `cluster {\n`;
	natsServerConf += `name: "azabab"\n`;
	natsServerConf += `listen: 0.0.0.0:5222\n`;
	natsServerConf += `routes: [`
	for (let i = 0; i < sites.length; i++) {
		if (sites[i].domain === fqd) {
			continue
		}
		natsServerConf += `"nats://${sites[i].domain}:5222"`
		if (i < sites.length - 1) {
			natsServerConf += ','
		}
	}
	natsServerConf += `]\n`;
	natsServerConf += `}\n`;

	natsServerConf += `\n`;
	natsServerConf += `jetstream {\n`;
	natsServerConf += `store_dir: "/home/ubuntu/jetstream"\n`;
	natsServerConf += `}\n`;
	natsServerConf += `\n`;
	natsServerConf += `server_name: "${fqd.split('.')[0]}"\n`;

	console.log('natsServerConf', natsServerConf)
	console.log('rcloneConf', rcloneConf)
	console.log('fqd', fqd)
	const { data, error } = await configureserver(fqd, rcloneConf, natsServerConf);
	console.log('configureserver returned', data, error)
	if (error) {
		return c.json(200, { data: null, error: error?.value?.error() || error })
	} else {
		console.log('looks like it worked', data)
		return c.json(200, { data: data, error: null })
	}
})

