import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Images are optional, but when present `alt` is required — empty alt only if marked decorative. */
const image = z
  .object({
    src: z.string(),
    alt: z.string(),
    decorative: z.boolean().default(false),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .refine((i) => i.decorative || i.alt.trim().length > 0, { message: 'Image needs alt text (or decorative: true)' });

const categories = defineCollection({
  loader: file('src/content/categories.json'),
  schema: z.object({
    name: z.string(),
    intro: z.string(),
    order: z.number(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/services' }),
  schema: z.object({
    title: z.string(),
    category: reference('categories'),
    summary: z.string().max(220),
    featuredOnHome: z.boolean().default(false),
    order: z.number().default(100),
    image: image.optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().max(160).optional(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});

const staff = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/staff' }),
  schema: z.object({
    name: z.string(),
    credentials: z.string().optional(),
    role: z.string(),
    order: z.number().default(100),
    photo: image.optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    publishedAt: z.coerce.date(),
    author: reference('staff'),
    draft: z.boolean().default(false),
    cover: image.optional(),
  }),
});

/** Only entries with consentRecorded: true and a source are ever rendered. */
const testimonials = defineCollection({
  loader: file('src/content/testimonials.json'),
  schema: z.object({
    author: z.string(),
    body: z.string(),
    rating: z.number().int().min(1).max(5),
    source: z.string(),
    sourceUrl: z.string().url().optional(),
    reviewDate: z.coerce.date(),
    consentRecorded: z.boolean(),
  }),
});

export const collections = { categories, services, staff, blog, testimonials };
