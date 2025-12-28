import { z } from "zod";
import { PathSchema, ScalarSchema } from "./primitives";

const BaseConditionSchema = z.union([
  z.object({ eq: z.tuple([PathSchema, ScalarSchema]) }).strict(),
  z.object({ ne: z.tuple([PathSchema, ScalarSchema]) }).strict(),
  z.object({ gt: z.tuple([PathSchema, z.number()]) }).strict(),
  z.object({ gte: z.tuple([PathSchema, z.number()]) }).strict(),
  z.object({ lt: z.tuple([PathSchema, z.number()]) }).strict(),
  z.object({ lte: z.tuple([PathSchema, z.number()]) }).strict(),
  z.object({ truthy: PathSchema }).strict(),
  z.object({ falsy: PathSchema }).strict(),
  z.object({ has: PathSchema }).strict(),
  z.object({ lacks: PathSchema }).strict(),
  z.object({ present: PathSchema }).strict(),
  z.object({ absent: PathSchema }).strict(),
  z.object({ once: PathSchema }).strict(),
  z.object({ is_at: z.tuple([PathSchema, PathSchema]) }).strict(),
]);

type ConditionInput =
  | z.input<typeof BaseConditionSchema>
  | { and: ConditionInput[] }
  | { or: ConditionInput[] }
  | { not: ConditionInput };

export const ConditionSchema: z.ZodType<ConditionInput> = z.union([
  BaseConditionSchema,
  z.object({ and: z.array(z.lazy(() => ConditionSchema)) }).strict(),
  z.object({ or: z.array(z.lazy(() => ConditionSchema)) }).strict(),
  z.object({ not: z.lazy(() => ConditionSchema) }).strict(),
]);

export { BaseConditionSchema };
