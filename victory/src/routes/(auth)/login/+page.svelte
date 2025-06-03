<script lang="js">
    import {login, recallGunAccount} from "$lib/api.svelte.js";
    import {onMount} from "svelte";
    import {goto} from "$app/navigation";
    import {error} from "@sveltejs/kit";


    let username = $state("")
    let password = $state("")

    let errorMessage = $state("")

    onMount(() => {
        recallGunAccount().then(() => goto("/home"))
    })

</script>


<div class="flex flex-col min-h-screen max-w-screen justify-center items-center w-full p-4 font-lato">

            <form class="flex flex-col shadow w-full md:w-auto p-4 md:p-8 bg-[#252528] rounded-md display ">
                <h1 class="w-full text-center pb-4 text-xl md:text-2xl font-bold">Welcome Back.</h1>
                <label class="flex flex-col mb-1 text-xs">
                    {#if errorMessage !== ""}
                        <span class=" font-black text-gray-400 p-0.5 pb-2">EMAIL OR USERNAME<span class="pl-0.5 text-red-400">*</span> <span class="text-red-600">- {errorMessage}</span></span>
                        <input required class="bg-[var(--primary-bg)] rounded text-base px-2.5 py-2 mb-4" type="text" bind:value={username}>
                    {:else}
                        <span class=" font-black text-gray-400 p-0.5 pb-2">EMAIL OR USERNAME<span class="pl-0.5 text-red-400">*</span></span>
                        <input required class="bg-[var(--primary-bg)] rounded text-base px-2.5 py-2 mb-4" type="text" bind:value={username}>
                    {/if}
                </label>
                <label class="flex flex-col mb-1 text-xs">
                    <span class="text-xs font-black text-gray-400 p-0.5 pb-2">PASSWORD <span class="pl-0.5 text-red-400">*</span></span>
                    <input required class="bg-[var(--primary-bg)] rounded text-base px-2.5 py-2 mb-5" type="password" bind:value={password}>
                </label>
                <div class="flex flex-grow flex-col justify-end">
                    <button onclick={() => {
                        errorMessage = ""
                        if (String(username).trim() !== "" && String(password).trim() !== "") {
                            login(username, password).then(
                                () => goto("/home")
                               ).catch(
                                e => errorMessage = e.message
                            )
                        }
                }} class="text-base md:text-lg font-semibold text-black px-5 py-2 bg-white rounded-full">
                        Log In
                    </button>
                    <div class="text-sm pt-2">
                        Need an account? <a class="self-start" href="/register">Register</a>
                    </div>
                </div>
            </form>
</div>

<style>
    .display  {
        aspect-ratio: 4 / 3;
    }
</style>