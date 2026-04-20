declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  exitCode?: number;
};

declare module "node:fs/promises" {
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readFile(path: string, options: { encoding: "utf8" }): Promise<string>;
  export function writeFile(path: string, data: string, options: { encoding: "utf8" } | "utf8"): Promise<void>;
}

declare module "node:path" {
  export function dirname(path: string): string;
  export function isAbsolute(path: string): boolean;
  export function relative(from: string, to: string): string;
  export function resolve(...paths: string[]): string;
  export const sep: string;
}
