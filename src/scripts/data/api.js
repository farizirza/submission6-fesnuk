import CONFIG from "../config";
import { showInAppNotification } from "../utils/in-app-notification";

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  GET_STORIES: `${CONFIG.BASE_URL}/stories`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
  ADD_GUEST_STORY: `${CONFIG.BASE_URL}/stories/guest`,
  GET_STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
};

const TOKEN_KEY = "story_app_token";
const QUEUE_KEY = "offline_request_queue";

// Queue management
function getQueue() {
  const queue = localStorage.getItem(QUEUE_KEY);
  return queue ? JSON.parse(queue) : [];
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function addToQueue(request) {
  const queue = getQueue();
  queue.push(request);
  saveQueue(queue);
}

async function processQueue() {
  if (!navigator.onLine) return;

  const queue = getQueue();
  if (queue.length === 0) return;

  const newQueue = [];

  for (const request of queue) {
    try {
      if (request.type === "addStory") {
        await addStory(request.data);
      } else if (request.type === "addGuestStory") {
        await addGuestStory(request.data);
      }
    } catch (error) {
      newQueue.push(request);
    }
  }

  saveQueue(newQueue);
}

// Listen for online status
if (typeof window !== "undefined") {
  window.addEventListener("online", processQueue);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function register({ name, email, password }) {
  try {
    console.log("Registering with:", { name, email, password: "****" });

    const response = await fetch(ENDPOINTS.REGISTER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const responseJson = await response.json();
    console.log("Registration response:", responseJson);

    if (!response.ok) {
      throw new Error(responseJson.message || "Registration failed");
    }

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    // Tampilkan notifikasi sukses
    showInAppNotification({
      title: "Registrasi Berhasil",
      message: "Akun Anda berhasil dibuat. Silakan login.",
      type: "success",
      duration: 5000,
    });

    return responseJson;
  } catch (error) {
    console.error("Registration error:", error);

    // Tampilkan notifikasi error
    showInAppNotification({
      title: "Registrasi Gagal",
      message: error.message,
      type: "error",
      duration: 7000,
    });

    throw error;
  }
}

async function login({ email, password }) {
  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    setToken(responseJson.loginResult.token);

    // Tampilkan notifikasi sukses
    showInAppNotification({
      title: "Login Berhasil",
      message: "Selamat datang kembali!",
      type: "success",
      duration: 3000,
    });

    return responseJson;
  } catch (error) {
    // Tampilkan notifikasi error
    showInAppNotification({
      title: "Login Gagal",
      message: error.message,
      type: "error",
      duration: 5000,
    });

    throw error;
  }
}

async function getStories() {
  const token = getToken();
  if (!token) {
    throw new Error("Missing authentication");
  }

  const response = await fetch(ENDPOINTS.GET_STORIES, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const responseJson = await response.json();

  if (responseJson.error) {
    throw new Error(responseJson.message);
  }

  return responseJson.listStory;
}

async function getStoryDetail(id) {
  const token = getToken();
  if (!token) {
    throw new Error("Missing authentication");
  }

  const response = await fetch(ENDPOINTS.GET_STORY_DETAIL(id), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const responseJson = await response.json();

  if (responseJson.error) {
    throw new Error(responseJson.message);
  }

  return responseJson.story;
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];

async function addStory({ description, photo, lat, lon }) {
  if (!navigator.onLine) {
    addToQueue({
      type: "addStory",
      data: { description, photo, lat, lon },
    });

    // Tampilkan notifikasi in-app untuk offline
    showInAppNotification({
      title: "Mode Offline",
      message: "Anda sedang offline. Story akan dikirim otomatis saat online.",
      type: "warning",
      duration: 5000,
    });

    throw new Error(
      "Anda sedang offline. Story akan dikirim otomatis saat online."
    );
  }

  const token = getToken();
  if (!token) {
    throw new Error("Missing authentication");
  }

  // Validate photo
  if (!(photo instanceof File)) {
    throw new Error("Photo must be a valid file");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(photo.type)) {
    throw new Error("File must be a valid image (JPEG, PNG, or GIF)");
  }

  if (photo.size > MAX_FILE_SIZE) {
    throw new Error("File size must not exceed 1MB");
  }

  const formData = new FormData();
  formData.append("description", description);
  formData.append("photo", photo);

  // Validate and append location if provided
  if (lat !== undefined) {
    if (typeof lat !== "number" || isNaN(lat)) {
      throw new Error("Latitude must be a valid number");
    }
    formData.append("lat", lat.toString());
  }

  if (lon !== undefined) {
    if (typeof lon !== "number" || isNaN(lon)) {
      throw new Error("Longitude must be a valid number");
    }
    formData.append("lon", lon.toString());
  }

  try {
    const response = await fetch(ENDPOINTS.ADD_STORY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const responseJson = await response.json();

    if (!response.ok || responseJson.error) {
      throw new Error(responseJson.message || "Failed to add story");
    }

    // Tampilkan notifikasi in-app
    showInAppNotification({
      title: "Story berhasil dibuat",
      message: `Anda telah membuat story baru dengan deskripsi: ${description.substring(
        0,
        50
      )}${description.length > 50 ? "..." : ""}`,
      type: "success",
      duration: 5000,
    });

    // Show local notification for successful story creation
    await showStoryNotification(description);

    return responseJson;
  } catch (error) {
    console.error("Error adding story:", error);

    // Tampilkan notifikasi error
    showInAppNotification({
      title: "Error",
      message: error.message,
      type: "error",
      duration: 7000,
    });

    throw error;
  }
}

// Function to show a local notification for a new story
async function showStoryNotification(description) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Web push not supported");
    return;
  }

  try {
    // Check notification permission first
    if (Notification.permission !== "granted") {
      console.log("Notification permission not granted");
      return;
    }

    // Check subscription status from localStorage
    const isSubscribed =
      localStorage.getItem("notification_subscribed") === "true";
    if (!isSubscribed) {
      console.log(
        "User is not subscribed to notifications, skipping notification"
      );
      return;
    }

    // Verify subscription exists
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log("No active subscription found");
      localStorage.removeItem("notification_subscribed"); // Fix any inconsistency
      return;
    }

    // Format the notification data according to the schema
    const notificationData = {
      title: "Story berhasil dibuat",
      options: {
        body: `Anda telah membuat story baru dengan deskripsi: ${description.substring(
          0,
          50
        )}${description.length > 50 ? "..." : ""}`,
        icon: "/images/logo.png",
        badge: "/images/logo.png",
        vibrate: [100, 50, 100],
      },
    };

    console.log("Showing notification:", notificationData);

    // Show notification using the service worker
    await registration.showNotification(
      notificationData.title,
      notificationData.options
    );
  } catch (error) {
    console.error("Error showing notification:", error);
  }
}

async function addGuestStory({ description, photo, lat, lon }) {
  if (!navigator.onLine) {
    addToQueue({
      type: "addGuestStory",
      data: { description, photo, lat, lon },
    });

    // Tampilkan notifikasi in-app untuk offline
    showInAppNotification({
      title: "Mode Offline",
      message: "Anda sedang offline. Story akan dikirim otomatis saat online.",
      type: "warning",
      duration: 5000,
    });

    throw new Error(
      "Anda sedang offline. Story akan dikirim otomatis saat online."
    );
  }

  // Validate photo
  if (!(photo instanceof File)) {
    throw new Error("Photo must be a valid file");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(photo.type)) {
    throw new Error("File must be a valid image (JPEG, PNG, or GIF)");
  }

  if (photo.size > MAX_FILE_SIZE) {
    throw new Error("File size must not exceed 1MB");
  }

  const formData = new FormData();
  formData.append("description", description);
  formData.append("photo", photo);

  // Validate and append location if provided
  if (lat !== undefined) {
    if (typeof lat !== "number" || isNaN(lat)) {
      throw new Error("Latitude must be a valid number");
    }
    formData.append("lat", lat.toString());
  }

  if (lon !== undefined) {
    if (typeof lon !== "number" || isNaN(lon)) {
      throw new Error("Longitude must be a valid number");
    }
    formData.append("lon", lon.toString());
  }

  try {
    const response = await fetch(ENDPOINTS.ADD_GUEST_STORY, {
      method: "POST",
      body: formData,
    });

    const responseJson = await response.json();

    if (!response.ok || responseJson.error) {
      throw new Error(responseJson.message || "Failed to add story");
    }

    // Tampilkan notifikasi in-app
    showInAppNotification({
      title: "Story berhasil dibuat",
      message: `Anda telah membuat story baru sebagai tamu dengan deskripsi: ${description.substring(
        0,
        50
      )}${description.length > 50 ? "..." : ""}`,
      type: "success",
      duration: 5000,
    });

    return responseJson;
  } catch (error) {
    console.error("Error adding guest story:", error);

    // Tampilkan notifikasi error
    showInAppNotification({
      title: "Error",
      message: error.message,
      type: "error",
      duration: 7000,
    });

    throw error;
  }
}

function logout() {
  removeToken();

  // Tampilkan notifikasi
  showInAppNotification({
    title: "Logout Berhasil",
    message: "Anda telah keluar dari aplikasi",
    type: "info",
    duration: 3000,
  });

  window.location.hash = "#/auth";
}

export {
  getStories,
  getStoryDetail,
  addStory,
  addGuestStory,
  login,
  register,
  getToken,
  removeToken,
  logout,
};
