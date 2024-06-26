const clientId = "5e0f086d63214b34941f736646713e5c";

// Get the access token from localStorage
const getAccessToken = () => {
  return window.localStorage.getItem("access_token");
};

// Asynchronous function to refresh the access token
const getRefreshToken = async () => {
  const refreshToken = window.localStorage.getItem("refresh_token");

  const payload = {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  };

  // logging the payload object to the console to verify it's done correctly
  console.log("Token Request Payload:", payload);

  try {
    const response = await fetch(
      "https://accounts.spotify.com/api/token",
      payload
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    window.localStorage.setItem("access_token", data.access_token);
    return data.access_token;
  } catch (error) {
    console.error("Error fetching refresh token:", error);
    return null;
  }
};

// Function to fetch the top artists from the Spotify APII

const fetchTopArtists = async (token) => {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/top/artists", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("API Response:", data); // Log entire response
    return data.items; // Return the array of top artists
  } catch (error) {
    console.error("Error fetching top artists:", error);
    return []; // Return empty array if there's an error
  }
};

// Function to display top artists on the page
const displayTopArtists = (artists) => {
  const topArtistOl = document.querySelector("#topArtist ol");

  artists.forEach((artist, index) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `results.html?artist=${encodeURIComponent(artist.name)}`;
    a.textContent = `${index + 1}. ${artist.name}`;
    li.appendChild(a);
    topArtistOl.appendChild(li);
  });
};

// Main function to fetch and display top artists
const main = async () => {
  try {
    let accessToken = getAccessToken();
    if (!accessToken) {
      // If access token is not found, try to refresh it
      accessToken = await getRefreshToken();
      if (!accessToken) {
        console.error("Access token not found or could not be refreshed.");
      }
    }

    const topArtists = await fetchTopArtists(accessToken);
    console.log("Top Artists:", topArtists); // Log top artists to check if data is fetched correctly
    displayTopArtists(topArtists);
  } catch (error) {
    console.error("Error in main function:", error);
  }
};

// Call the main function to start fetching and displaying top artists
main();
