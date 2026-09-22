import widgetStyles from './style.css?inline';
import assistantIcon from './assets/assistant.svg';
import closeIcon from './assets/close.svg';
import launcherIcon from './assets/launcher.svg';
import sendIcon from './assets/send.svg';

const WIDGET_ID = 'lam-chat-widget';
const API_URL = 'https://chatapi.myriadsolutionz.com/api/chat';
const STORAGE_PREFIX = 'lam-chat-widget:messages:';
const DEFAULTS = {
  title: 'Lookatmedia™AIAssist',
  greeting: 'How may I help you?',
  placeholder: 'Ask a question...',
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character]);
}

function renderInlineMarkdown(value) {
  const codeTokens = [];
  const withTokens = escapeHtml(value).replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@CODE${codeTokens.length}@@`;
    codeTokens.push(`<code>${code}</code>`);
    return token;
  });

  return withTokens
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/@@CODE(\d+)@@/g, (_, index) => codeTokens[Number(index)]);
}

function renderMarkdown(markdown) {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let paragraph = [];
  let listType = null;
  let inCode = false;
  let codeLanguage = '';
  let codeLines = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  const closeCode = () => {
    const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
    html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    inCode = false;
    codeLanguage = '';
    codeLines = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (inCode) {
      if (/^\s*```/.test(line)) {
        closeCode();
      } else {
        codeLines.push(line);
      }
      continue;
    }

    const codeStart = line.match(/^\s*```\s*([\w-]*)\s*$/);
    if (codeStart) {
      flushParagraph();
      closeList();
      inCode = true;
      codeLanguage = codeStart[1];
      continue;
    }

    const tableSeparator = lines[index + 1] && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(lines[index + 1]);
    if (line.includes('|') && tableSeparator) {
      flushParagraph();
      closeList();
      const parseCells = (tableLine) => tableLine.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
      const headers = parseCells(line);
      html.push('<table><thead><tr>');
      headers.forEach((cell) => html.push(`<th>${renderInlineMarkdown(cell)}</th>`));
      html.push('</tr></thead><tbody>');
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        html.push('<tr>');
        parseCells(lines[index]).forEach((cell) => html.push(`<td>${renderInlineMarkdown(cell)}</td>`));
        html.push('</tr>');
        index += 1;
      }
      html.push('</tbody></table>');
      index -= 1;
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      flushParagraph();
      closeList();
      html.push('<hr>');
      continue;
    }

    const unorderedItem = line.match(/^\s*[-*+]\s+(.+)$/);
    const orderedItem = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unorderedItem || orderedItem) {
      flushParagraph();
      const nextListType = unorderedItem ? 'ul' : 'ol';
      if (listType && listType !== nextListType) {
        closeList();
      }
      if (!listType) {
        listType = nextListType;
        html.push(`<${listType}>`);
      }
      html.push(`<li>${renderInlineMarkdown((unorderedItem || orderedItem)[1])}</li>`);
      continue;
    }

    closeList();
    paragraph.push(line.trim());
  }

  if (inCode) {
    closeCode();
  }
  flushParagraph();
  closeList();
  return html.join('');
}

function getScriptConfig(script) {
  if (!script || !script.dataset) {
    return {};
  }

  return Object.fromEntries(
    Object.entries({
      title: script.dataset.title,
      greeting: script.dataset.greeting,
      placeholder: script.dataset.placeholder,
      apiUrl: script.dataset.apiUrl,
      clientId: script.dataset.clientId,
    }).filter(([, value]) => value !== undefined && value !== '')
  );
}

function createWidget(config = {}) {
  if (document.getElementById(WIDGET_ID)) {
    return;
  }

  const settings = { ...DEFAULTS, ...config };
  const storageKey = `${STORAGE_PREFIX}${settings.clientId || 'default'}`;
  let messages = [];

  try {
    const storedMessages = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(storedMessages)) {
      messages = storedMessages.filter((message) => (
        message
        && (message.type === 'assistant' || message.type === 'user')
        && typeof message.text === 'string'
      ));
    }
  } catch (error) {
    console.warn('Chat widget localStorage is unavailable:', error);
  }
  const title = escapeHtml(settings.title);
  const greeting = escapeHtml(settings.greeting);
  const placeholder = escapeHtml(settings.placeholder);
  const host = document.createElement('div');
  host.id = WIDGET_ID;
  host.setAttribute('data-lam-chat-widget', '');
  document.body.append(host);

  const shadowRoot = host.attachShadow({ mode: 'closed' });
  shadowRoot.innerHTML = `
    <style>${widgetStyles}</style>
    <button class="launcher" type="button" aria-label="Open chat" aria-expanded="false">
      <img src="${launcherIcon}" alt="" />
    </button>
    <section class="panel" aria-label="${title}" hidden>
      <header class="header">
        <h1>${title}</h1>
        <button class="close" type="button" aria-label="Close chat">
          <img src="${closeIcon}" alt="" />
        </button>
      </header>
      <div class="chat-shell">
        <div class="conversation" role="log" aria-live="polite" aria-label="Conversation">
        </div>
        <form class="composer">
          <label class="sr-only" for="chat-question">${placeholder}</label>
          <input id="chat-question" name="question" type="text" autocomplete="off" placeholder="${placeholder}" />
          <button class="send" type="submit" aria-label="Send message">
            <img src="${sendIcon}" alt="" />
          </button>
        </form>
      </div>
    </section>
  `;

  const launcher = shadowRoot.querySelector('.launcher');
  const close = shadowRoot.querySelector('.close');
  const panel = shadowRoot.querySelector('.panel');
  const conversation = shadowRoot.querySelector('.conversation');
  const composer = shadowRoot.querySelector('.composer');
  const input = shadowRoot.querySelector('#chat-question');
  const send = shadowRoot.querySelector('.send');

  const setOpen = (isOpen) => {
    panel.hidden = !isOpen;
    launcher.setAttribute('aria-expanded', String(isOpen));
    launcher.setAttribute('aria-label', isOpen ? 'Chat open' : 'Open chat');

    if (isOpen) {
      window.requestAnimationFrame(() => input.focus());
    } else {
      launcher.focus();
    }
  };

  const saveMessages = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      console.warn('Chat widget could not save messages:', error);
    }
  };

  const appendMessage = (text, type, shouldPersist = true) => {
    const message = document.createElement('div');
    message.className = `message ${type}-message`;

    if (type === 'assistant') {
      const icon = document.createElement('img');
      icon.className = 'assistant-icon';
      icon.src = assistantIcon;
      icon.alt = '';
      message.append(icon);
    }

    const content = document.createElement(type === 'assistant' ? 'div' : 'p');
    content.className = 'message-content';
    if (type === 'assistant') {
      content.innerHTML = renderMarkdown(text);
    } else {
      content.textContent = text;
    }
    message.append(content);
    conversation.append(message);
    conversation.scrollTop = conversation.scrollHeight;

    if (shouldPersist) {
      messages.push({ text, type });
      saveMessages();
    }
  };

  if (messages.length) {
    messages.forEach(({ text, type }) => appendMessage(text, type, false));
  } else {
    appendMessage(settings.greeting, 'assistant');
  }

  launcher.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  composer.addEventListener('submit', async (event) => {
    event.preventDefault();
    const question = input.value.trim();

    if (!question) {
      return;
    }

    appendMessage(question, 'user');
    input.value = '';
    input.disabled = true;
    send.disabled = true;

    try {
      const response = await fetch(settings.apiUrl || API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: question }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      const answer = typeof result.response === 'string' && result.response.trim()
        ? result.response
        : 'I could not find a response for that question.';
      appendMessage(answer, 'assistant');
    } catch (error) {
      console.error('Chat widget API error:', error);
      appendMessage('Sorry, I could not connect right now. Please try again.', 'assistant');
    } finally {
      input.disabled = false;
      send.disabled = false;
      input.focus();
    }
  });
}

const embedScript = document.currentScript;

function boot() {
  const previewRoot = document.querySelector('#app');

  if (previewRoot) {
    createWidget();
  } else {
    createWidget(getScriptConfig(embedScript));
  }
}

if (document.body) {
  boot();
} else {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
}
