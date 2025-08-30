import { DuckAgent, type DuckAgentConfig } from '../src/DuckAgent.js';

export type DuckAgentType = DuckAgent;


export const createTestAgent = (config?: Partial<DuckAgentConfig> & { personalityPrompt?: string }): DuckAgent => {
  if (!config?.privateKey) {
    throw new Error('privateKey is required in config');
  }

  const defaultConfig: DuckAgentConfig = {
    privateKey: config.privateKey,
    rpcUrl: config?.rpcUrl || 'https://rpc.duckchain.org/',
    model: config?.model || 'gpt-4o-mini',
    openAiApiKey: config?.openAiApiKey,
    anthropicApiKey: config?.anthropicApiKey,
    personalityPrompt: config?.personalityPrompt,
  };

  return new DuckAgent(defaultConfig);
};


