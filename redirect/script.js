// Get query parameters
const params = new URLSearchParams(location.search);
const url = params.get("url");

// Reference to the <h1> message
const message = document.querySelector("h1");

// Whitelist of allowed domains (edit these!)
const allowedDomains = ["youtube.com", "soundcloud.com"];

if (url) {
  console.log("Found redirect URL:", url);

  setTimeout(() => {
    try {
      const target = new URL(url);

      // Check if target hostname ends with an allowed domain
      const isAllowed = allowedDomains.some(domain =>
        target.hostname.endsWith(domain)
      );

      if (isAllowed) {
        message.textContent = "Redirecting...";
        window.location.href = target.href;
      } else {
        message.textContent = "Invalid redirect target.";
        console.error("Blocked unsafe redirect:", target.href);
      }

    } catch (err) {
      message.textContent = "Invalid URL format.";
      console.error("Invalid URL:", url, err);
    }
  }, 250);
} else {
  message.textContent = "No redirect URL provided.";
  console.warn("No 'url' parameter found in query string.");
}