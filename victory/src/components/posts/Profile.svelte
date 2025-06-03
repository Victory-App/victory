<script>
    import {getAvatar} from "$lib/api.svelte.js";
    import {onMount} from "svelte";

    let { alias } = $props()

    let avatar = $state("")
    let loaded = $state(false)
    onMount(async () => {
        await getAvatar(alias).then(user => {
            avatar = user
        })
        loaded = true
    })
</script>

<div>
    <a class="w-10 h-10 self-start inline-block m-0 p-0" href="/{alias}">
        {#if loaded}
            <img class="w-10 h-10 mr-2 mt-1 rounded-full" src="{avatar}">
        {/if}
    </a>
</div>