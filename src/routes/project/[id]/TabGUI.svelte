<script lang="ts">
	import AccordionMenu from '$lib/components/AccordionMenu.svelte'
	const dir = `./pb_hooks
./pb_hooks/main.pb.js
./pb_public
./pb_public/lobby.html
./pb_public/samples.html
./pb_public/favicon.ico
./pb_public/robots.txt
./pb_public/icon-96.png
./pb_public/icon-64.png
./pb_public/favicon.png
./pb_public/manifest.webmanifest
./pb_public/icon-16.png
./pb_public/browserconfig.xml
./pb_public/settings.html
./pb_public/account.html
./pb_public/index.html
./pb_public/privacy.html
./pb_public/icon-256.png
./pb_public/quiz.html
./pb_public/prompt-sw.js
./pb_public/icon-192.png
./pb_public/spotify.svg
./pb_public/notion.svg
./pb_public/icon-2048.png
./pb_public/icon-167.png
./pb_public/icon-120.png
./pb_public/icon-1024.png
./pb_public/icon-152.png
./pb_public/icon-128.png
./pb_public/safari-pinned-tab.svg
./pb_public/welcome.html
./pb_public/zoom.svg
./pb_public/icon.svg
./pb_public/changelog.html
./pb_public/icon-1024-transparent.png
./pb_public/about.html
./pb_public/icon-32.png
./pb_public/terms.html
./pb_public/icon-150.png
./pb_public/samples
./pb_public/samples/sample-modal.html
./pb_public/support.html
./pb_public/avatar.svg
./pb_public/icon-384.png
./pb_public/icon-168.png
./pb_public/icon-24.png
./pb_public/_app
./pb_public/_app/immutable
./pb_public/_app/immutable/chunks
./pb_public/_app/immutable/chunks/swipe-back.54ef3848.js
./pb_public/_app/immutable/chunks/index.824f034a.js
./pb_public/_app/immutable/chunks/alert.service.4ec40d9c.js
./pb_public/_app/immutable/chunks/LoginModal.bda1e6a5.js
./pb_public/_app/immutable/chunks/IonPage.b1ab5286.js
./pb_public/_app/immutable/chunks/display.f31ad225.js
./pb_public/_app/immutable/chunks/navigation.46da1396.js
./pb_public/_app/immutable/chunks/index.6a09ff18.js
./pb_public/_app/immutable/chunks/ios.transition.94a597f5.js
./pb_public/_app/immutable/chunks/status-tap.0bf0ccc7.js
./pb_public/_app/immutable/chunks/index9.2cf416cb.js
./pb_public/_app/immutable/chunks/platform.8c49433f.js
./pb_public/_app/immutable/chunks/PageEmpty.a7569504.js
./pb_public/_app/immutable/chunks/index.bb71138b.js
./pb_public/_app/immutable/chunks/0.5718c83e.js
./pb_public/_app/immutable/chunks/platform.5c5c8fed.js
./pb_public/_app/immutable/chunks/md.transition.ccf7b3f1.js
./pb_public/_app/immutable/chunks/singletons.2a208677.js
./pb_public/_app/immutable/chunks/preload-helper.a4192956.js
./pb_public/_app/immutable/chunks/input-shims.eec295ae.js
./pb_public/_app/immutable/chunks/workbox-window.prod.es5.a7b12eab.js
./pb_public/_app/immutable/chunks/backend.service.893b7959.js
./pb_public/_app/immutable/entry
./pb_public/_app/immutable/entry/start.93da986a.js
./pb_public/_app/immutable/entry/app.cfa11988.js
./pb_public/_app/immutable/assets
./pb_public/_app/immutable/assets/_page.5f6e5573.css
./pb_public/_app/immutable/assets/_error.c4fe04f7.css
./pb_public/_app/immutable/assets/5.c1f2d0b9.css
./pb_public/_app/immutable/assets/_layout.12ef4d86.css
./pb_public/_app/immutable/assets/1.c4fe04f7.css
./pb_public/_app/immutable/assets/LoginModal.0728e295.css
./pb_public/_app/immutable/assets/8.c429f4c6.css
./pb_public/_app/immutable/assets/_page.c1f2d0b9.css
./pb_public/_app/immutable/assets/display.46924d99.css
./pb_public/_app/immutable/assets/0.12ef4d86.css
./pb_public/_app/immutable/assets/9.e64b27e7.css
./pb_public/_app/immutable/assets/4.5f6e5573.css
./pb_public/_app/immutable/assets/_page.c429f4c6.css
./pb_public/_app/immutable/assets/2.b1579e4a.css
./pb_public/_app/immutable/assets/_page.b1579e4a.css
./pb_public/_app/immutable/assets/display.0c82dd73.css
./pb_public/_app/immutable/assets/_page.e64b27e7.css
./pb_public/_app/immutable/nodes
./pb_public/_app/immutable/nodes/9.30240635.js
./pb_public/_app/immutable/nodes/2.bb8c07e6.js
./pb_public/_app/immutable/nodes/13.417b1de1.js
./pb_public/_app/immutable/nodes/14.aaebeb5b.js
./pb_public/_app/immutable/nodes/10.9bb935ba.js
./pb_public/_app/immutable/nodes/1.5c4d5374.js
./pb_public/_app/immutable/nodes/12.56b9eb28.js
./pb_public/_app/immutable/nodes/6.4eab52d6.js
./pb_public/_app/immutable/nodes/0.d1b77d5c.js
./pb_public/_app/immutable/nodes/4.547b789e.js
./pb_public/_app/immutable/nodes/8.0afea89a.js
./pb_public/_app/immutable/nodes/3.69229714.js
./pb_public/_app/immutable/nodes/5.229c87b3.js
./pb_public/_app/immutable/nodes/11.fa9c992d.js
./pb_public/_app/immutable/nodes/7.fbb0b639.js
./pb_public/_app/version.json
./pb_public/icon-512.png
./pb_public/apple-touch-icon.png
./pb_public/icon-180.png
./pb_migrations
./pb_migrations/1701697956_created_trivia_counts.js
./pb_migrations/1701373615_updated_trivia_log.js
./pb_migrations/1701657215_updated_userstate.js
./pb_migrations/1701373591_updated_trivia_log.js
./pb_migrations/1701718349_updated_users.js
./pb_migrations/1701741471_updated_trivia_log_score.js
./pb_migrations/1701698084_created_trivia_total.js
./pb_migrations/1701535061_updated_lobby.js
./pb_migrations/1701306404_created_trivia.js
./pb_migrations/1701532099_created_lobby.js
./pb_migrations/1701797723_updated_trivia_counts.js
./pb_migrations/1701656545_deleted_lobby.js
./pb_migrations/1701536337_updated_lobby.js
./pb_migrations/1701318538_updated_trivia.js
./pb_migrations/1701741386_updated_trivia_log_score.js
./pb_migrations/1701740986_created_trivia_log_score.js
./pb_migrations/1701614973_updated_lobby.js
./pb_migrations/1701656519_created_userstate.js
./pb_migrations/1701373175_created_trivia_log.js
./pb_migrations/1701741341_updated_trivia_log_score.js
./pb_data
./pb_data/filtered.db
./pb_data/backups
./pb_data/backups/pbsveltic-init.zip
./pb_data/storage
./pb_data/storage/_pb_users_auth_
./pb_data/storage/_pb_users_auth_/js4vzi2j1f6f4z2
./pb_data/storage/_pb_users_auth_/js4vzi2j1f6f4z2/thumbs_mark_fullsize_cropped_removebg_1mb_SjDZgiPF3k.png
./pb_data/storage/_pb_users_auth_/js4vzi2j1f6f4z2/thumbs_mark_fullsize_cropped_removebg_1mb_SjDZgiPF3k.png/150x150_mark_fullsize_cropped_removebg_1mb_SjDZgiPF3k.png
./pb_data/storage/_pb_users_auth_/js4vzi2j1f6f4z2/thumbs_mark_fullsize_cropped_removebg_1mb_SjDZgiPF3k.png/150x150_mark_fullsize_cropped_removebg_1mb_SjDZgiPF3k.png.attrs
./pb_data/storage/_pb_users_auth_/js4vzi2j1f6f4z2/mark_fullsize_cropped_removebg_1mb_SjDZgiPF3k.png.attrs
./pb_data/storage/_pb_users_auth_/js4vzi2j1f6f4z2/mark_fullsize_cropped_removebg_1mb_SjDZgiPF3k.png
./pb_data/data.db
./pb_data/logs.db
./pb_data/types.d.ts
./pb_data/trivia.txt`.split('\n')

// const ffiles: AppPage[] = [];
//     ffiles.push({title: 'pb_data', url: 'pb_data', children: []})
//     ffiles.push({title: 'pb_hooks', url: 'pb_hooks', children: []})
//     ffiles.push({title: 'pb_migrations', url: 'pb_migrations', children: []})
//     ffiles.push({title: 'pb_public', url: 'pb_public', children: []})

	// turn dir into a tree

	interface AppPage {
		title: string
		url: string
		icon?: string
		iosIcon?: string
		mdIcon?: string
		children?: AppChild[] | any
	}
	interface AppChild {
		title: string
		url: string
		icon: string
		disabled?: boolean
	}


	const files: AppPage[] = [
		{
			title: 'pb_data',
			url: 'dashboardMenu',
			icon: 'serverOutline',
			children: [
				{ title: 'Welcome', url: 'welcome', icon: 'map', disabled: false },
				{ title: 'Projects', url: 'projects', icon: 'map', disabled: false },
			],
		},
		{
			title: 'pb_hooks',
			url: 'informationMenu',
			icon: './hook.svg',
			children: [
				{ title: 'About...', url: 'about', icon: 'map', disabled: false },
				{ title: 'Terms of Use', url: 'terms', icon: 'map', disabled: false },
				{ title: 'Privacy Policy', url: 'privacy', icon: 'map', disabled: false },
				{ title: 'Support', url: 'support', icon: 'map', disabled: false },
			],
		},
		{
			title: 'pb_migrations',
			url: 'settingsMenu',
			icon: 'trendingUpOutline',
			children: [
				{ title: 'Account', url: 'account', icon: 'settings', disabled: false },
				{ title: 'Settings', url: 'settings', icon: 'settings', disabled: false },
			],
		},
		{
			title: 'pb_public',
			url: 'adminMenu',
			icon: 'browsersOutline',
			children: [
                { title: 'Users', url: 'adm-users', icon: 'map', disabled: false }],
		}
	]
	let tree: any = {}
	for (let i = 0; i < dir.length; i++) {
        const path: any = dir[i].split('/')
        if (path.length > 2) {
            console.log('path', path)
        }
	}

	// console.log('tree', JSON.stringify(tree, null, 2))

</script>

<ion-content class="ion-padding">
	<AccordionMenu appPages={files} badges={{}} />

	<!-- <div class="container">
        <div class="box upper-left">
            <div class="box-title"><ion-label>Database</ion-label></div>
            <div class="box-content">

            </div>
        </div>
        <div class="box upper-right">
            <div class="box-title"><ion-label>Hooks</ion-label></div>
            <div class="box-content">

            </div>
        </div>
        <div class="box lower-left">
            <div class="box-title"><ion-label>Migrations</ion-label></div>
            <div class="box-content">

            </div>
        </div>
        <div class="box lower-right">
            <div class="box-title"><ion-label>Public</ion-label></div>
            <div class="box-content">

            </div>
        </div>
    </div> -->
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
