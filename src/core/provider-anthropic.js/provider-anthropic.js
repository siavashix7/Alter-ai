import { ProviderAdapter } from "./provider-adapter.js";

export class AnthropicProvider extends ProviderAdapter {
  constructor(config = {}) {
    super({
      id: "anthropic",
      name: "Anthropic",
      model:
        config.model ||
        process.env.ANTHROPIC_MODEL ||
        null,
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
      process.env.ANTHROPIC_API_KEY ||
      null;

    this.baseUrl =
      config.baseUrl ||
      process.env.ANTHROPIC_BASE_URL ||
      "https://api.anthropic.com/v1";
  }

  async run(task = {}) {
    if (!this.apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured."
      );
    }

    if (!this.model) {
      throw new Error(
        "ANTHROPIC_MODEL is not configured."
      );
    }

    const messages = Array.isArray(task.messages)
      ? task.messages
      : [
          {
            role: "user",
            content: String(task.request || "")
          }
        ];

    const system =
      task.system ||
      process.env.ALTER_SYSTEM_PROMPT ||
      "You are Alter, a helpful personal AI assistant.";

    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, "")}/messages`,
      {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: task.maxTokens ?? 4096,
          system,
          messages
        })
      }
    );

    const data = await response.json().catch(
      () => ({})
    );

    if (!response.ok) {
      const message =
        data?.error?.message ||
        `Anthropic request failed with HTTP ${response.status}`;

      const error = new Error(message);
      error.code = `HTTP_${response.status}`;

      throw error;
    }

    const text = Array.isArray(data?.content)
      ? data.content
          .filter(block => block?.type === "text")
          .map(block => block.text)
          .join("\n")
      : "";

    return this.normalizeResult({
      text,
      provider: "Anthropic",
      model: data?.model || this.model,
      raw: {
        id: data?.id || null,
        usage: data?.usage || null,
        stopReason: data?.stop_reason || null
      }
    });
  }

  async health() {
    return {
      ok: Boolean(
        this.apiKey && this.model
      ),
      providerId: this.id,
      model: this.model,
      configured: Boolean(
        this.apiKey && this.model
      )
    };
  }
      }
