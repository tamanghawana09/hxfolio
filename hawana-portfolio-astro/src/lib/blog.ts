import { getCollection } from 'astro:content';

export const BLOG_PAGE_SIZE = 5;

export async function getBlogPosts() {
  return (await getCollection('blog')).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id),
  );
}
