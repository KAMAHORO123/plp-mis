import { z } from "zod";

// The homepage slideshow: each slide is a photo with a two-line headline, a sentence and a button.
// Administrators edit it in the Content studio; an empty list means "use the built-in slides".
// A slide's image is either one of the website's own photos (/images/plp/...) or a PNG/JPEG an administrator uploaded.
const line = (max) => z.string().trim().min(1).max(max);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const builtIn = /^\/images\/plp\/[a-z0-9/_-]+\.(webp|jpg|jpeg|png)$/;

const slide = z
  .object({
    image: z.string().refine((v) => uuid.test(v) || builtIn.test(v), "Choose a photo for every slide"),
    position: z.string().regex(/^center (\d|[1-9]\d|100)%$/, "Choose which part of the photo to show").default("center 50%"),
    name: line(40),
    title: line(60),
    text: z.string().trim().max(200).default(""),
    cta: line(30),
    to: z
      .string()
      .trim()
      .max(500)
      .refine((v) => (/^\/(?!\/)/.test(v) || /^https:\/\//.test(v)) && !/[\\\s]/.test(v), "Button links must be a site path like /about or an https:// link"),
  })
  .strict();

export const heroSlidesSchema = z
  .object({ slides: z.array(slide).min(1, "Keep at least one slide").max(8, "Use at most 8 slides") })
  .strict();

/** Uploaded image ids used by the slides (built-in photos are left out). */
export const uploadedImages = (slides) => [...new Set(slides.map((s) => s.image).filter((v) => uuid.test(v)))];
