<script lang="ts">
    import NewPost from "../../../components/posts/NewPost.svelte";
    import HomeHeader from "../../../components/HomeHeader.svelte";
    import {account} from "$lib/api.svelte";
    import {isMobile} from "$lib/state.svelte";
    import {onMount} from "svelte";
    import {setIsMobile} from "$lib/utils";
    import {goto} from "$app/navigation";

    let activeTab = "For You"
    let tabs = ["For You", "Following"]

    onMount(()=> {
        goto("/")
    })

</script>

<svelte:head>
    <title>Victory</title>
</svelte:head>
<div class="flex flex-col h-screen w-full">
    <main class="flex flex-grow flex-row overflow-x-hidden overflow-y-auto min-h-full">
        <div class="flex flex-col min-w-full">
            <HomeHeader bind:activeTab={activeTab} bind:tabs={tabs}/>
            {#if (account.loggedIn && !isMobile.value)}
                <NewPost/>
            {/if}

        </div>
    </main>
</div>
