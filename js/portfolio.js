(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var pageName = (window.location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
    document.body.classList.add('page-' + pageName);
    var year = document.getElementById('current-year');
    var form = document.getElementById('contact-form');
    var status = document.getElementById('contact-status');
    var themeToggle = document.getElementById('theme-toggle');
    var backToTop = document.getElementById('back-to-top');
    // Preserve the original floating actions on every page in the multi-page layout.
    if (!backToTop) {
      backToTop = document.createElement('button');
      backToTop.id = 'back-to-top';
      backToTop.className = 'back-to-top';
      backToTop.type = 'button';
      backToTop.setAttribute('aria-label', 'Back to top');
      backToTop.innerHTML = '<i class="bi-arrow-up" aria-hidden="true"></i>';
      document.body.appendChild(backToTop);
    }
    if (!document.querySelector('.whatsapp-float')) {
      var whatsappFloat = document.createElement('a');
      whatsappFloat.className = 'whatsapp-float';
      whatsappFloat.href = 'https://wa.me/237677449120?text=Hello%20Louis%2C%20I%27d%20like%20to%20discuss%20a%20project.';
      whatsappFloat.target = '_blank';
      whatsappFloat.rel = 'noopener noreferrer';
      whatsappFloat.setAttribute('aria-label', 'Message Louis on WhatsApp');
      whatsappFloat.title = 'Message me on WhatsApp';
      whatsappFloat.innerHTML = '<i class="bi-whatsapp" aria-hidden="true"></i>';
      document.body.appendChild(whatsappFloat);
    }
    var nav = document.getElementById('navbarNav');
    var whatsappQuote = document.getElementById('quote-whatsapp');

    // Pricing was a dedicated section in the original design; expose it in every page's navigation.
    if (nav) {
      var navList = nav.querySelector('.navbar-nav');
      if (navList && !navList.querySelector('a[href="pricing.html"]')) {
        var pricingItem = document.createElement('li');
        pricingItem.className = 'nav-item';
        pricingItem.innerHTML = '<a class="nav-link" href="pricing.html">Pricing</a>';
        var projectsItem = navList.querySelector('a[href="projects.html"]');
        if (projectsItem && projectsItem.parentElement) navList.insertBefore(pricingItem, projectsItem.parentElement);
        else navList.appendChild(pricingItem);
      }
      if (/pricing\.html$/.test(window.location.pathname)) {
        var pricingLink = nav.querySelector('a[href="pricing.html"]');
        if (pricingLink) pricingLink.classList.add('active');
      }
    }

    // The original services section also included content management; keep that offering visible.
    if (/services\.html$/.test(window.location.pathname) && !document.querySelector('[data-content-management]')) {
      var serviceGrid = document.querySelector('.page-section .row.g-4');
      if (serviceGrid) {
        var contentCard = document.createElement('div');
        contentCard.className = 'col-md-6';
        contentCard.setAttribute('data-content-management', 'true');
        contentCard.innerHTML = '<div class="page-card"><i class="bi-card-list h2 text-success"></i><h3>Content management</h3><p>Admin-friendly features to manage website content, publish updates, and handle customer requests.</p><ul><li>Easy-to-use admin features</li><li>Articles and product updates</li><li>Customer enquiry management</li><li>Clear handover and support</li></ul></div>';
        serviceGrid.appendChild(contentCard);
      }
    }

    if (year) year.textContent = String(new Date().getFullYear());

    // Respect the saved preference; otherwise follow the operating system.
    var savedTheme = null;
    try { savedTheme = window.localStorage.getItem('louis-portfolio-theme'); } catch (error) { /* Storage may be disabled. */ }
    var initialTheme = savedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      if (themeToggle) {
        var dark = theme === 'dark';
        themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        themeToggle.innerHTML = dark
          ? '<i class="bi-sun" aria-hidden="true"></i><span class="theme-toggle-label">Light mode</span>'
          : '<i class="bi-moon-stars" aria-hidden="true"></i><span class="theme-toggle-label">Dark mode</span>';
      }
      var themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) themeColor.setAttribute('content', theme === 'dark' ? '#171923' : '#14b789');
    }
    applyTheme(initialTheme);

    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { window.localStorage.setItem('louis-portfolio-theme', next); } catch (error) { /* Theme still works for this page view. */ }
      });
    }

    function updateBackToTop() {
      if (backToTop) backToTop.classList.toggle('is-visible', window.scrollY > 500);
    }
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    updateBackToTop();
    if (backToTop) backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });

    // Close the mobile menu after choosing a destination.
    if (nav && window.bootstrap && window.bootstrap.Collapse) {
      nav.querySelectorAll('a[href^="#section_"]').forEach(function (link) {
        link.addEventListener('click', function () {
          if (window.getComputedStyle(nav).display !== 'none' && nav.classList.contains('show')) {
            window.bootstrap.Collapse.getOrCreateInstance(nav).hide();
          }
        });
      });
    }

    // Quote CTA links preselect the requested service in the enquiry form.
    document.querySelectorAll('.pricing-cta[data-service]').forEach(function (link) {
      link.addEventListener('click', function () {
        var serviceSelect = document.getElementById('service');
        if (serviceSelect) serviceSelect.value = link.getAttribute('data-service');
      });
    });

    if (whatsappQuote && form) {
      whatsappQuote.addEventListener('click', function () {
        if (!form.reportValidity()) return;
        var fields = new FormData(form);
        var message = [
          'Hello Louis, I would like a project quote.',
          'Name: ' + String(fields.get('name') || '').trim(),
          'Email: ' + String(fields.get('email') || '').trim(),
          'Service: ' + String(fields.get('service') || '').trim(),
          'Budget: ' + String(fields.get('budget') || '').trim(),
          'Timeline: ' + String(fields.get('timeline') || '').trim(),
          'Project details: ' + String(fields.get('message') || '').trim()
        ].join('\n');
        window.open('https://wa.me/237677449120?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
      });
    }

    if (form) {
      var submitButton = document.getElementById('contact-submit');
      var originalButtonText = submitButton ? submitButton.innerHTML : '';

      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (!form.reportValidity()) return;

        var formData = new FormData(form);
        var name = String(formData.get('name') || '').trim();
        var email = String(formData.get('email') || '').trim();
        var message = String(formData.get('message') || '').trim();
        var service = String(formData.get('service') || '').trim();
        var budget = String(formData.get('budget') || '').trim();
        var timeline = String(formData.get('timeline') || '').trim();
        if (!name || !email || !message || !service || !budget || !timeline) {
          if (status) status.textContent = 'Please complete all required fields before sending your quote request.';
          return;
        }

        formData.set('name', name);
        formData.set('email', email);
        formData.set('message', message);
        formData.set('service', service);
        formData.set('budget', budget);
        formData.set('timeline', timeline);
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.setAttribute('aria-busy', 'true');
          submitButton.textContent = 'Sending…';
        }
        if (status) status.textContent = 'Sending your message…';

        try {
          var payload = Object.fromEntries(formData.entries());
          var response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          var result = await response.json().catch(function () { return {}; });
          if (!response.ok) throw new Error(result.error || 'The form service returned an error.');
          form.reset();
          if (status) status.textContent = result.message || ('Thank you, ' + name + '. Your enquiry has been received.');
        } catch (error) {
          if (status) status.textContent = (error && error.message ? error.message + ' ' : '') + 'We could not confirm that your enquiry was saved. Please try again, or email nlouisnwufor@gmail.com directly.';
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.removeAttribute('aria-busy');
            submitButton.innerHTML = originalButtonText;
          }
        }
      });
    }
  });
}());
