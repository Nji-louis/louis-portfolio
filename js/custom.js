(function () {
  'use strict';
  // Keep the shared portfolio behavior active on every standalone page.
  var script = document.createElement('script');
  script.src = 'js/portfolio.js';
  script.onload = function () {
    if (document.readyState !== 'loading') document.dispatchEvent(new Event('DOMContentLoaded'));
  };
  document.head.appendChild(script);
}());
