import { ALTER_POLICY } from "./policy.js";
import { ProviderRegistry } from "./providers.js";
import { Router } from "./router.js";
import { Verifier } from "./verifier.js";
import { Planner } from "./planner.js";
import { TaskGraph } from "./task-graph.js";
import { AuditLog } from "./audit.js";
import { ToolRegistry } from "./tool-registry.js";
import {
  registerProviders,
  inspectProviders
} from "./provider-factory.js";
import { ExecutionEngine } from "./execution.js";

export class AlterRuntime {
  constructor(config = {}) {
    this.policy = ALTER_POLICY;

    this.audit = new AuditLog();

    this.providers = new ProviderRegistry();

    this.tools = new ToolRegistry();

    this.planner = new Planner({
      policy: this.policy
    });

    this.router = new Router(
      this.providers
    );

    this.verifier = new Verifier();

    this.execution = new ExecutionEngine({
      registry: this.providers,
      router: this.router,
      verifier: this.verifier,
      policy: this.policy
    });

    this.registerDefaultProviders(
      config.providers || {}
    );

    this.audit.record(
      "runtime.initialized",
      {
        alter: this.policy.identity.name,
        providers:
          this.providers.list().map(
            provider => provider.id
          )
      }
    );
  }

  registerDefaultProviders(config) {
    registerProviders(
      this.providers,
      config
    );
  }

  async run(input = {}) {
    const task =
      this.planner.createTask(input);

    this.audit.record(
      "task.created",
      {
        taskId: task.id,
        capability: task.capability
      }
    );

    const route =
      this.router.route(task);

    this.audit.record(
      "task.routed",
      {
        taskId: task.id,
        providerId: route.providerId,
        reason: route.reason
      }
    );

    const result =
      await this.execution.execute({
        ...task,
        providerId: route.providerId
      });

    this.audit.record(
      result.ok
        ? "task.completed"
        : "task.failed",
      {
        taskId: task.id,
        attempts: result.attempts?.length || 0,
        verification:
          result.verification
      }
    );

    return {
      task,
      route,
      ...result
    };
  }

  createGraph() {
    return new TaskGraph();
  }

  async providersHealth() {
    return inspectProviders(
      this.providers
    );
  }

  getTrace() {
    return this.audit.getAll();
  }

  getStatus() {
    return {
      name: this.policy.identity.name,
      role: this.policy.identity.role,
      providers: this.providers.list(),
      tools: this.tools.list(),
      traceEntries:
        this.audit.getAll().length
    };
  }
}

export function createAlter(config = {}) {
  return new AlterRuntime(config);
      }
