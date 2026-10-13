import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One Markdown file per work in src/content/works/. The file name becomes the URL:
// src/content/works/minecraft-cup-2026.md -> /works/minecraft-cup-2026/
const works = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    year: z.number(),
    // Shown as a small "year ・ category" line above the title; leave out to hide that line
    category: z.string().optional(),
    // true sets the title in the navigation font instead of the serif title font
    sansTitle: z.boolean().default(false),
    summary: z.string().optional(),
    // Paths are relative to public/, e.g. "/media/minecraft-cup-2026/cover.webp"
    // cover and video can be left out: public/media/<file name>/poster.jpg and main.mp4
    // (created by `npm run import-videos`) are picked up automatically.
    cover: z.string().optional(),
    video: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    // Competition entries: the competition (e.g. "Minecraft Cup 2025"), its theme that year, and awards received.
    // `title` is the name of our work.
    event: z.string().optional(),
    // Small line shown above the title on the work's own page only (not in lists or menus)
    titleLead: z.string().optional(),
    theme: z.string().optional(),
    awards: z.array(z.string()).default([]),
    // Commemorative photo; public/media/<file name>/photo.webp is picked up automatically
    photo: z.string().optional(),
    photoCaption: z.string().optional(),
    // draft: true shows a "準備中" card and does not generate a page
    draft: z.boolean().default(false),
    // Higher numbers are listed first; ties fall back to year
    order: z.number().default(0),
  }),
});

export const collections = { works };
