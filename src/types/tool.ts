import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface ToolDefinition<I = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodType<I>;
  inputJsonSchema: Record<string, unknown>;
  handler: (input: I) => Promise<unknown>;
}

export interface DefineToolSpec<S extends z.ZodType> {
  name: string;
  description: string;
  input: S;
  handler: (input: z.infer<S>) => Promise<unknown>;
}

export function defineTool<S extends z.ZodType>(
  spec: DefineToolSpec<S>,
): ToolDefinition<z.infer<S>> {
  const jsonSchema = zodToJsonSchema(spec.input, {
    target: "jsonSchema7",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  delete jsonSchema.$schema;

  return {
    name: spec.name,
    description: spec.description,
    inputSchema: spec.input,
    inputJsonSchema: jsonSchema,
    handler: spec.handler,
  };
}
