import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createAlter } from "./src/core/index.js";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);

const publicDir = path.join(
  __dirname,
  "public"
);

const port = Number(
  process.env.PORT || 8787
);

function loadEnv() {
  const envPath = path.join(
    __dirname,
    ".env"
  );

  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const line of fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)) {

    const value = line.trim();

    if (!value || value.startsWith("#")) {
      continue;
    }

    const separator = value.indexOf("=");

    if (separator < 1) {
      continue;
    }

    const key = value.slice(0, separator).trim();

    const envValue = value
      .slice(separator + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1");

    if (!(key in process.env)) {
      process.env[key] = envValue;
    }
  }
}

loadEnv();

const alter = createAlter();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(
  res,
  status,
  body,
  type = "application/json; charset=utf-8"
) {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  });

  res.end(body);
}

async function readBody(req) {
  let raw = "";

  for await (const chunk of req) {
    raw += chunk;
  }

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON request body.");
  }
}

function getHealth() {
  const status = alter.getStatus();

  return {
    ok: true,
    alter: "online",
    identity: alter.policy.identity,
    providers: status.providers,
    tools: status.tools,
    traceEntries: status.traceEntries
  };
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      return send(res, 204, "");
    }

    const url = new URL(
      req.url,
      `http://${req.headers.host}`
    );

    if (
      req.method === "GET" &&
      url.pathname === "/api/health"
    ) {
      return send(
        res,
        200,
        JSON.stringify(getHealth())
      );
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/status"
    ) {
      return send(
        res,
        200,
        JSON.stringify(alter.getStatus())
      );
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/providers"
    ) {
      return send(
        res,
        200,
        JSON.stringify(
          await alter.providersHealth()
        )
      );
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/trace"
    ) {
      return send(
        res,
        200,
        JSON.stringify(alter.getTrace())
      );
    }

    if (
      req.method === "POST" &&
      url.pathname === "/api/chat"
    ) {
      const payload = await readBody(req);

      const result = await alter.run({
        request:
          payload.request ||
          payload.prompt ||
          "",

        messages:
          Array.isArray(payload.messages)
            ? payload.messages
            : undefined,

        capability:
          payload.capability || "chat",

        providerId:
          payload.providerId || null,

        system:
          payload.system || undefined,

        temperature:
          payload.temperature,

        maxTokens:
          payload.maxTokens
      });

      return send(
        res,
        result.ok ? 200 : 502,
        JSON.stringify(result)
      );
    }

    if (req.method !== "GET") {
      return send(
        res,
        405,
        JSON.stringify({
          error: "Method not allowed."
        })
      );
    }

    const requested = decodeURIComponent(
      url.pathname === "/"
        ? "/index.html"
        : url.pathname
    );

    const safe = path
      .normalize(requested)
      .replace(/^(\.\.[/\\])+/, "");

    const file = path.join(
      publicDir,
      safe
    );

    if (!file.startsWith(publicDir)) {
      return send(
        res,
        403,
        JSON.stringify({
          error: "Forbidden."
        })
     
