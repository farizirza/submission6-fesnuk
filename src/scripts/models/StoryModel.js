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

    const queue = this.getQueue();
    if (queue.length === 0) return;

    const newQueue = [];

    for (const request of queue) {
      try {
        if (request.type === "addStory") {
          await this.addStory(request.data);
        } else if (request.type === "addGuestStory") {
          await this.addGuestStory(request.data);
        }
      } catch (error) {
        newQueue.push(request);
      }
    }

    this.saveQueue(newQueue);
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

      // Tampilkan notifikasi sukses
      showInAppNotification({
        title: "Registrasi Berhasil",
        message: "Akun Anda berhasil dibuat. Silakan login.",
        type: "success",
        duration: 5000,
      });

      return responseJson;
    } catch (error) {
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
        this.addToQueue({
          type: "addStory",
          data: { description, photo, lat, lon },
        });

        showInAppNotification({
          title: "Disimpan offline",
          message:
            "Cerita Anda akan dikirim ketika Anda terhubung ke internet lagi.",
          type: "info",
          duration: 5000,
        });

        return { success: true, offline: true };
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
        this.addToQueue({
          type: "addGuestStory",
          data: { description, photo, lat, lon },
        });

        showInAppNotification({
          title: "Disimpan offline",
          message:
            "Cerita Anda akan dikirim ketika Anda terhubung ke internet lagi.",
          type: "info",
          duration: 5000,
        });

        return { success: true, offline: true };
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
}

export default StoryModel;
