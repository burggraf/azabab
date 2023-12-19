<script lang="ts">
    let stats: any = []
    import type { ProjectInstance } from './interfaces'
    import { currentUser, pb } from '$services/backend.service'
    import moment from 'moment'
	const formatDate = (timestamp: number) => moment(timestamp * 1000).format('MM/DD/YY HH:mm:ss')

	const changeMetrics = async (e: any) => {
		if (e !== 'info') {
			// fetch a paginated records list
			try {
				const resultList = await pb.collection('stats_view').getList(1, 50, {
					filter: `instance_id = "${e.detail.value}"`,
					columns: `ts, event, cpu_usage, mem_usage, disk_read, disk_write, net_in, net_out`,
					sort: '-ts',
				})
				stats = resultList.items
			} catch (error) {
				console.log('changeMetrics error', error)
			}
		}
	}
    export let project_instances: ProjectInstance[] = [
		{
			code: '',
			domain: '',
			id: '',
			port: 0,
			site_domain: '',
			site_name: 'Select a site',
			site_id: '',
			type: 'primary',
		},
	]

</script>
<div class="ion-padding" style="overflow: scroll;height: 100%">
    <ion-segment on:ionChange={changeMetrics} id="metrics" value="info">
        <ion-segment-button value="info">
            <ion-label>Info</ion-label>
        </ion-segment-button>
        {#each project_instances as project_instance, index}
            <ion-segment-button value={project_instance.id}>
                <ion-label>{project_instance.site_name}</ion-label>
            </ion-segment-button>
        {/each}
    </ion-segment>
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
