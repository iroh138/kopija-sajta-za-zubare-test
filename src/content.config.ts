import { defineCollection } from 'astro:content';
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

/** One Markdown file per service area; its sub-services are listed on the service page, not split into thin pages. */
const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/services' }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string().optional(),
    summary: z.string().max(240),
    subservices: z.array(z.string()).min(1),
    featuredOnHome: z.boolean().default(true),
    order: z.number().default(100),
    image: image.optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().max(160).optional(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    /** Editorial note, never rendered: e.g. medical text awaiting the doctor's review. */
    reviewStatus: z.string().optional(),
  }),
});

const staff = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/staff' }),
  schema: z.object({
    name: z.string(),
    honorific: z.string().optional(),
    credentials: z.string().optional(),
    role: z.string(),
    order: z.number().default(100),
    photo: image.optional(),
  }),
});

/** Only entries with consentRecorded: true and a source are ever rendered. */
const testimonials = defineCollection({
  loader: file('src/content/testimonials.json'),
  schema: z.object({
    author: z.string(),
    body: z.string(),
    rating: z.number().int().min(1).max(5).optional(),
    source: z.string(),
    sourceUrl: z.string().url().optional(),
    reviewDate: z.coerce.date().optional(),
    consentRecorded: z.boolean(),
    /** false = text is a paraphrase awaiting the patient's exact words; shown only in the preview build, labelled. */
    verbatim: z.boolean().default(true),
  }),
});

export const collections = { services, staff, testimonials };
