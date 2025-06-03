<script>
    import {onMount} from "svelte";
    import {recallGunAccount} from "$lib/api.svelte.js";
    import {account} from "$lib/api.svelte.js";

    let index = 0;
    const values = ["The People", "The Creators", "Truthseekers", "The Igniters", "The Pioneers", "The Imagers", "The Guides", "The Explorers", "The Makers"];
    let value = $state(values[index]);

    let loading = $state(true)
    onMount(() => {
        recallGunAccount().then(() => {
            loading = false
        }).catch(() => {
            loading = false
        })
        setInterval(() => {
            index = (index + 1) % values.length;
            value = values[index];
        }, 5000);
    });
</script>


{#if !loading}
    <div class="relative flex flex-col min-h-screen max-w-screen items-center">
        <div class="flex flex-col flex-grow w-full h-full px-8 2xl:px-96">
            <div class="flex flex-row w-full h-20 items-center justify-between">
                <a class="text-white text-xl md:text-3xl font-bold" href="/home"><span class="pr-[0.02rem] md:text-[2rem]">V</span><span class="font-lato tracking-wide">ictory</span></a>
                {#if account.loggedIn || true}
                    <a class="text-sm text-black font-semibold px-4 py-2 bg-white rounded-full" href="/">Soon</a>
                {:else}
                    <a class="text-sm text-black font-semibold px-4 py-2 bg-white rounded-full" href="/login">Login</a>
                {/if}
            </div>

            <div class="flex flex-row flex-grow items-center lg:w-1/2 ml-2 md:ml-10 mb-40 text-3xl md:text-5xl font-semibold">
                <div class="flex flex-col">
                    <div class="font-lato">
                        <p class="md:p-2 ">Social Media</p>
                        <p class="md:p-2 tracking-tight">For <span class="text-white tracking-wide">{value}</span> </p>
                        <p class="md:p-2 tracking-tight">By <span class="text-white tracking-wide">{value}</span></p>
                    </div>
                    <div class="pt-6">
                        {#if !account.loggedIn && false }
                            <a class="text-base md:text-lg font-semibold text-black px-5 py-2 bg-white rounded-full" href="/home">Open</a>
                        {/if}
                    </div>
                </div>
            </div>

        </div>
    </div>
{/if}