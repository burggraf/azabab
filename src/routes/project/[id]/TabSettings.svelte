<script lang="ts">
    import type { Project, ProjectInstance, Site } from './interfaces'
    import { currentUser, pb } from '$services/backend.service'
    import { dropdownmenu } from '$components/DropdownMenu'
	import * as allIonicIcons from 'ionicons/icons'

    export let project: Project = {
		id: '',
		domain: '',
		name: '',
		owner: $currentUser?.id,
		ownertype: 'person',
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
    export let sites: Site[] = []


	const handleChange = async (event: any) => {
		console.log('id', event.target.id)
		console.log('handleChange', event.target.value)
		console.log(event)
		project[event.target.id] = event.target.value || ''
	}
    const chooseSite = async (e: any) => {
		let items = []
		for (let i = 0; i < sites.length; i++) {
			const site = sites[i]
			items.push({
				text: site.name,
				icon: allIonicIcons.globeOutline,
				handler: async () => {
					project_instances[0].id = site.id
					project_instances[0].site_name = site.name
					project_instances[0].site_domain = site.domain
				},
			})
		}
		const result = await dropdownmenu(e, items)
	}


</script>
<ion-grid class="ion-padding Grid">
    <ion-row>
        <ion-col>
            <ion-label>Project Name</ion-label>
        </ion-col>
    </ion-row>
    <ion-row>
        <ion-col>
            <ion-item class="GridItem" lines="none">
                <ion-input
                    on:ionInput={handleChange}
                    class="loginInputBoxWithIcon"
                    type="text"
                    id="name"
                    placeholder="Project Name"
                    style="--padding-start: 10px;"
                    value={project.name}
                    debounce={500}
                />
            </ion-item>
        </ion-col>
    </ion-row>

    <ion-row>
        <ion-col>
            <ion-label>domain</ion-label>
        </ion-col>
    </ion-row>
    <ion-row>
        <ion-col>
            <ion-item class="GridItem" lines="none">
                <ion-input
                    on:ionInput={handleChange}
                    class="loginInputBoxWithIcon"
                    type="text"
                    id="domain"
                    placeholder="domain"
                    style="--padding-start: 10px;"
                    value={project.domain}
                    debounce={500}
                />
            </ion-item>
        </ion-col>
    </ion-row>
    <ion-row style="padding-top: 20px;">
        <ion-col
            class="ion-text-center"
            style="width: 100%;border: 1px solid;background-color: var(--ion-color-dark);"
        >
            <ion-label color="light"><b>Instances</b></ion-label>
        </ion-col>
    </ion-row>
    {#each project_instances as project_instance, index}
        <ion-row>
            <ion-col class="ion-text-center">
                <ion-label>Instance {index + 1}</ion-label>
            </ion-col>
        </ion-row>
        <ion-row>
            <ion-col>
                <ion-button size="small" expand="block" on:click={chooseSite}
                    >{project_instance.site_name}</ion-button
                >
            </ion-col>
        </ion-row>
        <ion-row>
            <ion-col>
                <ion-button
                    size="small"
                    fill={project_instance.type === 'primary' ? 'solid' : 'outline'}
                    expand="block"
                    on:click={() => {}}
                >
                    primary
                </ion-button>
            </ion-col>
            <ion-col>
                <ion-button
                    size="small"
                    fill={project_instance.type === 'replica' ? 'solid' : 'outline'}
                    expand="block"
                    on:click={() => {}}
                >
                    replica
                </ion-button>
            </ion-col>
        </ion-row>
        <ion-row><ion-col style="width: 100%;border-top: 1px solid;">&nbsp;</ion-col></ion-row>
    {/each}
</ion-grid>
