// set up spotify authorization
const spotifyClientID = `5e0f086d63214b34941f736646713e5c`;
const spotifyRedirectUri = `Cneale92.github.io/gigON/stats.html`;
const spotifyScopes = `user-top-read`; 

// write a function to redirect the user to the Spotify login when they click the login button
function redirectToSpotifyLogin() {
    const authURL = `https://accounts.spotify.com/authorize?client_id=${spotifyClientId}&redirect_uri=${encodeURIComponent(spotifyRedirectUri)}&scope=${encodeURIComponent(spotifyScopes)}&response_type=token`;
    window.location.href = authURL;    
}
 
// use an event listener for the login button
document.querySelector('.button').addEventListener('click', redirectToSpotifyLogin);


