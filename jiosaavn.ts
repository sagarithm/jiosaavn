/* eslint-disable @typescript-eslint/no-explicit-any */
import forge from 'node-forge';

// ─── Data Models & Interfaces ────────────────────────────────────────────────

export interface ImageLink {
  quality: string;
  url: string;
}

export interface DownloadLink {
  quality: string;
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

// ─── API Client Implementation ───────────────────────────────────────────────

const ENDPOINTS = {
  search: {
    all: 'autocomplete.get',
    songs: 'search.getResults',
    albums: 'search.getAlbumResults',
    artists: 'search.getArtistResults',
    playlists: 'search.getPlaylistResults'
  },
  songs: {
    id: 'song.getDetails',
    lyrics: 'lyrics.get',
    station: 'webradio.getSongStation'
  },
  albums: {
    id: 'content.getAlbumDetails'
  },
  artists: {
    id: 'artist.getArtistPageDetails',
    songs: 'artist.getArtistMoreSong',
    albums: 'artist.getArtistMoreAlbum'
  },
  playlists: {
    id: 'playlist.getDetails'
  },
  modules: 'content.getBrowseModules',
  trending: 'content.getTrending'
} as const;

export class JioSaavnAPI {
  private baseUrls: string[] = [];
  private currentUrlIndex = 0;

  /**
   * Initializes the JioSaavn API Client.
   * 
   * @param baseUrls An array of endpoints. Since the raw JioSaavn endpoints block CORS 
   * on web browsers, you should pass your own reverse proxy urls (e.g. ['/api-saavn'] or ['https://myproxy.com/api-saavn']).
   */
  constructor(baseUrls: string[] = ["https://www.jiosaavn.com/api.php"]) {
    this.baseUrls = baseUrls;
  }

  /**
   * Make a request to the API with automatic failover rotation
   */
  private async fetch(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const queryParams = new URLSearchParams({
      __call: endpoint,
      _format: 'json',
      _marker: '0',
      ctx: 'web6dot0',
      ...params
    });

    const maxRetries = this.baseUrls.length;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const baseUrl = this.baseUrls[this.currentUrlIndex];
      const url = `${baseUrl}?${queryParams}`;

      try {
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        };

        const response = await fetch(url, { headers });

        if (!response.ok) {
          if (response.status === 429 || response.status >= 500) {
            this.rotateUrl();
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        return JSON.parse(text);
      } catch (error: any) {
        lastError = error;
        this.rotateUrl();
      }
    }

    throw lastError || new Error("All proxy endpoints failed.");
  }

  private rotateUrl() {
    this.currentUrlIndex = (this.currentUrlIndex + 1) % this.baseUrls.length;
  }

  async searchAll(query: string): Promise<SearchResult> {
    const data = await this.fetch(ENDPOINTS.search.all, { query });

    return {
      albums: data.albums?.data ? {
        results: data.albums.data?.map((album: any) => this.transformAlbum(album)) || [],
        position: 1
      } : undefined,
      songs: data.songs?.data ? {
        results: data.songs.data?.map((song: any) => this.transformSong(song)) || [],
        position: 1
      } : undefined,
      artists: data.artists?.data ? {
        results: data.artists.data?.map((artist: any) => this.transformArtist(artist)) || [],
        position: 1
      } : undefined,
      playlists: data.playlists?.data ? {
        results: data.playlists.data || [],
        position: 1
      } : undefined,
      topQuery: data.topQuery?.data ? {
        results: data.topQuery.data?.map((song: any) => this.transformSong(song)) || [],
        position: 1
      } : undefined
    };
  }

  async searchAllFull(query: string, page = 0, limit = 20): Promise<SearchResult> {
    const isDirectId = /^[a-zA-Z0-9]{5,15}$/.test(query) && !query.includes(' ');

    const [songs, albums, artists, playlists] = await Promise.all([
      this.searchSongs(query, page, limit),
      this.searchAlbums(query, page, limit),
      this.searchArtists(query, page, limit),
      this.searchPlaylists(query, page, limit)
    ]);

    const topResult: any[] = [];
    const normalizedQuery = query.toLowerCase().trim();

    if (isDirectId && artists.results.length === 0) {
      try {
        const directArtist = await this.getArtistById(query);
        if (directArtist) topResult.push({ ...directArtist, type: 'artist' });
      } catch (e) { /* ignore */ }
    }

    if (topResult.length === 0 && artists.results.length > 0) {
      const topArtist = artists.results[0];
      if (topArtist.name.toLowerCase().trim() === normalizedQuery ||
        (isDirectId && topArtist.id === query)) {
        topResult.push({ ...topArtist, type: 'artist' });
      }
    }

    if (topResult.length === 0 && songs.results.length > 0) {
      const topSong = songs.results[0];
      if (topSong.name.toLowerCase().trim().includes(normalizedQuery)) {
        topResult.push({ ...topSong, type: 'song' });
      }
    }

    return {
      songs: { results: songs.results, position: 1 },
      albums: { results: albums.results, position: 2 },
      artists: { results: artists.results, position: 3 },
      playlists: { results: playlists.results, position: 4 },
      topResult: topResult.length > 0 ? topResult : undefined
    };
  }

  async searchSongs(query: string, page = 0, limit = 20): Promise<{ total: number, start: number, results: Song[] }> {
    const data = await this.fetch(ENDPOINTS.search.songs, {
      q: query,
      n: limit,
      p: page + 1,
      api_version: '4'
    });

    return {
      total: Number(data.total || 0),
      start: page * limit + 1,
      results: (data.results || data.data || [])?.map((song: any) => this.transformSong(song)) || []
    };
  }

  async searchAlbums(query: string, page = 0, limit = 20): Promise<{ total: number, start: number, results: Album[] }> {
    const data = await this.fetch(ENDPOINTS.search.albums, {
      q: query,
      n: limit,
      p: page + 1,
      api_version: '4'
    });

    return {
      total: Number(data.total || 0),
      start: page * limit + 1,
      results: (data.results || data.data || [])?.map((album: any) => this.transformAlbum(album)) || []
    };
  }

  async searchArtists(query: string, page = 0, limit = 20): Promise<{ total: number, start: number, results: any[] }> {
    const data = await this.fetch(ENDPOINTS.search.artists, {
      q: query,
      n: limit,
      p: page + 1,
      api_version: '4'
    });

    return {
      total: Number(data.total || 0),
      start: page * limit + 1,
      results: (data.results || data.data || [])?.map((artist: any) => this.transformArtist(artist)) || []
    };
  }

  async searchPlaylists(query: string, page = 0, limit = 20): Promise<{ total: number, start: number, results: any[] }> {
    const data = await this.fetch(ENDPOINTS.search.playlists, {
      q: query,
      n: limit,
      p: page + 1
    });

    return {
      total: data.total || 0,
      start: page * limit + 1,
      results: data.results || []
    };
  }

  async getSongById(songIds: string): Promise<Song[]> {
    const data = await this.fetch(ENDPOINTS.songs.id, {
      pids: songIds,
      api_version: '4'
    });
    return data.songs?.map((song: any) => this.transformSong(song)) || [];
  }

  async getAlbumById(albumId: string): Promise<Album> {
    const data = await this.fetch(ENDPOINTS.albums.id, {
      cc: 'in',
      albumid: albumId,
      api_version: '4'
    });
    return this.transformAlbum(data);
  }

  async getArtistById(artistId: string): Promise<Artist> {
    const isToken = /^[a-zA-Z0-9_-]+$/.test(artistId) && isNaN(Number(artistId));

    if (isToken) {
      const data = await this.fetch('webapi.get', {
        token: artistId,
        type: 'artist',
        api_version: '4'
      });
      return this.transformArtist(data);
    }

    const data = await this.fetch(ENDPOINTS.artists.id, {
      artistId: artistId,
      api_version: '4'
    });
    return this.transformArtist(data);
  }

  async getArtistSongs(artistId: string, page = 0, limit = 20, sortBy = 'popularity', sortOrder = 'desc') {
    const data = await this.fetch(ENDPOINTS.artists.songs, {
      artistId,
      n: limit,
      p: page,
      sortBy,
      sortOrder
    });

    if (data.songs) {
      data.songs = data.songs.map((song: any) => this.transformSong(song));
    }
    return data;
  }

  async getArtistAlbums(artistId: string, page = 0, limit = 20, sortBy = 'popularity', sortOrder = 'desc') {
    const data = await this.fetch(ENDPOINTS.artists.albums, {
      artistId,
      n: limit,
      p: page,
      sortBy,
      sortOrder
    });

    if (data.albums) {
      data.albums = data.albums.map((album: any) => this.transformAlbum(album));
    }
    return data;
  }

  async getPlaylistById(playlistId: string): Promise<Playlist> {
    const data = await this.fetch(ENDPOINTS.playlists.id, {
      listid: playlistId,
      n: 50
    });
    return this.transformPlaylist(data);
  }

  async getSongLyrics(songId: string) {
    const data = await this.fetch(ENDPOINTS.songs.lyrics, { lyrics_id: songId });
    return data;
  }

  async getSongStation(songId: string) {
    const data = await this.fetch(ENDPOINTS.songs.station, {
      entity_id: songId,
      entity_type: 'song'
    });
    return data;
  }

  async getBrowseModules() {
    const data = await this.fetch(ENDPOINTS.modules, { ctx: 'web6dot0', n: 20 });
    return this.transformModules(data);
  }

  private transformModules(data: any) {
    const radioStations = Array.isArray(data.radio)
      ? data.radio
      : (data.radio?.featured_stations || []);

    const shows = Array.isArray(data.top_shows)
      ? data.top_shows
      : (data.top_shows?.shows || []);

    return {
      albums: (data.new_albums || []).map((item: any) => this.transformAlbum(item)),
      charts: (data.charts || []).map((item: any) => this.transformPlaylist(item)),
      trending: (data.new_trending || []).map((item: any) => {
        if (item.type === 'song') return this.transformSong(item);
        if (item.type === 'album') return this.transformAlbum(item);
        if (item.type === 'playlist') return this.transformPlaylist(item);
        return item;
      }),
      playlists: (data.top_playlists || []).map((item: any) => this.transformPlaylist(item)),
      artists: (data.top_artists || []).map((item: any) => this.transformArtist(item)),
      radio: radioStations.map((item: any) => ({
        id: item.id || item.stationid,
        title: item.name || item.station_display_text || item.title,
        subtitle: item.description || item.subtitle || '',
        image: typeof item.image === 'string'
          ? [{ quality: '150x150', url: item.image }]
          : (item.image || []),
        type: 'radio'
      })),
      podcasts: shows.map((item: any) => ({
        id: item.id,
        title: item.title || item.show_title,
        subtitle: item.subtitle || '',
        image: typeof item.image === 'string'
          ? [{ quality: '150x150', url: item.image }]
          : (item.image || []),
        type: 'show'
      })),
      discover: (data.browse_discover || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        image: typeof item.image === 'string'
          ? [{ quality: '150x150', url: item.image }]
          : (item.image || []),
        type: 'playlist'
      }))
    };
  }

  async getTrending() {
    const data = await this.fetch(ENDPOINTS.trending, { ctx: 'web6dot0', n: 20 });

    const results = {
      songs: [] as Song[],
      albums: [] as Album[],
      playlists: [] as any[]
    };

    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.type === 'song') {
          results.songs.push(this.transformSong(item.details || item));
        } else if (item.type === 'album') {
          results.albums.push(this.transformAlbum(item.details || item));
        } else if (item.type === 'playlist') {
          results.playlists.push(item.details || item);
        }
      });
    }

    return results;
  }

  private transformSong(song: any): Song {
    const moreInfo = song.more_info || {};

    return {
      id: song.id || song.songId || song.songid || song.perma_url?.split('/').pop(),
      name: song.title || song.song || song.name || 'Unknown Song',
      subtitle: song.subtitle || song.description || '',
      type: song.type || 'song',
      language: song.language || 'Unknown',
      year: song.year ? Number(song.year) : (moreInfo.year ? Number(moreInfo.year) : null),
      playCount: song.play_count ? Number(song.play_count) : (moreInfo.play_count ? Number(moreInfo.play_count) : null),
      duration: song.duration ? Number(song.duration) : (moreInfo.duration ? Number(moreInfo.duration) : null),
      explicitContent: song.explicit_content === '1' || song.explicit === 'true' || moreInfo.explicit_content === '1' || false,
      hasLyrics: song.has_lyrics === 'true' || song.lyrics_id !== undefined || moreInfo.has_lyrics === 'true' || false,

      artists: {
        primary: (Array.isArray(song.primary_artists)
          ? song.primary_artists
          : (typeof song.primary_artists === 'string' && song.primary_artists.length > 0
            ? song.primary_artists.split(',').map((name: string) => ({ name: name.trim() }))
            : (moreInfo.primary_artists ? (Array.isArray(moreInfo.primary_artists) ? moreInfo.primary_artists : [{ name: moreInfo.primary_artists }]) : (moreInfo.artistMap?.primary_artists || [])))
        ).map((artist: any) => ({
          id: artist.id,
          name: artist.name || artist.title,
          role: artist.role || 'singer',
          type: artist.type || 'artist',
          image: this.createImageLinks(artist.image),
          url: artist.perma_url || artist.url
        })) || [],

        featured: (Array.isArray(song.featured_artists)
          ? song.featured_artists
          : (typeof song.featured_artists === 'string' && song.featured_artists.length > 0
            ? song.featured_artists.split(',').map((name: string) => ({ name: name.trim() }))
            : (moreInfo.featured_artists ? (Array.isArray(moreInfo.featured_artists) ? moreInfo.featured_artists : [{ name: moreInfo.featured_artists }]) : (moreInfo.artistMap?.featured_artists || [])))
        ).map((artist: any) => ({
          id: artist.id,
          name: artist.name || artist.title,
          role: artist.role || 'featured',
          type: artist.type || 'artist',
          image: this.createImageLinks(artist.image),
          url: artist.perma_url || artist.url
        })) || [],

        all: (Array.isArray(song.artistMap?.artists)
          ? song.artistMap.artists
          : (moreInfo.artistMap?.artists || [])
        ).map((artist: any) => ({
          id: artist.id,
          name: artist.name || artist.title,
          role: artist.role || 'singer',
          type: artist.type || 'artist',
          image: this.createImageLinks(artist.image),
          url: artist.perma_url || artist.url
        })) || []
      },

      album: song.album ? {
        id: song.album.id || moreInfo.album_id,
        name: song.album.title || song.album.name || moreInfo.album,
        url: song.album.url || song.album.perma_url || moreInfo.album_url
      } : (moreInfo.album ? {
        id: moreInfo.album_id,
        name: moreInfo.album,
        url: moreInfo.album_url
      } : null),

      image: this.createImageLinks(song.image),
      downloadUrl: this.createDownloadLinks(song.encrypted_media_url || song.media_url || moreInfo.encrypted_media_url || moreInfo.media_url),
      mp3Urls: this.createMp3Urls(song.encrypted_media_url || song.media_url || moreInfo.encrypted_media_url || moreInfo.media_url),

      url: song.perma_url || song.url,
      copyright: song.copyright_text || moreInfo.copyright_text || null,
      label: song.label || moreInfo.label || null,
      releaseDate: song.release_date || moreInfo.release_date || null
    };
  }

  private transformAlbum(album: any): Album {
    return {
      id: album.id || album.albumId || album.albumid || album.perma_url?.split('/').pop(),
      name: album.title || album.name || album.album || 'Unknown Album',
      subtitle: album.subtitle || album.description || '',
      type: album.type || 'album',
      language: album.language || 'Unknown',
      year: album.year ? Number(album.year) : null,
      playCount: album.play_count ? Number(album.play_count) : null,
      explicitContent: album.explicit_content === '1' || album.explicit === 'true' || false,

      artists: {
        primary: (Array.isArray(album.primary_artists)
          ? album.primary_artists
          : (typeof album.primary_artists === 'string' && album.primary_artists.length > 0
            ? album.primary_artists.split(',').map((name: string) => ({ name: name.trim() }))
            : (album.more_info?.artistMap?.primary_artists ? album.more_info.artistMap.primary_artists : []))
        ).map((artist: any) => ({
          id: artist.id,
          name: artist.name || artist.title,
          role: artist.role || 'singer',
          type: artist.type || 'artist',
          image: this.createImageLinks(artist.image),
          url: artist.perma_url || artist.url
        })) || [],

        featured: (Array.isArray(album.featured_artists)
          ? album.featured_artists
          : (typeof album.featured_artists === 'string' && album.featured_artists.length > 0
            ? album.featured_artists.split(',').map((name: string) => ({ name: name.trim() }))
            : (album.more_info?.artistMap?.featured_artists ? album.more_info.artistMap.featured_artists : []))
        ).map((artist: any) => ({
          id: artist.id,
          name: artist.name || artist.title,
          role: artist.role || 'featured',
          type: artist.type || 'artist',
          image: this.createImageLinks(artist.image),
          url: artist.perma_url || artist.url
        })) || [],

        all: (Array.isArray(album.artistMap?.artists)
          ? album.artistMap.artists
          : (Array.isArray(album.more_info?.artistMap?.artists) ? album.more_info.artistMap.artists : [])
        ).map((artist: any) => ({
          id: artist.id,
          name: artist.name || artist.title,
          role: artist.role || 'singer',
          type: artist.type || 'artist',
          image: this.createImageLinks(artist.image),
          url: artist.perma_url || artist.url
        })) || []
      },

      songCount: Number(album.more_info?.song_count || album.song_count || 0),
      url: album.perma_url || album.url,
      image: this.createImageLinks(album.image),
      songs: Array.isArray(album.list) ? album.list.map((song: any) => this.transformSong(song)) : []
    };
  }

  private transformArtist(artist: any): Artist {
    return {
      id: artist.id || artist.artistId,
      name: artist.title || artist.name || 'Unknown Artist',
      type: artist.type || 'artist',
      description: artist.description || null,
      image: this.createImageLinks(artist.image),
      url: artist.perma_url || artist.url || `https://www.jiosaavn.com/artist/${encodeURIComponent(artist.title || artist.name || 'unknown')}`,
      followerCount: artist.follower_count ? Number(artist.follower_count) : null,
      fanCount: artist.fan_count ? Number(artist.fan_count) : null,
      isVerified: artist.isVerified === 'true' || artist.is_verified === '1' || artist.isVerified || false,
      dominantLanguage: artist.dominantLanguage || artist.dominant_language || null,
      dominantType: artist.dominantType || artist.dominant_type || null,
      bio: artist.bio || null,
      dob: artist.dob || null,
      fb: artist.fb || null,
      twitter: artist.twitter || null,
      wiki: artist.wiki || null,
      availableLanguages: artist.availableLanguages || artist.available_languages || [],
      isRadioPresent: artist.isRadioPresent === 'true' || artist.is_radio_present === '1' || artist.isRadioPresent || false,

      topSongs: artist.topSongs ? artist.topSongs.map((song: any) => this.transformSong(song)) : [],
      topAlbums: artist.topAlbums ? artist.topAlbums.map((album: any) => this.transformAlbum(album)) : [],
      singles: artist.singles ? artist.singles.map((song: any) => this.transformSong(song)) : [],

      featuredPlaylists: artist.featured_artist_playlist ? artist.featured_artist_playlist.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.title,
        type: playlist.type,
        image: this.createImageLinks(playlist.image),
        url: playlist.perma_url,
        songCount: playlist.more_info?.song_count ? Number(playlist.more_info.song_count) : null
      })) : [],

      dedicatedPlaylists: artist.dedicated_artist_playlist ? artist.dedicated_artist_playlist.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.title,
        type: playlist.type,
        image: this.createImageLinks(playlist.image),
        url: playlist.perma_url,
        songCount: playlist.more_info?.song_count ? Number(playlist.more_info.song_count) : null
      })) : [],

      similarArtists: artist.similarArtists ? artist.similarArtists.map((similar: any) => ({
        id: similar.id || similar._id,
        name: similar.name,
        type: similar.type,
        image: this.createImageLinks(similar.image || similar.image_url),
        url: similar.perma_url,
        isVerified: similar.isVerified === 'true' || similar.is_verified === '1',
        dominantType: similar.dominantType || similar.dominant_type,
        bio: similar.bio || null,
        fb: similar.fb || null,
        twitter: similar.twitter || null,
        wiki: similar.wiki || null,
        dob: similar.dob || null
      })) : [],

      urls: artist.urls || null,
      topEpisodes: artist.topEpisodes || []
    };
  }

  private transformPlaylist(playlist: any): Playlist {
    return {
      id: playlist.id || playlist.listid || playlist.perma_url?.split('/').pop(),
      name: playlist.title || playlist.listname || playlist.name || 'Unknown Playlist',
      description: playlist.header_desc || playlist.subtitle || playlist.description || null,
      year: playlist.year ? Number(playlist.year) : null,
      type: playlist.type || 'playlist',
      playCount: playlist.play_count ? Number(playlist.play_count) : (playlist.fan_count ? Number(playlist.fan_count.replace(/,/g, '')) : null),
      language: playlist.language || 'Unknown',
      explicitContent: playlist.explicit_content === '1' || playlist.explicit === 'true' || false,
      songCount: playlist.more_info?.song_count ? Number(playlist.more_info.song_count) : (playlist.song_count ? Number(playlist.song_count) : null),
      url: playlist.perma_url || playlist.url,
      image: this.createImageLinks(playlist.image),
      songs: Array.isArray(playlist.list) ? playlist.list.map((song: any) => this.transformSong(song)) : [],
      artists: (playlist.more_info?.artists || playlist.artists || []).map((artist: any) => ({
        id: artist.id,
        name: artist.name || artist.title,
        role: artist.role || 'artist',
        type: artist.type || 'artist',
        image: this.createImageLinks(artist.image),
        url: artist.perma_url || artist.url
      }))
    };
  }

  private createImageLinks(link: any) {
    if (Array.isArray(link)) return link;
    if (!link || typeof link !== 'string') return [];

    const qualities = ['50x50', '150x150', '500x500'];
    const qualityRegex = /150x150|50x50/;
    const protocolRegex = /^(http:)?\/\//;

    return qualities.map((quality) => ({
      quality,
      url: link.replace(qualityRegex, quality).replace(protocolRegex, 'https://')
    }));
  }

  private createDownloadLinks(encryptedMediaUrl: string) {
    if (!encryptedMediaUrl) return [];

    try {
      const qualities = [
        { id: '_12', bitrate: '12kbps' },
        { id: '_48', bitrate: '48kbps' },
        { id: '_96', bitrate: '96kbps' },
        { id: '_160', bitrate: '160kbps' },
        { id: '_320', bitrate: '320kbps' }
      ];

      const key = '38346591';
      const iv = '00000000';

      const encrypted = forge.util.decode64(encryptedMediaUrl);
      const decipher = forge.cipher.createDecipher('DES-ECB', forge.util.createBuffer(key));
      decipher.start({ iv: forge.util.createBuffer(iv) });
      decipher.update(forge.util.createBuffer(encrypted));
      decipher.finish();
      const decryptedLink = decipher.output.getBytes().replace(/\0/g, '').trim();

      return qualities.map((quality) => ({
        quality: quality.bitrate,
        url: decryptedLink.replace(/_(12|48|96|160|320)/, quality.id).replace('http:', 'https:')
      }));
    } catch (error) {
      return [
        { quality: '12kbps', url: encryptedMediaUrl },
        { quality: '48kbps', url: encryptedMediaUrl },
        { quality: '96kbps', url: encryptedMediaUrl },
        { quality: '160kbps', url: encryptedMediaUrl },
        { quality: '320kbps', url: encryptedMediaUrl }
      ];
    }
  }

  private createMp3Urls(encryptedMediaUrl: string) {
    if (!encryptedMediaUrl) return null;
    const downloadUrls = this.createDownloadLinks(encryptedMediaUrl);
    if (!downloadUrls.length) return null;

    const urls: Record<string, { quality: string, url: string }> = {};
    downloadUrls.forEach(d => {
      urls[d.quality] = {
        quality: d.quality,
        url: d.url
      };
    });

    return urls;
  }
}
