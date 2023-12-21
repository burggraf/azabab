<script lang="ts">
    import AccordionWrapper from './AccordionWrapper.svelte';
    export let node: any;
    export let paddingLeft = 0;
  </script>
  
  <ion-accordion value={node.title}>
    <ion-item slot="header" color="light" style={`padding-left: ${paddingLeft}px;`}>
      <ion-label>{node.title}</ion-label>
    </ion-item>
  
    <div slot="content">
      {#if node.children && node.children.length > 0}
        <ion-accordion-group>
          {#each node.children as childNode}
            <AccordionWrapper node={childNode} paddingLeft={paddingLeft + 20} />
          {/each}
        </ion-accordion-group>
      {:else}
          <div class="ion-padding" style={`margin-left:${paddingLeft}px;`}>
             Content for {node.title}
          </div>
      {/if}
    </div>
  </ion-accordion>
  

