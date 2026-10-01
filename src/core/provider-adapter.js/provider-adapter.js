export class ProviderAdapter {
  constructor(config = {}) {
    this.id = config.id;
    this.name = config.name || this.id;
    this.model = config.model || null;
    this.capabilities = config.capabilities || ["chat"];
    this.enabled = config.enabled !== false;
  }

  metadata() {
    return {
      id: this.id,
      name: this.name,
      model: this.model,
      capabilities: [...this.capabilities],
      enabled: this.enabled
    };
  }

  async run() {
    throw new Error(
      `Provider "${this.id}" does not implement run().`
    );
  }

  async health() {
    return {
      ok: this.enabled,
      providerId: this.id,
      model: this.model
    };
  }

  normalizeResult(result = {}) {
    return {
      text: String(result.text || ""),
      provider: result.provider || this.name,
      model: result.model || this.model,
      raw: result.raw ?? null
    };
  }

  normalizeError(error) {
    return {
      providerId: this.id,
      message: error?.message || "Unknown provider error",
      code: error?.code || "PROVIDER_ERROR"
    };
  }
}
