import { decrypt as tlockDecrypt } from './tlock';

/**
 * Decrypt timelock-encrypted data
 */
export async function decrypt(ciphertext: string): Promise<Buffer> {
    const result = await tlockDecrypt(ciphertext);
    if (!result) {
        throw new Error('Decryption failed - time may not have been reached yet');
    }
    return result;
}
