import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { config, ensureDir } from "../config/env";
import type { DashboardLead, DashboardLeadStatus } from "../api/types";

const STORE_PATH = path.resolve(process.cwd(), "dashboard_state.json");

interface DashboardStore {
  leads: DashboardLead[];
}

const seedLeads: DashboardLead[] = [
  {
    id: "lead-bloemenhuis-van-dijk",
    company_name: "Bloemenhuis Van Dijk",
    email: "iris.vandijk@example.com",
    industry: "independent florist",
    language_preference: "nl",
    status: "PENDING",
  },
  {
    id: "lead-nordic-outdoor",
    company_name: "Nordic Outdoor Co",
    email: "ops@nordic-outdoor.example",
    industry: "outdoor retail",
    language_preference: "en",
    website: "https://nordic-outdoor.example",
    status: "UNCONTACTED",
  },
  {
    id: "lead-atelier-keramiek",
    company_name: "Atelier Keramiek",
    email: "hello@atelierkeramiek.example",
    industry: "ceramics studio",
    language_preference: "nl",
    status: "PENDING",
  },
  {
    id: "lead-harbor-logistics",
    company_name: "Harbor & Co Logistics",
    email: "contact@harborco.example",
    industry: "regional logistics",
    language_preference: "en",
    status: "UNCONTACTED",
  },
  {
    id: "lead-gouden-korrel",
    company_name: "Bakkerij De Gouden Korrel",
    email: "info@goudenkorrel.example",
    industry: "artisan bakery",
    language_preference: "nl",
    status: "PENDING",
  },
  {
    id: "lead-lumen-studio",
    company_name: "Lumen Studio Lighting",
    email: "studio@lumenlighting.example",
    industry: "interior lighting",
    language_preference: "en",
    website: "https://www.allbirds.com",
    status: "UNCONTACTED",
  },
];

function readStore(): DashboardStore {
  if (!fs.existsSync(STORE_PATH)) {
    return { leads: seedLeads.map((lead) => ({ ...lead })) };
  }
  const raw = fs.readFileSync(STORE_PATH, "utf8");
  if (!raw.trim()) return { leads: seedLeads.map((lead) => ({ ...lead })) };
  const parsed = JSON.parse(raw) as DashboardStore;
  return { leads: Array.isArray(parsed.leads) ? parsed.leads : seedLeads.map((lead) => ({ ...lead })) };
}

function writeStore(store: DashboardStore): void {
  ensureDir(path.dirname(STORE_PATH));
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
}

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function unauthorized(res: http.ServerResponse): void {
  json(res, 401, { error: "Unauthorized" });
}

function isAuthorized(req: http.IncomingMessage): boolean {
  const expected = config.dashboardApiKey;
  if (!expected) return true;
  const header = req.headers.authorization ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const apiKey = String(req.headers["x-api-key"] ?? "").trim();
  return bearer === expected || apiKey === expected;
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function startMockDashboard(port = config.dashboardMockPort): http.Server {
  if (!fs.existsSync(STORE_PATH)) {
    writeStore(readStore());
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
    const method = req.method ?? "GET";

    if (url.pathname === "/api/health") {
      json(res, 200, { ok: true, service: "jr-dashboard-mock" });
      return;
    }

    if (!isAuthorized(req)) {
      unauthorized(res);
      return;
    }

    if (method === "GET" && url.pathname === "/api/leads") {
      const store = readStore();
      const rawFilter = url.searchParams.getAll("status").join(",") || url.searchParams.get("status") || "";
      const allowed = rawFilter
        .split(",")
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean);
      const leads =
        allowed.length === 0
          ? store.leads
          : store.leads.filter((lead) => allowed.includes(lead.status));
      json(res, 200, { leads });
      return;
    }

    const leadMatch = url.pathname.match(/^\/api\/leads\/([^/]+)$/);
    if (leadMatch && (method === "PATCH" || method === "PUT")) {
      const id = decodeURIComponent(leadMatch[1] ?? "");
      const store = readStore();
      const lead = store.leads.find((item) => item.id === id);
      if (!lead) {
        json(res, 404, { error: `Lead ${id} not found` });
        return;
      }
      const raw = await readBody(req);
      const patch = raw.trim() ? (JSON.parse(raw) as Record<string, unknown>) : {};
      const nextStatus = String(patch.status ?? lead.status).toUpperCase() as DashboardLeadStatus;
      lead.status = nextStatus === "SENT" ? "CONTACTED" : nextStatus;
      if (typeof patch.subject === "string") lead.subject = patch.subject;
      if (typeof patch.contacted_at === "string") lead.contacted_at = patch.contacted_at;
      if (typeof patch.error === "string" || typeof patch.error_reason === "string") {
        lead.error = String(patch.error ?? patch.error_reason);
      }
      writeStore(store);
      json(res, 200, { lead });
      return;
    }

    if (leadMatch && method === "GET") {
      const id = decodeURIComponent(leadMatch[1] ?? "");
      const lead = readStore().leads.find((item) => item.id === id);
      if (!lead) {
        json(res, 404, { error: `Lead ${id} not found` });
        return;
      }
      json(res, 200, { lead });
      return;
    }

    json(res, 404, { error: "Not found" });
  });

  server.listen(port, "0.0.0.0");
  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.log(`Mock dashboard already running on port ${port}`);
      return;
    }
    throw error;
  });
  return server;
}

export async function dashboardIsReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${config.dashboardApiUrl.replace(/\/+$/, "")}/api/health`, {
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

if (require.main === module) {
  startMockDashboard();
  console.log(`Mock dashboard: http://127.0.0.1:${config.dashboardMockPort}/api/leads`);
}
