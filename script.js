const yearEl = document.getElementById('year');
const footerYearEl = document.getElementById('year-footer');
const revealEls = document.querySelectorAll('.reveal');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (footerYearEl) {
  footerYearEl.textContent = new Date().getFullYear();
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('visible'));
}

const navLinks = document.querySelectorAll('.site-nav a, .header-actions a, .scroll-to, .brand');
navLinks.forEach((link) => {
  if (!link.getAttribute('href') || !link.getAttribute('href').startsWith('#')) return;
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    const target = document.querySelector(targetId);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', targetId);
    }
  });
});

const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navToggle.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
    siteNav.classList.toggle('open');
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation');
      siteNav.classList.remove('open');
    });
  });
}
const contactForm = document.getElementById('contact-form');
const formStatus = contactForm?.querySelector('.form-status');
const submitButton = contactForm?.querySelector('button[type="submit"]');

if (contactForm && formStatus && submitButton) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    formStatus.textContent = 'Sending your message...';
    formStatus.className = 'form-status is-sending';
    submitButton.disabled = true;

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to send your message.');

      contactForm.reset();
      formStatus.textContent = 'Thanks. Your message has been sent successfully.';
      formStatus.className = 'form-status is-success';
    } catch (error) {
      formStatus.textContent = error.message || 'Something went wrong. Please email me directly.';
      formStatus.className = 'form-status is-error';
    } finally {
      submitButton.disabled = false;
    }
  });
}

const chatPanel = document.getElementById('chat-panel');
const chatToggle = document.getElementById('chat-toggle');
const chatClose = document.getElementById('chat-close');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const chatPrompts = document.getElementById('chat-prompts');
const chatStatus = document.getElementById('chat-status');
const chatSend = document.getElementById('chat-send');

if (chatPanel && chatToggle && chatClose && chatForm && chatInput && chatMessages && chatStatus && chatSend) {
  const conversation = [];
  const chatIcon = chatToggle.querySelector('i');

  const addMessage = (role, text) => {
    const item = document.createElement('li');
    const message = document.createElement('p');
    item.className = `chat-message is-${role}`;
    message.textContent = text;
    item.append(message);
    chatMessages.append(item);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const setChatOpen = (open) => {
    chatPanel.hidden = !open;
    chatToggle.setAttribute('aria-expanded', String(open));
    chatToggle.setAttribute('aria-label', open ? 'Close portfolio assistant' : 'Open portfolio assistant');
    if (chatIcon) chatIcon.className = open ? 'las la-times' : 'las la-comment-dots';
    if (open) chatInput.focus();
    else chatToggle.focus();
  };

  const sendMessage = async (text) => {
    const message = text.trim().slice(0, 1200);
    if (!message || chatSend.disabled) return;

    addMessage('user', message);
    conversation.push({ role: 'user', content: message });
    chatInput.value = '';
    chatInput.disabled = true;
    chatSend.disabled = true;
    chatStatus.textContent = 'Thinking...';
    if (chatPrompts) chatPrompts.hidden = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation.slice(-10),
          website: chatForm.elements.website.value
        })
      });
      const result = await response.json();
      if (!response.ok || typeof result.reply !== 'string') {
        throw new Error(result.error || 'Unable to get a reply.');
      }

      addMessage('assistant', result.reply);
      conversation.push({ role: 'assistant', content: result.reply });
      if (conversation.length > 10) conversation.splice(0, conversation.length - 10);
      chatStatus.textContent = '';
    } catch {
      const fallback = 'Sorry, I could not reply just now. You can contact Adeel at adeelshareef761@gmail.com or use the contact form.';
      addMessage('assistant', fallback);
      conversation.push({ role: 'assistant', content: fallback });
      chatStatus.textContent = 'Reply service is temporarily unavailable.';
    } finally {
      chatInput.disabled = false;
      chatSend.disabled = false;
      chatInput.focus();
    }
  };

  chatToggle.addEventListener('click', () => setChatOpen(chatPanel.hidden));
  chatClose.addEventListener('click', () => setChatOpen(false));
  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage(chatInput.value);
  });

  chatPrompts?.querySelectorAll('[data-chat-prompt]').forEach((button) => {
    button.addEventListener('click', () => sendMessage(button.dataset.chatPrompt || ''));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !chatPanel.hidden) setChatOpen(false);
  });
}
