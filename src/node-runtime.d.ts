declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  exitCode?: number;
};

declare module "node:fs/promises" {
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readFile(path: string, options: { encoding: "utf8" }): Promise<string>;
}

declare module "node:path" {
  export function dirname(path: string): string;
}

declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(location?: string);
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }

  export type RunResult = {
    changes: number;
    lastInsertRowid: number | bigint;
  };

  export interface StatementSync {
    all(...anonymousParameters: unknown[]): unknown[];
    get(...anonymousParameters: unknown[]): unknown | undefined;
    run(...anonymousParameters: unknown[]): RunResult;
  }
}
