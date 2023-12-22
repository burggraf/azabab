<script context="module">
	// retain module scoped expansion state for each tree node
	const _expansionState = {
		/* treeNodeId: expanded <boolean> */
	}
</script>
<script lang="ts">
	export let tree;
    export let callback;
	import { documentOutline, folderOutline, folderOpenOutline, folder } from "ionicons/icons"

	// import { slide } from 'svelte/transition'
	const {label, fullpath, children, typ, len} = tree;

	let expanded = _expansionState[label] || false
	const toggleExpansion = () => {
		expanded = _expansionState[label] = !expanded
	}
	$: arrowDown = expanded
    const handler = (e) => {
        if (typ !== 'f') return;
        callback({label, fullpath, typ, len});
    }
</script>

<ul><!-- transition:slide -->
	<li on:click|stopPropagation={handler}>
		{#if children}
			<span on:click={toggleExpansion}>
				<span class="arrow" class:arrowDown>&#x25b6</span>
                <ion-icon icon={expanded?folderOpenOutline:folderOutline} />
				{label}
			</span>
			{#if expanded}
				{#each children as child}
					<svelte:self tree={child} {callback} />
				{/each}
			{/if}
		{:else}
			<span>
				<span class="no-arrow"/>
				<ion-icon icon={typ==="f"? documentOutline : folder} /> {label}
			</span>
		{/if}
	</li>
</ul>

<style>
	ul {
        font-size: 14pt;
        margin: 10pt;

		/*margin: 0;*/
		list-style: none;
		padding-left: 1.2rem; 
		user-select: none;
	}
	.no-arrow { padding-left: 1.0rem; }
	.arrow {
		cursor: pointer;
		display: inline-block;
		/* transition: transform 200ms; */
	}
	.arrowDown { transform: rotate(90deg); }
</style>
