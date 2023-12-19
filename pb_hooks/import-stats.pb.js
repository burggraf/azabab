/// <reference path="../pb_data/types.d.ts" />

routerAdd('GET', '/import-stats', async (c) => {
	const convertUnits = (str) => {
		// get units by looking for letters in the string
		const arr = str.split(/([a-zA-Z]+)/)
		if (arr.length < 2) {
			return 0
		}
		const num = parseFloat(arr[0])
		const unit = arr[1]
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

    const sites = arrayOf(
        new DynamicModel({
            id: '',
            name: '',
            domain: '',
        })
    )
    $app
        .dao()
        .db()
        .newQuery(
            `select id, name, domain from sites where active = true`
        )
        .all(sites) // throw an error on db failure

    const process_site = async (site) => {
        console.log('processing stats for', site.name)
        try {
            let counter = 0
            let records_inserted = 0;
            while (counter < 500) {
                // read the body via the cached request object
                // (this method is commonly used in hook handlers because it allows reading the body more than once)
                const res = await $http.send({
                    url: `http://${site.domain}:3030/getfile`,
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
                        console.log(`${site.name} getfile error:`)
                        console.log('res', JSON.stringify(res, null, 2))
                        return;
                        // return c.json(res.statusCode, { data: null, error: res.json?.error || res.raw })	
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
                        console.log(`${site.name} file ${f} line ${i + 1} skipping record.length < 10`, record.length)
                        console.log('record: ', JSON.stringify(record))
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
                                `insert into stats (site_id, ts, event, port, cpu_usage, mem_usage, mem_max, net_in, net_out, disk_write, disk_read) 
                        values ('${site.id}', '${rec.ts}', '${rec.event}', '${rec.port}', '${rec.cpu_usage}', '${rec.mem_usage}', '${rec.mem_max}', '${rec.net_in}', '${rec.net_out}', '${rec.disk_write}', '${rec.disk_read}')
                        returning id`
                            )
                            .all(result_record) // throw an error on db failure
                        records_inserted++
                    }
                }
                // delete file
                const delete_res = await $http.send({
                    url: `http://${site.domain}:3030/deletefile/${f}`,
                    method: 'GET',
                    // body:    JSON.stringify({"domain": data?.project?.domain + '.' + data?.site?.domain, "port": newPort.toString()}),
                    headers: {
                        'content-type': 'application/json',
                        Authorization: 'YourSecretToken',
                    },
                    timeout: 120, // in seconds
                })
                if (delete_res.statusCode !== 200) {
                    console.log(`${site.name} ${filename} delete file error`, JSON.stringify(delete_res, null, 2))
                    return;
                    // return c.json(delete_res.statusCode, { data: null, error: delete_res.json.error })
                }
                counter++;
            }
            console.log(`${site.name} SUCCESS: ${counter} files processed, ${records_inserted} records inserted.`)
            // return c.json(200, { data: `SUCCESS: ${counter} files processed, ${records_inserted} records inserted.`, error: null })
            return;
        } catch (err) {
            console.log(`${site.name} error`, err)
            return;
            //return c.json(200, { ERROR: JSON.stringify(err) })
        }
    
    }
    for (const site of sites) {
        await process_site(site)
    }
})
