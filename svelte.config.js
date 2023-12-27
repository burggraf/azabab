import { vitePreprocess } from '@sveltejs/kit/vite';

import { adapter } from './adapter.mjs'
// you don't need to do this if you're using generateSW strategy in your app
import { generateSW } from './pwa.mjs'


/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter,
		serviceWorker: {
		register: false,
		},
		files: {
			// you don't need to do this if you're using generateSW strategy in your app
			serviceWorker: generateSW ? undefined : 'src/prompt-sw.ts',
		},
		alias: {
			'$lib': 'src/lib',
			'$ionic': 'src/lib/ionic',
			'$ionpage': 'src/lib/ionic/svelte/components/IonPage.svelte',
			'$interfaces': 'src/interfaces',
			'$services': 'src/services',
			'$stores': 'src/stores',
			'$components': 'src/components',
			'$localdata': 'src/localdata',
		},	
		prerender: {
			// use relative URLs similar to an anchor tag <a href="/test/1"></a>
			// do not include group layout folders in the path such as /(group)/test/1
			entries: ['*',
			'/instance/[id]',
			'/streamingbackups/[id]',
			]
		}
	},
};

export default config;


