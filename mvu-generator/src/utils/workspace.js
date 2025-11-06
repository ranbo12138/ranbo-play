const WORKSPACE_TABS = [
  {
    id: 'html',
    label: 'HTML',
    language: 'html',
    fileName: 'workspace.html',
    canFormat: true,
  },
  {
    id: 'css',
    label: 'CSS',
    language: 'css',
    fileName: 'workspace.css',
    canFormat: true,
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    language: 'javascript',
    fileName: 'workspace.js',
    canFormat: true,
  },
  {
    id: 'yaml',
    label: 'YAML',
    language: 'yaml',
    fileName: 'workspace.yaml',
    canFormat: true,
  },
  {
    id: 'script',
    label: 'MVU Script',
    language: 'javascript',
    fileName: 'mvu-script.js',
    canFormat: true,
  },
  {
    id: 'regex',
    label: 'Regex',
    language: 'plaintext',
    fileName: 'patterns.txt',
    canFormat: false,
  },
];

const WORKSPACE_TAB_IDS = WORKSPACE_TABS.map((tab) => tab.id);

const EMPTY_ARTIFACTS = Object.freeze(
  WORKSPACE_TABS.reduce((acc, tab) => {
    acc[tab.id] = '';
    return acc;
  }, {})
);

function normaliseArtifacts(artifacts = {}) {
  const result = { ...EMPTY_ARTIFACTS };

  if (!artifacts || typeof artifacts !== 'object') {
    return result;
  }

  WORKSPACE_TABS.forEach((tab) => {
    const value = artifacts?.[tab.id];
    result[tab.id] = typeof value === 'string' ? value : '';
  });

  return result;
}

function extractArtifactsFromContent(content) {
  if (!content || typeof content !== 'string') {
    return {};
  }

  const extracted = {};
  const codeFencePattern = /```([\w+-]*)?\s*([\s\S]*?)```/g;
  const languageMap = {
    html: 'html',
    'html+ejs': 'html',
    'html+js': 'html',
    'html+xml': 'html',
    css: 'css',
    scss: 'css',
    less: 'css',
    javascript: 'javascript',
    js: 'javascript',
    ts: 'javascript',
    typescript: 'javascript',
    yaml: 'yaml',
    yml: 'yaml',
    json: 'yaml',
    toml: 'yaml',
    script: 'script',
    mvu: 'script',
    'mvu-script': 'script',
    regex: 'regex',
    regexp: 'regex',
    re: 'regex',
  };

  let match;
  while ((match = codeFencePattern.exec(content)) !== null) {
    const languageKey = (match[1] || '').trim().toLowerCase();
    const body = (match[2] || '').trim();
    const tabId = languageMap[languageKey];
    if (tabId && body) {
      if (!extracted[tabId]) {
        extracted[tabId] = body;
      } else {
        extracted[tabId] = `${extracted[tabId]}\n\n${body}`;
      }
    }
  }

  if (Object.keys(extracted).length === 0) {
    const sectionPattern = /\[(HTML|CSS|JAVASCRIPT|JS|YAML|SCRIPT|REGEX)\]\s*([\s\S]*?)(?=\n\s*\[[A-Z]+\]|$)/gi;
    let sectionMatch;
    while ((sectionMatch = sectionPattern.exec(content)) !== null) {
      const label = sectionMatch[1].toLowerCase();
      const body = (sectionMatch[2] || '').trim();
      switch (label) {
        case 'html':
          extracted.html = body;
          break;
        case 'css':
          extracted.css = body;
          break;
        case 'javascript':
        case 'js':
          extracted.javascript = body;
          break;
        case 'yaml':
          extracted.yaml = body;
          break;
        case 'script':
          extracted.script = body;
          break;
        case 'regex':
          extracted.regex = body;
          break;
        default:
          break;
      }
    }
  }

  return extracted;
}

function diffArtifacts(current = {}, baseline = {}) {
  const currentNormalised = normaliseArtifacts(current);
  const baselineNormalised = normaliseArtifacts(baseline);

  return WORKSPACE_TABS.reduce((acc, tab) => {
    acc[tab.id] = currentNormalised[tab.id].trim() !== baselineNormalised[tab.id].trim();
    return acc;
  }, {});
}

function mergeArtifacts(current = {}, patch = {}) {
  const merged = normaliseArtifacts(current);

  if (patch && typeof patch === 'object') {
    WORKSPACE_TABS.forEach((tab) => {
      if (Object.prototype.hasOwnProperty.call(patch, tab.id)) {
        const value = patch[tab.id];
        merged[tab.id] = typeof value === 'string' ? value : '';
      }
    });
  }

  return merged;
}

export {
  WORKSPACE_TABS,
  WORKSPACE_TAB_IDS,
  EMPTY_ARTIFACTS,
  normaliseArtifacts,
  mergeArtifacts,
  diffArtifacts,
  extractArtifactsFromContent,
};

export default {
  WORKSPACE_TABS,
  WORKSPACE_TAB_IDS,
  EMPTY_ARTIFACTS,
  normaliseArtifacts,
  mergeArtifacts,
  diffArtifacts,
  extractArtifactsFromContent,
};