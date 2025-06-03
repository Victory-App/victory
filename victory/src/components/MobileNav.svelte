<script lang="ts">
    import {afterNavigate} from "$app/navigation";
    import {onMount} from "svelte";
    import {account, getAvatar} from "$lib/api.svelte";


    let currentPage: string = $state('')

    function updateCurrentPage(): void {
        const path = window.location.pathname;
        currentPage = path.split('/').pop() || '';
    }

    afterNavigate(() => {
        updateCurrentPage();
    })

    let avatar = $state("")
    onMount(async () => {
        updateCurrentPage();
        await getAvatar(account.alias).then(r => {
            avatar = r;
        }).catch(e => {
            console.log(e);
        })
    })

</script>

<footer class="fixed -bottom-1 flex flex-row min-w-full bg-[var(--primary-bg)] z-50 items-center justify-evenly border-t">

    <a data-sveltekit-preload-data class="flex flex-col items-center w-16 p-2 px-4" href="/home">
        {#if currentPage === "home"}
            <img class="h-5 mb-1" src="/buttons/home/home-active.png" alt="home"/>
        {:else}
            <img class="h-5 mb-1" src="/buttons/home/home.png" alt="home"/>
        {/if}
        <p class="text-xs">Home</p>
    </a>

    <a data-sveltekit-preload-data class="flex flex-col items-center w-16 p-2 px-4" href="/shorts">
        {#if currentPage === "shorts"}
            <img class="h-5 mb-1" src="/buttons/bookmark/bookmark-active.svg" alt="shorts"/>
        {:else}
            <img class="h-5 mb-1" src="/buttons/bookmark/bookmark.svg" alt="shorts"/>
        {/if}
        <p class="text-xs">Shorts</p>
    </a>

    <!-- Create Button -->

    <div class="bg-[var(--primary-border)] bg-[#404040] rounded-full mb-1">
        <img class="h-8 m-[0.25rem]" src="/buttons/create/create.svg" alt="search"/>
    </div>


    <a data-sveltekit-preload-data class="flex flex-col items-center w-16 p-2 px-4" href="/search">
        {#if currentPage === "search"}
            <img class="h-5 mb-1" src="/buttons/search/search-active.svg" alt="search"/>
        {:else}
            <img class="h-5 mb-1" src="/buttons/search/search.svg" alt="search"/>
        {/if}
        <p class="text-xs">Search</p>
    </a>

    <a data-sveltekit-preload-data class="flex flex-col items-center w-16 p-2 px-4" href="/{account.loggedIn? account.alias : 'login'}">
        {#if currentPage.toLowerCase() === account.alias.toLowerCase()}
            <img class="w-5 h-5 mb-1 outline outline-2 outline-white rounded-full" src="{avatar}"/>
        {:else}
            <img class="w-5 h-5 mb-1 rounded-full" src="{avatar}"/>
        {/if}
        <p class="text-xs">Profile</p>
    </a>

</footer>

<style>
    p {
        font-size: 0.65rem;
        line-height: 1;
    }
</style>