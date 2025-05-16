import CONFIG from "../config";
import { showInAppNotification } from "../utils/in-app-notification";
import {
  saveStory,
  getAllStories,
  deleteStory,
  archiveStory,
  getArchivedStories,
} from "../data/idb-helper";

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

class StoryModel {
  constructor() {
    // Queue management methods
    this.getQueue = () => {
      const queue = localStorage.getItem(QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    };

    this.saveQueue = (queue) => {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    };

    this.addToQueue = (request) => {
      const queue = this.getQueue();
      queue.push(request);
      this.saveQueue(queue);
    };

    // Listen for online status
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.processQueue.bind(this));
    }
  }

  async processQueue() {
    if (!navigator.onLine) return;

    try {
      // Get stories from both localStorage queue and IndexedDB
      const queue = this.getQueue();
      const offlineStories = await getAllStories();

      if (queue.length === 0 && offlineStories.length === 0) return;

      const newQueue = [];
      const processedStoryIds = [];

      // Process localStorage queue
      for (const request of queue) {
        try {
          if (request.type === "addStory") {
            await this.addStory(request.data);
          } else if (request.type === "addGuestStory") {
            await this.addGuestStory(request.data);
          }
        } catch (error) {
          console.error("Error processing queue item:", error);
          newQueue.push(request);
        }
      }

      // Process IndexedDB stories
      for (const story of offlineStories) {
        try {
          if (story.type === "addStory") {
            await this.addStory({
              description: story.description,
              photo: story.photoBlob,
              lat: story.lat,
              lon: story.lon,
            });
            processedStoryIds.push(story.id);
          } else if (story.type === "addGuestStory") {
            await this.addGuestStory({
              description: story.description,
              photo: story.photoBlob,
              lat: story.lat,
              lon: story.lon,
            });
            processedStoryIds.push(story.id);
          }
        } catch (error) {
          console.error(`Error processing IndexedDB story ${story.id}:`, error);
          // Don't delete from IndexedDB if there was an error
        }
      }

      // Delete successfully processed stories from IndexedDB
      for (const id of processedStoryIds) {
        try {
          await deleteStory(id);
        } catch (error) {
          console.error(`Error deleting story ${id} from IndexedDB:`, error);
        }
      }

      // Update localStorage queue
      this.saveQueue(newQueue);

      // Show notification if stories were processed
      if (processedStoryIds.length > 0) {
        showInAppNotification({
          title: "Cerita terkirim",
          message: `${processedStoryIds.length} cerita offline berhasil dikirim ke server.`,
          type: "success",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error in processQueue:", error);
    }
  }

  // Authentication methods
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  async register({ name, email, password }) {
    try {
      const response = await fetch(ENDPOINTS.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const responseJson = await response.json();

      if (!response.ok) {
        throw new Error(responseJson.message || "Registration failed");
      }

      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      return responseJson;
    } catch (error) {
      throw error;
    }
  }

  async login({ email, password }) {
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

      this.setToken(responseJson.loginResult.token);

      return responseJson;
    } catch (error) {
      throw error;
    }
  }

  async getStories(page = 1, size = 9) {
    const token = this.getToken();
    if (!token) {
      throw new Error("Missing authentication");
    }

    const url = new URL(ENDPOINTS.GET_STORIES);
    url.searchParams.append("page", page);
    url.searchParams.append("size", size);
    url.searchParams.append("location", 1); // Meminta data dengan lokasi

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    // Hitung total halaman jika API memberikan total stories
    let totalPages = 1;
    if (responseJson.totalStory) {
      totalPages = Math.ceil(responseJson.totalStory / size);
    } else if (
      responseJson.listStory &&
      responseJson.listStory.length === size
    ) {
      // Jika ada data sebanyak ukuran halaman, mungkin ada halaman berikutnya
      totalPages = page + 1;
    }

    // Menormalisasi data dari API Dicoding
    return {
      stories: responseJson.listStory || [],
      totalPages,
      totalStory: responseJson.totalStory || 0,
    };
  }

  async getStoryDetail(id) {
    const token = this.getToken();
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

  static MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes
  static ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];

  async addStory({ description, photo, lat, lon }) {
    const token = this.getToken();
    if (!token) {
      throw new Error("Missing authentication");
    }

    // Validasi file ukuran dan tipe file
    if (photo.size > StoryModel.MAX_FILE_SIZE) {
      throw new Error(
        "Ukuran foto terlalu besar, maksimal 1MB. Silakan kompres dulu."
      );
    }

    if (!StoryModel.ALLOWED_IMAGE_TYPES.includes(photo.type)) {
      throw new Error("Tipe file tidak didukung. Gunakan JPEG, PNG, atau GIF.");
    }

    try {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", photo);

      if (lat && lon) {
        formData.append("lat", lat);
        formData.append("lon", lon);
      }

      if (!navigator.onLine) {
        // Add to queue for later processing
        this.addToQueue({
          type: "addStory",
          data: { description, photo, lat, lon },
        });

        try {
          // Store in IndexedDB
          const storyData = {
            type: "addStory",
            description,
            photoUrl: URL.createObjectURL(photo),
            photoBlob: photo,
            lat,
            lon,
            createdAt: new Date().toISOString(),
            status: "pending",
          };

          await saveStory(storyData);

          showInAppNotification({
            title: "Disimpan offline",
            message:
              "Cerita Anda akan dikirim ketika Anda terhubung ke internet lagi.",
            type: "info",
            duration: 5000,
          });

          return { success: true, offline: true, id: storyData.id };
        } catch (error) {
          console.error("Error saving story to IndexedDB:", error);
          throw new Error(
            "Gagal menyimpan cerita secara offline. " + error.message
          );
        }
      }

      const response = await fetch(ENDPOINTS.ADD_STORY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      // Show notification and send notification via service worker
      await this.showStoryNotification(description);

      showInAppNotification({
        title: "Berhasil",
        message: "Cerita Anda berhasil dikirim dan dipublikasikan!",
        type: "success",
        duration: 5000,
      });

      return responseJson;
    } catch (error) {
      showInAppNotification({
        title: "Error",
        message: `Gagal mengirim cerita: ${error.message}`,
        type: "error",
        duration: 7000,
      });
      throw error;
    }
  }

  async showStoryNotification(description) {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        // Kirim notifikasi menggunakan Service Worker
        if (
          "serviceWorker" in navigator &&
          navigator.serviceWorker.controller
        ) {
          this.sendStoryNotification(description);
        } else {
          new Notification("Story berhasil dibuat", {
            body: `Anda telah membuat story baru dengan deskripsi: ${description.substring(
              0,
              100
            )}${description.length > 100 ? "..." : ""}`,
          });
        }
      } catch (error) {
        // Quiet fail jika notifikasi gagal
      }
    }
  }

  sendStoryNotification(description) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.active.postMessage({
        type: "SHOW_NOTIFICATION",
        payload: {
          title: "Story berhasil dibuat",
          options: {
            body: `Anda telah membuat story baru dengan deskripsi: ${description.substring(
              0,
              100
            )}${description.length > 100 ? "..." : ""}`,
          },
        },
      });
    });
  }

  async addGuestStory({ description, photo, lat, lon }) {
    // Validasi file ukuran dan tipe file
    if (photo.size > StoryModel.MAX_FILE_SIZE) {
      throw new Error(
        "Ukuran foto terlalu besar, maksimal 1MB. Silakan kompres dulu."
      );
    }

    if (!StoryModel.ALLOWED_IMAGE_TYPES.includes(photo.type)) {
      throw new Error("Tipe file tidak didukung. Gunakan JPEG, PNG, atau GIF.");
    }

    try {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", photo);

      if (lat && lon) {
        formData.append("lat", lat);
        formData.append("lon", lon);
      }

      if (!navigator.onLine) {
        // Add to queue for later processing
        this.addToQueue({
          type: "addGuestStory",
          data: { description, photo, lat, lon },
        });

        try {
          // Store in IndexedDB
          const storyData = {
            type: "addGuestStory",
            description,
            photoUrl: URL.createObjectURL(photo),
            photoBlob: photo,
            lat,
            lon,
            createdAt: new Date().toISOString(),
            status: "pending",
          };

          await saveStory(storyData);

          showInAppNotification({
            title: "Disimpan offline",
            message:
              "Cerita Anda akan dikirim ketika Anda terhubung ke internet lagi.",
            type: "info",
            duration: 5000,
          });

          return { success: true, offline: true, id: storyData.id };
        } catch (error) {
          console.error("Error saving guest story to IndexedDB:", error);
          throw new Error(
            "Gagal menyimpan cerita secara offline. " + error.message
          );
        }
      }

      const response = await fetch(ENDPOINTS.ADD_GUEST_STORY, {
        method: "POST",
        body: formData,
      });

      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      showInAppNotification({
        title: "Berhasil",
        message: "Cerita Anda berhasil dikirim sebagai tamu!",
        type: "success",
        duration: 5000,
      });

      return responseJson;
    } catch (error) {
      showInAppNotification({
        title: "Error",
        message: `Gagal mengirim cerita: ${error.message}`,
        type: "error",
        duration: 7000,
      });
      throw error;
    }
  }

  logout() {
    this.removeToken();
    showInAppNotification({
      title: "Logout Berhasil",
      message: "Anda telah keluar dari akun. Sampai jumpa kembali!",
      type: "info",
      duration: 3000,
    });

    // Redirect ke halaman login setelah logout
    window.location.hash = "#/auth";
  }

  /**
   * Archive a story for offline viewing
   * @param {Object} story - The story object to archive
   * @returns {Promise} - Promise object represents the archived story ID
   */
  async archiveStoryForOffline(story) {
    try {
      // Archive the story in IndexedDB
      const id = await archiveStory(story);
      return { success: true, id };
    } catch (error) {
      console.error("Error archiving story:", error);
      throw error;
    }
  }

  /**
   * Get all archived stories
   * @returns {Promise} - Promise object represents the archived stories
   */
  async getArchivedStories() {
    try {
      return await getArchivedStories();
    } catch (error) {
      console.error("Error getting archived stories:", error);
      throw error;
    }
  }
}

export default StoryModel;
