import "server-only";

import { z } from "zod";

const RuntimeEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    AIDERA_DATA_MODE: z.enum(["prototype", "live"]).optional(),
    AIDERA_BRIDGE_URL: z
      .url()
      .refine((value) => {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
      }, "Bridge URL must use HTTP(S) without embedded credentials")
      .optional(),
    AIDERA_BRIDGE_TOKEN: z.string().min(1).optional(),
  })
  .superRefine((environment, context) => {
    const dataMode = environment.AIDERA_DATA_MODE
      ?? (environment.NODE_ENV === "production" ? "live" : "prototype");

    if (environment.NODE_ENV === "production" && dataMode === "prototype") {
      context.addIssue({
        code: "custom",
        message: "Prototype data cannot run in production",
        path: ["AIDERA_DATA_MODE"],
      });
    }

    if (dataMode === "live") {
      if (!environment.AIDERA_BRIDGE_URL) {
        context.addIssue({
          code: "custom",
          message: "AIDERA_BRIDGE_URL is required in live mode",
          path: ["AIDERA_BRIDGE_URL"],
        });
      }

      if (!environment.AIDERA_BRIDGE_TOKEN) {
        context.addIssue({
          code: "custom",
          message: "AIDERA_BRIDGE_TOKEN is required in live mode",
          path: ["AIDERA_BRIDGE_TOKEN"],
        });
      }
    }
  });

export interface AideraServerEnv {
  nodeEnv: "development" | "test" | "production";
  dataMode: "prototype" | "live";
  bridgeUrl: string | null;
  bridgeToken: string | null;
}

let cachedEnvironment: AideraServerEnv | undefined;

export function getServerEnv(): AideraServerEnv {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  const parsed = RuntimeEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    AIDERA_DATA_MODE: process.env.AIDERA_DATA_MODE,
    AIDERA_BRIDGE_URL: process.env.AIDERA_BRIDGE_URL,
    AIDERA_BRIDGE_TOKEN: process.env.AIDERA_BRIDGE_TOKEN,
  });
  const dataMode = parsed.AIDERA_DATA_MODE
    ?? (parsed.NODE_ENV === "production" ? "live" : "prototype");

  cachedEnvironment = Object.freeze({
    nodeEnv: parsed.NODE_ENV,
    dataMode,
    bridgeUrl: parsed.AIDERA_BRIDGE_URL ?? null,
    bridgeToken: parsed.AIDERA_BRIDGE_TOKEN ?? null,
  });

  return cachedEnvironment;
}

export function isPrototypeMode(): boolean {
  return getServerEnv().dataMode === "prototype";
}
