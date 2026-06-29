import { posts as staticPosts } from '../data/posts';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const CACHE_KEY = 'ojon_blog_posts_cache_v2';
const PINNED_SLUG = 'leitura-de-fio-metodo-exclusivo-studio-do-jon';

let memoryCache = null;

// Helper to pin the specified post to the top of the list
export const pinPost = (list) => {
  const pinned = list.find(p => p.slug === PINNED_SLUG);
  if (!pinned) return list;
  const rest = list.filter(p => p.slug !== PINNED_SLUG);
  return [pinned, ...rest];
};

// Helper to filter out drafts
export const filterDrafts = (list) => {
  return list.filter(p => p.status !== 'draft');
};

// Helper to safely get item from sessionStorage
const getSessionCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Error reading from sessionStorage:', e);
    return null;
  }
};

// Helper to safely set item in sessionStorage
const setSessionCache = (data) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Error writing to sessionStorage:', e);
  }
};

// Synchronously get initial posts list (no flashing on navigation/F5)
export const getInitialPosts = () => {
  if (memoryCache) {
    return memoryCache;
  }
  const sessionData = getSessionCache();
  if (sessionData && sessionData.length > 0) {
    memoryCache = sessionData;
    return memoryCache;
  }
  // Fallback to static posts
  const filtered = filterDrafts(staticPosts);
  memoryCache = pinPost(filtered);
  return memoryCache;
};

// Asynchronously fetch latest posts from posts.json and Firestore, merge, deduplicate, and update cache
export const fetchLatestPosts = async () => {
  let freshStatic = staticPosts;
  try {
    const res = await fetch(`/posts.json?v=${Date.now()}`);
    if (res.ok) {
      freshStatic = await res.json();
    }
  } catch (e) {
    console.warn('Erro ao buscar posts.json na listagem:', e);
  }

  let list = [];
  if (db) {
    try {
      const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
    } catch (err) {
      console.warn('Erro ao carregar posts dinâmicos do Firestore:', err);
    }
  }

  // Deduplicate and merge: dynamic (Firestore) has priority, then posts.json, then staticPosts
  // We use a Map keyed by slug to ensure uniqueness and preserve order
  const mergedMap = new Map();

  // 1. Add dynamic posts first (putting them at the top)
  // Exclude Firestore drafts so they don't block the static published version of the same post
  list.filter(p => p.status !== 'draft').forEach(post => {
    if (post.slug) {
      mergedMap.set(post.slug, post);
    }
  });

  // 2. Add posts from /posts.json (or static fallback if fetch failed)
  freshStatic.forEach(post => {
    if (post.slug && !mergedMap.has(post.slug)) {
      mergedMap.set(post.slug, post);
    }
  });

  // 3. Safety net: always include current JS bundle's staticPosts.
  // Prevents disappearing posts when the deployed /posts.json is momentarily
  // outdated (e.g. deploy lag between bundle update and CDN cache flush).
  staticPosts.forEach(post => {
    if (post.slug && !mergedMap.has(post.slug)) {
      mergedMap.set(post.slug, post);
    }
  });

  const merged = Array.from(mergedMap.values());
  const filtered = filterDrafts(merged);
  const pinned = pinPost(filtered);

  // Update caches
  memoryCache = pinned;
  setSessionCache(pinned);

  return pinned;
};
