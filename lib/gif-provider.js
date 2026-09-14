/**
 * ============================================================================
 * STREETALK // GIF PROVIDER ABSTRACTION LAYER & MULTI-PROVIDER ENGINE
 * - Pluggable Adapter Architecture (Google Tenor v2, Giphy v1, Curated Fallback)
 * - Automatic Fallback with Circuit Breaker (Never fails to deliver GIFs)
 * - In-Memory Volatile TTL Cache (Zero unnecessary API calls, anti-rate-limit)
 * - Normalized GifItem Schema (Contract isolation for UI)
 * ============================================================================
 */

'use strict';

/**
 * Standard Normalized GifItem Contract
 * @typedef {Object} GifItem
 * @property {string} id
 * @property {string} title
 * @property {string} url
 * @property {string} previewUrl
 * @property {number} width
 * @property {number} height
 * @property {string} provider
 * @property {string} category
 * @property {string[]} tags
 * @property {string} rating
 * @property {string} sourceUrl
 */

/**
 * Base Abstract GIF Provider Interface
 */
class GIFProvider {
  /**
   * @param {string} name 
   * @param {Object} options
   */
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
    this.consecutiveFailures = 0;
    this.circuitOpenUntil = 0;
  }

  isAvailable() {
    return Date.now() > this.circuitOpenUntil;
  }

  recordSuccess() {
    this.consecutiveFailures = 0;
    this.circuitOpenUntil = 0;
  }

  recordFailure() {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= 3) {
      // Trip circuit breaker for 60 seconds
      this.circuitOpenUntil = Date.now() + 60 * 1000;
    }
  }

  async search(query, limit = 18, offset = 0) {
    throw new Error(`search() not implemented in ${this.name}`);
  }

  async trending(category = 'trend', limit = 18, offset = 0) {
    throw new Error(`trending() not implemented in ${this.name}`);
  }

  normalizeResult(rawItem, category = 'trend') {
    throw new Error(`normalizeResult() not implemented in ${this.name}`);
  }

  async healthCheck() {
    return { ok: true, provider: this.name, available: this.isAvailable() };
  }
}

/**
 * 1. GOOGLE TENOR API (V2) PROVIDER
 * Documentation: https://developers.google.com/tenor/guides/quickstart
 */
class TenorProvider extends GIFProvider {
  constructor(apiKey) {
    super('tenor');
    // Use environment variable or Google Tenor public client key fallback
    this.apiKey = apiKey || process.env.TENOR_API_KEY || 'LIVDSRZULELA';
    this.clientKey = 'streetalk_web';
    this.baseUrl = 'https://tenor.googleapis.com/v2';
    this.timeoutMs = Number(process.env.GIF_FETCH_TIMEOUT_MS) || 1500;
  }

  isAvailable() {
    if (process.env.NODE_ENV === 'test' || process.env.OFFLINE_TEST === '1') {
      return false;
    }
    return super.isAvailable();
  }

  async trending(category = 'trend', limit = 18, offset = 0) {
    const categoryQueryMap = {
      trend: '',
      street: 'street urban style',
      flirt: 'flirt kiss romance love',
      amore: 'love romance heart couple',
      spicy: 'hot spicy flame fire chili',
      reazioni: 'reaction face',
      memes: 'funny meme viral',
      lol: 'laughing laughing hard',
      notte: 'night neon city dark',
      cyberpunk: 'cyberpunk glitch neon',
      anime: 'anime vibe aesthetic',
      music: 'music dance beat rhythm'
    };

    const q = categoryQueryMap[category.toLowerCase()] || category;
    if (!q) {
      const url = `${this.baseUrl}/featured?key=${encodeURIComponent(this.apiKey)}&client_key=${encodeURIComponent(this.clientKey)}&limit=${limit}&media_filter=gif,tinygif`;
      return this._fetchAndNormalize(url, category);
    } else {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(q)}&key=${encodeURIComponent(this.apiKey)}&client_key=${encodeURIComponent(this.clientKey)}&limit=${limit}&media_filter=gif,tinygif&contentfilter=medium`;
      return this._fetchAndNormalize(url, category);
    }
  }

  async search(query, limit = 18, offset = 0) {
    const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&key=${encodeURIComponent(this.apiKey)}&client_key=${encodeURIComponent(this.clientKey)}&limit=${limit}&media_filter=gif,tinygif&contentfilter=medium`;
    return this._fetchAndNormalize(url, 'search');
  }

  async _fetchAndNormalize(endpoint, category) {
    const response = await fetch(endpoint, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    if (!response.ok) {
      throw new Error(`Tenor API responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.results)) {
      throw new Error('Tenor API returned invalid data payload');
    }

    return data.results.map(item => this.normalizeResult(item, category));
  }

  normalizeResult(raw, category = 'trend') {
    const formats = raw.media_formats || {};
    const full = formats.gif || formats.mediumgif || {};
    const tiny = formats.tinygif || formats.nanogif || full;

    return {
      id: `tenor_${raw.id || Math.random().toString(36).slice(2, 9)}`,
      title: raw.title || raw.content_description || 'Street Reaction',
      url: full.url || tiny.url,
      previewUrl: tiny.url || full.url,
      width: full.dims ? full.dims[0] : 320,
      height: full.dims ? full.dims[1] : 240,
      provider: 'tenor',
      category: category,
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      rating: 'medium',
      sourceUrl: raw.itemurl || 'https://tenor.com'
    };
  }
}

/**
 * 2. GIPHY API (V1) PROVIDER
 * Documentation: https://developers.giphy.com/docs/api/endpoint
 */
class GiphyProvider extends GIFProvider {
  constructor(apiKey) {
    super('giphy');
    this.apiKey = apiKey || process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC';
    this.baseUrl = 'https://api.giphy.com/v1/gifs';
    this.timeoutMs = Number(process.env.GIF_FETCH_TIMEOUT_MS) || 1500;
  }

  isAvailable() {
    if (process.env.NODE_ENV === 'test' || process.env.OFFLINE_TEST === '1') {
      return false;
    }
    return super.isAvailable();
  }

  async trending(category = 'trend', limit = 18, offset = 0) {
    const categoryQueryMap = {
      trend: null,
      street: 'urban street',
      flirt: 'flirt kiss love',
      amore: 'love romance heart',
      spicy: 'spicy hot chili flame',
      reazioni: 'reaction',
      memes: 'memes',
      lol: 'lol laughing',
      notte: 'night aesthetic',
      cyberpunk: 'cyberpunk neon',
      anime: 'anime',
      music: 'hip hop music'
    };

    const q = categoryQueryMap[category.toLowerCase()];
    const endpoint = q 
      ? `${this.baseUrl}/search?api_key=${encodeURIComponent(this.apiKey)}&q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}&rating=pg-13`
      : `${this.baseUrl}/trending?api_key=${encodeURIComponent(this.apiKey)}&limit=${limit}&offset=${offset}&rating=pg-13`;

    return this._fetchAndNormalize(endpoint, category);
  }

  async search(query, limit = 18, offset = 0) {
    const endpoint = `${this.baseUrl}/search?api_key=${encodeURIComponent(this.apiKey)}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=pg-13`;
    return this._fetchAndNormalize(endpoint, 'search');
  }

  async _fetchAndNormalize(endpoint, category) {
    const response = await fetch(endpoint, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    if (!response.ok) {
      throw new Error(`Giphy API responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.data)) {
      throw new Error('Giphy API returned invalid data payload');
    }

    return data.data.map(item => this.normalizeResult(item, category));
  }

  normalizeResult(raw, category = 'trend') {
    const images = raw.images || {};
    const full = images.original || images.downsized || images.fixed_height || {};
    const small = images.fixed_height_small || images.preview_gif || full;

    return {
      id: `giphy_${raw.id || Math.random().toString(36).slice(2, 9)}`,
      title: raw.title || 'Street GIF',
      url: full.url || small.url,
      previewUrl: small.url || full.url,
      width: parseInt(full.width, 10) || 320,
      height: parseInt(full.height, 10) || 240,
      provider: 'giphy',
      category: category,
      tags: typeof raw.slug === 'string' ? raw.slug.split('-').filter(Boolean) : [],
      rating: raw.rating || 'pg-13',
      sourceUrl: raw.url || 'https://giphy.com'
    };
  }
}

/**
 * 3. STREET CURATED ZERO-FAILURE PROVIDER
 * Curated, verified, permanent image CDN URLs with 100% uptime guarantee
 */
class CuratedProvider extends GIFProvider {
  constructor() {
    super('curated');
    this.catalog = [
      // TREND
      {
        id: 'cur_trend_1',
        title: 'Lit Fire Flame',
        url: '/assets/gifs/flame.svg',
        previewUrl: '/assets/gifs/flame.svg',
        category: 'trend',
        tags: ['mindblown', 'shock', 'wow', 'fuoco', 'trend', 'flame', 'lit']
      },
      {
        id: 'cur_trend_2',
        title: 'Respect Salute Nod',
        url: '/assets/gifs/respect.svg',
        previewUrl: '/assets/gifs/respect.svg',
        category: 'trend',
        tags: ['respect', 'nod', 'real', 'capito', 'approvo', 'salute']
      },
      {
        id: 'cur_trend_3',
        title: 'Cool Sunglasses Deal With It',
        url: '/assets/gifs/doge.svg',
        previewUrl: '/assets/gifs/doge.svg',
        category: 'trend',
        tags: ['cool', 'sunglasses', 'street', 'top', 'doge']
      },
      {
        id: 'cur_trend_4',
        title: 'Eating Popcorn Watching Drama',
        url: '/assets/gifs/popcorn.svg',
        previewUrl: '/assets/gifs/popcorn.svg',
        category: 'trend',
        tags: ['popcorn', 'drama', 'gossip', 'notte']
      },
      {
        id: 'cur_trend_5',
        title: 'Mind Blown Exploding Head',
        url: '/assets/gifs/mindblown.svg',
        previewUrl: '/assets/gifs/mindblown.svg',
        category: 'trend',
        tags: ['mindblown', 'shock', 'esplosione', 'bravo', 'respect']
      },

      // STREET
      {
        id: 'cur_street_1',
        title: 'Night Drive Tunnel Neon',
        url: '/assets/gifs/drive.svg',
        previewUrl: '/assets/gifs/drive.svg',
        category: 'street',
        tags: ['street', 'drive', 'auto', 'asfalto', 'notte']
      },
      {
        id: 'cur_street_2',
        title: 'Boombox Beat Street Style',
        url: '/assets/gifs/boombox.svg',
        previewUrl: '/assets/gifs/boombox.svg',
        category: 'street',
        tags: ['street', 'hiphop', 'music', 'boombox']
      },
      {
        id: 'cur_street_3',
        title: 'Urban Skater Kickflip',
        url: '/assets/gifs/skate.svg',
        previewUrl: '/assets/gifs/skate.svg',
        category: 'street',
        tags: ['street', 'skate', 'board', 'asfalto', 'urban']
      },
      {
        id: 'cur_street_4',
        title: 'Lit Fire Street',
        url: '/assets/gifs/flame.svg',
        previewUrl: '/assets/gifs/flame.svg',
        category: 'street',
        tags: ['street', 'fire', 'flame', 'fuoco', 'art']
      },

      // REAZIONI
      {
        id: 'cur_reaz_1',
        title: 'Shocked Surprised Face',
        url: '/assets/gifs/shock.svg',
        previewUrl: '/assets/gifs/shock.svg',
        category: 'reazioni',
        tags: ['reazione', 'shock', 'occhi', 'incredulo']
      },
      {
        id: 'cur_reaz_2',
        title: 'Facepalm Exhausted',
        url: '/assets/gifs/facepalm.svg',
        previewUrl: '/assets/gifs/facepalm.svg',
        category: 'reazioni',
        tags: ['reazione', 'facepalm', 'no', 'disperato']
      },
      {
        id: 'cur_reaz_3',
        title: 'Mind Blown Shock',
        url: '/assets/gifs/mindblown.svg',
        previewUrl: '/assets/gifs/mindblown.svg',
        category: 'reazioni',
        tags: ['reazione', 'mindblown', 'wow', 'esplosione']
      },
      {
        id: 'cur_reaz_4',
        title: 'Respect Respect Salute',
        url: '/assets/gifs/respect.svg',
        previewUrl: '/assets/gifs/respect.svg',
        category: 'reazioni',
        tags: ['reazione', 'respect', 'onore', 'approvo']
      },

      // MEMES & LOL
      {
        id: 'cur_lol_1',
        title: 'Laughing Dead LOL',
        url: '/assets/gifs/lol.svg',
        previewUrl: '/assets/gifs/lol.svg',
        category: 'lol',
        tags: ['lol', 'laugh', 'ridere', 'meme']
      },
      {
        id: 'cur_lol_2',
        title: 'Wheezing Laugh Tear',
        url: '/assets/gifs/wheeze.svg',
        previewUrl: '/assets/gifs/wheeze.svg',
        category: 'lol',
        tags: ['lol', 'wheeze', 'ridere', 'muoio']
      },
      {
        id: 'cur_memes_1',
        title: 'Roll Safe Smart Think',
        url: '/assets/gifs/smart.svg',
        previewUrl: '/assets/gifs/smart.svg',
        category: 'memes',
        tags: ['meme', 'smart', 'think', 'genio']
      },
      {
        id: 'cur_memes_2',
        title: 'Deal With It Cool Doge',
        url: '/assets/gifs/doge.svg',
        previewUrl: '/assets/gifs/doge.svg',
        category: 'memes',
        tags: ['meme', 'doge', 'cool', 'sunglasses']
      },

      // NOTTE & CYBERPUNK
      {
        id: 'cur_notte_1',
        title: 'Moonlight Alley Neon Night',
        url: '/assets/gifs/moon.svg',
        previewUrl: '/assets/gifs/moon.svg',
        category: 'notte',
        tags: ['notte', 'luna', 'moon', 'dark', 'pioggia']
      },
      {
        id: 'cur_notte_2',
        title: 'Midnight Smoke Dark City',
        url: '/assets/gifs/smoke.svg',
        previewUrl: '/assets/gifs/smoke.svg',
        category: 'notte',
        tags: ['notte', 'smoke', 'fumo', 'dark']
      },
      {
        id: 'cur_cyber_1',
        title: 'Cyberpunk Glitch Bolt',
        url: '/assets/gifs/cyber.svg',
        previewUrl: '/assets/gifs/cyber.svg',
        category: 'cyberpunk',
        tags: ['cyberpunk', 'cyber', 'glitch', 'bolt', 'future', 'neon']
      },

      // ANIME & MUSIC
      {
        id: 'cur_anime_1',
        title: 'Anime Sparkle Vibe Night',
        url: '/assets/gifs/anime.svg',
        previewUrl: '/assets/gifs/anime.svg',
        category: 'anime',
        tags: ['anime', 'sparkle', 'notte', 'vibe', 'chill']
      },
      {
        id: 'cur_music_1',
        title: 'DJ Vinyl Scratching Beat',
        url: '/assets/gifs/vinyl.svg',
        previewUrl: '/assets/gifs/vinyl.svg',
        category: 'music',
        tags: ['music', 'vinyl', 'dj', 'bass', 'beat', '808']
      },
      {
        id: 'cur_music_2',
        title: 'Boombox Beat Stereo 808',
        url: '/assets/gifs/boombox.svg',
        previewUrl: '/assets/gifs/boombox.svg',
        category: 'music',
        tags: ['music', 'boombox', 'hiphop', 'beat']
      },

      // FLIRT
      {
        id: 'cur_flirt_1',
        title: 'Neon Kiss Glow',
        url: '/assets/gifs/kiss.svg',
        previewUrl: '/assets/gifs/kiss.svg',
        category: 'flirt',
        tags: ['flirt', 'kiss', 'bacio', 'neon', 'love', 'glow']
      },
      {
        id: 'cur_flirt_2',
        title: 'Wink Glint Spark',
        url: '/assets/gifs/wink.svg',
        previewUrl: '/assets/gifs/wink.svg',
        category: 'flirt',
        tags: ['flirt', 'wink', 'occhiolino', 'glint', 'spark']
      },
      {
        id: 'cur_flirt_3',
        title: 'Sweet Violet Devil',
        url: '/assets/gifs/devil.svg',
        previewUrl: '/assets/gifs/devil.svg',
        category: 'flirt',
        tags: ['flirt', 'devil', 'diavoletto', 'sweet', 'violet']
      },
      {
        id: 'cur_flirt_4',
        title: 'Neon Rose Blooming',
        url: '/assets/gifs/rose.svg',
        previewUrl: '/assets/gifs/rose.svg',
        category: 'flirt',
        tags: ['flirt', 'rose', 'rosa', 'neon', 'fiore', 'crimson']
      },
      {
        id: 'cur_flirt_5',
        title: 'Flirt Sparkle Glitter',
        url: '/assets/gifs/sparkle.svg',
        previewUrl: '/assets/gifs/sparkle.svg',
        category: 'flirt',
        tags: ['flirt', 'sparkle', 'scintilla', 'glitter', 'gold']
      },

      // AMORE
      {
        id: 'cur_amore_1',
        title: 'Heart Pulse Double Beat',
        url: '/assets/gifs/heart_pulse.svg',
        previewUrl: '/assets/gifs/heart_pulse.svg',
        category: 'amore',
        tags: ['amore', 'heart', 'cuore', 'pulse', 'love', 'beat']
      },
      {
        id: 'cur_amore_2',
        title: 'Twin Hearts Orbit',
        url: '/assets/gifs/hearts.svg',
        previewUrl: '/assets/gifs/hearts.svg',
        category: 'amore',
        tags: ['amore', 'hearts', 'cuori', 'orbit', 'pink', 'love']
      },
      {
        id: 'cur_amore_3',
        title: 'Secret Love Letter',
        url: '/assets/gifs/love_letter.svg',
        previewUrl: '/assets/gifs/love_letter.svg',
        category: 'amore',
        tags: ['amore', 'letter', 'lettera', 'segreto', 'love', 'envelope']
      },
      {
        id: 'cur_amore_4',
        title: 'Cupid Neon Arrow',
        url: '/assets/gifs/cupid.svg',
        previewUrl: '/assets/gifs/cupid.svg',
        category: 'amore',
        tags: ['amore', 'cupid', 'cupido', 'freccia', 'arrow', 'bolt']
      },
      {
        id: 'cur_amore_5',
        title: 'Street Love Lock',
        url: '/assets/gifs/love_lock.svg',
        previewUrl: '/assets/gifs/love_lock.svg',
        category: 'amore',
        tags: ['amore', 'lock', 'lucchetto', 'street', 'love', 'gold']
      },

      // SPICY
      {
        id: 'cur_spicy_1',
        title: 'Red Hot Chili',
        url: '/assets/gifs/chili.svg',
        previewUrl: '/assets/gifs/chili.svg',
        category: 'spicy',
        tags: ['spicy', 'chili', 'peperoncino', 'hot', 'fire', 'rosso']
      },
      {
        id: 'cur_spicy_2',
        title: 'Purple Plasma Flame',
        url: '/assets/gifs/purple_flame.svg',
        previewUrl: '/assets/gifs/purple_flame.svg',
        category: 'spicy',
        tags: ['spicy', 'flame', 'purple', 'plasma', 'heat', 'viola']
      },
      {
        id: 'cur_spicy_3',
        title: 'Sweet Danger Cherries',
        url: '/assets/gifs/cherries.svg',
        previewUrl: '/assets/gifs/cherries.svg',
        category: 'spicy',
        tags: ['spicy', 'cherries', 'ciliegie', 'danger', 'ruby', 'sweet']
      }
    ];
  }

  async trending(category = 'trend', limit = 18, offset = 0) {
    const catLower = (category || 'trend').toLowerCase();
    const filtered = catLower === 'trend'
      ? this.catalog
      : this.catalog.filter(item => item.category === catLower);

    const pool = filtered.length > 0 ? filtered : this.catalog;
    const sliced = pool.slice(offset, offset + limit);
    return sliced.map(item => this.normalizeResult(item, catLower));
  }

  async search(query, limit = 18, offset = 0) {
    const qLower = (query || '').toLowerCase().trim();
    if (!qLower) return this.trending('trend', limit, offset);

    const matches = this.catalog.filter(item => {
      if (item.title.toLowerCase().includes(qLower)) return true;
      if (item.category.toLowerCase().includes(qLower)) return true;
      if (item.tags.some(t => t.toLowerCase().includes(qLower))) return true;
      return false;
    });

    const pool = matches.length > 0 ? matches : this.catalog.slice(0, 6);
    return pool.slice(offset, offset + limit).map(item => this.normalizeResult(item, 'search'));
  }

  normalizeResult(item, category = 'trend') {
    const isTest = process.env.NODE_ENV === 'test';
    const origin = process.env.PUBLIC_URL || (isTest ? `http://localhost:${process.env.PORT || 3000}` : '');
    const resolveUrl = (u) => {
      if (!u) return u;
      if (u.startsWith('http://') || u.startsWith('https://')) return u;
      return origin ? `${origin}${u}` : u;
    };
    return {
      id: item.id,
      title: item.title,
      url: resolveUrl(item.url),
      previewUrl: resolveUrl(item.previewUrl || item.url),
      width: 320,
      height: 240,
      provider: 'curated',
      category: item.category || category,
      tags: item.tags || [],
      rating: 'g',
      sourceUrl: origin ? `${origin}/assets/gifs` : '/assets/gifs'
    };
  }
}

/**
 * GIF SERVICE ORCHESTRATOR & RESILIENT FALLBACK MANAGER
 */
class GIFService {
  constructor(providers = null) {
    this.providers = providers || [
      new TenorProvider(),
      new GiphyProvider(),
      new CuratedProvider()
    ];

    // In-Memory Volatile TTL Cache: key -> { data, expiresAt }
    this.cache = new Map();
    this.CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    // Clean expired cache entries every 2 minutes
    this.cleanupTimer = setInterval(() => this._purgeExpiredCache(), 2 * 60 * 1000);
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();

    this.categories = Object.freeze([
      { id: 'trend', label: 'Trend', emoji: '🔥' },
      { id: 'street', label: 'Street', emoji: '🏙️' },
      { id: 'flirt', label: 'Flirt', emoji: '💋' },
      { id: 'amore', label: 'Amore', emoji: '💖' },
      { id: 'spicy', label: 'Spicy', emoji: '🌶️' },
      { id: 'reazioni', label: 'Reazioni', emoji: '👀' },
      { id: 'memes', label: 'Memes', emoji: '💀' },
      { id: 'lol', label: 'LOL', emoji: '😂' },
      { id: 'notte', label: 'Notte', emoji: '🌙' },
      { id: 'cyberpunk', label: 'Cyberpunk', emoji: '⚡' },
      { id: 'anime', label: 'Anime', emoji: '✨' },
      { id: 'music', label: 'Music', emoji: '🎧' }
    ]);
  }

  _purgeExpiredCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  _getCache(key) {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  _setCache(key, data) {
    if (this.cache.size >= 300) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL_MS
    });
  }

  /**
   * Get trending GIFs with multi-provider fallback & in-RAM cache
   */
  async getTrending({ category = 'trend', limit = 18, offset = 0 } = {}) {
    const cacheKey = `trending:${category.toLowerCase()}:${limit}:${offset}`;
    const cached = this._getCache(cacheKey);
    if (cached) return { ok: true, cached: true, ...cached };

    let lastError = null;

    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue;

      try {
        const items = await provider.trending(category, limit, offset);
        if (Array.isArray(items) && items.length > 0) {
          provider.recordSuccess();
          const result = {
            provider: provider.name,
            category,
            count: items.length,
            items
          };
          this._setCache(cacheKey, result);
          return { ok: true, cached: false, ...result };
        }
      } catch (err) {
        provider.recordFailure();
        lastError = err;
      }
    }

    // Ultimate fallback: return CuratedProvider directly
    const curated = this.providers.find(p => p.name === 'curated') || new CuratedProvider();
    const fallbackItems = await curated.trending(category, limit, offset);
    return {
      ok: true,
      cached: false,
      provider: 'curated_fallback',
      category,
      count: fallbackItems.length,
      items: fallbackItems,
      warning: lastError ? 'PROVIDER_FALLBACK' : null
    };
  }

  /**
   * Search GIFs with multi-provider fallback & in-RAM cache
   */
  async search({ query = '', limit = 18, offset = 0 } = {}) {
    const sanitized = (query || '').trim();
    if (!sanitized) {
      return this.getTrending({ category: 'trend', limit, offset });
    }

    const cacheKey = `search:${sanitized.toLowerCase()}:${limit}:${offset}`;
    const cached = this._getCache(cacheKey);
    if (cached) return { ok: true, cached: true, ...cached };

    let lastError = null;

    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue;

      try {
        const items = await provider.search(sanitized, limit, offset);
        if (Array.isArray(items) && items.length > 0) {
          provider.recordSuccess();
          const result = {
            provider: provider.name,
            query: sanitized,
            count: items.length,
            items
          };
          this._setCache(cacheKey, result);
          return { ok: true, cached: false, ...result };
        }
      } catch (err) {
        provider.recordFailure();
        lastError = err;
      }
    }

    // Ultimate fallback to curated
    const curated = this.providers.find(p => p.name === 'curated') || new CuratedProvider();
    const fallbackItems = await curated.search(sanitized, limit, offset);
    return {
      ok: true,
      cached: false,
      provider: 'curated_fallback',
      query: sanitized,
      count: fallbackItems.length,
      items: fallbackItems,
      warning: lastError ? 'PROVIDER_FALLBACK' : null
    };
  }

  getCategories(options = {}) {
    if (options && options.legacy) {
      return this.categories.filter(c => ['trend', 'street', 'reazioni', 'memes', 'lol', 'notte', 'cyberpunk', 'anime', 'music'].includes(c.id));
    }
    return this.categories;
  }

  getProvidersStatus() {
    return this.providers.map(p => ({
      name: p.name,
      available: p.isAvailable(),
      consecutiveFailures: p.consecutiveFailures,
      circuitOpenUntil: p.circuitOpenUntil
    }));
  }
}

// Global Singleton Instance
const defaultGifService = new GIFService();

module.exports = {
  GIFProvider,
  TenorProvider,
  GiphyProvider,
  CuratedProvider,
  GIFService,
  defaultGifService
};
