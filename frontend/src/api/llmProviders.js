// LLM Providers Integration
import axios from 'axios'

const API_ENDPOINTS = {
  'openai-gpt-4': 'https://api.openai.com/v1/chat/completions',
  'openai-gpt-3.5': 'https://api.openai.com/v1/chat/completions',
  'anthropic-claude-3-opus': 'https://api.anthropic.com/v1/messages',
  'anthropic-claude-3-sonnet': 'https://api.anthropic.com/v1/messages',
  'anthropic-claude-3-haiku': 'https://api.anthropic.com/v1/messages',
  'google-gemini-pro': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  'google-gemini-pro-vision': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent'
}

const MODEL_CONFIGS = {
  'openai-gpt-4': {
    model: 'gpt-4-turbo-preview',
    provider: 'openai',
    maxTokens: 4096,
    temperature: 0.7
  },
  'openai-gpt-3.5': {
    model: 'gpt-3.5-turbo',
    provider: 'openai',
    maxTokens: 4096,
    temperature: 0.7
  },
  'anthropic-claude-3-opus': {
    model: 'claude-3-opus-20240229',
    provider: 'anthropic',
    maxTokens: 4096,
    temperature: 0.7
  },
  'anthropic-claude-3-sonnet': {
    model: 'claude-3-sonnet-20240229',
    provider: 'anthropic',
    maxTokens: 4096,
    temperature: 0.7
  },
  'anthropic-claude-3-haiku': {
    model: 'claude-3-haiku-20240307',
    provider: 'anthropic',
    maxTokens: 4096,
    temperature: 0.7
  },
  'google-gemini-pro': {
    model: 'gemini-pro',
    provider: 'google',
    maxTokens: 4096,
    temperature: 0.7
  },
  'google-gemini-pro-vision': {
    model: 'gemini-pro-vision',
    provider: 'google',
    maxTokens: 4096,
    temperature: 0.7
  }
}

export async function sendMessage(message, modelId, apiKey, conversationHistory = []) {
  const config = MODEL_CONFIGS[modelId]
  if (!config) {
    throw new Error(`Modelo não suportado: ${modelId}`)
  }

  try {
    switch (config.provider) {
      case 'openai':
        return await sendOpenAIMessage(message, config, apiKey, conversationHistory)
      case 'anthropic':
        return await sendAnthropicMessage(message, config, apiKey, conversationHistory)
      case 'google':
        return await sendGoogleMessage(message, config, apiKey, conversationHistory)
      default:
        throw new Error(`Provider não suportado: ${config.provider}`)
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    throw new Error(getErrorMessage(error))
  }
}

async function sendOpenAIMessage(message, config, apiKey, conversationHistory) {
  const messages = [
    {
      role: 'system',
      content: 'Você é um assistente IA útil e amigável. Responda de forma clara e concisa.'
    },
    ...conversationHistory.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    {
      role: 'user',
      content: message
    }
  ]

  const response = await axios.post(API_ENDPOINTS[`openai-${config.model.includes('gpt-4') ? 'gpt-4' : 'gpt-3.5'}`], {
    model: config.model,
    messages,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    stream: false
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  return response.data.choices[0].message.content
}

async function sendAnthropicMessage(message, config, apiKey, conversationHistory) {
  const messages = conversationHistory.slice(-10).map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }))

  messages.push({
    role: 'user',
    content: message
  })

  const response = await axios.post(API_ENDPOINTS[`anthropic-${config.model.split('-')[2]}`], {
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    messages,
    system: 'Você é um assistente IA útil e amigável. Responda de forma clara e concisa.'
  }, {
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }
  })

  return response.data.content[0].text
}

async function sendGoogleMessage(message, config, apiKey, conversationHistory) {
  const history = conversationHistory.slice(-10).map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }))

  const contents = [
    ...history,
    {
      role: 'user',
      parts: [{ text: message }]
    }
  ]

  const response = await axios.post(`${API_ENDPOINTS[`google-${config.model}`]}?key=${apiKey}`, {
    contents,
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      topP: 0.8,
      topK: 10
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ]
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return response.data.candidates[0].content.parts[0].text
}

function getErrorMessage(error) {
  if (error.response) {
    const status = error.response.status
    const data = error.response.data

    switch (status) {
      case 401:
        return 'API key inválida. Verifique sua chave de API.'
      case 403:
        return 'Acesso negado. Verifique suas permissões de API.'
      case 429:
        return 'Muitas requisições. Tente novamente em alguns segundos.'
      case 500:
        return 'Erro interno do servidor. Tente novamente mais tarde.'
      default:
        return data?.error?.message || data?.message || `Erro HTTP ${status}`
    }
  } else if (error.request) {
    return 'Erro de conexão. Verifique sua internet.'
  } else {
    return error.message || 'Erro desconhecido'
  }
}

export function validateApiKey(apiKey, provider) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false
  }

  switch (provider) {
    case 'openai':
      return apiKey.startsWith('sk-') && apiKey.length > 20
    case 'anthropic':
      return apiKey.startsWith('sk-ant-') && apiKey.length > 20
    case 'google':
      return apiKey.length > 20 && !apiKey.includes(' ')
    default:
      return apiKey.length > 10
  }
}

export function getProviderFromModel(modelId) {
  const config = MODEL_CONFIGS[modelId]
  return config ? config.provider : null
}

export function getAvailableModels() {
  return Object.keys(MODEL_CONFIGS).map(id => ({
    id,
    name: MODEL_CONFIGS[id].model,
    provider: MODEL_CONFIGS[id].provider,
    maxTokens: MODEL_CONFIGS[id].maxTokens
  }))
}

export default {
  sendMessage,
  validateApiKey,
  getProviderFromModel,
  getAvailableModels
}
