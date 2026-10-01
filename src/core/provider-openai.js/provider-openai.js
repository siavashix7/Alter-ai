import { ProviderAdapter } from "./provider-adapter.js";

export class OpenAIProvider extends ProviderAdapter {
  constructor(config = {}) {
    super({
      id: "openai",
      name: "OpenAI",
      model: config.model || process.env.OPENAI_MODEL || null,
      capabilities: [
        "chat",
        "reasoning",
        "coding",
        "vision"
      ],
      enabled: config.enabled !== false
    });

    this.apiKey =
      config.apiKey ||
      process.env.OPENAI_API_KEY ||
      null;

    this.baseUrl =
      config.baseUrl ||
      process.env.OPENAI_BASE_URL ||
      "https://api.openai.com/v1";
  }

  async run(task = {}) {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    if (!this.model) {
      throw new Error("OPENAI_MODEL is not configured.");
    }

    const messages = Array.isArray(task.messages)
      ? task.messages
      : [
          {
            role: "user",
            content: String(task.request || "")
          }
        ];

    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: task.temperature ?? 0.4
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data?.error?.message ||
        `OpenAI request failed with HTTP ${response.status}`;

      const error = new Error(message);
      error.code = `HTTP_${response.status}`;

      throw error;
    }

    return this.normalizeResult({
      text:
        data?.choices?.[0]?.message?.content || "",
      provider: "OpenAI",
      model:
        data?.model || this.model,
      raw: {
        id: data?.id || null,
        usage: data?.usage || null
      }
    });
  }

  async health() {
    return {
      ok: Boolean(this.apiKey && this.model),
      providerId: this.id,
      model: this.model,
      configured: Boolean(this.apiKey && this.model)
    };
  }
  }
