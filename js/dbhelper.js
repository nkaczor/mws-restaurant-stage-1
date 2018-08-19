const port = 1337

/**
 * Common database helper functions.
 */
class DBHelper {

  static openDatabase() {
    return idb.open('restaurantDataBase', 1, (upgradeDb) => {
      upgradeDb.createObjectStore('restaurantDataBase', {
        keyPath: 'id'});
      upgradeDb.createObjectStore('reviews', {
        keyPath: 'id'})
      upgradeDb.createObjectStore('offline-post', {
        keyPath: 'createdAt'})
    });
  }

  static saveDatabase(response) {
    return DBHelper.openDatabase()
      .then((db) => {
        if (!db) return;
        let tx = db.transaction('restaurantDataBase', 'readwrite');
        let store = tx.objectStore('restaurantDataBase');
        response.forEach((restaurant) => store.put(restaurant));
        return tx.complete;
      });
  }

  static getCachedRestaurants() {
    return DBHelper.openDatabase().then((db) => {
      if (!db) return;
      let tx = db.transaction('restaurantDataBase');
      let store = tx.objectStore('restaurantDataBase');
      return store.getAll();
    });
  }

 /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */

  static get RESTAURANTS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get REVIEWS_URL() {
     // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  static fetchRestaurants() {
    return fetch(DBHelper.RESTAURANTS_URL)
      .then(this.handleErrors)
      .then(response => response.json())
      .then(response => {
        DBHelper.saveDatabase(response);
        return response;
      })
  }

  static handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
  }

  /**
   * Fetch all restaurants.
   */
  static getRestaurants(callback) {
    return DBHelper.getCachedRestaurants()
      .then((restaurants) => {
        if (restaurants.length) {
          return Promise.resolve(restaurants);
        } else {
          return this.fetchRestaurants();
        }
      })
      .then(response =>
        callback(null, response)
      )
      .catch((error) =>
        callback(error, null)
      );
  }

  static favourite(id, value) {
    return fetch(`${DBHelper.RESTAURANTS_URL}/${id}/?is_favourite=${value}` , {
      method: "PUT"
    })
    .then(data => data.json())
    .then(data => {
      return DBHelper.openDatabase().then(db => {
        if (!db) return;
        const tx = db.transaction('reviews', 'readwrite');
        const store = tx.objectStore('reviews');
        store.put(data)
        return data;
      });
    })
  }

  static getRestaurantById(id, callback) {
    return DBHelper.getRestaurants(((error, response) => {
      if(error) {
        return callback(error, null);
      }
      const restaurant = response.find(el => el.id == id);
      return callback(null, restaurant);
    }))
  }

  static getCachedReviews(id) {
    return DBHelper.openDatabase().then(db => {
			if (!db) return;
			const tx = db.transaction('reviews');
			const store = tx.objectStore('reviews');
      return store.getAll().then(result => result.filter(el => el.id === id))
    });
  }

  static getReviewsById(id) {
    return DBHelper.getCachedReviews(id).then(results => {
				if (results && results.length) {
					return results;
				} else {
					return fetch(DBHelper.REVIEWS_URL + '/?restaurant_id=' + id)
            .then(response => {
              return response.json();
            })
            .then(reviews => {
              DBHelper.openDatabase().then(db => {
                if (!db) return;
                const tx = db.transaction('reviews', 'readwrite');
                const store = tx.objectStore('reviews');
                reviews.forEach(review => {
                  store.put(review);
                })
              });
              return reviews;
            })
				}
			})
  }


  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static getRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.getRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static getRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.getRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static getRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.getRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  static postReview(review) {
    return fetch(DBHelper.REVIEWS_URL, {
      method: "POST",
      body: JSON.stringify(review)
    })
    .then(response => response.json())
    .then(data => {
      DBHelper.openDatabase().then(db => {
          if (!db) return;
          const tx = db.transaction('reviews', 'readwrite');
          const store = tx.objectStore('reviews');
          store.put(data);
        });
        return data;
      })
    .catch(() => {
      const reviewToSave = {
        ...review,
        ['createdAt']: new Date().getTime()
      };
      DBHelper.openDatabase().then(db => {
        if (!db) return;
        const tx = db.transaction('offline-post', 'readwrite');
        const store = tx.objectStore('offline-post');
        store.put(reviewToSave);
      });
      return;
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static getNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.getRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static getCuisines(callback) {
    // Fetch all restaurants
    DBHelper.getRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Restaurant image URL.
   */
  static webpImageUrlForRestaurant(restaurant) {
    return (`/img/webp/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant) {
    const marker = {
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
    };
    return marker;
  }

}
