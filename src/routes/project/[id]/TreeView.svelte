<script context="module">
	// retain module scoped expansion state for each tree node
	const _expansionState = {
		/* treeNodeId: expanded <boolean> */
	}
</script>
<script lang="ts">
	// import { slide } from 'svelte/transition'
	export let tree
	const {label, fullpath, children} = tree

	let expanded = _expansionState[label] || false
	const toggleExpansion = () => {
		expanded = _expansionState[label] = !expanded
	}
	$: arrowDown = expanded
    const handler = (e) => {
        if (children) return;
        console.log(label, fullpath)
    }
</script>

<ul><!-- transition:slide -->
	<li on:click|stopPropagation={handler}>
		{#if children}
			<span on:click={toggleExpansion}>
				<span class="arrow" class:arrowDown>&#x25b6</span>
				{label}
			</span>
			{#if expanded}
				{#each children as child}
					<svelte:self tree={child} />
				{/each}
			{/if}
		{:else}
			<span>
				<span class="no-arrow"/>
				{label}
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
