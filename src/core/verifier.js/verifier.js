export class Verifier {
  constructor(options = {}) {
    this.minTextLength = options.minTextLength ?? 1;
  }

  verify(result) {
    const issues = [];

    if (!result) {
      issues.push("empty-result");
    }

    const text = String(result?.text ?? "").trim();

    if (text.length < this.minTextLength) {
      issues.push("empty-text");
    }

    if (!result?.provider) {
      issues.push("missing-provider");
    }

    if (!result?.model) {
      issues.push("missing-model");
    }

    if (issues.length) {
      return {
        ok: false,
        confidence: 0,
        issues
      };
    }

    return {
      ok: true,
      confidence: this.calculateConfidence(result),
      issues: []
    };
  }

  calculateConfidence(result) {
    let confidence = 0.7;

    const text = String(result.text || "").trim();

    if (text.length >= 50) {
      confidence += 0.05;
    }

    if (text.length >= 200) {
      confidence += 0.05;
    }

    if (result.provider && result.model) {
      confidence += 0.1;
    }

    return Math.min(Number(confidence.toFixed(2)), 1);
  }

  assertValid(result) {
    const verification = this.verify(result);

    if (!verification.ok) {
      throw new Error(
        `Verification failed: ${verification.issues.join(", ")}`
      );
    }

    return result;
  }
  }
