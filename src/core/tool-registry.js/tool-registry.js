export class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  register(tool) {
    if (!tool?.id) {
      throw new Error("Tool id is required.");
    }

    if (typeof tool.run !== "function") {
      throw new Error(
        `Tool "${tool.id}" must implement run().`
      );
    }

    const normalized = {
      id: String(tool.id),
      name: String(tool.name || tool.id),
      description: String(tool.description || ""),
      capabilities: Array.isArray(tool.capabilities)
        ? [...new Set(tool.capabilities.map(String))]
        : [],
      enabled: tool.enabled !== false,
      requiresApproval: tool.requiresApproval === true,
      run: tool.run
    };

    this.tools.set(normalized.id, normalized);

    return normalized;
  }

  get(id) {
    return this.tools.get(id);
  }

  has(id) {
    return this.tools.has(id);
  }

  list({ capability } = {}) {
    return [...this.tools.values()]
      .filter(tool => tool.enabled)
      .filter(tool =>
        !capability ||
        tool.capabilities.includes(capability)
      )
      .map(tool => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        capabilities: [...tool.capabilities],
        requiresApproval: tool.requiresApproval
      }));
  }

  async execute(id, input = {}, context = {}) {
    const tool = this.get(id);

    if (!tool) {
      throw new Error(`Unknown tool "${id}".`);
    }

    if (!tool.enabled) {
      throw new Error(`Tool "${id}" is disabled.`);
    }

    return await tool.run(input, context);
  }
      }
