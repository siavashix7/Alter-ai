export class AuditLog {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries ?? 500;
    this.entries = [];
  }

  record(event, data = {}) {
    const entry = {
      id: this.createId(),
      timestamp: new Date().toISOString(),
      event,
      data: this.sanitize(data)
    };

    this.entries.push(entry);

    if (this.entries.length > this.maxEntries) {
      this.entries.splice(
        0,
        this.entries.length - this.maxEntries
      );
    }

    return entry;
  }

  getAll() {
    return [...this.entries];
  }

  find(event) {
    return this.entries.filter(
      entry => entry.event === event
    );
  }

  clear() {
    this.entries.length = 0;
  }

  sanitize(value) {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === "string") {
      return value.length > 4000
        ? `${value.slice(0, 4000)}…`
        : value;
    }

    if (Array.isArray(value)) {
      return value.map(item => this.sanitize(item));
    }

    if (typeof value === "object") {
      const output = {};

      for (const [key, item] of Object.entries(value)) {
        const sensitive = [
          "apiKey",
          "api_key",
          "authorization",
          "token",
          "password",
          "secret"
        ];

        if (sensitive.includes(key.toLowerCase())) {
          output[key] = "[REDACTED]";
        } else {
          output[key] = this.sanitize(item);
        }
      }

      return output;
    }

    return value;
  }

  createId() {
    return `evt_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
  }
