import widgetStyles from './style.css?inline';
import assistantIcon from './assets/assistant.svg';
import closeIcon from './assets/close.svg';
import launcherIcon from './assets/launcher.svg';
import sendIcon from './assets/send.svg';

const WIDGET_ID = 'lam-chat-widget';
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

function getScriptConfig(script) {

  if (!script || !script.dataset) {
    return {};
  }

  return {
    title: script.dataset.title,
    greeting: script.dataset.greeting,
    placeholder: script.dataset.placeholder,
  };
}

function createWidget(config = {}) {
  if (document.getElementById(WIDGET_ID)) {
    return;
  }

  const settings = { ...DEFAULTS, ...config };
  const title = escapeHtml(settings.title);
  const greeting = escapeHtml(settings.greeting);
  const placeholder = escapeHtml(settings.placeholder);
  const host = document.createElement('div');
  host.id = WIDGET_ID;
  host.setAttribute('data-lam-chat-widget', '');
  document.body.append(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });
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
          <div class="message assistant-message">
            <img class="assistant-icon" src="${assistantIcon}" alt="" />
            <p>${greeting}</p>
          </div>
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

  const appendMessage = (text, type) => {
    const message = document.createElement('div');
    message.className = `message ${type}-message`;

    if (type === 'assistant') {
      const icon = document.createElement('img');
      icon.className = 'assistant-icon';
      icon.src = assistantIcon;
      icon.alt = '';
      message.append(icon);
    }

    const content = document.createElement('p');
    content.textContent = text;
    message.append(content);
    conversation.append(message);
    conversation.scrollTop = conversation.scrollHeight;
  };

  launcher.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  composer.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = input.value.trim();

    if (!question) {
      return;
    }

    appendMessage(question, 'user');
    input.value = '';
    input.disabled = true;
    send.disabled = true;

    window.setTimeout(() => {
      appendMessage('Thanks for your question. I can help you find the right content option.', 'assistant');
      input.disabled = false;
      send.disabled = false;
      input.focus();
    }, 550);
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
