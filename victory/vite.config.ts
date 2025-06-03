import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

interface ModuleExcludePlugin {
	name: string;
	resolveId(id: string): string | void;
	load(id: string): string | void;
}

const moduleExclude = (match: string): ModuleExcludePlugin => {
	const m = (id: string): boolean => id.indexOf(match) > -1;

	return {
		name: `exclude-${match}`,
		resolveId(id: string): string | void {
			if (m(id)) return id;
		},
		load(id: string): string | void {
			if (m(id)) return 'export default {}';
		}
	};
};


export default defineConfig({
	plugins: [sveltekit(), moduleExclude('text-encoding')],
	optimizeDeps: {
		include: [
			'gun',
			'gun/gun',
			'gun/sea',
			'gun/sea.js',
			'gun/lib/then',
			'gun/lib/webrtc',
			'gun/lib/radix',
			'gun/lib/radisk',
			'gun/lib/store',
			'gun/lib/rindexed',
		],
	},
});
