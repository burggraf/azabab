<script lang="ts">
	let stats: any = []
	let diskstats: any = []
	let itemcount = 50;
	let cutoff = 'current time';
	import type { ProjectInstance } from '$models/interfaces'
	import { currentUser, pb } from '$services/backend.service'
	import moment from 'moment'
	import * as allIonicIcons from 'ionicons/icons'
	import { instanceTab } from './instanceTabStore'
	const formatDate = (timestamp: number) => moment(timestamp * 1000).format('MM/DD/YY HH:mm:ss')
	import { getRelativePosition } from 'chart.js/helpers'
	import TabMetricsCharts from './TabMetricsCharts.svelte'
	import { dropdownmenu } from '$components/DropdownMenu'
	import { checkmarkOutline, closeOutline } from 'ionicons/icons'
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

	const loadData = async (cutoffDateTime?: string) => {
		let filter = `instance_id = "${project_instance?.id}"`
		// convert cutoffDateTime to timestamp using moment

		if (cutoffDateTime && cutoffDateTime !== 'current time') {
			const newTS = moment(cutoffDateTime).unix();
			filter += ` && ts <= ${newTS}`;
		}
		const resultList = await pb.collection('stats_view').getList(1, itemcount, {
			filter,
			columns: `ts, event, cpu_usage, mem_usage, disk_read, disk_write, net_in, net_out`,
			sort: '-ts',
		})
		//console.log('loadData: resultList', JSON.stringify(resultList))
		stats = resultList.items.reverse()
		const diskList = await pb.collection('disk_usage_view').getList(1, itemcount, {
			filter,
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
	const chooseItemCount = async (e: any) => {
		const opts = [10, 20, 50, 100, 200]
		const items = [];
		for (let opt of opts) {
			items.push({
				text: opt.toString(),
				icon: allIonicIcons.barChartOutline,
				color: 'primary',
				textcolor: 'primary',
				handler: async () => {
					itemcount = opt;
					await loadData(cutoff);
				},
			})
		}
		const result = await dropdownmenu(e, items)
	}
	const chooseCutoff = async (e: any) => {
		console.log('not implemented')
	}
	const dateChanged = (e: any) => {
		console.log('dateChanged', e.detail.value)
		cutoff = e.detail.value
	}

</script>

<div class="ion-padding" style="overflow: scroll;height: 100%">
	<ion-toolbar>
		<ion-grid>
			<ion-row>
				<ion-col>
					<ion-button size="small" expand="block" on:click={chooseItemCount}
					>show {itemcount} items</ion-button>					
				</ion-col>
				<ion-col>
					<ion-modal trigger="open-modal">


						<ion-header>
							<ion-toolbar>
							<ion-buttons slot="start">
								<ion-button on:click={() => {
									const el = document.querySelector('ion-modal');
									if (el) el.dismiss();
								}} strong={true}><ion-icon slot="icon-only" icon={closeOutline} /></ion-button>
							</ion-buttons>
							<ion-title>Ending Time</ion-title>
							<ion-buttons slot="end">
								<ion-button on:click={() => {
									loadData(cutoff);
									const el = document.querySelector('ion-modal');
									if (el) el.dismiss();
								}} strong={true}><ion-icon slot="icon-only" icon={checkmarkOutline} /></ion-button>
							</ion-buttons>
							</ion-toolbar>
						</ion-header>
						<ion-content class="ion-padding">
							<div class="ion-text-center" style="display: flex; align-items: center; justify-content: center;">
							<ion-datetime on:ionChange={dateChanged}></ion-datetime>
							</div>
							<div class="ion-text-center" style="display: flex; align-items: center; justify-content: center;">

							<ion-button expand="block" 
								style="max-width: 500px;"
								size="small"
								on:click={() => {
									cutoff = 'current time';
									loadData();
									const el = document.querySelector('ion-modal');
									if (el) el.dismiss();
							}}>Use Current Time</ion-button>

							<ion-button expand="block" 
								style="max-width: 500px;"
								size="small"
								on:click={() => {
									// do something here
									loadData(cutoff);
									const el = document.querySelector('ion-modal');
									if (el) el.dismiss();
							}}>{cutoff}</ion-button>


							</div>
						</ion-content>
						

					</ion-modal>
					<ion-button id="open-modal" size="small" expand="block" on:click={chooseCutoff}
					>through {cutoff}</ion-button>
				</ion-col>
			</ion-row>
		</ion-grid>


	</ion-toolbar>
	
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
