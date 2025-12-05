// services/cryptoService.ts

export interface EncryptedContent {
    ciphertext: string;
    mac: string;
}

const E2E_CIPHER_PREFIX = 'E2E_CIPHER:';
const MOCK_MAC = 'MOCK_MAC_A1B2C3D4E5F6';

export const cryptoService = {
    /**
     * Encrypts plaintext to a Base64 blob with a prefix.
     * Handles UTF-8 characters (Emojis) correctly.
     */
    encryptMessage(plaintext: string): EncryptedContent {
        try {
            let base64 = '';
            
            // Browser Environment (React)
            if (typeof window !== 'undefined' && window.btoa) {
                // Encode UTF-8 string to bytes, then to binary string, then Base64
                const encoder = new TextEncoder();
                const bytes = encoder.encode(plaintext);
                const binary = String.fromCharCode(...Array.from(bytes));
                base64 = window.btoa(binary);
            } 
            // Node.js Environment (Backend)
            else if (typeof Buffer !== 'undefined') {
                base64 = Buffer.from(plaintext, 'utf8').toString('base64');
            }

            return {
                ciphertext: E2E_CIPHER_PREFIX + base64,
                mac: MOCK_MAC
            };
        } catch (e) {
            console.error("Encryption error:", e);
            return { ciphertext: plaintext, mac: 'ERROR' };
        }
    },

    /**
     * Decrypts the message.
     * Handles UTF-8 characters (Emojis) correctly.
     */
    decryptMessage(message: { text: string, mac?: string }): string {
        const encryptedText = message.text;

        // Return as-is if not encrypted
        if (!encryptedText || !encryptedText.startsWith(E2E_CIPHER_PREFIX)) {
            return encryptedText;
        }

        try {
            const base64 = encryptedText.substring(E2E_CIPHER_PREFIX.length);
            
            // Browser Environment (React)
            if (typeof window !== 'undefined' && window.atob) {
                const binaryString = window.atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const decoder = new TextDecoder('utf-8');
                return decoder.decode(bytes);
            } 
            // Node.js Environment (Backend)
            else if (typeof Buffer !== 'undefined') {
                return Buffer.from(base64, 'base64').toString('utf8');
            }
            
            return base64; // Fallback
        } catch (e) {
            console.error('Decryption failed:', e);
            return '🚫 Decryption Error';
        }
    }
};