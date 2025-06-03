<script lang="ts">
    import {isMobile} from "$lib/state.svelte.js";
    import TabSwitcher from "./TabSwitcher.svelte";

    let {
        nav = true,
        activeTab = $bindable(),
        tabs = $bindable()
    } = $props();

</script>

<div class="">
    <header class="fixed top-0 z-50 flex flex-col w-full border-b">
        {#if isMobile.value}
            <div class="relative bg-[var(--primary-bg)] h-14 flex flex-grow flex-row w-full justify-between items-center">
                <button>
                    <img class="h-[1.35rem] m-2.5 mx-3.5" src="/buttons/interface/bars.svg" alt="logo"/>
                </button>

                <img class="h-7 m-1" src="/logo-transparent.png" alt="logo"/>

                <div data-sveltekit-preload-data>
                    <img class="h-[1.3rem] m-2.5 mx-3.5" src="/buttons/bell/bell-disabled.png" alt="logo"/>
                </div>
            </div>
        {/if}
        {#if nav}
            <TabSwitcher bind:activeTab={activeTab} bind:tabs={tabs}/>
        {/if}
    </header>
    {#if  isMobile.value}
        <div class="h-14"></div>
    {/if}
    {#if nav}
        <div class="h-14"></div>
    {/if}
</div>