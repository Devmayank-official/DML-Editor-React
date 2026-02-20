const encoder = new TextEncoder();
const decoder = new TextDecoder();

const derive = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', iterations: 100000, salt },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
};

export const encryptText = async (value: string, password: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(password, salt);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(value));
  const merged = new Uint8Array(salt.length + iv.length + data.byteLength);
  merged.set(salt, 0);
  merged.set(iv, salt.length);
  merged.set(new Uint8Array(data), salt.length + iv.length);
  return btoa(String.fromCharCode(...merged));
};

export const decryptText = async (payload: string, password: string): Promise<string> => {
  const bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const body = bytes.slice(28);
  const key = await derive(password, salt);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, body);
  return decoder.decode(plain);
};
