// @ts-ignore
import base91 from 'node-base91'

/**
 * Encodes the given data.
 * @param {string | Buffer} data - The data to encode (string or file buffer).
 */
function encode(data) {
    base91.encode(data)
}

/**
 * Decodes the given data.
 * @param {string} data - The input string to decode.
 * @returns {string | Buffer} - The decoded data, either as a string or a Buffer.
 */
function decode(data) {
    return base91.decode(data)
}

