import { browser } from '$app/environment';

export class LocalStore {
    /**
     * @param {string} key
     * @param {any} initialValue
     */
    constructor(key, initialValue) {
        this.key = key;
        this._value = initialValue;
        if (browser) {
            const item = localStorage.getItem(key);
            console.log('Loaded from localStorage:', item);
            if (item) this._value = this.deserialize(item);
        }
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        console.log('Setting value:', newValue);
        if (this._value !== newValue) {
            this._value = newValue;
            if (browser) {
                console.log('Saving to localStorage with key:', this.key);
                localStorage.setItem(this.key, this.serialize(newValue));
            }
        }
    }

    /**
     * @param {any} value
     */
    serialize(value) {
        return JSON.stringify(value);
    }

    /**
     * @param {string} item
     */
    deserialize(item) {
        return JSON.parse(item);
    }
}

/**
 * @param {string} key
 * @param {any} initialValue
 */
export function localStore(key, initialValue) {
    return new LocalStore(key, initialValue);
}