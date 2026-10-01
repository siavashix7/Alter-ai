import { OpenAIProvider } from "./provider-openai.js";
import { AnthropicProvider } from "./provider-anthropic.js";
import { GoogleProvider } from "./provider-google.js";

export function createProviders(config = {}) {
  const providers = [];

  const openai = new OpenAIProvider(
    config.openai || {}
  );

  const anthropic = new AnthropicProvider(
    config.anthropic || {}
  );

  const google = new GoogleProvider(
    config.google || {}
  );

  if (openai.enabled) {
    providers.push(openai);
  }

  if (anthropic.enabled) {
    providers.push(anthropic);
  }

  if (google.enabled) {
    providers.push(google);
  }

  return providers;
}

export function registerProviders(
  registry,
  config = {}
) {
  const providers = createProviders(config);

  for (const provider of providers) {
    registry.register(provider);
  }

  return registry;
}

export async function inspectProviders(
  registry
) {
  const providers = registry.list();

  const health = await Promise.all(
    providers.map(async provider => {
      const result =
        await registry.health(provider.id);

      return {
        ...provider,
        health: result
      };
    })
  );

  return health;
    }
