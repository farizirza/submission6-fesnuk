import CONFIG from "./config";

// Function to request notification permission
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
    return false;
  }

  let permission = Notification.permission;

  // If permission is not granted and not denied
  if (permission !== "granted" && permission !== "denied") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    alert("You need to allow notification permission to receive notifications");
    return false;
  }

  return true;
}

// Test notification function
async function showTestNotification() {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("Test Notification", {
      body: "This is a test notification to check if notifications are working",
      icon: "/images/logo.png",
      badge: "/images/logo.png",
      vibrate: [100, 50, 100],
    });
    console.log("Test notification sent successfully");
  } catch (error) {
    console.error("Error showing test notification:", error);
    alert(`Error showing test notification: ${error.message}`);
  }
}

// Function to subscribe to push notifications
async function subscribeToPushNotifications() {
  try {
    // First, ensure we have notification permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk"
      ),
    });

    // Debug subscription object
    console.log("Push Subscription:", JSON.stringify(subscription));

    // Extract keys properly from the subscription
    const subscriptionJSON = subscription.toJSON();
    const keysData = subscriptionJSON.keys || {};

    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("story_app_token")}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: keysData.p256dh || "",
          auth: keysData.auth || "",
        },
      }),
    });

    const data = await response.json();
    if (!data.error) {
      console.log("Successfully subscribed to push notifications");
      // Save subscription status in localStorage
      localStorage.setItem("notification_subscribed", "true");
      // Show a test notification to confirm it's working
      await showTestNotification();
      alert("Successfully subscribed to push notifications");
    } else {
      console.error("Failed to subscribe:", data.message);
      localStorage.removeItem("notification_subscribed");
      alert(`Failed to subscribe: ${data.message}`);
    }
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    localStorage.removeItem("notification_subscribed");
    alert(`Error subscribing to push notifications: ${error.message}`);
  }
}

// Function to unsubscribe from push notifications
async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log("No subscription found to unsubscribe");
      localStorage.removeItem("notification_subscribed");
      alert("No active subscription found");
      return;
    }

    // First, unsubscribe from the service worker
    const unsubscribeResult = await subscription.unsubscribe();
    if (!unsubscribeResult) {
      throw new Error("Failed to unsubscribe from push manager");
    }

    // Then, notify the server about unsubscription
    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("story_app_token")}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
      }),
    });

    // Clear subscription status regardless of server response
    localStorage.removeItem("notification_subscribed");

    const data = await response.json();
    if (!data.error) {
      console.log("Successfully unsubscribed from push notifications");
      alert("Successfully unsubscribed from push notifications");
    } else {
      console.error("Server unsubscribe error:", data.message);
      // We still consider the unsubscribe successful if the browser part worked
      alert("Unsubscribed locally, but server reported: " + data.message);
    }
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    // Still remove local subscription status on error
    localStorage.removeItem("notification_subscribed");
    alert(`Error during unsubscribe: ${error.message}`);
  }

  // Update UI elements even if there was an error
  const subscribeBtn = document.getElementById("subscribeBtn");
  const unsubscribeBtn = document.getElementById("unsubscribeBtn");
  if (subscribeBtn && unsubscribeBtn) {
    subscribeBtn.disabled = false;
    unsubscribeBtn.disabled = true;
  }
}

// Helper function to check subscription status
function isSubscribedToNotifications() {
  return localStorage.getItem("notification_subscribed") === "true";
}

// Helper function to convert VAPID public key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Initialize service worker
if ("serviceWorker" in navigator && "PushManager" in window) {
  window.addEventListener("load", async () => {
    try {
      // Make sure to register with the correct path and scope
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("Service Worker registered:", registration);

      // Check if user is already subscribed
      const subscription = await registration.pushManager.getSubscription();
      const subscribeBtn = document.getElementById("subscribeBtn");
      const unsubscribeBtn = document.getElementById("unsubscribeBtn");

      if (subscription) {
        console.log("User is already subscribed to push notifications");
        localStorage.setItem("notification_subscribed", "true");
        if (subscribeBtn && unsubscribeBtn) {
          subscribeBtn.disabled = true;
          unsubscribeBtn.disabled = false;
        }
      } else {
        console.log("User is not subscribed to push notifications");
        localStorage.removeItem("notification_subscribed");
        if (subscribeBtn && unsubscribeBtn) {
          subscribeBtn.disabled = false;
          unsubscribeBtn.disabled = true;
        }
      }
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  });
}

// Export functions for use in other modules
export {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  showTestNotification,
  isSubscribedToNotifications,
};
