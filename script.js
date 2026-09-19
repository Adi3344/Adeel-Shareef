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
const typingText = document.querySelector('.typing-text');

if (typingText) {
  const words = ['Adeel Shareef', 'a WordPress Developer', 'a Digital Designer', 'a Brand Builder'];
  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const typeLoop = () => {
    const currentWord = words[wordIndex];
    if (!deleting) {
      charIndex += 1;
      typingText.textContent = currentWord.slice(0, charIndex);

      if (charIndex === currentWord.length) {
        deleting = true;
        setTimeout(typeLoop, 1300);
        return;
      }
    } else {
      charIndex -= 1;
      typingText.textContent = currentWord.slice(0, charIndex);

      if (charIndex === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
      }
    }

    const speed = deleting ? 60 : 110;
    setTimeout(typeLoop, speed);
  };

  typeLoop();
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
