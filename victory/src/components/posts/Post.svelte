<script lang="ts">
    import {isMobile} from "$lib/state.svelte.js";

    export let username: string;
    export let author_name: string;
    export let title: string = "";
    export let text: string = "";
    export let timestamp: Date

    function getRelativeTime(date: Date): string {
        const now = new Date();
        const elapsed = now.getTime() - date.getTime();

        const msPerMinute = 60 * 1000;
        const msPerHour = msPerMinute * 60;
        const msPerDay = msPerHour * 24;
        const msPerMonth = msPerDay * 30;
        const msPerYear = msPerDay * 365;

        if (elapsed < msPerMinute) {
            return `${Math.round(elapsed / 1000)}s`;
        } else if (elapsed < msPerHour) {
            return `${Math.round(elapsed / msPerMinute)}m`;
        } else if (elapsed < msPerDay) {
            return `${Math.round(elapsed / msPerHour)}h`;
        } else if (elapsed < msPerMonth) {
            return `${Math.round(elapsed / msPerDay)}d`;
        } else if (elapsed < msPerYear) {
            return `${Math.round(elapsed / msPerMonth)}m`;
        } else {
            return `${Math.round(elapsed / msPerYear)}y`;
        }
    }
</script>

<article class="text-md flex flex-row items-center border-b hover:bg-[#181820] min-w-full p-1.5 pr-4 pt-1 sm:pr-4 sm:p-2.5">
    <a class="self-start inline-block m-0 p-0 pt-0.5 pr-0.5" href="/{author_id}">
        <img class="w-10 h-10 mr-2 mt-1 rounded-full" src="/buttons/profile.png" alt="{author_name} {author_id}">
    </a>
    <div class="flex flex-col justify-center text-[.93rem] sm:text-base ml-1 mt-0.5 sm:mt-0 w-full">
        <div class="flex flex-row justify-between items-center">
            <a class="flex flex-wrap flex-row max-w-full " href="/{author_id}">
                <h1 class="sm:hover:underline font-semibold text-neutral-100">{author_name}&nbsp</h1>
                <h1 class="text-[gray]">{author_id + " · " + getRelativeTime(timestamp)}</h1>
            </a>
            <button class="w-5 flex justify-end items-center">
                {#if isMobile.value}
                    <img class="" src="/buttons/interface/dots-vertical.svg" alt="profile">
                {:else}
                    <img class="" src="/buttons/interface/dots-horizontal.svg" alt="profile">
                {/if}
            </button>
        </div>
        {#if title}
            <div class="flex flex-col pt-0.5 font-medium flex-grow text-base sm:text-lg">
                <p>{title}</p>
            </div>
        {/if}
        {#if text}
            <div class="flex flex-col font-normal flex-grow text-sm sm:text-base">
                <p>{text}</p>
            </div>
        {/if}

        <div class="w-full flex bg-black justify-center items-center max-h-[50rem] rounded-lg overflow-clip mt-1.5 mb-0.5">
            <img class="max-h-[50rem]" src="/testimage.jpg" alt="test">
        </div>
    </div>
</article>