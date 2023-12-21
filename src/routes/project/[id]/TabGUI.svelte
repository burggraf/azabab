<script lang="ts">
	import { pb } from '$services/backend.service'
	import { onMount } from 'svelte'
    import AccordionWrapper from './AccordionWrapper.svelte';
    export let instance_id: string = ''
    let dir: string[] = [];
    let tree: any;

const getDir = async () => {
    const { data, error } = await pb.send(`/getinstancefiles/${instance_id}`, {
				method: 'GET'
			})
    if (data) dir = data.split('\n').sort();
    else console.log('error', error);
    const index = dir.indexOf('./');
    if (index > -1) {
        dir.splice(index, 1);
    }
    const index2 = dir.indexOf('./.ssh');
    if (index2 > -1) {
        dir.splice(index2, 1);
    }
    const index3 = dir.indexOf('./.ssh/authorized_keys');
    if (index3 > -1) {
        dir.splice(index3, 1);
    }

    tree = buildTree(dir);
}

getDir();
// onMount(() => {
//     console.log('instance_id inside the tab is: ', instance_id)
//     console.log('TabGUI onmount', instance_id)
//     console.log('calling getDir');
//     //getDir();
// })  

interface TreeNode {
    title: string;
    children?: TreeNode[];
}

function buildTree(paths: string[]): TreeNode[] {
    const root: TreeNode[] = [];

    paths.forEach(path => {
        const segments = path.split('/').slice(1); // Skip the first segment
        let currentLevel = root;

        segments.forEach((segment, index) => {
            let node = currentLevel.find(n => n.title === segment);

            if (!node) {
                node = { title: segment };
                currentLevel.push(node);
            }

            if (index < segments.length - 1) {
                node.children = node.children ?? [];
                currentLevel = node.children;
            }
        });
    });

    return root;
}



const clickHandler = async (e: any) => {
    console.log('clickHandler', e.target.id);
}


</script>

<ion-content class="ion-padding">

    <ion-accordion-group>
        {#if tree}
            {#each tree as node}
            <AccordionWrapper {node} />
            {/each}
        {:else}
            <p>loading...</p>
        {/if}
      </ion-accordion-group>
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
