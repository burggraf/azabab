<script lang="ts">
	let stats: any = []
	let diskstats: any = []
	import type { ProjectInstance } from '$models/interfaces'
	import { currentUser, pb } from '$services/backend.service'
	import moment from 'moment'
	import { instanceTab } from './instanceTabStore'
	const formatDate = (timestamp: number) => moment(timestamp * 1000).format('MM/DD/YY HH:mm:ss')
	import { getRelativePosition } from 'chart.js/helpers'
	import TabMetricsCharts from './TabMetricsCharts.svelte'
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
			await loadData()
		}
	})

	export const refresh = () => {
		loadData();
	}

	const loadData = async () => {
		const resultList = await pb.collection('stats_view').getList(1, 50, {
			filter: `instance_id = "${project_instance?.id}"`,
			columns: `ts, event, cpu_usage, mem_usage, disk_read, disk_write, net_in, net_out`,
			sort: '-ts',
		})
		//console.log('loadData: resultList', JSON.stringify(resultList))
		stats = resultList.items.reverse()
		const diskList = await pb.collection('disk_usage_view').getList(1, 50, {
			filter: `instance_id = "${project_instance?.id}"`,
			columns: `ts, size`,
			sort: '-ts',
		})
		//console.log('loadData: resultList', JSON.stringify(resultList))
		diskstats = diskList.items.reverse()
		console.log('loadData: diskstats', diskstats)
		// load chart stuff here

		// load chart stuff here
	}
	if (localStorage.getItem('instance.tab') === 'metrics') {
		setTimeout(async () => {
            if (stats.length === 0) {
                await loadData()
            }
		}, 1000)
	}
	// ********************************
    </script>

<div class="ion-padding" style="overflow: scroll;height: 100%">
    <TabMetricsCharts {stats} {diskstats} />
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
