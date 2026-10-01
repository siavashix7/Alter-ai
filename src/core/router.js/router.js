export class Router {
  constructor(registry) {
    this.registry = registry;
  }

  route(task = {}) {
    const capability = task.capability || "chat";
    const providers = this.registry.list({ capability });

    if (!providers.length) {
      throw new Error(
        `No enabled provider supports capability "${capability}".`
      );
    }

    // Explicit provider request always has priority.
    if (task.providerId) {
      const requested = providers.find(
        provider => provider.id === task.providerId
      );

      if (requested) {
        return {
          providerId: requested.id,
          reason: "explicit-provider"
        };
      }

      // The requested provider exists but cannot handle this capability.
      if (this.registry.has(task.providerId)) {
        throw new Error(
          `Provider "${task.providerId}" does not support "${capability}".`
        );
      }
    }

    // Default route: highest-priority compatible provider.
    const selected = providers[0];

    return {
      providerId: selected.id,
      reason: "capability-priority"
    };
  }

  candidates(task = {}) {
    const capability = task.capability || "chat";

    return this.registry.list({ capability }).map(provider => ({
      providerId: provider.id,
      name: provider.name,
      priority: provider.priority,
      capabilities: provider.capabilities
    }));
  }
}
