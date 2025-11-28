/**
 * Social sharing utilities
 * Provides functions to share files via various platforms
 */

/**
 * Share file via Web Share API (native sharing on mobile)
 * @param {Object} file - File object with name and URL
 * @returns {Promise<boolean>}
 */
export async function shareViaWebShare(file) {
    if (!navigator.share) {
        return false;
    }

    try {
        await navigator.share({
            title: file.name,
            text: `Check out this file: ${file.name}`,
            url: file.url || window.location.href,
        });
        return true;
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Web Share error:', error);
        }
        return false;
    }
}

/**
 * Share file via WhatsApp
 * @param {Object} file - File object
 * @param {string} message - Optional message
 */
export function shareViaWhatsApp(file, message = '') {
    const text = encodeURIComponent(
        message || `Check out this secure file: ${file.name}\n${window.location.href}`
    );
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
}

/**
 * Share file via Facebook
 * @param {string} url - URL to share
 */
export function shareViaFacebook(url = window.location.href) {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

/**
 * Share file via Twitter/X
 * @param {Object} file - File object
 * @param {string} message - Optional message
 */
export function shareViaTwitter(file, message = '') {
    const text = encodeURIComponent(
        message || `Securely sharing: ${file.name}`
    );
    const url = encodeURIComponent(window.location.href);
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

/**
 * Share file via Instagram (opens Instagram app if on mobile)
 * Note: Instagram doesn't support direct web sharing, so we copy link to clipboard
 * @param {Object} file - File object
 */
export async function shareViaInstagram(file) {
    try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied! Open Instagram and paste the link in your story or bio.');
        // On mobile, try to open Instagram app
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            window.location.href = 'instagram://';
        }
    } catch (error) {
        console.error('Instagram share error:', error);
        alert('Please copy this link manually: ' + window.location.href);
    }
}

/**
 * Share file via TikTok (opens TikTok app if on mobile)
 * Note: TikTok doesn't support direct web sharing, so we copy link to clipboard
 * @param {Object} file - File object
 */
export async function shareViaTikTok(file) {
    try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied! Open TikTok and paste the link in your bio or video description.');
        // On mobile, try to open TikTok app
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            window.location.href = 'tiktok://';
        }
    } catch (error) {
        console.error('TikTok share error:', error);
        alert('Please copy this link manually: ' + window.location.href);
    }
}

/**
 * Share file via Bluetooth (Web Bluetooth API)
 * Note: This is experimental and may not work on all browsers
 * @param {Object} file - File object with blob data
 */
export async function shareViaBluetooth(file) {
    if (!navigator.bluetooth) {
        alert('Bluetooth sharing is not supported on this browser. Please use Chrome on Android or a compatible device.');
        return false;
    }

    try {
        // Request Bluetooth device
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['file_transfer']
        });

        alert(`Selected device: ${device.name}. File transfer via Bluetooth is experimental and may require additional setup.`);
        return true;
    } catch (error) {
        console.error('Bluetooth share error:', error);
        if (error.name !== 'NotFoundError') {
            alert('Bluetooth sharing failed. Try using the native share option instead.');
        }
        return false;
    }
}

/**
 * Copy file link to clipboard
 * @param {string} url - URL to copy
 */
export async function copyLinkToClipboard(url = window.location.href) {
    try {
        await navigator.clipboard.writeText(url);
        return true;
    } catch (error) {
        console.error('Clipboard error:', error);
        return false;
    }
}

/**
 * Get available sharing options based on browser capabilities
 * @returns {Object} Available sharing methods
 */
export function getAvailableSharingOptions() {
    return {
        webShare: !!navigator.share,
        whatsapp: true,
        facebook: true,
        twitter: true,
        instagram: true,
        tiktok: true,
        bluetooth: !!navigator.bluetooth,
        clipboard: !!navigator.clipboard,
    };
}
