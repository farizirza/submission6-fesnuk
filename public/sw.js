// Service Worker with Workbox
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

const CACHE_NAME = "fesnuk-v1";
const BASE_URL = "https://story-api.dicoding.dev/v1";
const VAPID_PUBLIC_KEY =
  "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

// Use Workbox if it's available
if (workbox) {
  console.log("Workbox is loaded");

  // Set debug mode in development
  workbox.setConfig({ debug: false });

  // Precache app shell resources
  workbox.precaching.precacheAndRoute([
    { url: "./", revision: "1" },
    { url: "./index.html", revision: "1" },
    { url: "./favicon.png", revision: "1" },
    { url: "./manifest.json", revision: "1" },
    { url: "./icons/icon-192x192.png", revision: "1" },
    { url: "./icons/icon-512x512.png", revision: "1" },
    { url: "./icons/maskable-icon.png", revision: "1" },
  ]);

  // Cache CSS, JS, and Web Fonts
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === "style" ||
      request.destination === "script" ||
      request.destination === "font",
    new workbox.strategies.CacheFirst({
      cacheName: "static-resources",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );

  // Cache images
  workbox.routing.registerRoute(
    ({ request }) => request.destination === "image",
    new workbox.strategies.CacheFirst({
      cacheName: "images",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        }),
      ],
    })
  );

  // API requests - Network first strategy
  workbox.routing.registerRoute(
    ({ url }) => url.href.includes(BASE_URL),
    new workbox.strategies.NetworkFirst({
      cacheName: "api-responses",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // Fallback to app shell for navigation requests
  workbox.routing.registerRoute(
    ({ request }) => request.mode === "navigate",
    new workbox.strategies.NetworkFirst({
      cacheName: "pages",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        }),
      ],
    })
  );
} else {
  console.log(
    "Workbox could not be loaded. Offline functionality will be limited."
  );
}

// Skip waiting and claim clients
self.addEventListener("install", (event) => {
  self.skipWaiting();
  console.log("Service Worker installed");
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
  console.log("Service Worker activated");
});

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  // Default notification data in case parsing fails
  let notificationData = {
    title: "Story berhasil dibuat",
    options: {
      body: "Anda telah membuat story baru dengan deskripsi: <story description>",
    },
  };

  // Try to parse the push data if available
  if (event.data) {
    try {
      notificationData = event.data.json();
      console.log("Push data received:", notificationData);
    } catch (e) {
      console.error("Error parsing push data:", e);
    }
  }

  // Following the exact JSON schema:
  // {
  //   "title": "Story berhasil dibuat",
  //   "options": {
  //     "body": "Anda telah membuat story baru dengan deskripsi: <story description>"
  //   }
  // }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData.options
    )
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  // Open or focus the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // If we have an open window, focus it
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

// Listen for messages from the client
self.addEventListener("message", (event) => {
  console.log("Message received in SW:", event.data);

  if (event.data.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data.payload;

    self.registration
      .showNotification(title, options)
      .then(() => console.log("Notification shown successfully"))
      .catch((err) => console.error("Error showing notification:", err));
  }
});
