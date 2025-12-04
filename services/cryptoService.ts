// services/cryptoService.ts

export interface EncryptedContent {
    ciphertext: string;
    mac: string;
}

const E2E_CIPHER_PREFIX = 'E2E_CIPHER:';
const MOCK_MAC = 'MOCK_MAC_A1B2C3D4E5F6'; // Mock Message Authentication Code

// Polyfill Buffer for client-side environments (Vite/Browser)
if (typeof window !== 'undefined' && typeof Buffer === 'undefined') {
  (window as any).Buffer = {
    from: (data: string, encoding?: string) => {
      if (encoding === 'base64') return atob(data);
      // Mocked UTF-8 to Base64 conversion
      return btoa(unescape(encodeURIComponent(data))); 
    },
    toString: (data: string, encoding?: string) => {
      if (encoding === 'base64') return atob(data);
      // Mocked Base64 to UTF-8 conversion
      return decodeURIComponent(escape(atob(data)));
    }
  };
}

export const cryptoService = {
    /**
     * Mock function to simulate E2E encryption.
     * Takes plaintext and returns a ciphertext blob and a Message Authentication Code (MAC).
     */
    encryptMessage(plaintext: string): EncryptedContent {
        // 1. Simulate encryption by Base64 encoding the plaintext
        // @ts-ignore - Buffer is polyfilled/mocked
        const ciphertextBase64 = Buffer.from(plaintext).toString('base64');
        const ciphertext = E2E_CIPHER_PREFIX + ciphertextBase64;
        
        // 2. Return ciphertext and a mock MAC
        return {
            ciphertext,
            mac: MOCK_MAC
        };
    },

    /**
     * Mock function to simulate E2E decryption.
     * Takes an encrypted message (with optional MAC) and returns the decrypted plaintext.
     */
    decryptMessage(message: { text: string, mac?: string }): string {
        const encryptedText = message.text;

        // Skip decryption if it doesn't look like an encrypted message (e.g., old data or failed encryption)
        if (!encryptedText || !encryptedText.startsWith(E2E_CIPHER_PREFIX)) {
            return encryptedText;
        }

        try {
            const ciphertextBase64 = encryptedText.substring(E2E_CIPHER_PREFIX.length);
            
            // In a real implementation, you would:
            // 1. Verify MAC (message.mac)
            // 2. Decrypt ciphertextBase64 using the correct key
            
            // Simulate decryption by decoding Base64
            // @ts-ignore
            return Buffer.from(ciphertextBase64, 'base64').toString('utf8');
        } catch (e) {
            console.error('Decryption failed:', e);
            return 'Failed to decrypt message.';
        }
    }
};