<script>
	import '../../app.css';
    import {onMount} from "svelte";
    import MobileNav from "../../components/MobileNav.svelte";
    import {setIsMobile} from "$lib/utils.js";
    import {isMobile} from "$lib/state.svelte.js";
    import {recallGunAccount} from "$lib/api.svelte.js";

    let { children } = $props();

    let loaded = $state(false)
    onMount(async () => {
        setIsMobile()
        await recallGunAccount().then().catch(err => console.error(err))
        loaded = true
    });

</script>

<svelte:head>
    <title>Victory</title>
</svelte:head>
{#if loaded}
    {@render children()}
    {#if isMobile.value}
        <MobileNav/>
    {/if}
{/if}