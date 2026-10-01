export class TaskGraph {
  constructor() {
    this.nodes = new Map();
  }

  add(task, dependencies = []) {
    if (!task?.id) {
      throw new Error("Task must have an id.");
    }

    if (this.nodes.has(task.id)) {
      throw new Error(`Task "${task.id}" already exists.`);
    }

    const deps = [...new Set(dependencies)];

    for (const dependency of deps) {
      if (!this.nodes.has(dependency)) {
        throw new Error(
          `Dependency "${dependency}" does not exist.`
        );
      }
    }

    this.nodes.set(task.id, {
      task,
      dependencies: deps,
      status: "pending",
      result: null,
      error: null
    });

    return this.nodes.get(task.id);
  }

  get(id) {
    return this.nodes.get(id);
  }

  ready() {
    return [...this.nodes.values()]
      .filter(node => {
        if (node.status !== "pending") {
          return false;
        }

        return node.dependencies.every(dependency => {
          const parent = this.nodes.get(dependency);
          return parent?.status === "completed";
        });
      })
      .map(node => node.task);
  }

  markRunning(id) {
    const node = this.require(id);

    if (node.status !== "pending") {
      throw new Error(
        `Task "${id}" cannot enter running state from "${node.status}".`
      );
    }

    node.status = "running";
    return node;
  }

  markCompleted(id, result = null) {
    const node = this.require(id);

    node.status = "completed";
    node.result = result;
    node.error = null;

    return node;
  }

  markFailed(id, error) {
    const node = this.require(id);

    node.status = "failed";
    node.error = error?.message || String(error);
    
    return node;
  }

  isComplete() {
    return [...this.nodes.values()]
      .every(node =>
        node.status === "completed" ||
        node.status === "failed"
      );
  }

  hasFailures() {
    return [...this.nodes.values()]
      .some(node => node.status === "failed");
  }

  snapshot() {
    return [...this.nodes.values()].map(node => ({
      id: node.task.id,
      status: node.status,
      dependencies: [...node.dependencies],
      result: node.result,
      error: node.error
    }));
  }

  require(id) {
    const node = this.nodes.get(id);

    if (!node) {
      throw new Error(`Unknown task "${id}".`);
    }

    return node;
  }
      }
