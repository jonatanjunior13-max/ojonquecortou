import { posts as staticPosts } from '../data/posts';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const CACHE_KEY = 'ojon_blog_posts_cache_v4';
const PINNED_SLUG = 'leitura-de-fio-metodo-exclusivo-studio-do-jon';

let memoryCache = null;

// Pin a post to the top of the list
export const pinPost = (list) => {
  const pinned = list.find(p => p.slug === PINNED_SLUG);
  if (!pinned) return list;
  const rest = list.filter(p => p.slug !== PINNED_SLUG);
  return [pinned, ...rest];
};

// Remove draft, archived, and deleted posts
export const filterDrafts = (list) => list.filter(p => p.status !== 'draft' && p.status !== 'archived' && p.status !== 'deleted');

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

  // First visit: use the JS bundle posts directly (tagging static posts)
  const preparedStatic = staticPosts.map(p => ({ ...p, isStatic: true }));
  const result = pinPost(filterDrafts(preparedStatic));
  memoryCache = result;
  return memoryCache;
};

/**
 * Asynchronously enriches the post list with Firestore dynamic posts.
 *
 * KEY RULES:
 * 1. staticPosts (JS bundle) is ALWAYS the baseline.
 * 2. Firestore posts can ADD new dynamic posts or OVERRIDE static ones.
 * 3. Static mirror docs in Firestore (doc ID `static_*` or `isStatic: true`) are
 *    only merged if their slug still exists in the current `staticPosts` bundle.
 * 4. All static bundle posts are tagged with `isStatic: true` so cache guards
 *    automatically purge removed statics across sessions without manual version bumps.
 */
export const fetchLatestPosts = async () => {
  const staticSlugs = new Set(staticPosts.map(p => p.slug).filter(Boolean));

  // Step 1: Seed the map with ALL static posts from the current JS bundle.
  const mergedMap = new Map();
  staticPosts.forEach(post => {
    if (post.slug) {
      mergedMap.set(post.slug, { ...post, isStatic: true });
    }
  });

  // Step 2: Fetch Firestore and let published dynamic posts (and active static overrides) merge.
  if (db) {
    try {
      const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const post = { id: docSnap.id, ...docSnap.data() };
        const isStaticDoc = docSnap.id.startsWith('static_') || !!post.isStatic;
        const isInactive = ['draft', 'archived', 'deleted'].includes(post.status);

        if (isInactive) return;

        if (isStaticDoc) {
          // Só mescla espelho estático do Firestore se o slug ainda existir no staticPosts atual
          if (post.slug && staticSlugs.has(post.slug)) {
            mergedMap.set(post.slug, { ...post, isStatic: true });
          }
        } else if (post.slug) {
          // Post verdadeiramente dinâmico (CMS / Admin)
          mergedMap.set(post.slug, post);
        }
      });
    } catch (err) {
      console.warn('Firestore: erro ao carregar posts dinâmicos:', err);
    }
  }

  const result = pinPost(filterDrafts(Array.from(mergedMap.values())));

  // Step 3: Guard — higieniza cache atual contra estáticos removidos antes de validar tamanho
  const currentCache = getSessionCache();
  const validCache = currentCache
    ? currentCache.filter(p => {
        const isStatic = (p.id && String(p.id).startsWith('static_')) || !!p.isStatic;
        if (isStatic) return staticSlugs.has(p.slug);
        return true;
      })
    : null;

  if (!validCache || result.length >= validCache.length) {
    memoryCache = result;
    setSessionCache(result);
  } else {
    console.warn(
      `fetchLatestPosts: resultado (${result.length}) < cache válido (${validCache.length}). Cache preservado.`
    );
    memoryCache = validCache;
  }

  return memoryCache;
};
