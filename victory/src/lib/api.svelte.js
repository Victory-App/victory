// @ts-nocheck
import { browser } from '$app/environment';
import Gun from 'gun/gun';
import 'gun/sea';
import 'gun/lib/unset.js'
import { localStore } from './localStore.svelte';
import imageCompression from 'browser-image-compression';

const API_URL = 'https://victoryapp.net/api/v1';

/**
 * @type {import('gun').IGunInstance<any>}
 */
let gun;
if (browser) {
    gun = Gun(({
        peers: ['wss://gun.victoryapp.net/gun'], // Replace with your actual GunDB server URL
    }))
}

//
// Validate Account
//

/**
 * Validates if a user exists based on their public key.
 * @param {string} pub - The public key of the user to validate.
 * @returns {Promise<boolean>} - A promise that resolves to true if the user exists, false otherwise.
 * @throws {Error} - Throws an error if the request fails or the server returns an error status.
 */
async function validateUser(pub) {
    try {
        const response = await fetch(`${API_URL}/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({pub})
        });

        return response.status !== 404;
    } catch (error) {
        // Handle fetch errors (e.g., network issues, API_URL not reachable)
        console.error("Error during validateUser fetch:", error);
        return true; // Or handle error as needed, in this case, returning true for other errors as requested.
                     // You might want to return false or throw an error depending on your error handling strategy.
    }
}

//
// Account Login & Creation
//
// Private Struct (gun.user)
//{
// dob: number
//}
//
// Public Struct (users: username.lowercase)
//{
//    user: account.alias,
//    display: account.alias,
//    banner: "",
//    avatar: "",
//    bio: "",
//    pub: account.pub,
//    created_at: number,
// }
//

let lastAccount = localStore("lastAccount", "")

/**
 * @type {{ loggedIn: boolean; alias: string; pub: string; }}
 */
export let account = $state({
    loggedIn: false,
    alias: "",
    pub: "",
});

/**
 * Stores the last logged-in user's credentials in local storage.
 * @param {string} user - The username of the last logged-in user.
 * @param {string} password - The password of the last logged-in user.
 */
function setLastAccount(user, password) {
    lastAccount.value = user + "$" + password;
}

/**
 * Retrieves the last logged-in user's credentials from local storage.
 * @returns {{ user: string; password: string; }} - An object containing the username and password of the last logged-in user.
 */
function getLastAccount() {
    let last = String(lastAccount.value).split("$")
    let user = last[0]
    let password = last[1]
    return {user: user, password: password}
}

/**
 * Registers a new user on the server.
 * @param {string} pub - The public key of the user.
 * @param {string} alias - The alias or username of the user.
 * @param {string} email - The email address of the user.
 * @returns {Promise<string>} - A promise that resolves with the server's response text.
 * @throws {Error} - Throws an error if the registration fails, with specific messages for different error statuses.
 */
async function registerUser(pub, alias, email) {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({pub, alias, email})
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Please Use a Gmail or ProtonMail address.");
        } else if (response.status === 500) {
            throw new Error("An Internal Server Error occurred. Please try again later.");
        } else if (response.status === 409) {
            throw new Error("An Account with that email already exists.")
        } else {
            // Handle other potential error statuses if needed
            const errorText = await response.text(); // Get error message from response
            throw new Error(`Registration failed with status ${response.status}: ${errorText}`);
        }
    }

    // If response.ok is true (status 200), registration is successful
    return await response.text(); // Or response.json() if expecting JSON
}

/**
 * Attempts to recall a Gun account from session storage or local storage.
 * @returns {Promise<void>} - A promise that resolves when the account is successfully recalled and logged in, or rejects if there's an error.
 * @throws {Error} - Throws an error if the user cannot be recalled or logged in.
 */
export function recallGunAccount() {
    return new Promise((resolve, reject) => {
        let callback_executed = false
        gun.user().recall({sessionStorage: true}, ack => {
            callback_executed = true
            if ("sea" in ack && ack.sea.pub) {
                gun.user().get("alias").once(username => {
                    if (username) {
                        console.log(account.alias)
                        account.alias = username.toLowerCase();
                        account.pub = ack.sea.pub
                        account.loggedIn = true
                        gun.get("users").get(username.toLowerCase()).once(ack => {
                            if (ack) {
                                console.log("user node found")
                                return resolve()
                            } else {
                                reject(Error("User node not found"))
                            }
                        })
                    } else {
                        reject(Error("cant get username"))
                    }
                })
            } else {
                reject(Error("Error recalling user"))
            }
        })
        setTimeout(() => {
            if (!callback_executed) {
                if (getLastAccount().user !== "" && getLastAccount().user) {
                    let last = getLastAccount()
                    login(last.user, last.password).then(
                        () => resolve()
                    ).catch(
                        err => reject(err)
                    )
                } else {
                    reject(Error("Error recalling user"))
                }
            }
        },100)
    })
}

/**
 * Logs out the current Gun account and clears account information.
 */
export function logoutGunAccount() {
    gun.user().leave()
    account.loggedIn = false
    account.alias = ""
    account.pub = ""
    setLastAccount("", "")
}

/**
 * Registers a new user with Gun and the server.
 * @param {string} username - The desired username.
 * @param {string} password - The user's password.
 * @param {string} email - The user's email address.
 * @param {number} dob - The user's date of birth (as a timestamp).
 * @returns {Promise<void>} - A promise that resolves when the user is successfully registered and logged in, or rejects if there's an error.
 * @throws {Error} - Throws an error if there's an issue creating the user, authenticating, or registering on the server.
 */
export async function register(username, password, email, dob) {
    try {
        logoutGunAccount()

        return new Promise((resolve, reject) => { // Use Promise for async error handling

            gun.get("users").get(username.toLowerCase()).once(ack => {
                if (ack) {
                    reject(new Error("Username already exists.")); // Reject promise with specific error
                    return; // Important to stop further execution
                }
                gun.user().create(username.toLowerCase(), password, async (ack) => {
                    if ("err" in ack && ack.err) {
                        let old_password = localStore(username.toLowerCase()).value;
                        if (ack.err.includes("already created")) {
                            console.log("user already created error", old_password);
                            console.log(password);
                            if (old_password !== password) {
                                gun.user().auth(username.toLowerCase(), old_password, (authAck) => { // Renamed ack to authAck for clarity
                                    if (authAck.err === undefined) {
                                        localStore(username.toLowerCase()).value = password;
                                    } else {
                                        return reject(new Error(`Password update during registration failed: ${authAck.err}`)); // Reject promise on password update failure
                                    }
                                }, {change: password});
                            }
                            setTimeout(() => {
                                logoutGunAccount();
                                gun.user().auth(username.toLowerCase(), password, async (authAck) => { // Renamed ack to authAck for clarity
                                    if ("err" in authAck) {
                                        console.error("Authentication failed:", authAck.err);
                                        return reject(new Error(`Authentication after password update failed: ${authAck.err}`)); // Reject promise on auth failure
                                    } else {
                                        console.error("logged in", authAck);
                                        account.pub = authAck.sea.pub;
                                        account.alias = username.toLowerCase();
                                        account.loggedIn = true;
                                        try {
                                            gun.user().get("dob").put(dob)
                                            await registerUser(authAck.sea.pub, username.toLowerCase(), email.toLowerCase());
                                            resolve(); // Resolve promise with success data
                                        } catch (registerUserError) {
                                            reject(new Error(registerUserError.message)); // Reject promise if registerUser fails
                                        }
                                    }
                                });
                            }, 1000);
                        } else {
                            reject(new Error(`User creation failed: ${ack.err}`)); // Reject promise with user creation error
                        }
                    } else if ("ok" in ack) {
                        localStore(username.toLowerCase()).value = password;
                        account.pub = ack.pub;
                        account.alias = username.toLowerCase();
                        account.loggedIn = true;
                        try {
                            gun.user().get("dob").put(dob)
                            await registerUser(ack.pub, username.toLowerCase(), email.toLowerCase());
                            resolve(); // Resolve promise with success data
                        } catch (registerUserError) {
                            reject(new Error(registerUserError.message)); // Reject promise if registerUser fails
                        }
                    }
                });
            });
        }); // End of Promise
    } catch (error) {
        logoutGunAccount(); // Ensure user is left even if initial checks fail
        throw new Error(`${error.message}`); // Catch any errors from synchronous operations
    }
}

/**
 * Logs in an existing user with Gun.
 * @param {string} userOrEmail - The username or email of the user.
 * @param {string} password - The user's password.
 * @returns {Promise<void>} - A promise that resolves when the user is successfully logged in, or rejects if there's an error.
 * @throws {Error} - Throws an error if the authentication fails.
 */
export async function login(userOrEmail, password) {

    return new Promise(async (resolve, reject) => {
        userOrEmail = userOrEmail.toLowerCase();
        if (userOrEmail.includes("@")) {
            userOrEmail = await getAliasFromEmail(userOrEmail)
            console.log(userOrEmail)
        }

        gun.user().auth(userOrEmail, password, async (authAck) => { // Renamed ack to authAck for clarity
            if ("err" in authAck) {
                console.error("Authentication failed:", authAck.err);
                return reject(new Error(`${authAck.err}`)); // Reject promise on auth failure

            } else {
                console.error("logged in", authAck);
                account.pub = authAck.sea.pub;
                account.alias = userOrEmail.toLowerCase();
                account.loggedIn = true;
                if (await getAvatar(account.alias) === "") {
                    console.log("setting avatar", account.alias, await getAvatar(account.alias))
                    await updateAvatar(await convertUrlToFile("/default-avatar.webp"))
                }
                if (await getBanner(account.alias) === "") {
                    console.log("setting banner", account.alias, await getBanner(account.alias))
                    await updateBanner(await convertUrlToFile("/default-banner.webp"))
                }
                setLastAccount(userOrEmail, password);
                resolve();
            }
        });
    })

}

/**
 * Verifies a user's registration using a verification code.
 * @param {number} code - The verification code.
 * @returns {Promise<void>} - A promise that resolves when the registration is successfully verified, or rejects if there's an error.
 * @throws {Error} - Throws an error if the verification fails, or if the user is not logged in.
 */
export async function verifyRegistration(code) {

    return new Promise(async (resolve, reject) => {
        const response = await fetch(`${API_URL}/verify-registration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({code})
        });

        if (!response.ok) {
            let errorMessage = "Verification failed."; // Generic failure message
            if (response.status === 400) {
                errorMessage = "Invalid verification code."; // Specific 400 error
            } else if (response.status === 404) {
                errorMessage = "Verification code not found."; // Specific 404 error (if backend uses 404 for not found code)
            } else if (response.status >= 500) {
                errorMessage = "Internal server error during verification."; // Generic 500 error
            }
            return reject(Error(errorMessage))
        }

        if (account.loggedIn) {

            const profile = gun.get(account.alias).put({
                user: account.alias,
                display: account.alias,
                banner: "",
                avatar: "",
                bio: "",
                pub: account.pub,
                created_at: Math.floor(Date.now() / 1000),
            })

            gun.get("users").get(account.alias).set(profile)

        } else {
            return reject(Error(`Account not logged in, please try again`))
        }
        resolve()
    })
}

//
// Update Account Info
//
// Public Struct (users: username.lowercase)
//{
//    user: account.alias,
//    display: account.alias,
//    banner: "",
//    avatar: "",
//    bio: "",
//    pub: account.pub,
//    created_at: number,
// }
//
//

/**
 * Verifies an account update using a verification code.
 * @param {number} code - The verification code.
 * @returns {Promise<Response>} - A promise that resolves with the server's response.
 */
async function verifyUpdate(code) {
    return await fetch(`${API_URL}/verify-update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({code})
    });
}

export async function follow(username) {
    const my_profile = gun.get(account.alias)
    const target = gun.get(username.toLowerCase())

    my_profile.get("following").set(target)
    target.get("followers").set(my_profile);
}

export async function unfollow(username) {
    const my_profile = gun.get(account.alias)
    const target = gun.get(username.toLowerCase())

    my_profile.get("following").unset(target)
    target.get("followers").unset(my_profile);
}

/**
 * Updates a user's information on the server.
 * @param {string} pub - The public key of the user.
 * @param {boolean} isAlias - Whether the value is an alias.
 * @param {string} value - The new value to update.
 * @returns {Promise<Response>} - A promise that resolves with the server's response.
 */
async function updateUser(pub, isAlias, value) {
    return await fetch(`${API_URL}/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({pub, isAlias, value})
    });
}

/**
 * Updates the user's display name.
 * @param {string} s - The new Display name.
 */
export async function updateDisplay(s) {
    gun.get("users").get(account.alias).get("display").put(s)
}

/**
 * Updates the user's avatar.
 * @param {File} file - The image file to be used as the avatar.
 * @returns {Promise<void>} - returns when the avatar has been successfully updated in gun
 */
export async function updateAvatar(file) {
    let result = await readFileAsDataURL(file)
    let data = await imageToWebpBase64(result)
    gun.get("users").get(account.alias).get("avatar").put(data)
}

/**
 * Updates the user's banner picture.
 * @param {File} file - The image file to be used as the banner picture.
 * @returns {Promise<void>} - returns when the banner has been successfully updated in gun
 */
export async function updateBanner(file) {
    let result = await readFileAsDataURL(file)
    let data = await imageToWebpBase64(result)
    gun.get("users").get(account.alias).get("banner").put(data)
}

/**
 * Updates the user's bio.
 * @param {string} s - The new bio text.
 */
export async function updateBio(s) {
    gun.get("users").get(account.alias).get("bio").put(s)
}

//
// Get Account Info
//
// Public Struct (users: username.lowercase)
//{
//    user: account.alias,
//    display: account.alias,
//    banner: "",
//    avatar: "",
//    bio: "",
//    pub: account.pub,
//    created_at: number,
// }
//
//

export async function getIsFollowing(username) {


    const node = gun.get(account.alias).get("following").get(username)

    return await checkGunNodeExists(node)
}

export async function getFollowers(username) {
    const node = gun.get("users").get(username).get('followers')
    return getGunNodeCount(node)
}

export async function getFollowing(username) {
    const node = gun.get("users").get(username).get('following')
    return getGunNodeCount(node)
}


/**
 * Retrieves the username with the correct capitalization from GunDB.
 * @param {string} username - The username (alias) to fetch data for.
 * @returns {Promise<string>} - A promise that resolves with the display name of the user.
 */
export async function getUsernameWithCase(username) {
    return await validateUserAndGetValue(username, "user");
}

/**
 * Retrieves the display name of a user from GunDB.
 * @param {string} username - The username (alias) to fetch data for.
 * @returns {Promise<string>} - A promise that resolves with the display name of the user.
 */
export async function getDisplay(username) {
    return await validateUserAndGetValue(username, "display");
}

/**
 * Retrieves the banner image URL of a user from GunDB.
 * @param {string} username - The username (alias) to fetch data for.
 * @returns {Promise<string>} - A promise that resolves with the banner image URL of the user.
 */
export async function getBanner(username) {
    return await validateUserAndGetValue(username, "banner");
}

/**
 * Retrieves the avatar URL of a user from GunDB.
 * @param {string} username - The username (alias) to fetch data for.
 * @returns {Promise<string>} - A promise that resolves with the avatar URL of the user.
 */
export async function getAvatar(username) {
    return await validateUserAndGetValue(username, "avatar");
}

/**
 * Retrieves the bio of a user from GunDB.
 * @param {string} username - The username (alias) to fetch data for.
 * @returns {Promise<string>} - A promise that resolves with the bio of the user.
 */
export async function getBio(username) {
    return await validateUserAndGetValue(username, "bio");
}

/**
 * Retrieves the public key of a user from GunDB.
 * @param {string} username - The username (alias) to fetch data for.
 * @returns {Promise<string>} - A promise that resolves with the public key of the user.
 */
export async function getPub(username) {
    return await validateUserAndGetValue(username, "pub");
}

function convertUnixToMonthYear(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000); // Convert Unix timestamp to milliseconds
    const options = {month: 'long', year: 'numeric'};
    return date.toLocaleDateString('en-US', options);
}

/**
 * Retrieves the creation timestamp of a user's account from GunDB.
 * @param {string} username - The username (alias) to fetch data for.
 * @returns {Promise<string>} - A promise that resolves with the creation timestamp of the user's account.
 */
export async function getCreatedAt(username) {
    username = username.toLowerCase();
    return convertUnixToMonthYear(await getGunNodeValue(gun.get("users").get(username).get("created_at")));

}

//
// POST CREATION & GETTING
//



//
// Utils
//
