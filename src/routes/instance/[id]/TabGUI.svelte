<script lang="ts">
	import TreeView from './TreeView.svelte'
	import { pb } from '$services/backend.service'
	import { textFileExtensions } from '$services/utils.service'
	import type { ProjectInstance } from '$models/interfaces'
	import { instanceTab } from './instanceTabStore'
	import { Split } from '@geoffcox/svelte-splitter'
	import { toast } from '$services/toast'
    import loader from '@monaco-editor/loader';
    import { onDestroy, onMount } from 'svelte';
    import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';

    let editor: Monaco.editor.IStandaloneCodeEditor;
    let monaco: typeof Monaco;
    let editorContainer: HTMLElement;

    onMount(async () => {
        // Remove the next two lines to load the monaco editor from a CDN
        // see https://www.npmjs.com/package/@monaco-editor/loader#config
		console.log('onMount 01')
        const monacoEditor = await import('monaco-editor');
		console.log('onMount 02')
        loader.config({ monaco: monacoEditor.default });
		console.log('onMount 03')
        monaco = await loader.init();
		console.log('onMount 04')
        // Your monaco instance is ready, let's display some code!
		setTimeout(() =>{
			editor = monaco.editor.create(editorContainer);
			console.log('onMount 05')
			const model = monaco.editor.createModel(
				"console.log('Hello from Monaco! (the editor, not the city...)')",
				'javascript'
			);
			console.log('onMount 06')
			editor.setModel(model);
			console.log('onMount 07')
			window.addEventListener('resize', resizeContainer);
			console.log('onMount 08')
			// Initial resize to set the correct height
			resizeContainer();
			console.log('onMount 09')

		}, 250)
    });

    onDestroy(() => {
		window.removeEventListener('resize', resizeContainer);
        monaco?.editor.getModels().forEach((model) => model.dispose());
        editor?.dispose();
    });

	const loadFileIntoEditor = (text: string) => {
		const model = monaco.editor.createModel(
                    text,
                    'javascript' // Update this with the correct language for your file
                );
                editor.setModel(model);		
	}
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
		type: 'Select instance type',
		db_streaming_backup_location: '',
		logs_streaming_backup_location: '',
		db_streaming_backup_retention: 0,
		logs_streaming_backup_retention: 0,
		instance_status: '',
	}
	let dir: string[] = []
	let tree: any
	const getDir = async () => {
		console.log('getDir project_instance.id: ', project_instance.id)
		console.log('getDir project_instance: ', project_instance)
		const { data, error } = await pb.send(`/getinstancefiles/${project_instance.id}`, {
			method: 'GET',
		})
		if (data)
			dir = data
				.split('\n')
				.filter(
					(item: string) =>
						!item.startsWith('./.ssh') &&
						!item.startsWith('./marmot') &&
						!item.startsWith('./.data.db-litestream') &&
						!item.startsWith('./ ')
				)
				.sort()
		else console.log('getinstancefiles error', error)

		// remove any array entries that start with './.ssh'

		// console.log(JSON.stringify(dir, null, 2))
		tree = buildTree(dir)[0]
		// console.log('tree', tree);
	}

	instanceTab.subscribe(async (value: string) => {
		if (value === 'gui') {
			console.log('INSTANCE TAB GUI')
			await getDir()
		}
	})
	if (localStorage.getItem('instance.tab') === 'gui') {
		console.log('>>>>>>>>> instance.tab is gui <<<<<<<<<<')
		setTimeout(async () => {
			console.log('SET TIMEOUT FIRED, getDir()...')
			await getDir()
		}, 1000)
	}

	const callback = async (item: any) => {
		console.log('handler', item)
		/*
            {label: 'data.db', fullpath: './pb_data/data.db', typ: 'f', len: '921600'}        
        */
		const modifiedPath = item.fullpath.replace('./', '')
		console.log('modifiedPath', modifiedPath)
		console.log('TabGUI => project_instance.id', project_instance.id)

		// get the file extension
		const ext = '.' + modifiedPath.split('.').pop()
		if (textFileExtensions.indexOf(ext) === -1) {
			const el = document.getElementById('preview')
			if (el) el.innerText = `not a text file`
			const el2 = document.getElementById('previewTitle')
			if (el2) el2.innerHTML = modifiedPath //item.fullpath.replace('./', '')

			return
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
			console.log('loadFileIntoEditor(data.raw)', data.raw.length + ' bytes')
			loadFileIntoEditor(data.raw);
			return;
			// console.log('data.raw', data.raw)
			// const el = document.getElementById('preview')
			// if (el) el.innerText = data.raw
			// const el2 = document.getElementById('previewTitle')
			// if (el2) el2.innerHTML = item.fullpath.replace('./', '')
		}
	}


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
	const resizeContainer = () => {
		console.log('resizeContainer()')
        if (editorContainer && editorContainer?.parentElement?.parentElement) {
            // Set the height of the container to the height of the parent element
            editorContainer.style.height = `${editorContainer.parentElement.parentElement.offsetHeight}px`;
			editor.layout();
        }
    }
</script>

<ion-content class="ion-padding">
	{#if tree}
		<Split initialPrimarySize="30%" resetOnDoubleClick>
			<div slot="primary">
				<TreeView {tree} {callback} />
			</div>
			<div slot="secondary">
				<div class="container" bind:this={editorContainer} />
			</div>
		</Split>
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
		/* height: 100%; */ /* Full height of ion-content */
        height: 600px;
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
