import {isMobile, url} from "$lib/state.svelte.js";


export function setIsMobile() {
    // Combined mobile and tablet user agents
    const patterns = [
        "Mobile", "Android", "iPhone", "iPod", "Opera Mini",
        "IEMobile", "BlackBerry", "webOS", "iPad", "Kindle",
        "Silk", "PlayBook", "Tablet", "Touch"
    ];

    // Compiling regex pattern for efficiency
    const combinedRegex = new RegExp(patterns.join("|"), "i");

    // Check if user agent matches any mobile or tablet patterns
    isMobile.value = combinedRegex.test(navigator.userAgent);
}

export function setUrl() {
    url.value = window.location.pathname.split('/').pop() || ""
}
