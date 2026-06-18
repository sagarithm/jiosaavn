# JioSaavn API Reverse Engineering & Client Specification

An open-source, reverse-engineered client specification and library implementation for the internal JioSaavn music streaming API. This repository provides documentation, schemas, and a standalone, publish-ready TypeScript client to fetch songs, albums, artists, playlists, lyrics, and decrypt high-quality audio streams.

---

## 📦 Installation

Install the packaged library using your preferred package manager:

```bash
npm install jiosaavn
# or
yarn add jiosaavn
# or
pnpm add jiosaavn
# or
bun add jiosaavn
```

---

## 🚀 Quick Start

The package supports both ES Modules (`import`) and CommonJS (`require`), compiled with high-fidelity type declarations (`.d.ts`).

### 1. Import the Client

**ES Modules (TypeScript / Modern JavaScript)**
```typescript
import { JioSaavnAPI } from 'jiosaavn';

const api = new JioSaavnAPI();
```

**CommonJS (Node.js)**
```javascript
const { JioSaavnAPI } = require('jiosaavn');

const api = new JioSaavnAPI();
```

### 2. Client Initialization (Browser CORS Proxy)
Since the raw JioSaavn API endpoints block CORS requests from web browsers, you should pass your own reverse proxy URLs (CORS proxies) to the client during instantiation. The client handles automatic failover and rotates through the proxy list if any endpoint fails.

```typescript
const api = new JioSaavnAPI([
  '/api-saavn', // Local proxy path
  'https://yourproxy.com/api-saavn' // Remote fallback proxy
]);
```

### 3. Fetching Details Example

```typescript
// Fetch details of a specific song
const songs = await api.getSongById('sSongId123');
console.log(songs[0].name);

// Decrypt high-quality audio streams
const encryptedUrl = songs[0].downloadUrl[4].url; // 320kbps stream
```

---

## 🔑 Audio Stream Decryption Algorithm

JioSaavn wraps its media URLs in an encrypted string (`encrypted_media_url` or `media_url` parameters) using the **DES (Data Encryption Standard)** cipher in **ECB (Electronic Codebook)** mode. 

### Cryptographic Parameters
- **Algorithm**: DES-ECB
- **Cipher Key**: `38346591`
- **Initialization Vector (IV)**: `00000000` (unused in ECB, but required as empty block fallback)
- **Format Encoding**: Base64 encoded

### Decrying Media Streams Using the Client
The library exposes a static, high-performance method `decryptUrl` to easily decrypt these values without setting up custom ciphers:

```typescript
import { JioSaavnAPI } from 'jiosaavn';

const encryptedMediaUrl = 'base64_encrypted_string_from_api';
const directAudioUrl = JioSaavnAPI.decryptUrl(encryptedMediaUrl);

console.log(directAudioUrl);
// Returns: "https://aac.saavncdn.com/999/some_hash_320.mp4"
```

Once decrypted, you can replace the bitrate suffix in the URL (e.g. `_160`) to obtain different audio stream qualities:
- `_12` for **12 kbps**
- `_48` for **48 kbps**
- `_96` for **96 kbps**
- `_160` for **160 kbps**
- `_320` for **320 kbps** (high quality stream)

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
- **Zero dependencies** except `node-forge` (for cryptography).
- **Strongly Typed**: Highly-typed schema models and responses.
- **Failover Protection**: Rotation logic across multiple proxy endpoints.
- **Modern Build**: Supports ESM, CJS, and TypeScript typings out of the box.

---

## 👥 Credits & Reverse Engineering

This API was reverse-engineered, documented, and packaged by:
- **Sagar Kewat (@sagarithm)**
- **Chirag Vishwakarma**
- **Pixartual Studio** — [Website](https://pixartual.studio)

If this reverse engineering specification or client helps you in your projects, please consider dropping a star! ⭐

---

## ⚖ License
Licensed under the Apache License 2.0. See [LICENSE](./LICENSE) for details.
