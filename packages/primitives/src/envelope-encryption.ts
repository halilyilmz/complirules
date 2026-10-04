import crypto from 'node:crypto';

export interface EncryptedEnvelope {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  tag: string;
  algorithm: string;
  createdAt: string;
}

/**
 * KVKK Madde 6 (Özel Nitelikli Kişisel Veriler) Zarf Şifreleme (Envelope Encryption)
 * 
 * Veri Şifreleme Anahtarı (DEK - Data Encryption Key) oluşturur, veriyi DEK ile şifreler,
 * ardından DEK'i Ana Anahtarlık (KEK - Key Encryption Key / KMS) ile şifreleyerek zarflar.
 */
export function encryptSensitivePayload(plaintext: string, masterKey: string): EncryptedEnvelope {
  // 1. Her kayıt için rastgele 256-bit DEK üret
  const dek = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  // 2. Veriyi DEK ile AES-256-GCM modunda şifrele
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
  let encryptedData = cipher.update(plaintext, 'utf8', 'hex');
  encryptedData += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  // 3. DEK'i masterKey (KEK) ile şifrele (Master Key 32 byte hash olarak türetilir)
  const kek = crypto.createHash('sha256').update(masterKey).digest();
  const keyIv = crypto.randomBytes(16);
  const keyCipher = crypto.createCipheriv('aes-256-gcm', kek, keyIv);
  let encryptedKey = keyCipher.update(dek.toString('hex'), 'utf8', 'hex');
  encryptedKey += keyCipher.final('hex');
  const keyTag = keyCipher.getAuthTag().toString('hex');

  // Anahtar zarfı: keyIv:keyTag:encryptedKey
  const wrappedKey = `${keyIv.toString('hex')}:${keyTag}:${encryptedKey}`;

  return {
    encryptedData,
    encryptedKey: wrappedKey,
    iv: iv.toString('hex'),
    tag,
    algorithm: 'AES-256-GCM',
    createdAt: new Date().toISOString()
  };
}

/**
 * Zarflanmış özel nitelikli veriyi çözer
 */
export function decryptSensitivePayload(envelope: EncryptedEnvelope, masterKey: string): string {
  // 1. DEK'i masterKey ile çöz
  const kek = crypto.createHash('sha256').update(masterKey).digest();
  const [keyIvHex, keyTagHex, encKeyHex] = envelope.encryptedKey.split(':');
  
  const keyDecipher = crypto.createDecipheriv(
    'aes-256-gcm',
    kek,
    Buffer.from(keyIvHex, 'hex')
  );
  keyDecipher.setAuthTag(Buffer.from(keyTagHex, 'hex'));
  let dekHex = keyDecipher.update(encKeyHex, 'hex', 'utf8');
  dekHex += keyDecipher.final('utf8');
  const dek = Buffer.from(dekHex, 'hex');

  // 2. Veriyi DEK ile çöz
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    dek,
    Buffer.from(envelope.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, 'hex'));
  let decrypted = decipher.update(envelope.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
