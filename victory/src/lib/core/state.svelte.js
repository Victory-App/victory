import Gun from 'gun/gun';
import 'gun/sea';
import 'gun/lib/unset.js'
import { browser } from '$app/environment';

/**
 * @type {import('gun').IGunInstance<any>}
 */
export let gun;
if (browser) {
    gun = Gun(({
        peers: ['wss://gun.victoryapp.net/gun'], // Replace with your actual GunDB server URL
    }))
}

export let account = $state({
    loggedIn: false,
    alias: "",
    pub: "",
});
