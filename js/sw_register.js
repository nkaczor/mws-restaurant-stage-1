registerServiceWorker = function() {
  if (!navigator.serviceWorker) return;

  var indexController = this;
  navigator.serviceWorker.register('../sw/index.js');
}

registerServiceWorker();

