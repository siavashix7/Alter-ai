import { ProviderAdapter } from "./provider-adapter.js";

export class GoogleProvider extends ProviderAdapter {
  constructor(config = {}) {
    super({
      id: "google",
      name: "Google Gemini",
      model:
        config.model ||
        process.env.GEMINI_MODEL ||
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
      process.env.GEMINI_API_KEY ||
      null;

    this.baseUrl =
      config.baseUrl ||
      process.env.GEMINI_BASE_URL ||
      "https://generativelanguage.googleapis.com/v1beta";
  }

  async run(task = {}) {
    if (!this.apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured."
      );
    }

    if (!this.model) {
      throw new Error(
        "GEMINI_MODEL is not configured."
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

    const contents = messages.map(message => ({
      role:
        message.role === "assistant"
          ? "model"
          : "user",
      parts: [
        {
          text: String(message.content || "")
        }
      ]
    }));

    const url =
      `${this.baseUrl.replace(/\/$/, "")}` +
      `/models/${encodeURIComponent(this.model)}` +
      `:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents,

        generationConfig: {
          temperature:
            task.temperature ?? 0.4
        }
      })
    });

    const data = await response.json().catch(
      () => ({})
    );

    if (!response.ok) {
      const message =
        data?.error?.message ||
        `Gemini request failed with HTTP ${response.status}`;

      const error = new Error(message);
      error.code = `HTTP_${response.status}`;

      throw error;
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part?.text || "")
        .join("") || "";

    return this.normalizeResult({
      text,
      provider: "Google Gemini",
      model: this.model,
      raw: {
        finishReason:
          data?.candidates?.[0]?.finishReason ||
          null
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
