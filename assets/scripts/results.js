// Event Listener for the location search modal

document.addEventListener("DOMContentLoaded", function () {
    const openModalButton = document.getElementById("open-modal-button");
    const closeModalButtons = document.querySelectorAll(".delete, .cancel-button");
    const searchButton = document.getElementById("search-button");
    const locationInput = document.getElementById("location-input");

    if (openModalButton && closeModalButtons && searchButton && locationInput) {
        // Open modal event listener
        openModalButton.addEventListener("click", function () {
            const locationModal = document.getElementById("location-modal");
            locationModal.classList.add("is-active");
            locationInput.value = ""; // Clear previous input on modal open
            const errorMessage = document.getElementById("error-message");
            if (errorMessage) errorMessage.textContent = ""; // Clear previous error message
        });

        // Close modal event listeners
        closeModalButtons.forEach((button) => {
            button.addEventListener("click", function () {
                const locationModal = document.getElementById("location-modal");
                locationModal.classList.remove("is-active");
            });
        });

        // Search button event listener
        searchButton.addEventListener("click", function () {
            const locationValue = locationInput.value.trim();
            const locationPattern = /^[a-zA-Z\s]+,\s*[A-Z]{2}$/; // Regex pattern for "City, StateCode" format Ticketmaster requires

            if (!locationPattern.test(locationValue)) {
                const errorMessage = document.getElementById("error-message");
                if (errorMessage) errorMessage.textContent = "Please enter a valid location format (e.g., Austin, TX).";
                return; // Prevent further execution if format is incorrect
            }

            const [city, stateCountry] = locationValue.split(",").map((item) => item.trim());
            fetchAndDisplayEvents(stateCountry, city);

            // Close modal if search is successful
            const locationModal = document.getElementById("location-modal");
            locationModal.classList.remove("is-active");
        });

        // Cancel button event listener (to close modal)
        const cancelButton = document.querySelector(".cancel-button");
        cancelButton.addEventListener("click", function () {
            const locationModal = document.getElementById("location-modal");
            locationModal.classList.remove("is-active");
        });
    } 
});

  // Function to fetch events from Ticketmaster for a specific artist
  function fetchTicketmasterEvents(stateCountry, city, artist) {
    const apiKey = "PBfMUdFBnTSYC6GWk3cAGkK4pHGSRD5q";
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&stateCode=${stateCountry}&city=${city}&classificationName=Music&keyword=${encodeURIComponent(
      artist
    )}`;

    return fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data._embedded && data._embedded.events) {
          return data._embedded.events;
        } else {
          return [];
        }
      })
      .catch((error) => {
        return [];
      });
  }

// Function to retrieve stored artists from local storage
  function getStoredArtists() {
    const storedArtists = JSON.parse(localStorage.getItem("top_artists")) || [];
    return storedArtists.map((artist) => artist.name);
  }

  // Function to fetch and display events
  async function fetchAndDisplayEvents(stateCountry, city) {
    const storedArtists = getStoredArtists();
    const allEvents = [];

    for (const artist of storedArtists) {
      try {
        const events = await fetchTicketmasterEvents(
          stateCountry,
          city,
          artist
        );
        allEvents.push(...events);
      } catch (error) {
        return;
      }
    }

    displayEvents(allEvents);

    // Close modal if events are fetched successfully
    const locationModal = document.getElementById("location-modal");
    locationModal.classList.remove("is-active");

  }

  // Function to display events on the page and append the results to the html
  function displayEvents(events) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    events.forEach((event) => {
      const eventDiv = document.createElement("div");
      eventDiv.className = "event";

      const eventName = document.createElement("h2");
      eventName.textContent = event.name;
      eventDiv.appendChild(eventName);

      if (event.images && event.images.length > 0) {
        const eventImage = document.createElement("img");
        eventImage.src = event.images[0].url;
        eventImage.alt = event.name;
        eventDiv.appendChild(eventImage);
      }

      if (event.dates && event.dates.start && event.dates.start.dateTime) {
        const eventDate = document.createElement("p");
        eventDate.textContent = `Date: ${new Date(
          event.dates.start.dateTime
        ).toLocaleString()}`;
        eventDiv.appendChild(eventDate);
      }

      if (
        event._embedded &&
        event._embedded.venues &&
        event._embedded.venues.length > 0
      ) {
        const eventVenue = document.createElement("p");
        eventVenue.textContent = `Venue: ${event._embedded.venues[0].name}`;
        eventDiv.appendChild(eventVenue);
      }

      if (event.url) {
        const eventLink = document.createElement("a");
        eventLink.href = event.url;
        eventLink.textContent = "Buy Tickets";
        eventLink.target = "_blank";
        eventDiv.appendChild(eventLink);
      }

      resultsDiv.appendChild(eventDiv);
    });
  }