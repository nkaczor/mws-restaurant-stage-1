let restaurant;
var map;

initMap = () => {
  getRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      let loc = [restaurant.latlng.lat, restaurant.latlng.lng]
      self.map = L.map('map', {zoomControl: false}).setView(loc, 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(self.map);
      fillBreadcrumb();
      const marker = DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      L.marker([marker.position.lat, marker.position.lng])
      .addTo(self.map)
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
getRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.getRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });

    DBHelper.getReviewsById(id).then((reviews) => {
      if (!reviews) {
        console.error("error");
        return;
      }
      fillReviewsHTML(reviews);
    })
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  console.log(restaurant)

  const fav = document.getElementById('restaurant-add-to-favourite');
  fav.innerHTML = !restaurant.is_favourite ? 'Add to favourite' : 'Delete from favourite';

  fav.addEventListener('click', event => {
    event.preventDefault();
    DBHelper.favourite(restaurant.id, !restaurant.is_favourite).then(() => {
      restaurant.is_favourite = !restaurant.is_favourite;
      fav.innerHTML = !restaurant.is_favourite ? 'Add to favourite' : 'Delete from favourite'
    });
  });

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h4');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('time');
  date.innerHTML = new Date(review.createdAt);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const element = document.querySelector('#review-form');
element.addEventListener('submit', event => {
  event.preventDefault();

  const review = {
    restaurant_id: getParameterByName('id'),
    name: document.getElementById('name').value,
    rating: document.getElementById('rating').value,
    comments: document.getElementById('comments').value,
    date: new Date()
  };

  document.getElementById('name').value = '';
  document.getElementById('rating').value = null;
  document.getElementById('comments').value = '';

  DBHelper.postReview(review);
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));
});


load = () => {
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