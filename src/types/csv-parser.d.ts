declare module "csv-parser" {
  import type { Transform } from "node:stream";

  interface Options {
    separator?: string;
    newline?: string;
    skipComments?: boolean | string;
    strict?: boolean;
    headers?: string[] | boolean;
    skipLines?: number;
    mapHeaders?: (args: { header: string; index: number }) => string | null;
    mapValues?: (args: { header: string; index: number; value: string }) => string;
  }

  function csvParser(options?: Options): Transform;
  export default csvParser;
}
