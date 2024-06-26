const clientId = "5e0f086d63214b34941f736646713e5c";
const redirectUri = "https://cneale92.github.io/gigON/stats.html";
const scope = "user-read-private user-read-email";

// Function that generates a random string of specified length
const generateRandomString = (length) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join("");
};

// Asynchronous function to hash a plains string using SHA-256 algorithm
const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
};

// Function to base64 encode binary input

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

// Asynchronous function to generate code challenge from code verifier
const generateCodeChallenge = async (codeVerifier) => {
  const hashed = await sha256(codeVerifier);
  return base64encode(hashed);
};

const redirectToSpotifyLogin = async () => {
  const codeVerifier = generateRandomString(64);
  window.localStorage.setItem("code_verifier", codeVerifier);

  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  const params = {
    response_type: "code",
    client_id: clientId,
    scope,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
  };

  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString();
  return;
  };

document
  .querySelector("#spotifyAuthenticationBtn")
  .addEventListener("click", redirectToSpotifyLogin);


// Asynchronous function to exchange authorization code for access token
async function fetchAccessToken(code) {
  const codeVerifier = localStorage.getItem("code_verifier");

  // Payload for token request to Spotify

  const payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  };

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", payload);
    const data = await response.json();

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data.access_token;
  } catch (error) {
    console.error("Error fetching access token:", error);
    return null;
  }
};
////// Everything below this is for the stats page

const getAccessToken = () => {
    return localStorage.getItem("access_token");
};

const getRefreshToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  const url = "https://accounts.spotify.com/api/token";

  const payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
   }),
  };

  try {
    const response = await fetch(url, payload);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
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