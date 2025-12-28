import { z } from "zod";
import { PathSchema, ScalarSchema } from "./primitives";

export const EffectSchema = z.union([
  z.object({ consume: PathSchema }).strict(),
  z.object({ set: z.tuple([PathSchema, ScalarSchema]) }).strict(),
  z.object({ markOnce: PathSchema }).strict(),
  z.object({ addItem: z.string() }).strict(),
  z.object({ removeItem: z.string() }).strict(),
  z.object({ add: z.tuple([PathSchema, z.number()]) }).strict(),
  z.object({ subtract: z.tuple([PathSchema, z.number()]) }).strict(),
]);
