import { z } from "zod";

// The landing-page fun corner: a short peace & history quiz and a rotating quote card.
// Administrators edit it; the public site reads it. An empty value means "use the built-in content".
const line = (max) => z.string().trim().min(1).max(max);
const source = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || (/^https:\/\/[^\s\\]+$/.test(v)), "Sources must be https:// links")
  .default("");

const question = z
  .object({
    category: line(60),
    question: line(300),
    options: z.array(line(160)).min(2).max(4),
    answer: z.number().int().min(0),
    detail: line(600),
    source,
    sourceName: z.string().trim().max(80).default(""),
  })
  .strict()
  .refine((q) => q.answer < q.options.length, "The correct answer must be one of the options")
  .refine((q) => new Set(q.options.map((o) => o.toLowerCase())).size === q.options.length, "Options must be different");

const quote = z
  .object({
    text: line(300),
    author: line(80),
    context: z.string().trim().max(200).default(""),
    source,
    sourceName: z.string().trim().max(80).default(""),
  })
  .strict();

export const funCornerSchema = z
  .object({
    trivia: z.array(question).min(1, "Add at least one question").max(12),
    quotes: z.array(quote).min(1, "Add at least one quote").max(12),
  })
  .strict();
