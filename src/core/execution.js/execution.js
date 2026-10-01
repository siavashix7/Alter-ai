export class ExecutionEngine {
  constructor({ registry, router, verifier, policy }) {
    this.registry = registry;
    this.router = router;
    this.verifier = verifier;
    this.policy = policy;
  }

  async execute(task = {}) {
    const maxAttempts = task.maxAttempts ?? 2;
    const attempts = [];
    const candidates = this.router.candidates(task);

    if (!candidates.length) {
      throw new Error("No compatible providers available.");
    }

    const orderedCandidates = this.buildCandidateOrder(
      task,
      candidates
    );

    for (
      let attempt = 0;
      attempt < Math.min(maxAttempts, orderedCandidates.length);
      attempt++
    ) {
      const candidate = orderedCandidates[attempt];
      const provider = this.registry.get(candidate.providerId);

      if (!provider) {
        attempts.push({
          providerId: candidate.providerId,
          ok: false,
          error: "provider-not-found"
        });
        continue;
      }

      const startedAt = Date.now();

      try {
        const result = await provider.run(task);

        const verification = this.verifier.verify(result);

        const record = {
          providerId: provider.id,
          provider: result?.provider || provider.name,
          model: result?.model || null,
          durationMs: Date.now() - startedAt,
          verification
        };

        if (verification.ok) {
          return {
            ok: true,
            result,
            verification,
            attempts: [...attempts, record]
          };
        }

        attempts.push({
          ...record,
          ok: false,
          error: "verification-failed"
        });
      } catch (error) {
        attempts.push({
          providerId: provider.id,
          ok: false,
          durationMs: Date.now() - startedAt,
          error: error?.message || "provider-execution-failed"
        });
      }

      if (this.policy?.execution?.retryOnProviderFailure === false) {
        break;
      }

      if (this.policy?.execution?.fallbackOnProviderFailure === false) {
        break;
      }
    }

    return {
      ok: false,
      result: null,
      verification: {
        ok: false,
        confidence: 0,
        issues: ["all-attempts-failed"]
      },
      attempts
    };
  }

  buildCandidateOrder(task, candidates) {
    const list = [...candidates];

    if (task.providerId) {
      const requested = list.find(
        item => item.providerId === task.providerId
      );

      if (requested) {
        return [
          requested,
          ...list.filter(
            item => item.providerId !== requested.providerId
          )
        ];
      }
    }

    return list.sort((a, b) => b.priority - a.priority);
  }
    }
