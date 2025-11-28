/**
 * Client-side encryption utilities using Web Crypto API
 * All encryption happens in the browser - keys never leave the client
 */

/**
 * Derive encryption key from password using PBKDF2
 * @param {string} password - User password
 * @param {Uint8Array} salt - Salt for key derivation (optional, generates new if not provided)
 * @returns {Promise<{key: CryptoKey, salt: Uint8Array}>}
 */
export async function deriveKey(password, salt = null) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Generate salt if not provided
    if (!salt) {
        salt = crypto.getRandomValues(new Uint8Array(16));
    }

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    // Derive AES-GCM key
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    return { key, salt };
}

/**
 * Encrypt a file using AES-GCM 256
 * @param {File} file - File to encrypt
 * @param {string} password - Encryption password
 * @returns {Promise<{encryptedData: ArrayBuffer, iv: Uint8Array, salt: Uint8Array, key: CryptoKey}>}
 */
export async function encryptFile(file, password) {
    // Read file as array buffer
    const fileBuffer = await file.arrayBuffer();

    // Derive key from password
    const { key, salt } = await deriveKey(password);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt file
    const encryptedData = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        fileBuffer
    );

    return { encryptedData, iv, salt, key };
}

/**
 * Decrypt file data using AES-GCM 256
 * @param {ArrayBuffer} encryptedData - Encrypted file data
 * @param {CryptoKey} key - Decryption key
 * @param {Uint8Array} iv - Initialization vector
 * @returns {Promise<ArrayBuffer>}
 */
export async function decryptFile(encryptedData, key, iv) {
    try {
        const decryptedData = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encryptedData
        );

        return decryptedData;
    } catch (error) {
        throw new Error('Decryption failed. Incorrect key or corrupted file.');
    }
}

/**
 * Export key to raw format for storage
 * @param {CryptoKey} key - Crypto key to export
 * @returns {Promise<ArrayBuffer>}
 */
export async function exportKey(key) {
    return await crypto.subtle.exportKey('raw', key);
}

/**
 * Import key from raw format
 * @param {ArrayBuffer} keyData - Raw key data
 * @returns {Promise<CryptoKey>}
 */
export async function importKey(keyData) {
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt backup key for email recovery
 * @param {CryptoKey} key - Encryption key to backup
 * @param {string} recoveryPassword - Recovery password
 * @returns {Promise<{encryptedKey: ArrayBuffer, iv: Uint8Array, salt: Uint8Array}>}
 */
export async function encryptBackupKey(key, recoveryPassword) {
    // Export key to raw format
    const keyData = await exportKey(key);

    // Derive recovery key
    const { key: recoveryKey, salt } = await deriveKey(recoveryPassword);

    // Generate IV for backup encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the key
    const encryptedKey = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        recoveryKey,
        keyData
    );

    return { encryptedKey, iv, salt };
}

/**
 * Decrypt backup key from email recovery
 * @param {ArrayBuffer} encryptedKey - Encrypted backup key
 * @param {string} recoveryPassword - Recovery password
 * @param {Uint8Array} iv - Initialization vector
 * @param {Uint8Array} salt - Salt used for key derivation
 * @returns {Promise<CryptoKey>}
 */
export async function decryptBackupKey(encryptedKey, recoveryPassword, iv, salt) {
    // Derive recovery key
    const { key: recoveryKey } = await deriveKey(recoveryPassword, salt);

    // Decrypt the key data
    const keyData = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        recoveryKey,
        encryptedKey
    );

    // Import decrypted key
    return await importKey(keyData);
}

/**
 * Convert ArrayBuffer to Base64 string for storage
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
export function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Generate random wallet keypair (for email-based wallet generation)
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 */
export async function generateKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'ECDSA',
            namedCurve: 'P-256'
        },
        true,
        ['sign', 'verify']
    );

    const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
        publicKey: arrayBufferToBase64(publicKey),
        privateKey: arrayBufferToBase64(privateKey)
    };
}
