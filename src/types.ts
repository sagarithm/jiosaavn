export interface ImageLink {
  /** Image resolution (e.g. '50x50', '150x150', '500x500') */
  quality: string;
  /** Direct link to image asset */
  url: string;
}

export interface DownloadLink {
  /** Stream quality bitrate (e.g. '12kbps', '48kbps', '96kbps', '160kbps', '320kbps') */
  quality: string;
  /** Direct link to decrypted MP3/AAC audio stream */
  url: string;
}

export interface ArtistInfo {
  id: string;
  name: string;
  role: string;
  type: string;
  image: ImageLink[];
  url: string;
}

export interface Artists {
  primary: ArtistInfo[];
  featured: ArtistInfo[];
  all: ArtistInfo[];
}

export interface AlbumInfo {
  id: string;
  name: string;
  url: string;
}

export interface Song {
  id: string;
  name: string;
  subtitle: string;
  type: string;
  language: string;
  year: number | null;
  playCount: number | null;
  duration: number | null;
  explicitContent: boolean;
  hasLyrics: boolean;
  artists: Artists;
  album: AlbumInfo | null;
  image: ImageLink[];
  downloadUrl: DownloadLink[];
  mp3Urls: Record<string, { quality: string; url: string }> | null;
  url: string;
  copyright: string | null;
  label: string | null;
  releaseDate: string | null;
}

export interface Album {
  id: string;
  name: string;
  subtitle: string;
  type: string;
  language: string;
  year: number | null;
  playCount: number | null;
  explicitContent: boolean;
  artists: Artists;
  songCount: number;
  url: string;
  image: ImageLink[];
  songs: Song[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  year: number | null;
  type: string;
  playCount: number | null;
  language: string;
  explicitContent: boolean;
  songCount: number | null;
  url: string;
  image: ImageLink[];
  songs: Song[];
  artists: ArtistInfo[];
}

export interface Artist {
  id: string;
  name: string;
  type: string;
  description: string | null;
  image: ImageLink[];
  url: string;
  followerCount: number | null;
  fanCount: number | null;
  isVerified: boolean;
  dominantLanguage: string | null;
  dominantType: string | null;
  bio: string | null;
  dob: string | null;
  fb: string | null;
  twitter: string | null;
  wiki: string | null;
  availableLanguages: string[];
  isRadioPresent: boolean;
  topSongs: Song[];
  topAlbums: Album[];
  singles: Song[];
  featuredPlaylists: any[];
  dedicatedPlaylists: any[];
  similarArtists: any[];
  urls: any;
  topEpisodes: any[];
}

export interface SearchSection {
  results: any[];
  position: number;
}

export interface SearchResult {
  albums?: SearchSection;
  songs?: SearchSection;
  artists?: SearchSection;
  playlists?: SearchSection;
  topQuery?: SearchSection;
  topResult?: any[];
}
