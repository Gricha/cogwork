import { z } from "zod";
import { PathSchema, ScalarSchema } from "./primitives";
import type { Condition } from "../types";

// Base conditions (non-recursive)
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

// Recursive condition type with combinators
// Using z.lazy for recursive definition
export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    BaseConditionSchema,
    z.object({ and: z.array(ConditionSchema) }).strict(),
    z.object({ or: z.array(ConditionSchema) }).strict(),
    z.object({ not: ConditionSchema }).strict(),
  ]),
);

export { BaseConditionSchema };
