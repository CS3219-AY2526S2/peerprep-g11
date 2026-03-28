import { createGateway } from 'ai';
import { assistantConfig } from './config';

const gateway = createGateway({
  apiKey: assistantConfig.gatewayApiKey,
});

export function getExplainModel() {
  return gateway(assistantConfig.explainModel);
}

export function getHintsModel() {
  return gateway(assistantConfig.hintsModel);
}
