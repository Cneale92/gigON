const clientId = "5e0f086d63214b34941f736646713e5c";

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
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
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
    return null; // Return null or handle error as appropriate
  }
};

    
const getAccessToken = () => {
  return localStorage.getItem("access_token");
};

const fetchTopArtists = async (token) => {
  try {
    const response = fetch("https://api.spotify.com/v1/me/top/artists", {
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

const main = async () => {
  try {
    let accessToken = getAccessToken();
    if (!accessToken) {
      accessToken = await getRefreshToken();
      if (!accessToken) {
        console.error("Access token not found or could not be refreshed.");
        return;
      }
    }

    const topArtists = fetchTopArtists(accessToken);
    console.log("Top Artists:", topArtist); // Log top artists to check if data is fetched correctly
    displayTopArtists(topArtist);
  } catch (error) {
    console.error("Error in main function:", error);
  }
};

main();
