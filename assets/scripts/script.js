// Create a code verifier
const generateRandomString = (length) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const codeVerifier = generateRandomString(64);

// Transform code verifier using the SHA256 algorithm
const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
};

// Implement a function base64encode that returns the base64 representation of the digest we just calculated with the sha256 function
const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

// Implementing the code challeneg generation
const hashed = sha256(codeVerifier);
const codeChallenge = base64encode(hashed);

//Request User Authorization
const clientId = `5e0f086d63214b34941f736646713e5c`;
const redirectUri = `https://cneale92.github.io/gigON/stats.html`;

const scope = 'user-read-private user-read-email';
const authUrl = new URL("https://accounts.spotify.com/authorize")

// generated in the previous step
window.localStorage.setItem('code_verifier', codeVerifier);

const params =  {
  response_type: 'code',
  client_id: clientId,
  scope,
  code_challenge_method: 'S256',
  code_challenge: codeChallenge,
  redirect_uri: redirectUri,
}

authUrl.search = new URLSearchParams(params).toString();
window.location.href = authUrl.toString();

// User Authorization Response 
const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get("code");

// Request Access Token
const getToken = async code => {

  // stored in the previous step
  let codeVerifier = localStorage.getItem('code_verifier');

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  }

  const body = await fetch(url, payload);
  const response = await body.json();

  localStorage.setItem('access_token', response.access_token);
}




// set up spotify authorization
//const spotifyClientId = `5e0f086d63214b34941f736646713e5c`;
//const spotifyRedirectUri = `https://cneale92.github.io/gigON/stats.html`;
//const spotifyScopes = `user-top-read`;

// write a function to redirect the user to the Spotify login when they click the login button
//function redirectToSpotifyLogin() {
  //const authURL = `https://accounts.spotify.com/authorize?client_id=${spotifyClientId}&redirect_uri=${encodeURIComponent(
    //spotifyRedirectUri
  //)}&scope=${encodeURIComponent(spotifyScopes)}&response_type=token`;
  //window.location.href = authURL;
//}

// use an event listener for the login button
//document
  //.querySelector(".button")
  //.addEventListener("click", redirectToSpotifyLogin);
