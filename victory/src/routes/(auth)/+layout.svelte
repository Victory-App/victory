<script>
	import '../../app.css';
    import {onMount} from "svelte";
    import {url} from "$lib/state.svelte.js";
    import {setIsMobile, setUrl} from "$lib/utils.js";
    let { children } = $props();

    onMount(() => {
        setUrl()
        setIsMobile()
    })

</script>

<svelte:head>
    <title>Victory</title>
</svelte:head>

<div class="fixed z-10 bg-[var(--primary-bg)] md:bg-transparent flex flex-col w-full items-center md:pt-5 pl-2">
    <div class="flex flex-col flex-grow w-full h-full p-2 pt-2 md:px-12">
        <div class="flex flex-row w-full h-14 md:h-20 items-center justify-between">
            <a class=" text-white w-[2.25rem] md:w-[3rem] text-[2.5rem] md:text-5xl font-semibold" href={url.value === "terms"? "/"  : "/home" }>
                <img class="object-contain" src="/logo-transparent.png" alt="V">
            </a>
        </div>
    </div>
</div>

{@render children()}