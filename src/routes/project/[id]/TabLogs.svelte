<script lang="ts">
    let stats: any = []
    import type { ProjectInstance } from './interfaces'
    import { currentUser, pb } from '$services/backend.service'
    
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
	];
    let sortDirection = 'forward'
    const loadData = async () => {
        const { data, error } = await pb.send(`/getinstancefile`, {
				method: 'POST',
				body: {
					project_instance_id: project_instances[0].id,
					path: 'pb_data/log.txt',
				},
			})
			console.log('*** getinstancefile: data, error', data, error)
			if (data?.raw) {
				console.log('data.raw', data.raw)
                const logs = data.raw.split('\n')
                if (sortDirection === 'reverse') logs.reverse();
                const el = document.getElementById('logviewer');                
                if (el) { 
                    el.innerText = '';
                    for (let i = 0; i < logs.length; i++) {
                        const log = logs[i];
                        el.innerText += log + '\n';
                    }
                }
			} 

    }
    setTimeout(() => {
        loadData()
    }, 500)
    const changeSort = (e: any) => {
        console.log('changeSort: e', e)
        sortDirection = e.detail.value
        loadData()
        // loadData()
    }
</script>
<div class="ion-padding" style="overflow: scroll;height: 100%">
    <ion-segment style="max-width: 200px;" on:ionChange={changeSort} id="sortDirection" value={sortDirection}>
        <ion-segment-button value="forward">
            <ion-label>Forward</ion-label>
        </ion-segment-button>
        <ion-segment-button value="reverse">
            <ion-label>Reverse</ion-label>
        </ion-segment-button>
    </ion-segment>                


    <pre id="logviewer"></pre>
</div>
