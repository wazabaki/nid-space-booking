// js/auth.js

let tokenClient;
let gUser = null; // Will hold the GoogleUser payload

function initializeGSI() {
  // 1. Initialize the Google Identity Services client
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: "email profile openid",
    callback: (tokenResponse) => {
      // After we get an access token, fetch user info
      fetchUserInfo(tokenResponse.access_token);
    },
  });

  // 2. Render the “Sign In” button
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      // The ID token: decode it to get user info
      const user = parseJwt(response.credential);
      handleSignIn(user);
    },
    ux_mode: "popup",
    allowed_parent_origin: window.location.origin,
  });

  google.accounts.id.renderButton(
    document.getElementById("g_id_signin"),
    { theme: "outline", size: "large", text: "signin_with" }
  );
}

function parseJwt(token) {
  // Basic JWT parse: decode payload part (no signature check)
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

function handleSignIn(user) {
  // user.email must end with @nid.edu
  if (!user.email.endsWith("@nid.edu")) {
    document.getElementById("login-error").innerText =
      "Please sign in with your @nid.edu email.";
    google.accounts.id.disableAutoSelect(); // ensure they can pick a different account
    return;
  }
  gUser = user;
  // Hide login, show main content
  document.getElementById("login-section").classList.add("hidden");
  document.getElementById("login-error").innerText = "";
  initAppAfterAuth();
}

function initAppAfterAuth() {
  document.getElementById("student-name").innerText = gUser.name;
  document.getElementById("student-email").innerText = gUser.email;
  document.getElementById("main-content").classList.remove("hidden");
  setupSignOut();
  // Now we can initialize the rest of the app (dates, fetching spaces, etc.)
  initializeDateNav();
  fetchAndRenderSpaces();
}

function setupSignOut() {
  document
    .getElementById("logout-btn")
    .addEventListener("click", () => {
      google.accounts.id.disableAutoSelect();
      // Soft sign-out: reload the page so they can sign in again
      window.location.reload();
    });
}

function fetchUserInfo(accessToken) {
  // If we needed additional scopes (we don’t strictly here), we’d fetch profile from Google APIs.
  // But Google Identity Services provided us with the JWT containing name/email.
}

// On load: initialize the GSI (Google Sign In) flow
window.onload = () => {
  initializeGSI();
};
