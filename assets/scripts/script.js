const clientId = "5e0f086d63214b34941f736646713e5c";
const redirectUrl = "https://cneale92.github.io/gigON/";
const authorizationEndpoint = "https://accounts.spotify.com/authorize";
const tokenEndpoint = "https://accounts.spotify.com/api/token";
const scope = "user-read-private user-read-email user-top-read";

// Data structure that manages the current active token, caching it in localStorage
const currentToken = {
  get access_token() {
    return localStorage.getItem("access_token") || null;
  },
  get refresh_token() {
    return localStorage.getItem("refresh_token") || null;
  },
  get expires_in() {
    return localStorage.getItem("expires_in") || null;
  },
  get expires() {
    return localStorage.getItem("expires") || null;
  },

  save: function (response) {
    const { access_token, refresh_token, expires_in } = response;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("expires_in", expires_in);

    const now = new Date();
    const expiry = new Date(now.getTime() + expires_in * 1000);
    localStorage.setItem("expires", expiry);
  },
};

// On page load, try to fetch auth code from current browser search URL
const args = new URLSearchParams(window.location.search);
const code = args.get("code");

// If we find a code, we're in a callback, do a token exchange
if (code) {
  (async () => {
    const token = await getToken(code);
    currentToken.save(token);

    // Remove code from URL so we can refresh correctly.
    const url = new URL(window.location.href);
    url.searchParams.delete("code");

    const updatedUrl = url.search ? url.href : url.href.replace("?", "");
    window.history.replaceState({}, document.title, updatedUrl);
  })();
}

// If we have a token, we're logged in, so fetch user data and render logged in template
if (currentToken.access_token) {
  (async () => {
    const userData = await getUserData();
    const topArtists = await getTopArtists();

    //combined user data with top artists to simplify code down the line for binding
    const combinedData = {
      ...userData,
      top_artists: topArtists,
    };

    console.log("User data fetched:", combinedData);
    renderTemplate("main", "logged-in-template", combinedData);
    renderTemplate("oauth", "oauth-template", currentToken);

    // save top artists to local storage to use in results page
    localStorage.setItem(
      "top_artists",
      JSON.stringify(combinedData.top_artists.items)
    );
  })();
} else {
  // Otherwise we're not logged in, so render the login template
  renderTemplate("main", "login");
}

async function redirectToSpotifyAuthorize() {
  console.log("Redirecting to Spotify for authorization...");

  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = crypto.getRandomValues(new Uint8Array(64));
  const randomString = randomValues.reduce(
    (acc, x) => acc + possible.charAt(x % possible.length),
    ""
  );

  const code_verifier = randomString;
  const data = new TextEncoder().encode(code_verifier);
  const hashed = await crypto.subtle.digest("SHA-256", data);

  const code_challenge_base64 = btoa(
    String.fromCharCode(...new Uint8Array(hashed))
  )
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  window.localStorage.setItem("code_verifier", code_verifier);

  const authUrl = new URL(authorizationEndpoint);
  const params = {
    response_type: "code",
    client_id: clientId,
    scope: scope,
    code_challenge_method: "S256",
    code_challenge: code_challenge_base64,
    redirect_uri: redirectUrl,
  };

  authUrl.search = new URLSearchParams(params).toString();
  console.log(`Auth URL: ${authUrl.toString()}`);
  window.location.href = authUrl.toString(); // Redirect the user to the authorization server for login
}


// Spotify API Calls

// function to get token from local storage
async function getToken(code) {
  const code_verifier = localStorage.getItem("code_verifier");

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUrl,
      code_verifier: code_verifier,
    }),
  });

  return await response.json();
}

// function to refresh the token
async function refreshToken() {
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: currentToken.refresh_token,
    }),
  });

  return await response.json();
}
/// function to retrieve user data from spotify
async function getUserData() {
  const response = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: "Bearer " + currentToken.access_token },
  });

  return await response.json();
}

// function to retrieve user's top artists
async function getTopArtists() {
  const response = await fetch("https://api.spotify.com/v1/me/top/artists", {
    method: "GET",
    headers: { Authorization: "Bearer " + currentToken.access_token },
  });

  return await response.json();
}

// Click handlers

async function loginWithSpotifyClick() {
  await redirectToSpotifyAuthorize();
}

async function logoutClick() {
  localStorage.clear();
  window.location.href = redirectUrl;
}

async function refreshTokenClick() {
  const token = await refreshToken();
  currentToken.save(token);
  renderTemplate("oauth", "oauth-template", currentToken);
}

// HTML Template Rendering with basic data binding - demoware only.
function renderTemplate(targetId, templateId, data = null) {
  const template = document.getElementById(templateId);
  const clone = template.content.cloneNode(true);

  const elements = clone.querySelectorAll("*");
  elements.forEach((ele) => {
    const bindingAttrs = [...ele.attributes].filter((a) =>
      a.name.startsWith("data-bind")
    );

    bindingAttrs.forEach((attr) => {
      const target = attr.name
        .replace(/data-bind-/, "")
        .replace(/data-bind/, "");
      const targetType = target.startsWith("onclick") ? "HANDLER" : "PROPERTY";
      const targetProp = target === "" ? "innerHTML" : target;

      const prefix = targetType === "PROPERTY" ? "data." : "";
      const expression = prefix + attr.value.replace(/;\n\r\n/g, "");

      // Evaluate and bind the expression to the element
      try {
        ele[targetProp] =
          targetType === "PROPERTY"
            ? eval(expression)
            : () => {
                eval(expression);
              };
        ele.removeAttribute(attr.name);
      } catch (ex) {
        console.error(`Error binding ${expression} to ${targetProp}`, ex);
      }
    });
  });

  const target = document.getElementById(targetId);
  if (!target) {
    console.error(`Target element with ID '${targetId}' not found.`);
    return;
  }
  target.innerHTML = "";
  target.appendChild(clone);

  // Render top artists if they're available to display in the html

  if (data && data.top_artists && data.top_artists.items) {
    const topArtistsList = document.getElementById("top_artists");
    if (topArtistsList) {
      data.top_artists.items.forEach((artist) => {
        const li = document.createElement("li");
        li.textContent = artist.name;
        topArtistsList.appendChild(li);
      });
    }
  }
}








