<script lang="js">
    import {recallGunAccount, register, verifyRegistration} from "$lib/api.svelte.js";
    import {onMount} from "svelte";
    import {goto} from "$app/navigation";

    let validate = $state(false)

    let code = $state()

    let username = $state("")
    let email = $state("")
    let password = $state("")
    let month = $state()
    let day = $state()
    let year = $state()

    let errorMessage = $state("")

    onMount(() => {
        recallGunAccount().then(() => goto("/home"))
    })

</script>


<div class="flex flex-col min-h-screen max-w-screen justify-center items-center w-full p-4 font-lato">

        {#if validate}
            <form class="relative flex flex-col shadow w-full md:w-auto mt-3 p-4 md:p-8 bg-[#252528] rounded-md">
                <button class="absolute top-5 left-5 sm:hover:bg-[var(--primary-border)] sm:hover:bg-opacity-90 rounded-full" onclick={() => validate = false}>
                    <img class=" h-[1.35rem] sm:h-[1.1rem]" src="/buttons/interface/arrow-left.svg" alt="logo"/>
                </button>
                <h1 class="w-full text-center pt-6 pb-4 text-xl md:text-2xl font-bold">Email Verification Code</h1>
                <label class="flex flex-col mb-1 text-sm">
                    {#if errorMessage !== ""}
                        <span class="font-normal text-center text-red-600 p-0.5 pb-2">{errorMessage}</span>
                    {:else}
                        <span class="font-normal text-center text-gray-300 p-0.5 pb-2">Check your email and enter the code</span>
                    {/if}
                    <input required class="bg-[var(--primary-bg)] rounded text-base px-2.5 py-2 mt-2 mb-6" type="number" bind:value={code}>
                </label>
                <div class="flex flex-grow flex-col justify-end">
                    <button onclick={() => {
                        errorMessage = ""
                        verifyRegistration(code).then(()=>{
                            goto("/home")
                        }).catch(e => {
                            errorMessage = e.message?? "An error has occurred"
                        })
                }} class="text-base md:text-lg font-semibold text-black px-5 py-2 bg-white rounded-full">
                        Check
                    </button>
                </div>
            </form>
        {:else}
            <form class="flex flex-col shadow w-full md:w-auto  mt-3 p-4 md:p-8 bg-[#252528] rounded-md display ">
                <h1 class="w-full text-center pb-4 text-xl md:text-2xl font-bold">Create an account</h1>
                <label class="flex flex-col mb-1 text-xs">
                    {#if errorMessage !== ""}
                        <span class=" font-black text-gray-400 p-0.5 pb-2">EMAIL<span class="pl-0.5 text-red-400">*</span> <span class="text-red-600">- {errorMessage}</span></span>
                        <input required class="bg-[var(--primary-bg)] rounded text-base px-2.5 py-2 mb-4" type="text" bind:value={email}>
                    {:else}
                        <span class=" font-black text-gray-400 p-0.5 pb-2">EMAIL<span class="pl-0.5 text-red-400">*</span></span>
                        <input required class="bg-[var(--primary-bg)] rounded text-base px-2.5 py-2 mb-4" type="text" bind:value={email}>
                    {/if}
                </label>
                <label class="flex flex-col mb-1 text-xs">
                    <span class="text-xs font-black text-gray-400 p-0.5 pb-2">USERNAME <span class="pl-0.5 text-red-400">*</span></span>
                    <input required class="bg-[var(--primary-bg)] rounded text-base px-2.5 py-2 mb-5" type="text" bind:value={username}>
                </label>
                <label class="flex flex-col mb-1 text-xs">
                    <span class="text-xs font-black text-gray-400 p-0.5 pb-2">PASSWORD <span class="pl-0.5 text-red-400">*</span></span>
                    <input required class="bg-[var(--primary-bg)] rounded text-base px-2.5 py-2 mb-5" type="password" bind:value={password}>
                </label>
                <label class="flex flex-col mb-1 text-xs">
                    <span class="text-xs font-black text-gray-400 p-0.5 pb-2">DATE OF BIRTH <span class="pl-0.5 text-red-400">*</span></span>
                    <!-- Month Dropdown -->
                    <div class="flex flex-row">
                        <select bind:value={month} required class="flex-grow mr-2.5 bg-[var(--primary-bg)] rounded text-gray-400 text-base px-2 py-2 mb-5">
                            <option value="">Month</option>
                            <option value="0">January</option>
                            <option value="1">February</option>
                            <option value="2">March</option>
                            <option value="3">April</option>
                            <option value="4">May</option>
                            <option value="5">June</option>
                            <option value="6">July</option>
                            <option value="7">August</option>
                            <option value="8">September</option>
                            <option value="9">October</option>
                            <option value="10">November</option>
                            <option value="11">December</option>
                        </select>

                        <!-- Day Dropdown -->
                        <select bind:value={day} required class="flex-grow mr-2.5 bg-[var(--primary-bg)] rounded text-gray-400 text-base px-2 py-2 mb-5">
                            <option value="">Day</option>
                            {#each Array(31) as _, day}
                                <option value={day+1}>{day+1}</option>
                            {/each}
                        </select>

                        <!-- Year Dropdown -->
                        <select bind:value={year} required class="flex-grow max-h-32 bg-[var(--primary-bg)] rounded text-gray-400 text-base px-2 py-2 mb-5">
                            <option value="">Year</option>
                            {#each Array(112) as _, year}
                                <option value={Math.abs(year-2012)}>{Math.abs(year-2012)}</option>
                            {/each}
                        </select>
                    </div>
                </label>
                <div class="flex flex-grow flex-col justify-end">
                    <button onclick={() => {
                        errorMessage = ""
                        if (String(username).trim() !== "" && String(email).trim() !== "" && String(password).trim() !== "" && String(month).trim() !== "" && String(day).trim() !== "" && String(year).trim() !== "") {
                            register(username, password, email, Math.floor(Date.UTC(year, month, day) / 1000)).then(r => {
                                validate = true
                            }).catch(e => {
                                errorMessage = e.message?? "Internal Server Error"
                            })
                        }
                }} class="text-base md:text-lg font-semibold text-black px-5 py-2 bg-white rounded-full">
                        Continue
                    </button>
                    <div class="text-xs">
                        <p class="py-2 pb-4 text-gray-400">By registering you agree to victory's <a href="/terms">Terms of Service</a></p>
                        <a class="text-sm self-start" href="/login">Already have an account?</a>
                    </div>
                </div>
            </form>
        {/if}
</div>

<style>
    .display  {
        aspect-ratio: 3 / 4;
    }
</style>