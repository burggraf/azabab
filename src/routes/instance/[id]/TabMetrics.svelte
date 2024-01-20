<script lang="ts">
	let stats: any = []
	import type { ProjectInstance } from '$models/interfaces'
	import { currentUser, pb } from '$services/backend.service'
	import moment from 'moment'
	import { instanceTab } from './instanceTabStore'
	const formatDate = (timestamp: number) => moment(timestamp * 1000).format('MM/DD/YY HH:mm:ss')
	const formatDate2 = (timestamp: number) => moment(timestamp * 1000).format('MM/DD HH:mm')
	import Chart from 'chart.js/auto'
	import { getRelativePosition } from 'chart.js/helpers'
	export let project_instance: ProjectInstance = {
		name: '',
		project_id: '',
		owner: '',
		ownertype: '',
		code: '',
		domain: '',
		id: '',
		port: 0,
		site_domain: '',
		site_name: 'Select a site',
		site_id: '',
		type: 'primary',
		db_streaming_backup_location: '',
		logs_streaming_backup_location: '',
		db_streaming_backup_retention: 0,
		logs_streaming_backup_retention: 0,
		instance_status: '',
	}
	instanceTab.subscribe(async (value: string) => {
		if (value === 'metrics') {
			console.log('INSTANCE TAB METRICS')
			await loadData()
		}
	})

	const loadData = async () => {
		console.log('tabmetrics loadata, $currentUser', $currentUser)
		const resultList = await pb.collection('stats_view').getList(1, 50, {
			filter: `instance_id = "${project_instance?.id}"`,
			columns: `ts, event, cpu_usage, mem_usage, disk_read, disk_write, net_in, net_out`,
			sort: '-ts',
		})
		//console.log('loadData: resultList', JSON.stringify(resultList))
		stats = resultList.items.reverse()
        //stats = demo
		console.log('stats', stats)
        console.log('loadData 01')
        let labels = stats.map((stat: any) => formatDate2(stat.ts))
        const cpu_usage = stats.map((stat: any) => stat.cpu_usage)
        let datasets = [
					{
						label: 'CPU Usage %',
						data: cpu_usage,
						borderWidth: 1,
						tension: 0.3,
					},
				]
        console.log('loadData 02')
		createChart('cpu', 'CPU Usage', labels, datasets)
        console.log('loadData 03')
        const mem_usage = stats.map((stat: any) => stat.mem_usage)
        datasets = [
					{
						label: 'Memory Usage (mb)',
						data: mem_usage,
						borderWidth: 1,
						tension: 0.3,
					},
				]
		createChart('mem', 'Memory Usage', labels, datasets)
        const disk_read = stats.map((stat: any) => stat.disk_read)
        const disk_write = stats.map((stat: any) => stat.disk_write)
        datasets = [
					{
						label: 'Disk I/O IN (bytes)',
						data: disk_read,
						borderWidth: 1,
						tension: 0.3,
					},
                    {
						label: 'Disk I/O OUT (bytes)',
						data: disk_write,
						borderWidth: 1,
						tension: 0.3,
					},
				]
		createChart('disk', 'Disk I/O', labels, datasets)
        const net_in = stats.map((stat: any) => stat.net_in)
        const net_out = stats.map((stat: any) => stat.net_out)
        datasets = [
					{
						label: 'Net I/O IN (bytes)',
						data: net_in,
						borderWidth: 1,
						tension: 0.3,
					},
					{
						label: 'Net I/O OUT (bytes)',
						data: net_out,
						borderWidth: 1,
						tension: 0.3,
					},
				]
		createChart('net', 'Network I/O', labels, datasets)
	}
	if (localStorage.getItem('instance.tab') === 'metrics') {
		setTimeout(async () => {
			await loadData()
		}, 1000)
	}
	// ********************************
	const createChart = (chartType: string, description: string, labels: string[], datasets: any[]) => {
		const ctx: any = document.getElementById(`${chartType}Chart`)

		new Chart(ctx, {
			type: 'line',
			data: {
				labels: labels,
				datasets: datasets,
			},
			options: {
				scales: {
					x: {
						ticks: {
							maxRotation: 90,
							minRotation: 90,
						},
					},
                    y: {
                        beginAtZero: true
                    }
				},
			},
		})
	}
</script>

<div class="ion-padding" style="overflow: scroll;height: 100%">
	<ion-grid>
		<ion-row>
			<ion-col>
				<div style="width: 100%;">
					<canvas id="cpuChart" />
				</div>
			</ion-col>
			<ion-col>
				<div style="width: 100%;">
					<canvas id="memChart" />
				</div>
			</ion-col>
		</ion-row>
		<ion-row>
			<ion-col>
				<div style="width: 100%;">
					<canvas id="diskChart" />
				</div>
			</ion-col>
			<ion-col>
				<div style="width: 100%;">
					<canvas id="netChart" />
				</div>
			</ion-col>
		</ion-row>
	</ion-grid>
 
	<ion-grid class="ion-padding" id="statGrid" style="width: 100%">
		<ion-row style="color:var(--ion-color-light);background-color:var(--ion-color-medium)">
			<ion-col>Date</ion-col>
			<ion-col>Event</ion-col>
			<ion-col>CPU%</ion-col>
			<ion-col>Mem(mb)</ion-col>
			<ion-col>Disk Read</ion-col>
			<ion-col>Disk Write</ion-col>
			<ion-col>Net In</ion-col>
			<ion-col>Net Out</ion-col>
		</ion-row>
		{#each stats as stat, index}
			<ion-row>
				<ion-col>{formatDate(stat.ts)}</ion-col>
				<ion-col>{stat.event}</ion-col>
				<ion-col>{stat.cpu_usage}</ion-col>
				<ion-col>{stat.mem_usage}</ion-col>
				<ion-col>{stat.disk_read}</ion-col>
				<ion-col>{stat.disk_write}</ion-col>
				<ion-col>{stat.net_in}</ion-col>
				<ion-col>{stat.net_out}</ion-col>
			</ion-row>
		{/each}
	</ion-grid>
</div>
