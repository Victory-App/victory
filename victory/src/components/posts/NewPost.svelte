<script lang="ts">
    import autosize from 'svelte-autosize';
    import Profile from "./Profile.svelte";
    import {account} from "$lib/api.svelte";
    let div: HTMLDivElement;
    let otherdiv: HTMLDivElement;
    let textarea: HTMLTextAreaElement;
    let p: HTMLParagraphElement;
    let text = $state("");

    let textarea_style = $state("")

    let post_button: HTMLButtonElement;

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;

        if (target.value.trim() == "") {
            post_button.style.backgroundColor = "#A3A3A3"
        } else {
            post_button.style.backgroundColor = "#FFFFFF"
        }

        if (target.value == "") {
            p.textContent = "What is happening?!"
        } else {
            p.textContent = "‎ ";
        }
        div.style.height = textarea.offsetHeight + "px";
    }

    function handleMouseEnter(event: Event) {
        if (text.trim() != "") {
            post_button.style.backgroundColor = "#DDDDDD"
        }
    }

    function onFocus(event: Event){
        otherdiv.style.paddingBottom = "1.25rem";
        otherdiv.style.borderBottomWidth = "1px";
    }

    function handleMouseLeave(event: Event) {
        if (text.trim() == "") {
            post_button.style.backgroundColor = "#A3A3A3"
        } else {
            post_button.style.backgroundColor = "#FFFFFF"
        }
    }


</script>

<div class="flex text-xl flex-col justify-center border-b min-w-full p-4 pr-3 pb-0 px-3.5">
    <div class="flex flex-row justify-center w-full">
        <Profile alias={account.alias}/>
        <div bind:this={otherdiv} class="w-full m-0.5 ml-0">
            <div bind:this={div} class="relative m-2 w-full">
                <textarea use:autosize bind:this={textarea} onfocus={onFocus} oninput={handleInput} bind:value={text} class="bg-transparent text-white pb-0 absolute w-full" rows="1"></textarea>
                <p bind:this={p} class="text-neutral-500">What is happening?!</p>
            </div>
        </div>
    </div>
    <div class="flex flex-col w-full items-end">
        <button bind:this={post_button} onmouseenter={handleMouseEnter} onmouseleave={handleMouseLeave} class="text-black text-lg font-semibold m-2.5 mr-0 px-4 py-1 bg-neutral-500 rounded-full" aria-label="post">Post</button>
    </div>
</div>