import type { CliOptions } from "./config/types";

export function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    command: "csv",
    dryRun: false,
    preview: false,
    force: false,
    skipJitter: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--worker") options.command = "worker";
    else if (arg === "--test-dashboard") options.command = "test-dashboard";
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--preview") options.preview = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--skip-jitter") options.skipJitter = true;
    else if (arg === "--leads") {
      options.leadsPath = argv[i + 1];
      i += 1;
    } else if (arg === "--limit") {
      options.limit = Number(argv[i + 1]);
      i += 1;
    }
  }

  return options;
}
