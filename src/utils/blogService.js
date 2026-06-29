import { posts as staticPosts } from '../data/posts';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const CACHE_KEY = 'ojon_blog_posts_cache_v3';
const PINNED_SLUG = 'leitura-de-fio-metodo-exclusivo-studio-do-jon';

let memoryCache = null;

// Pin a post to the top of the list
export const pinPost = (list) => {
  const pinned = list.find(p => p.slug === PINNED_SLUG);
  if (!pinned) return list;
  const rest = list.filter(p => p.slug !== PINNED_SLUG);
  return [pinned, ...rest];
};

// Remove draft posts
export const filterDrafts = (list) => list.filter(p => p.status !== 'draft');

// Safely read sessionStorage
const getSessionCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

// Safely write sessionStorage
const setSessionCache = (data) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    // silent fail
  }
};

/**
 * Synchronously returns the current post list.
 * Priority: memoryCache → sessionStorage → staticPosts bundle.
 * Never causes a loading state — used as useState initializer.
 */
export const getInitialPosts = () => {
  if (memoryCache) return memoryCache;

  const sessionData = getSessionCache();
  if (sessionData && sessionData.length > 0) {
    memoryCache = sessionData;
    return memoryCache;
  }

  // First visit: use the JS bundle posts directly
  const result = pinPost(filterDrafts(staticPosts));
  memoryCache = result;
  return memoryCache;
};

/**
 * Asynchronously enriches the post list with Firestore dynamic posts.
 *
 * KEY RULES:
 * 1. staticPosts (JS bundle) is ALWAYS the baseline — every post in the bundle
 *    will appear regardless of network conditions or CDN/SW cache state.
 * 2. Firestore posts can ADD new posts or OVERRIDE static ones (if published).
 *    They can never hide static posts.
 * 3. If the result would have fewer posts than the current cache, we keep the
 *    cache. This prevents a bad Firestore response from wiping the UI.
 */
export const fetchLatestPosts = async () => {
  // Step 1: Seed the map with ALL static posts from the current JS bundle.
  const mergedMap = new Map();
  staticPosts.forEach(post => {
    if (post.slug) mergedMap.set(post.slug, post);
  });

  // Step 2: Fetch Firestore and let published dynamic posts override statics.
  if (db) {
    try {
      const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      snap.forEach((doc) => {
        const post = { id: doc.id, ...doc.data() };
        if (post.slug && post.status !== 'draft') {
          mergedMap.set(post.slug, post);
        }
      });
    } catch (err) {
      console.warn('Firestore: erro ao carregar posts dinâmicos:', err);
    }
  }

  const result = pinPost(filterDrafts(Array.from(mergedMap.values())));

  // Step 3: Guard — never update cache with fewer posts than what we already have.
  const currentCache = getSessionCache();
  if (!currentCache || result.length >= currentCache.length) {
    memoryCache = result;
    setSessionCache(result);
  } else {
    console.warn(
      `fetchLatestPosts: resultado (${result.length}) < cache atual (${currentCache.length}). Cache preservado.`
    );
    memoryCache = currentCache;
  }

  return memoryCache;
};
