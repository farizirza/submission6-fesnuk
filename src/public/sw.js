// Service Worker for handling push notifications
const CACHE_NAME = "StoryApp-V1";
const VAPID_PUBLIC_KEY =
  "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

// Debug function
function logDebug(message, data) {
  const time = new Date().toISOString();
  console.log(`[ServiceWorker ${time}] ${message}`, data || "");
}

logDebug("Service Worker loaded");

// Push notification event handler
self.addEventListener("push", function (event) {
  // Wrap all async operations in event.waitUntil to extend the service worker lifetime
  event.waitUntil(
    (async function () {
      logDebug("Push event received", event);

      try {
        // Check if we have an active subscription
        const subscription =
          await self.registration.pushManager.getSubscription();
        if (!subscription) {
          logDebug("No active subscription found, ignoring push notification");
          return;
        }

        if (event.data) {
          // Try to parse the data as JSON
          try {
            const data = event.data.json();
            logDebug("Push data (JSON):", data);

            const options = {
              body: data.options.body,
              icon: "/images/logo.png",
              badge: "/images/logo.png",
              vibrate: [100, 50, 100],
              tag: "story-notification",
              renotify: true,
              data: {
                dateOfArrival: Date.now(),
                primaryKey: Math.floor(Math.random() * 1000),
                url: "/",
              },
            };

            logDebug("Showing notification with options:", options);
            return self.registration.showNotification(data.title, options);
          } catch (e) {
            // If can't parse as JSON, show the raw data
            const text = event.data.text();
            logDebug("Push data (text):", text);
            logDebug("JSON parse error:", e);

            return self.registration.showNotification("New Notification", {
              body: text,
              icon: "/images/logo.png",
            });
          }
        } else {
          logDebug("Push event has no data");
        }
      } catch (error) {
        logDebug("Error processing push notification:", error);
      }
    })()
  );
});

// Notification click event handler
self.addEventListener("notificationclick", function (event) {
  logDebug("Notification click event", event);

  // Close the notification
  event.notification.close();

  // Get any custom data from the notification
  const data = event.notification.data;
  const url = data && data.url ? data.url : "/";

  logDebug("Opening URL:", url);

  // Open the app and focus if already open
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if a window is already open and navigate to target URL
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          logDebug("Focusing existing client:", client.url);
          client.navigate(url);
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        logDebug("Opening new window:", url);
        return clients.openWindow(url);
      }
    })
  );
});

// Install event handler
self.addEventListener("install", (event) => {
  logDebug("Install event", event);
  event.waitUntil(self.skipWaiting());
});

// Activate event handler
self.addEventListener("activate", (event) => {
  logDebug("Activate event", event);
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear old caches if needed
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              logDebug("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
    ])
  );
});

// Handle messaging from the web app
self.addEventListener("message", (event) => {
  logDebug("Message received from web app:", event.data);

  if (event.data && event.data.type === "PING") {
    event.source.postMessage({ type: "PONG" });
  }
});
