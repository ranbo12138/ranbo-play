/**
 * Prompt templates and helpers for MVU-aligned chat requests.
 */

export const SYSTEM_PROMPT_TEMPLATE = `
[D0::MVU_CORE_GUIDE]
你是 MVU（MagVarUpdate）脚本环境下的协作者，需要严格遵守 MVU 文档的三层约束：
- D0：角色基线、语气与世界观，不得偏离；
- D1：任务执行流程，优先复用现有变量与上下文；
- D4：安全与升级限制，遇到缺失信息需请求 {{get_message_variable::support.escalation_channel}}。

你可以使用 MVU 宏直接访问上下文，例如 {{get_message_variable::stat_data.summary}}、{{get_message_variable::world_book.active_nodes}}、{{get_message_variable::memory.shards}}。
保持回答结构清晰，必要时用项目符号或表格组织内容。
<<VARIABLE_GLANCE>>
`;

export const USER_PROMPT_TEMPLATE = `
[D1::USER_INTENT]
用户诉求：
<<USER_INPUT>>

[D4::ASSISTANT_CONTEXT]
<<CONTEXT_BLOCK>>
`;

const CONTEXT_MACROS = {
  statData: '{{get_message_variable::stat_data.summary}}',
  lorebook: '{{get_message_variable::world_book.active_nodes}}',
  memory: '{{get_message_variable::memory.shards}}',
};

function toCompactText(value) {
  if (!value) return '';

  if (typeof value === 'string') {
    return value.length > 480 ? `${value.slice(0, 480)}…` : value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => toCompactText(item))
      .filter(Boolean)
      .join('\n');
  }

  if (typeof value === 'object') {
    if (typeof value.summary === 'string') return toCompactText(value.summary);
    if (typeof value.description === 'string') return toCompactText(value.description);
    const firstString = Object.values(value).find((item) => typeof item === 'string');
    if (firstString) return toCompactText(firstString);
  }

  return '';
}

function buildVariableGlance(parsedSummary) {
  if (!parsedSummary || typeof parsedSummary !== 'object' || Object.keys(parsedSummary).length === 0) {
    return '当前未检测到变量摘要，必要时调用 {{get_message_variable::stat_data.summary}} 或其他 MVU 宏检索信息。';
  }

  const lines = Object.entries(parsedSummary)
    .map(([key, value]) => {
      const compact = toCompactText(value);
      if (compact) {
        return `• ${key}: ${compact}`;
      }
      return `• ${key}: 可通过 {{get_message_variable::${key}}} 获取。`;
    })
    .slice(0, 8);

  return `变量速览：\n${lines.join('\n')}`;
}

export function parseVariableSummary(rawSummary) {
  if (!rawSummary) return {};
  if (typeof rawSummary === 'object') return rawSummary;

  if (typeof rawSummary === 'string') {
    try {
      return JSON.parse(rawSummary);
    } catch (error) {
      const sections = rawSummary.split(/\n{2,}/).map((section) => section.trim()).filter(Boolean);
      return sections.reduce((acc, section, index) => {
        acc[`section_${index + 1}`] = section;
        return acc;
      }, {});
    }
  }

  return {};
}

function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function buildContextSections(parsedSummary, context = {}) {
  const sections = [];

  if (context.statData) {
    const statSummary = toCompactText(parsedSummary?.stat_data) || '使用 {{get_message_variable::stat_data.summary}} 获取实时属性表。';
    sections.push(`【Stat Data】\n${statSummary}\n宏：${CONTEXT_MACROS.statData}`);
  }

  if (context.lorebook) {
    const loreSummary = toCompactText(parsedSummary?.lorebook || parsedSummary?.world_book) || '当前未缓存世界书摘要，可通过宏读取激活条目。';
    sections.push(`【World Book】\n${loreSummary}\n宏：${CONTEXT_MACROS.lorebook}`);
  }

  if (context.memory) {
    const memorySummary = toCompactText(parsedSummary?.memory) || '必要时使用 {{get_message_variable::memory.shards}} 获取最近记忆链路。';
    sections.push(`【Memory Shards】\n${memorySummary}\n宏：${CONTEXT_MACROS.memory}`);
  }

  const customNotes = ensureArray(context.customNotes)
    .map((note) => note.trim())
    .filter(Boolean);

  sections.push(...customNotes);

  return sections;
}

function applyTemplate(template, replacements = {}) {
  if (!template) return '';
  return Object.entries(replacements).reduce((acc, [token, value]) => {
    const pattern = new RegExp(`<<${token}>>`, 'g');
    return acc.replace(pattern, value ?? '');
  }, template);
}

export function assemblePrompt({
  userInput,
  history = [],
  variableSummary = {},
  context = {},
  includeSystem = true,
} = {}) {
  if (!userInput || !userInput.trim()) {
    throw new Error('assemblePrompt 需要传入用户输入');
  }

  const parsedSummary = variableSummary?.parsed
    ? variableSummary.parsed
    : variableSummary;

  const systemPrompt = includeSystem
    ? applyTemplate(SYSTEM_PROMPT_TEMPLATE, {
        VARIABLE_GLANCE: buildVariableGlance(parsedSummary),
      }).trim()
    : '';

  const contextSections = buildContextSections(parsedSummary, context);

  const userPrompt = applyTemplate(USER_PROMPT_TEMPLATE, {
    USER_INPUT: userInput.trim(),
    CONTEXT_BLOCK: contextSections.length
      ? contextSections.join('\n\n')
      : '当前对话未注入额外 MVU 上下文，如需更多信息请调用相关 {{get_message_variable::...}} 宏。',
  }).trim();

  const messages = [];
  if (includeSystem && systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  if (Array.isArray(history) && history.length > 0) {
    history.forEach((message) => {
      if (!message || typeof message !== 'object') return;
      if (!message.role || !message.content) return;
      messages.push({ role: message.role, content: message.content });
    });
  }

  messages.push({ role: 'user', content: userPrompt });

  return {
    systemPrompt,
    userPrompt,
    contextSections,
    messages,
  };
}

export const MVU_CONTEXT_ACTIONS = [
  { id: 'statData', label: '包含 stat_data 摘要', macro: CONTEXT_MACROS.statData },
  { id: 'lorebook', label: '包含世界书快照', macro: CONTEXT_MACROS.lorebook },
  { id: 'memory', label: '包含记忆碎片', macro: CONTEXT_MACROS.memory },
];