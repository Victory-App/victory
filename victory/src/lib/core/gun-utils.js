import {gun} from "$lib/core/state.svelte.js";

/**
 * Define gun node / chain type
 * @typedef {import("gun").IGunChain<*, import("gun").IGunInstance<*>, import("gun").IGunInstance<*>, string>} GunChain
 */

/**
 * Retrieves the username with the correct capitalization from GunDB.
 * @param {string} username - The username (alias) to fetch data for.
 * @param {string} key - The username (alias) to fetch data for.
 * @returns {Promise<string>} - A promise that resolves with the display name of the user.
 */
async function validateUserAndGetValue(username, key){
    return new Promise(async (resolve, reject) => {
        username = username.toLowerCase();
        const node = gun.get("users").get(username)
        const keyNode = node.get(key)

        let exists = false
        await getGunNodeValue(node).then(
            r => {
                exists = true
            }
        ).catch(
            err => {
                return reject(err)
            }
        )

        if (exists) {
            getGunNodeValue(keyNode).then(
                v => {
                    resolve(v)
                }
            ).catch(
                err => {
                    console.log(err, "err")
                    if (err.message.includes("Value not found at node")) {
                        keyNode.put("")
                        resolve("")
                    } else {
                        reject(err)
                    }
                }
            )
        } else {
            reject(new Error(`Invalid username: ${username}`));
        }
    })
}

/**
 * Retrieves a value from a specific node in GunDB using `.once()`.
 * @param {GunChain} node
 * @param {number} [timeout=5000] - Optional timeout in milliseconds. Defaults to 5000 (5 seconds).
 * @returns {Promise<any>} - A promise that resolves with the value of the node if found,
 *   or rejects with an error if the node is not found, if there's a timeout, or if there's a general Gun error.
 */
async function getGunNodeValue(node, timeout = 5000) {
    return new Promise((resolve, reject) => {
        if (!gun) {
            return reject(new Error("Gun is not initialized."));
        }

        /**
         * @type {string | number | NodeJS.Timeout | undefined}
         */
        let timeoutId;
        let onceCallbackExecuted = false;

        const onceCallback = (/** @type {null | undefined | GunChain} */ value) => {
            onceCallbackExecuted = true;
            clearTimeout(timeoutId); // Clear the timeout if we get a response
            if (value === undefined || value === null) {
                reject(new Error(`Value not found at node: ${node}`));
            } else {
                resolve(value);
            }
        };

        // Set a timeout
        timeoutId = setTimeout(() => {
            if (!onceCallbackExecuted) {
                reject(new Error(`Timed out getting value for node: ${node}`));
            }
        }, timeout);

        // Use once to retrieve the value
        node.once(onceCallback);
    });
}

/**
 * Retrieves a value from a specific node in GunDB using `.once()`.
 * @param {GunChain} node
 * @returns {Promise<boolean>} - A promise that resolves with the value of the node if found,
 */
async function checkGunNodeExists(node) {
    await getGunNodeValue(node).then(r => {
        return true
    }).catch(e => {
        return false
    })
    return false
}

/**
 *
 * @param {GunChain} node
 * @returns {Promise<unknown>}
 */
async function getGunNodeCount(node) {
    return new Promise((resolve, reject) => {
        let count = 0
        node.map().once((node, key) => {
            if (node) {
                count++
            }
        })
        resolve(count)
    })
}
