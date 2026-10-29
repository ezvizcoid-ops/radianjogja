/**
 * End-to-End Cryptography Module for RADIAN JOGJA
 * Uses Web Crypto API (AES-GCM 256-bit) to protect sensitive subscriber PII (NIK, Passwords, etc.)
 */

const MASTER_SALT = 'RADIAN_JOGJA_FIBER_SECURITY_SALT_2026';

// Derive an AES-GCM 256-bit CryptoKey from passphrase
async function deriveKey(passphrase: string = 'RADIAN-JOGJA-ISP-E2EE-KEY'): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(MASTER_SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plain text string into a protected base64 token
 */
export async function encryptSensitiveData(plainText: string): Promise<string> {
  if (!plainText) return '';
  try {
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encoded
    );

    // Pack IV + Ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Convert to base64
    let binary = '';
    const bytes = new Uint8Array(combined);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `E2EE::${btoa(binary)}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return `ENC_${btoa(plainText)}`;
  }
}

/**
 * Decrypt an E2EE token back to plain text
 */
export async function decryptSensitiveData(encryptedToken: string): Promise<string> {
  if (!encryptedToken) return '';
  try {
    if (!encryptedToken.startsWith('E2EE::')) {
      if (encryptedToken.startsWith('ENC_')) {
        return atob(encryptedToken.replace('ENC_', ''));
      }
      return encryptedToken;
    }

    const base64Data = encryptedToken.replace('E2EE::', '');
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);

    const key = await deriveKey();
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('Decryption failed or invalid key:', err);
    return '***PROTECTED***';
  }
}

/**
 * Mask NIK for display: e.g. 3404011205930002 -> 3404********0002
 */
export function maskNik(nik: string): string {
  if (!nik) return '-';
  const clean = nik.replace(/\D/g, '');
  if (clean.length <= 8) return '********';
  return `${clean.slice(0, 4)}********${clean.slice(-4)}`;
}

/**
 * Mask Phone: 081234567890 -> 0812****7890
 */
export function maskPhone(phone: string): string {
  if (!phone) return '-';
  const clean = phone.trim();
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 4)}****${clean.slice(-4)}`;
}
