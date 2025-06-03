<script lang="js">
    import { onMount } from "svelte";
    import {afterNavigate, goto} from "$app/navigation";
    import BackHeader from "../../../components/BackHeader.svelte";
    import TabSwitcher from "../../../components/TabSwitcher.svelte";
    import {
        getUsernameWithCase,
        getAvatar,
        getBanner,
        getDisplay,
        updateAvatar,
        updateBanner,
        account,
        getCreatedAt,
        getFollowers,
        getFollowing, getIsFollowing
    } from "$lib/api.svelte.js";


    let url = $state("")
    let loading = $state(true)
    let exists = $state(false)

    let { data } = $props();
    let slug = data.params.slug

    let display = $state("")
    let username = $state("")
    let avatar = $state("")
    let banner = $state("")
    let created_at = $state("")
    let followers = $state(0)
    let following = $state(0)
    let isFollowing = $state(false)

    onMount(async () => {
        goto("/")

        url = window.location.pathname.split('/').pop() || ""

        try {
            display = await getDisplay(slug)
            username = await getUsernameWithCase(slug)
            avatar = await getAvatar(slug)
            banner = await getBanner(slug)
            created_at = await getCreatedAt(slug)
            followers = await getFollowers(slug)
            following = await getFollowing(slug)
            isFollowing = await getIsFollowing(slug)
            exists = true
        } catch (err) {
            console.log(err)
            exists = false
        } finally {
            loading = false
        }
    })

    afterNavigate(() => {
        url = window.location.pathname.split('/').pop() || ""
        console.log("URL: " + url)
    })

</script>

<svelte:head>
    <title>{display} (@{username})</title>
</svelte:head>
{#if !loading}
    <div class="flex flex-col min-h-screen max-w-screen overflow-x-hidden">

        <main class="relative flex flex-col z-10">

            <BackHeader/>

            <div class="relative w-full flex display overflow-clip">
                <img class="min-w-full display" src="{banner}"/>
            </div>

            <div class="relative border-b">

                <div class="absolute bg-black -top-8 w-20 h-20 sm:-top-14 sm:w-32 sm:h-32 mx-2 sm:mx-4 flex items-center justify-center outline outline-2 sm:outline-4 outline-[var(--primary-bg)] rounded-full overflow-clip">
                    <img class="" src="{avatar}"/>
                </div>

                {#if exists}

                    <div class="absolute right-0 font-[650] m-2.5 mx-3">
                        {#if account.alias === url.toLowerCase()}
                            <button class="w-full px-4 py-1.5 bg-[var(--primary-button)] hover:bg-[var(--primary-button-hover)] border rounded-full">Edit</button>
                        {:else}
                            {#if isFollowing}
                                <button onclick={()=>{}} class="w-full px-4 py-1.5 bg-[var(--primary-bg)] hover:bg-[var(--primary-button-hover)] border rounded-full">Following</button>
                            {:else}
                                <button onclick={()=>{}} class="w-full px-4 py-1.5 bg-white hover:bg-[#A3A3A3] text-black border rounded-full">Follow</button>
                            {/if}
                        {/if}
                    </div>

                    <div class="pt-14 sm:pt-[5.25rem] p-2.5 sm:px-4 flex flex-col sm:flex-row">
                        <div class="flex flex-col flex-shrink">
                            <h1 class="truncate break-all text-xl sm:text-2xl font-semibold sm:font-bold">{display}</h1>
                            <div class="flex flex-col text-[0.8rem] sm:text-[0.925rem]">
                                <p class="flex-grow max-w-max truncate font-[500] text-neutral-500">@{username}</p>
                                <p class="py-2">🌞 I notice things 👁️ History, Memes, & Politics 🌎 Backup 👉🏻
                                    @NextWaveAlt
                                    ⚡️</p>
                                <p class="py-1 text-neutral-500">Joined {created_at}</p>
                                <div class="flex flex-row py-1 whitespace-pre font-[500] text-neutral-500">
                                    <p class="text-neutral-500 mr-2"><span class="text-neutral-200">{following}</span> Following</p>
                                    <p class="text-neutral-500"><span class="text-neutral-200">{followers}</span> Followers</p>
                                </div>


                            </div>
                        </div>
                    </div>

                    <TabSwitcher activeTab={"Posts"} tabs={["Posts", "Replies", "Videos", "Shorts"]} />
                {/if}

            </div>

            {#if !exists}
            <div class="flex flex-col mt-32 justify-center items-center font-bold text-3xl">
                <div>
                    <p>This account doesn't<p>
                    <p>exist.<p>
                    <p class="font-medium mt-1 text-neutral-500 text-base">Try searching for another.</p>
                </div>
            </div>
            {/if}

        </main>

    </div>
{/if}

<style>

    .display  {
        aspect-ratio: 6 / 2;
        background-color: black;
    }

</style>