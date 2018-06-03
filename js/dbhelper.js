/**
 * Common database helper functions.
 */
class DBHelper {

  static openDatabase() {
    return idb.open('restaurantDataBase', 1, (upgradeDb) => {
      upgradeDb.createObjectStore('restaurantDataBase', {
        keyPath: 'id'});
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

  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static fetchRestaurants() {
    return fetch(DBHelper.DATABASE_URL)
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

  static getRestaurantById(id, callback) {
    return DBHelper.getRestaurants(((error, response) => {
      if(error) {
        return callback(error, null);
      }
      const restaurant = response.find(el => el.id == id);
      return callback(null, restaurant);
    }))
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
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
