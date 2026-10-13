import { existsSync, readdirSync } from 'node:fs';
import { getCollection } from 'astro:content';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

// Prefixes a site-absolute path ("/works/", "/media/logo.webp") with the configured base path.
export const url = (path = '/') => `${base}${path.startsWith('/') ? path : `/${path}`}`;

export const CONTACT_URL = 'https://forms.gle/gKj23jaX9un7VdwU7';

// Files found in public/media/<work>/ (main.mp4 and poster.jpg come from `npm run import-videos`),
// used when the work does not name its own.
const importedMedia = (workId: string, file: string) =>
  existsSync(`public/media/${workId}/${file}`) ? `/media/${workId}/${file}` : undefined;

// Every image in public/media/<work>/gallery/, in file-name order (01.webp, 02.webp, ...).
const importedGallery = (workId: string) => {
  const dir = `public/media/${workId}/gallery`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => /\.(webp|jpe?g|png)$/i.test(file))
    .sort()
    .map((file) => `/media/${workId}/gallery/${file}`);
};

export const getWorks = async () => {
  const works = await getCollection('works');
  return works
    .map((work) => ({
      ...work,
      data: {
        ...work.data,
        video: work.data.video ?? importedMedia(work.id, 'main.mp4'),
        cover: work.data.cover ?? importedMedia(work.id, 'poster.jpg'),
        photo: work.data.photo ?? importedMedia(work.id, 'photo.webp'),
        gallery: work.data.gallery.length > 0 ? work.data.gallery : importedGallery(work.id),
      },
    }))
    .sort((a, b) => b.data.order - a.data.order || b.data.year - a.data.year);
};
