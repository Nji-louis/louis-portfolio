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

    // Lightweight bilingual mode for the public homepage. Text nodes are translated
    // in place so existing links, icons, and layout remain intact.
    var languageToggle = document.getElementById('language-toggle');
    if (!languageToggle) {
      languageToggle = document.createElement('button');
      languageToggle.className = 'language-toggle';
      languageToggle.id = 'language-toggle';
      languageToggle.type = 'button';
      languageToggle.textContent = 'FR';
      languageToggle.setAttribute('aria-label', 'Passer le site en français');
      languageToggle.setAttribute('aria-pressed', 'false');
    }
    if (languageToggle) {
      // Keep the floating control outside the blurred navbar so fixed positioning
      // is relative to the viewport on every browser.
      document.body.appendChild(languageToggle);
      var translations = {
        'Home': 'Accueil', 'About': 'À propos', 'Services': 'Services', 'Pricing': 'Tarifs', 'Dark mode': 'Mode sombre', 'Light mode': 'Mode clair',
        'Projects': 'Projets', 'Contact': 'Contact', 'Start a project': 'Démarrer un projet',
        'Full-stack developer · Cameroon': 'Développeur full-stack · Cameroun',
        'Digital experiences built to move your business forward.': 'Des expériences numériques pour faire avancer votre activité.',
        'I help ambitious businesses turn ideas into fast, clear, and dependable websites and web applications.': 'J’aide les entreprises ambitieuses à transformer leurs idées en sites web et applications rapides, clairs et fiables.',
        'Explore my work': 'Découvrir mes réalisations', 'Let’s talk': 'Parlons-en',
        'Live projects': 'Projets en ligne', 'Stack delivery': 'Développement full-stack', 'Collaboration': 'Collaboration',
        'What I do': 'Ce que je fais', 'The right mix of design, code, and strategy.': 'Le bon équilibre entre design, code et stratégie.',
        'From a polished business website to the backend behind a growing platform, I build with a focus on clarity and real-world results.': 'D’un site vitrine soigné au backend d’une plateforme en pleine croissance, je construis des solutions claires et utiles.',
        'Websites': 'Sites web', 'Responsive, accessible websites that make your offer easy to understand and easy to trust.': 'Des sites web responsives et accessibles qui rendent votre offre facile à comprendre et digne de confiance.',
        'View services': 'Voir les services', 'Web applications': 'Applications web',
        'Practical full-stack features, APIs, dashboards, and database integrations for your workflow.': 'Des fonctionnalités full-stack, des API, des tableaux de bord et des intégrations de bases de données adaptés à votre activité.',
        'See selected work': 'Voir mes réalisations', 'Clear collaboration': 'Collaboration claire',
        'A focused process, transparent communication, and a clean handover when the work is done.': 'Un processus structuré, une communication transparente et une remise de projet claire.',
        'Learn about me': 'En savoir plus sur moi', 'A thoughtful approach': 'Une approche réfléchie',
        'Technology should feel useful, not complicated.': 'La technologie doit être utile, pas compliquée.',
        'I partner with business owners and teams to create digital tools that are easy to use, maintain, and grow. Every project starts with understanding what matters to you.': 'Je collabore avec les entrepreneurs et les équipes pour créer des outils numériques faciles à utiliser, maintenir et faire évoluer. Chaque projet commence par la compréhension de vos priorités.',
        'More about Louis': 'En savoir plus sur Louis', 'Available for new projects.': 'Disponible pour de nouveaux projets.',
        'Selected work': 'Réalisations sélectionnées', 'Projects made for real people and real workflows.': 'Des projets conçus pour de vraies personnes et de vrais besoins.',
        'A few examples of the websites and full-stack systems I’ve built for businesses.': 'Voici quelques exemples de sites web et de systèmes full-stack que j’ai créés pour des entreprises.',
        'Business website · Full stack': 'Site vitrine · Full-stack', 'Corporate website · Full stack': 'Site corporate · Full-stack',
        'A cocoa and coffee business website for showcasing products, publishing articles, and managing a product gallery, customer inquiries, and quote requests through an admin dashboard.': 'Un site pour une entreprise de cacao et de café afin de présenter ses produits, publier des articles et gérer sa galerie, ses demandes et ses devis depuis un tableau de bord.',
        'A corporate website presenting company information, services, team members, and testimonials, with backend features for managing content and user interactions.': 'Un site corporate présentant l’entreprise, ses services, son équipe et ses témoignages, avec des fonctionnalités backend pour gérer le contenu et les interactions.',
        'Visit website': 'Visiter le site', 'Frontend code': 'Code frontend', 'Backend code': 'Code backend',
        'Your project next?': 'Votre projet ensuite ?', 'Let’s make it the next case study.': 'Faisons-en la prochaine étude de cas.', 'Start a conversation': 'Démarrer une conversation',
        'Services': 'Services', 'Useful digital work, scoped around your goals.': 'Des solutions numériques utiles, adaptées à vos objectifs.',
        'Whether you need to get online, sell online, or connect the tools behind your business, I can help.': 'Que vous souhaitiez être visible en ligne, vendre en ligne ou connecter les outils de votre entreprise, je peux vous aider.',
        'Responsive websites': 'Sites web responsives', 'Modern, mobile-friendly business websites designed to present your services clearly and make it easy for customers to reach you.': 'Des sites web modernes et adaptés aux mobiles, conçus pour présenter clairement vos services et faciliter le contact avec vos clients.',
        'Business and portfolio websites': 'Sites vitrines et portfolios', 'Mobile-first layouts': 'Mises en page mobile-first', 'Contact and WhatsApp calls-to-action': 'Appels à l’action par contact et WhatsApp', 'Basic SEO and launch support': 'SEO de base et accompagnement au lancement',
        'Backend & REST APIs': 'Backend et API REST', 'Node.js and Express.js services that connect your interface to secure, maintainable application features.': 'Des services Node.js et Express.js qui relient votre interface à des fonctionnalités sécurisées et faciles à maintenir.',
        'Custom API endpoints': 'Points d’accès API personnalisés', 'Authentication and permissions': 'Authentification et permissions', 'Third-party integrations': 'Intégrations tierces', 'Testing and documentation': 'Tests et documentation',
        'Database integration': 'Intégration de base de données', 'MySQL-backed data for real business needs, from product catalogues and articles to customer inquiries.': 'Des données MySQL pour vos besoins métier, des catalogues produits et articles aux demandes clients.',
        'Data modelling': 'Modélisation des données', 'CRUD workflows': 'Flux CRUD', 'Admin dashboards': 'Tableaux de bord administrateur', 'Reliable data handling': 'Gestion fiable des données',
        'E-commerce experiences': 'Expériences e-commerce', 'Product catalogues and shopping journeys built around your sales process and ready to grow with your business.': 'Des catalogues produits et parcours d’achat conçus autour de votre processus de vente et prêts à évoluer avec votre activité.',
        'Product and category pages': 'Pages produits et catégories', 'Cart or order enquiry flows': 'Parcours de panier ou de demande de commande', 'Payment integration planning': 'Planification de l’intégration des paiements', 'Handover and support': 'Remise et assistance',
        'How it works': 'Comment ça marche', 'A simple path from idea to launch.': 'Un parcours simple de l’idée au lancement.', 'Understand': 'Comprendre', 'We clarify the goals, audience, content, and features your project actually needs.': 'Nous clarifions les objectifs, le public, le contenu et les fonctionnalités réellement nécessaires.',
        'Build': 'Construire', 'I design and develop in focused stages, keeping you informed along the way.': 'Je conçois et développe par étapes ciblées en vous tenant informé.', 'Launch & support': 'Lancement et assistance', 'You receive a tested website, a clear handover, and help keeping it healthy.': 'Vous recevez un site testé, une remise claire et une aide pour le maintenir en bon état.',
        'Ready when you are': 'Prêt quand vous l’êtes', 'Have a project in mind?': 'Vous avez un projet en tête ?', 'Request a quote': 'Demander un devis', 'Let’s build something useful.': 'Construisons quelque chose d’utile.',
        'Start a project': 'Démarrer un projet', 'Tell me what you’re building.': 'Parlez-moi de votre projet.', 'Share a little about your goals, and I’ll get back to you with the best next step.': 'Parlez-moi de vos objectifs et je vous répondrai avec la meilleure prochaine étape.',
        'Let’s connect.': 'Échangeons.', 'Open to website and full-stack development projects.': 'Disponible pour des projets de sites web et de développement full-stack.', 'Message on WhatsApp': 'Écrire sur WhatsApp',
        'Send quote request': 'Envoyer la demande de devis', 'Continue on WhatsApp': 'Continuer sur WhatsApp', 'Your enquiry is saved securely. Please don’t include passwords or sensitive personal information.': 'Votre demande est enregistrée en toute sécurité. N’incluez pas de mots de passe ni d’informations personnelles sensibles.'
        , 'About me': 'À propos de moi', 'Building with curiosity and care.': 'Construire avec curiosité et attention.', 'I’m Louis, a full-stack website developer who enjoys turning real business needs into useful digital products.': 'Je suis Louis, développeur web full-stack. J’aime transformer les besoins réels des entreprises en produits numériques utiles.', 'My story': 'Mon parcours', 'A developer who thinks beyond the screen.': 'Un développeur qui voit au-delà de l’écran.', 'I’m a passionate full-stack website developer specializing in modern, responsive, and user-friendly web applications. I work across frontend and backend development, creating seamless user experiences, reliable APIs, and efficient database solutions.': 'Je suis un développeur web full-stack passionné, spécialisé dans les applications modernes, responsives et faciles à utiliser. Je travaille sur le frontend et le backend pour créer des expériences fluides, des API fiables et des solutions de bases de données efficaces.', 'I’m eager to learn new technologies, solve real-world problems, and collaborate on projects that deliver meaningful results.': 'J’ai envie d’apprendre de nouvelles technologies, de résoudre des problèmes concrets et de collaborer sur des projets aux résultats utiles.', 'Let’s work together': 'Travaillons ensemble', 'Information': 'Informations', 'Name': 'Nom', 'Role': 'Rôle', 'Full-Stack Developer': 'Développeur full-stack', 'Phone': 'Téléphone', 'What I work with': 'Mes technologies', 'Comfortable across the stack.': 'À l’aise sur toute la stack.', 'From polished interfaces to server-side features and data storage, I can contribute across the full web application lifecycle.': 'Des interfaces soignées aux fonctionnalités serveur et au stockage des données, je peux contribuer à tout le cycle de vie d’une application web.',
        'Services & pricing': 'Services et tarifs', 'Clear starting points for your next project.': 'Des points de départ clairs pour votre prochain projet.', 'Every project is scoped before work begins. International projects can be quoted in USD.': 'Chaque projet est cadré avant le début du travail. Les projets internationaux peuvent être chiffrés en USD.', 'GET ONLINE': 'SOYEZ EN LIGNE', 'SELL ONLINE': 'VENDEZ EN LIGNE', 'CONNECT & AUTOMATE': 'CONNECTEZ ET AUTOMATISEZ', 'ONGOING SUPPORT': 'ASSISTANCE CONTINUE', 'Business Website': 'Site vitrine', 'E-commerce Website': 'Site e-commerce', 'API & Automation': 'API et automatisation', 'Website care plans': 'Forfaits de maintenance', 'Keep your website updated, secure, and working after launch.': 'Gardez votre site à jour, sécurisé et fonctionnel après son lancement.', 'Discuss a care plan': 'Discuter d’un forfait', 'Prices are indicative starting rates, not a final offer. Hosting, domain names, paid plugins, payment-provider fees, advanced content entry, and other third-party costs are excluded unless specified in your written quote. Final pricing depends on scope, content readiness, integrations, and delivery timeline.': 'Les prix sont des tarifs de départ indicatifs et non une offre finale. L’hébergement, les noms de domaine, les extensions payantes, les frais de paiement, la saisie avancée de contenu et les autres coûts tiers sont exclus sauf indication dans votre devis écrit. Le prix final dépend du périmètre, de la préparation du contenu, des intégrations et du délai de livraison.'
      };
      var originalTranslations = {};
      Object.keys(translations).forEach(function (english) { originalTranslations[translations[english]] = english; });

      function applyLanguage(language) {
        var toFrench = language === 'fr';
        var dictionary = toFrench ? translations : originalTranslations;
        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        var node;
        while ((node = walker.nextNode())) {
          if (node.parentElement && (node.parentElement.closest('script, style, .language-toggle') || node.parentElement.classList.contains('brand-dot'))) continue;
          var text = node.nodeValue.trim();
          if (dictionary[text]) node.nodeValue = node.nodeValue.replace(text, dictionary[text]);
        }
        document.documentElement.lang = toFrench ? 'fr' : 'en';
        languageToggle.textContent = toFrench ? 'EN' : 'FR';
        languageToggle.setAttribute('aria-label', toFrench ? 'Switch the site to English' : 'Passer le site en français');
        languageToggle.setAttribute('aria-pressed', toFrench ? 'true' : 'false');
        try { window.localStorage.setItem('louis-portfolio-language', language); } catch (error) { /* Translation still works for this page view. */ }
      }

      var savedLanguage = null;
      try { savedLanguage = window.localStorage.getItem('louis-portfolio-language'); } catch (error) { /* Storage may be disabled. */ }
      applyLanguage(savedLanguage === 'fr' ? 'fr' : 'en');
      languageToggle.addEventListener('click', function () {
        applyLanguage(document.documentElement.lang === 'fr' ? 'en' : 'fr');
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
