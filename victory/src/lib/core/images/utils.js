// @ts-nocheck
import imageCompression from "browser-image-compression";

/**
 * @param {File} file - The result from FileReader.readAsDataURL() or readAsArrayBuffer()
 * @returns {Promise<string>} - A promise that resolves with the base64-encoded WebP image string, formatted for an `img` tag `src` attribute.
 * @throws {Error} - Throws an error if there is an issue compressing or converting the image.
 */
async function imageToWebpBase64(file) {

    const options = {
        maxSizeMB: 5, // Max size of 5MB
        maxWidthOrHeight: 4096, // Max 4K resolution (4096px)
        fileType: 'image/webp',
        alwaysKeepResolution: true, //always keep resolution unless it need to be smaller
    };

    const compressedFile = await imageCompression(file, options);

    // Convert the compressed file to a data URL
    const reader = new FileReader();
    reader.readAsDataURL(compressedFile);
    await new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = reject;
    });
    const compressedDataUrl = reader.result;
    if (!compressedDataUrl || typeof compressedDataUrl !== 'string' || compressedDataUrl.length < 10) {
        throw new Error('Empty result after compression or not a string.');
    }

    return compressedDataUrl; // This string is ready for use in an <img> tag's src
}

