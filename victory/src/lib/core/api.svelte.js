import {account} from "$lib/core/state.svelte.js";
import {gun} from "$lib/core/state.svelte.js";

const API_URL = 'https://victoryapp.net/api/v1';

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

/**
 * @param {string} email
 */
async function getAliasFromEmail(email) {
    const response = await fetch(`${API_URL}/user?email=${email}`, { // Added email as query parameter
        method: 'GET',
        headers: {
            'Content-Type': 'application/json' // You can keep the content-type header, although it's not strictly necessary for GET requests without a body.
        },
    });
    return await response.text();
}