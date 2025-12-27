import { z } from "zod";

export const PathSchema = z.string().min(1);
export const ScalarSchema = z.union([z.string(), z.number(), z.boolean()]);
export const DirectionSchema = z.enum(["north", "south", "east", "west", "up", "down"]);
