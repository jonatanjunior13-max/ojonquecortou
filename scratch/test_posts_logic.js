import { posts } from '../src/data/posts.js';

console.log('Total static posts:', posts.length);

const pinnedSlug = 'leitura-de-fio-metodo-exclusivo-studio-do-jon';
const pinPost = (list) => {
  const pinned = list.find(p => p.slug === pinnedSlug);
  if (!pinned) {
    console.log('Pinned post NOT found!');
    return list;
  }
  const rest = list.filter(p => p.slug !== pinnedSlug);
  return [pinned, ...rest];
};

const initialPosts = posts.filter(p => p.status !== 'draft');
console.log('After draft filter:', initialPosts.length);

const pinnedPosts = pinPost(initialPosts);
console.log('After pinning:', pinnedPosts.length);
console.log('First post slug:', pinnedPosts[0]?.slug);
console.log('First post title:', pinnedPosts[0]?.title);

// Simulate merging with empty db posts
const dbPosts = []; // empty
const merged = [...dbPosts, ...posts].filter(p => p.status !== 'draft');
const finalPosts = pinPost(merged);
console.log('Merged empty db final posts length:', finalPosts.length);
console.log('Merged empty db first post slug:', finalPosts[0]?.slug);

// Simulate merging with the 2 DB posts
const mockDbPosts = [
  { id: '1', slug: 'segredos-finalizacao-perfeita-cachos', title: 'Os segredos da finalização perfeita para cachos definidos e sem frizz' },
  { id: '2', slug: 'porosidade-capilar-rendimento-leave-in', title: 'Porosidade Capilar: O Que É e Como Ela Afeta o Rendimento do Seu Leave-In' }
];
const mergedWithDb = [...mockDbPosts, ...posts].filter(p => p.status !== 'draft');
const finalWithDb = pinPost(mergedWithDb);
console.log('Merged with DB final posts length:', finalWithDb.length);
console.log('Merged with DB first post slug:', finalWithDb[0]?.slug);
console.log('Merged with DB second post slug:', finalWithDb[1]?.slug);
