<script lang="ts">
    import {isMobile} from "$lib/state.svelte";

    let {
        activeTab = $bindable(),
        tabs = $bindable()
    } = $props();

    function changeTab(tab: string): void {
        activeTab = tab
    }

</script>

<div class="z-50 flex flex-col w-full">
    <div class="flex backdrop-blur-[10px] bg-[rgba(16,16,20,0.80)] h-14 flex-grow flex-row justify-evenly items-end">
        {#each tabs as tab}
            <div class="flex h-full w-full px-3 justify-center items-center {isMobile.value? '' : 'hover:bg-[var(--primary-button-hover)]'}">
                {#if activeTab === tab}
                    <button type="button" onclick={() => {changeTab(tab)}} class="flex px-2 items-center justify-evenly font-semibold text-base h-full border-b-4 border-b-blue-500 border-t-4 border-t-transparent">
                        {tab}
                    </button>
                {:else}
                    <button type="button" onclick={() => {changeTab(tab)}} class="flex w-full items-center justify-evenly text-base text-[gray] h-full">
                        {tab}
                    </button>
                {/if}
            </div>
        {/each}
    </div>
</div>