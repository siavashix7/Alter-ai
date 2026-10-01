export class Planner {
  constructor({ policy } = {}) {
    this.policy = policy;
  }

  createTask(input = {}) {
    const request = String(
      typeof input === "string"
        ? input
        : input.request || input.prompt || ""
    ).trim();

    if (!request) {
      throw new Error("Cannot create a task from an empty request.");
    }

    const task = {
      id: this.createTaskId(),
      type: input.type || "chat",
      capability: input.capability || "chat",
      request,
      providerId: input.providerId || null,
      priority: input.priority || "normal",
      maxAttempts: Number.isInteger(input.maxAttempts)
        ? Math.max(1, input.maxAttempts)
        : 3,
      createdAt: new Date().toISOString(),
      status: "planned"
    };

    return Object.freeze(task);
  }

  shouldDecompose(task) {
    if (!task?.request) return false;

    const request = task.request.toLowerCase();

    const indicators = [
      " and then ",
      " then ",
      "after that",
      "first ",
      "step by step",
      "multiple tasks",
      "compare and",
      "research and"
    ];

    return indicators.some(indicator =>
      request.includes(indicator)
    );
  }

  decompose(task) {
    if (!this.shouldDecompose(task)) {
      return [task];
    }

    const parts = task.request
      .split(/\s+(?:and then|then|after that)\s+/i)
      .map(part => part.trim())
      .filter(Boolean);

    if (parts.length <= 1) {
      return [task];
    }

    return parts.map((request, index) => ({
      ...task,
      id: `${task.id}-${index + 1}`,
      request,
      status: "planned",
      parentTaskId: task.id
    }));
  }

  createTaskId() {
    return `task_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
      }
