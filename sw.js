var staticCacheName = 'mws-restaurant-v2';
var allCaches = [
  staticCacheName,
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        './index.html',
        './restaurant.html',
        './img/1.jpg',
        './img/2.jpg',
        './img/3.jpg',
        './img/4.jpg',
        './img/5.jpg',
        './img/6.jpg',
        './img/7.jpg',
        './img/8.jpg',
        './img/9.jpg',
        './img/10.jpg',
        './css/styles.css',
        './js/dbhelper.js',
        './js/main.js',
        './js/restaurant_info.js'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);
  if (requestUrl.origin === location.origin) {
    event.respondWith(
      caches.open(staticCacheName).then(function(cache) {
        return cache.match(event.request, {ignoreSearch: true}).then(function (response) {
          return response || fetch(event.request).then(function(response) {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});


self.addEventListener('sync', function (event) {
	if (event.tag == 'reviews_sync') {
		const DBOpenRequest = indexedDB.open('restaurantDataBase', 1, function (upgradeDb) {
      upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
      upgradeDb.createObjectStore('offline-post', { keyPath: 'createdAt' });
    });
		DBOpenRequest.onsuccess = function (e) {
      db = DBOpenRequest.result;
      let tx = db.transaction('offline-post', 'readwrite');
      let store = tx.objectStore('offline-post');
			let request = store.getAll();
			request.onsuccess = function () {
				for (let i = 0; i < request.result.length; i++) {
					fetch(`http://localhost:1337/reviews/`, {
						body: JSON.stringify(request.result[i]),
						method: 'POST',
					})
					.then(response => response.json())
					.then(data => {
						let tx = db.transaction('reviews', 'readwrite');
						let store = tx.objectStore('reviews');
						let request = store.add(data);
						request.onsuccess = function (data) {
							let tx = db.transaction('offline-post', 'readwrite');
							let store = tx.objectStore('offline-post');
							let request = store.clear();
							request.onsuccess = function () { };
							request.onerror = function (e) {
								console.log(e);
							}
						};
						request.onerror = function (e) {
							console.log(e);
						}
					})
					.catch(function(e) {
						console.log(e);
					})
				}
			}
			request.onerror = function (e) {
				console.log(e);
			}
		}
		DBOpenRequest.onerror = function (e) {
			console.log(e);
		}
	}
});

self.addEventListener('activate', function(event) {
  console.log('Activating new service worker...');

  var cacheWhitelist = [staticCacheName];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});