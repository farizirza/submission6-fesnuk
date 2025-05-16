// Store the install prompt event globally
window.deferredPrompt = null;

// Function to check if the app is already installed
function isAppInstalled() {
  // Check if the app is in standalone mode or matches media query for installed PWAs
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// Function to handle install prompt (without showing a fixed button)
function handleInstallPrompt() {
  // We're not showing a fixed button anymore, just saving the prompt for later use
  console.log("Install prompt ready and saved for later use");
}

// Function to check PWA criteria and log debug info
function debugPWAStatus() {
  console.log("--- PWA Debug Info ---");

  // Check if service worker is supported
  console.log("Service Worker supported:", "serviceWorker" in navigator);

  // Check if the app is in standalone mode
  console.log(
    "In standalone mode:",
    window.matchMedia("(display-mode: standalone)").matches
  );

  // Check if on HTTPS
  console.log("On HTTPS:", window.location.protocol === "https:");

  // Check if manifest is linked
  const manifestLink = document.querySelector('link[rel="manifest"]');
  console.log("Manifest linked:", !!manifestLink);

  // Check if service worker is registered
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      console.log("Service Worker registrations:", registrations.length);
    });
  }

  console.log("--- End PWA Debug Info ---");
}

// Function to initialize the PWA installation
function initPWAInstall() {
  // Run debug checks
  debugPWAStatus();

  // If the app is already installed, don't show the install button
  if (isAppInstalled()) {
    console.log("App is already installed");
    return;
  }

  // Listen for the beforeinstallprompt event
  window.addEventListener("beforeinstallprompt", (event) => {
    // Prevent the default browser install prompt
    event.preventDefault();

    // Save the event for later use
    window.deferredPrompt = event;

    console.log("beforeinstallprompt event fired and saved");
  });

  // Listen for the appinstalled event
  window.addEventListener("appinstalled", () => {
    console.log("App was successfully installed");

    // Clear the saved prompt
    window.deferredPrompt = null;
  });
}

export default initPWAInstall;
