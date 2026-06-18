import forge from 'node-forge';
import { describe, it, expect } from 'vitest';
import { JioSaavnAPI } from '../src/index';

describe('JioSaavnAPI', () => {
  describe('decryptUrl', () => {
    it('should correctly decrypt media URLs using DES-ECB decryption', () => {
      const key = '38346591';
      const iv = '00000000';
      const originalUrl = 'https://aac.saavncdn.com/123/test_audio_160.mp4';

      // Encrypt the URL using DES-ECB
      const cipher = forge.cipher.createCipher('DES-ECB', forge.util.createBuffer(key));
      cipher.start({ iv: forge.util.createBuffer(iv) });
      cipher.update(forge.util.createBuffer(originalUrl));
      cipher.finish();
      const encryptedBase64 = forge.util.encode64(cipher.output.getBytes());

      // Decrypt using JioSaavnAPI static helper
      const decryptedUrl = JioSaavnAPI.decryptUrl(encryptedBase64);

      expect(decryptedUrl).toBe(originalUrl);
    });

    it('should handle and replace http protocol with https', () => {
      const key = '38346591';
      const iv = '00000000';
      const originalUrl = 'http://aac.saavncdn.com/123/test_audio_160.mp4';

      const cipher = forge.cipher.createCipher('DES-ECB', forge.util.createBuffer(key));
      cipher.start({ iv: forge.util.createBuffer(iv) });
      cipher.update(forge.util.createBuffer(originalUrl));
      cipher.finish();
      const encryptedBase64 = forge.util.encode64(cipher.output.getBytes());

      const decryptedUrl = JioSaavnAPI.decryptUrl(encryptedBase64);

      expect(decryptedUrl).toBe('https://aac.saavncdn.com/123/test_audio_160.mp4');
    });
  });

  describe('Instantiation', () => {
    it('should initialize with default base URL', () => {
      const api = new JioSaavnAPI();
      expect(api).toBeDefined();
      expect(api).toBeInstanceOf(JioSaavnAPI);
    });

    it('should initialize with custom proxy base URLs', () => {
      const api = new JioSaavnAPI(['/api-saavn', 'https://proxy.example.com/api-saavn']);
      expect(api).toBeDefined();
      expect(api).toBeInstanceOf(JioSaavnAPI);
    });
  });
});
