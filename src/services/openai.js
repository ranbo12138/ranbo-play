/**
 * Lightweight client for OpenAI-compatible chat completions.
 * Supports configurable base URLs, provider-specific auth headers,
 * and automatic fallback when streaming is unavailable.
 */

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-3.5-turbo';
const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

export class OpenAIServiceError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'OpenAIServiceError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function normaliseBaseUrl(baseUrl = DEFAULT_BASE_URL) {
  if (!baseUrl) return DEFAULT_BASE_URL;
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function buildEndpointPath(path) {
  if (!path) return '/chat/completions';
  return path.startsWith('/') ? path : `/${path}`;
}

function buildAuthHeaders(providerType = 'openai', apiKey) {
  if (!apiKey) return {};

  const trimmedKey = `${apiKey}`.trim();
  const bearerValue = trimmedKey.toLowerCase().startsWith('bearer ')
    ? trimmedKey
    : `Bearer ${trimmedKey}`;

  switch (providerType) {
    case 'azure':
      return { 'api-key': trimmedKey };
    case 'openrouter': {
      const headers = { Authorization: bearerValue };
      if (hasWindow && window.location) {
        headers['HTTP-Referer'] = window.location.origin || '';
      }
      if (hasDocument && document.title) {
        headers['X-Title'] = document.title;
      }
      if (!headers['X-Title']) {
        headers['X-Title'] = 'MVU Chat Module';
      }
      if (!headers['HTTP-Referer']) {
        headers['HTTP-Referer'] = hasWindow && window.location ? window.location.origin || window.location.href || 'https://openrouter.ai' : 'https://openrouter.ai';
      }
      return headers;
    }
    default:
      return { Authorization: bearerValue };
  }
}

function mergeHeaders(providerType, apiKey, headers = {}) {
  return {
    'Content-Type': 'application/json',
    ...buildAuthHeaders(providerType, apiKey),
    ...headers,
  };
}

async function parseJSONResponse(response) {
  let payload;

  try {
    payload = await response.json();
  } catch (error) {
    throw new OpenAIServiceError('无法解析 JSON 响应', {
      status: response.status,
      details: error,
    });
  }

  if (!response.ok) {
    throw new OpenAIServiceError(payload?.error?.message || 'OpenAI 请求失败', {
      status: response.status,
      code: payload?.error?.code,
      details: payload,
    });
  }

  return payload;
}

function parseStreamChunk(chunk) {
  return chunk
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^data:\s*/, ''))
    .filter((line) => line && line !== '[DONE]');
}

async function executeStreamingRequest(url, requestInit, { onToken, onComplete }) {
  const response = await fetch(url, requestInit);

  if (!response.ok) {
    const payload = await parseJSONResponse(response);
    return { response, payload };
  }

  if (!response.body || typeof response.body.getReader !== 'function') {
    throw new OpenAIServiceError('当前环境不支持流式传输');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const payloads = parseStreamChunk(chunk);

    payloads.forEach((payload) => {
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed?.choices?.[0]?.delta?.content || '';
        if (delta) {
          fullText += delta;
          if (typeof onToken === 'function') {
            onToken(delta, fullText, parsed);
          }
        }
      } catch (error) {
        console.warn('[openai] Failed to parse stream payload', error, payload);
      }
    });
  }

  if (typeof onComplete === 'function') {
    onComplete(fullText);
  }

  return { response, payload: { choices: [{ message: { content: fullText } }] } };
}

async function executeStandardRequest(url, requestInit) {
  const response = await fetch(url, requestInit);
  const payload = await parseJSONResponse(response);
  return { response, payload };
}

export async function createChatCompletion({
  apiKey,
  providerType = 'openai',
  baseUrl = DEFAULT_BASE_URL,
  endpointPath,
  model = DEFAULT_MODEL,
  messages = [],
  temperature = 0.7,
  maxTokens,
  topP,
  presencePenalty,
  frequencyPenalty,
  headers = {},
  stream = false,
  onToken,
  onComplete,
  onError,
  signal,
  body: bodyOverrides = {},
} = {}) {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new OpenAIServiceError('缺少聊天消息数据');
  }

  const url = `${normaliseBaseUrl(baseUrl)}${buildEndpointPath(endpointPath)}`;
  const requestBody = {
    model,
    messages,
    temperature,
    ...bodyOverrides,
  };

  if (typeof maxTokens === 'number') requestBody.max_tokens = maxTokens;
  if (typeof topP === 'number') requestBody.top_p = topP;
  if (typeof presencePenalty === 'number') requestBody.presence_penalty = presencePenalty;
  if (typeof frequencyPenalty === 'number') requestBody.frequency_penalty = frequencyPenalty;

  const shouldStream = Boolean(stream && typeof onToken === 'function');
  if (shouldStream) {
    requestBody.stream = true;
  }

  const requestInit = {
    method: 'POST',
    headers: mergeHeaders(providerType, apiKey, headers),
    body: JSON.stringify(requestBody),
    signal,
  };

  try {
    let result;

    if (shouldStream) {
      result = await executeStreamingRequest(url, requestInit, { onToken, onComplete });
    } else {
      result = await executeStandardRequest(url, requestInit);
      if (typeof onComplete === 'function') {
        const content = result?.payload?.choices?.[0]?.message?.content;
        if (typeof content === 'string') {
          onComplete(content);
        }
      }
    }

    return result;
  } catch (error) {
    if (shouldStream) {
      console.warn('[openai] Streaming failed, retrying without stream', error);
      if (typeof onError === 'function') {
        onError(error);
      }
      delete requestBody.stream;
      const retryInit = {
        ...requestInit,
        body: JSON.stringify(requestBody),
      };
      const retryResult = await executeStandardRequest(url, retryInit);
      if (typeof onComplete === 'function') {
        const content = retryResult?.payload?.choices?.[0]?.message?.content;
        if (typeof content === 'string') {
          onComplete(content);
        }
      }
      return retryResult;
    }

    throw error;
  }
}

export async function simpleChatCompletion(options = {}) {
  const { payload } = await createChatCompletion(options);
  return payload?.choices?.[0]?.message?.content || '';
}

export const OpenAIService = {
  createChatCompletion,
  simpleChatCompletion,
};
