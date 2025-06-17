// Exemplo básico — implemente integrações reais conforme necessário
export async function callLLM(message: string, history: any[]) {
  // Chame o provedor (OpenAI, Anthropic, Google) conforme apiKey e provider do usuário
  // Exemplo: return await openai.chat(...);
  return { reply: 'Mocked LLM response: ' + message }
}
