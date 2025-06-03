import { error } from '@sveltejs/kit';

/** @type {import('../../../../.svelte-kit/types/src/routes').PageLoad} */
export function load({ params }) {
    return {
        params: params,
    };
}