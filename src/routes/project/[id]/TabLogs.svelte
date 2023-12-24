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
                const el = document.getElementById('logviewer');                
                if (el) { 
                    el.innerText = data.raw; 
                }
			} 

    }
    setTimeout(() => {
        loadData()
    }, 500)

</script>
<div class="ion-padding" style="overflow: scroll;height: 100%">
    <pre id="logviewer"></pre>
</div>
