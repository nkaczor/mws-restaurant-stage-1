let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []


/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.getNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.getCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

initMap = () => {
  let loc = [
    40.722216,
    -73.987501
  ];

  self.map = L.map('map').setView(loc, 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(self.map);

  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.getRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  //TODO delete all markers
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const observer = lozad('.lozad', {
    loaded: function(el) {
        // Custom implementation on a loaded element
        el.querySelector('img').alt = el.getAttribute('data-alt')
    }
  });
   // lazy loads elements with default selector as '.lozad'
  observer.observe();

  if (restaurant.photograph) {
    const image = document.createElement('picture');
    image.setAttribute('data-alt', restaurant.name);
    image.setAttribute('data-iesrc', DBHelper.imageUrlForRestaurant(restaurant))
    const webp_image = document.createElement('source');
    const jpeg_image = document.createElement('source');
    image.className = 'restaurant-img lozad';
    webp_image.setAttribute('srcset', DBHelper.webpImageUrlForRestaurant(restaurant));
    jpeg_image.setAttribute('srcset', DBHelper.imageUrlForRestaurant(restaurant));
    image.append(webp_image);
    image.append(jpeg_image);

    li.append(image);
  }

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('adress');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', 'View Details of ' + restaurant.name);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant);
    L.marker([marker.position.lat, marker.position.lng])
    .addTo(self.map)
    .on('click', () => {
        window.location.href = marker.url
      });

    // google.maps.event.addListener(marker, 'click', () => {
    //   window.location.href = marker.url
    // });
  });
}

load = () => {
  fetchNeighborhoods();
  fetchCuisines();
  initMap();
};

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', load); // Document still loading so DomContentLoaded can still fire :)
} else {
  load();
}