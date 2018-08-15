registerServiceWorker = function() {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('../sw.js');

  navigator.serviceWorker.ready.then(function(swRegistration) {
    return swRegistration.sync.register('reviews_sync');
  });
}

registerServiceWorker();

