# JioSaavn API Reverse Engineering & Client Specification

An open-source, reverse-engineered client specification and implementation for the internal JioSaavn music streaming API. This repository provides documentations, schemas, and a standalone TypeScript client to fetch songs, albums, artists, playlists, lyrics, and decrypt high-quality audio streams.

---

## 🔑 Audio Stream Decryption Algorithm

JioSaavn wraps its media URLs in an encrypted string (`encrypted_media_url` or `media_url` parameters) using the **DES (Data Encryption Standard)** cipher in **ECB (Electronic Codebook)** mode. 

### Cryptographic Parameters
- **Algorithm**: DES-ECB
- **Cipher Key**: `38346591`
- **Initialization Vector (IV)**: `00000000` (unused in ECB, but required as empty block fallback)
- **Format Encoding**: Base64 encoded

### Decryption Flow (TypeScript Example)
```typescript
import forge from 'node-forge';

function decryptMediaUrl(encryptedMediaUrl: string): string {
  const key = '38346591';
  const iv = '00000000';

  const encryptedBytes = forge.util.decode64(encryptedMediaUrl);
  const decipher = forge.cipher.createDecipher('DES-ECB', forge.util.createBuffer(key));
  decipher.start({ iv: forge.util.createBuffer(iv) });
  decipher.update(forge.util.createBuffer(encryptedBytes));
  decipher.finish();

  // Decrypted base URL, e.g. "https://aac.saavncdn.com/999/some_hash_160.mp4"
  return decipher.output.getBytes().replace(/\0/g, '').trim();
}
```

Once decrypted, you can replace the bitrate suffix in the URL (e.g. `_160`) to obtain different audio stream qualities:
- `_12` for **12 kbps**
- `_48` for **48 kbps**
- `_96` for **96 kbps**
- `_160` for **160 kbps**
- `_320` for **320 kbps** (high quality)

---

## 🛰 Core API Specification

The base endpoint for JioSaavn's client-side API calls is:
`https://www.jiosaavn.com/api.php`

All requests are `GET` requests and should specify the following base query parameters:
- `_format`: `json`
- `_marker`: `0`
- `ctx`: `web6dot0`
- `api_version`: `4`

### Endpoints (`__call` parameter)

#### 1. Global Autocomplete Search
- **Endpoint**: `autocomplete.get`
- **Params**:
  - `query`: The search term (string)
- **Response**: Flat categories object containing `songs`, `albums`, `artists`, `playlists`, and `topQuery` arrays.

#### 2. Songs Search
- **Endpoint**: `search.getResults`
- **Params**:
  - `q`: Search query (string)
  - `n`: Limit/count (number)
  - `p`: Page number (1-indexed)

#### 3. Fetch Song Details
- **Endpoint**: `song.getDetails`
- **Params**:
  - `pids`: Comma-separated list of song IDs (string)

#### 4. Fetch Album Details
- **Endpoint**: `content.getAlbumDetails`
- **Params**:
  - `albumid`: Album ID (string)

#### 5. Fetch Artist Details
- **Endpoint**: `artist.getArtistPageDetails`
- **Params**:
  - `artistId`: Artist ID (string)

#### 6. Fetch Playlist Details
- **Endpoint**: `playlist.getDetails`
- **Params**:
  - `listid`: Playlist ID (string)

#### 7. Fetch Lyrics
- **Endpoint**: `lyrics.get`
- **Params**:
  - `lyrics_id`: Song ID (string)

---

## 🛠 Features of the Standalone Client
- Zero dependencies except `node-forge` (for cryptography).
- Highly-typed schema models.
- Support for PWA and edge environments.
- Failover proxy rotation logic.

## 👥 Credits & Reverse Engineering

This API was reverse-engineered, documented, and packaged by:
- **Sagar Kewat (@sagarithm)** — [GitHub](https://github.com/sagarithm)
- **Pixartual Studio** — [Website](https://pixartual.com)

If this reverse engineering specification or client helps you in your projects, please consider dropping a star! ⭐

## ⚖ License
Licensed under the Apache License 2.0. See [LICENSE](./LICENSE) for details.
