export interface LLMRequest {
  prompt: string;
  model: string;
  maxToken?: number;
  /** overrides the provider's default env var lookup for this one call */
  apiKey?: string;
}

export interface LLMProvider {
  /** Identifies the provider in error message and tests */
  readonly id: string;
  generateText(request: LLMRequest): Promise<string>;
}
