<script lang="ts">
    function goBack() {
        console.log(window.history.state)
        if (document.referrer.includes(window.location.hostname)) {
            window.history.back()
        } else {
            window.location.href = "/home"
        }
    }
</script>

<button class="absolute m-2 mx-2 sm:hover:bg-[var(--primary-border)] sm:hover:bg-opacity-90 rounded-full" onclick={goBack}>
    <img class="m-2 mx-2 h-[1.35rem] sm:h-[1.1rem]" src="/buttons/interface/arrow-left.svg" alt="logo"/>
</button>