<script lang="ts">
	import TreeView from './TreeView.svelte'
	import { pb } from '$services/backend.service'
    import { textFileExtensions } from '$services/utils.service'
	import type { ProjectInstance } from './interfaces'

	import { toast } from '$services/toast'
    export let project_instance: ProjectInstance = 
		{
			code: '',
			domain: '',
			id: '',
			port: 0,
			site_domain: '',
			site_name: 'Select a site',
			site_id: '',
			type: 'primary',
		};
	let dir: string[] = []
	let tree: any

	console.log('**** TabGUI ====> project_instance', project_instance)

	const callback = async (item: any) => {
		console.log('handler', item)
		/*
            {label: 'data.db', fullpath: './pb_data/data.db', typ: 'f', len: '921600'}        
        */
		const modifiedPath = item.fullpath.replace('./', '')
		console.log('modifiedPath', modifiedPath)
		console.log('TabGUI => project_instance.id', project_instance.id)

		if (false && modifiedPath.startsWith('pb_public')) {
			// old code removed            

		} else {
            // get the file extension
            const ext = '.' + modifiedPath.split('.').pop();
            if (textFileExtensions.indexOf(ext) === -1) {
                const el = document.getElementById('preview');                
                if (el) el.innerText = `not a text file`
                const el2 = document.getElementById('previewTitle');
                if (el2) el2.innerHTML = modifiedPath //item.fullpath.replace('./', '')

                return;
            }
            
			const { data, error } = await pb.send(`/getinstancefile`, {
				method: 'POST',
				body: {
					project_instance_id: project_instance.id,
					path: modifiedPath,
				},
				//instance_id
				//path: fullpath
			})
			console.log('*** getinstancefile: data, error', data, error)
			if (data?.raw) {
				console.log('data.raw', data.raw)
                const el = document.getElementById('preview');                
                if (el) el.innerText = data.raw;
                const el2 = document.getElementById('previewTitle');
                if (el2) el2.innerHTML = item.fullpath.replace('./', '')
			}
		}
	}

	const getDir = async () => {
		const { data, error } = await pb.send(`/getinstancefiles/${project_instance.id}`, {
			method: 'GET',
		})
		if (data)
			dir = data
				.split('\n')
				.filter((item: string) => !item.startsWith('./.ssh') && !item.startsWith('./ '))
				.sort()
		else console.log('error', error)

		// remove any array entries that start with './.ssh'

		// console.log(JSON.stringify(dir, null, 2))
		tree = buildTree(dir)[0]
		// console.log('tree', tree);
	}

	setTimeout(() => {
		getDir()
	}, 1000)

	interface TreeNode {
		label: string
		children?: TreeNode[]
		fullpath?: string
		typ?: string
		len?: string
	}

	function buildTree(paths: string[]): TreeNode[] {
		const root: TreeNode[] = []

		paths.forEach((path) => {
			const segments = path.split('/').slice(1) // Skip the first segment
			let currentLevel = root

			segments.forEach((segment, index) => {
				const segmentParts = segment.split(' |')
				let node = currentLevel.find((n) => n.label === segmentParts[0])

				if (!node) {
					node = {
						label: segmentParts[0],
						fullpath: path.split(' |')[0],
						typ: segmentParts[1],
						len: segmentParts[2],
					}
					currentLevel.push(node)
				}

				if (index < segments.length - 1) {
					node.children = node.children ?? []
					currentLevel = node.children
				}
			})
		})

		return [{ label: 'root', children: root }]
	}
</script>

<ion-content class="ion-padding">
	{#if tree}
        <ion-grid>
            <ion-row>
                <ion-col size={"6"}>
                    <TreeView {tree} {callback} />
                </ion-col>
                <ion-col size={"6"} style="border: 1px solid;">
                    <div id="previewTitle" style="padding: 5px; background-color: var(--ion-color-dark);color: var(--ion-color-dark-contrast);">Preview</div>
                    <pre id="preview" class="ion-text-wrap" style="padding-left: 10px;padding-right: 10px;">select a file</pre>                    
                </ion-col>
            </ion-row>
        </ion-grid>
	{:else}
		<div class="ion-text-center ion-padding">
			<ion-spinner name="crescent" /><br />
			<ion-label>Loading...</ion-label>
		</div>
	{/if}
</ion-content>

<style>
	html,
	body {
		height: 100%; /* Full height */
		margin: 0;
		padding: 0;
	}

	ion-content {
		--padding-start: 0;
		--padding-end: 0;
		--padding-top: 0;
		--padding-bottom: 0;
		height: 100vh; /* Full viewport height */
		display: block; /* Override any flexbox display */
	}
	.box-title {
		background-color: var(--ion-color-primary);
		color: var(--ion-color-primary-contrast);
		border-bottom: 1px solid black;
		padding-left: 20px;
	}

	.container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		height: 100%; /* Full height of ion-content */
		width: 100%; /* Full width */
	}

	.box {
		border: 1px solid black;
		display: flex;
		flex-direction: column; /* Align children vertically */
		justify-content: flex-start; /* Start content from the top */
		overflow: hidden; /* Hide overflow */
		min-height: 50vh; /* Minimum half viewport height */
		height: 50vh; /* Set height to half of the viewport height */
		position: relative; /* Needed for absolute positioning of children */
	}

	.box-content {
		width: 100%; /* Full width of the box */
		height: 100%; /* Full height of the box */
		overflow-y: auto; /* Enable vertical scrolling */
		position: absolute; /* Positioned absolutely to fill the box */
		top: 0;
		left: 0;
		margin-top: 20px;
		margin-left: 20px;
		padding-right: 20px;
	}

	.upper-left .mylist {
		width: 100%;
		height: 100%;
		overflow-y: auto;
	}
</style>
