// CSS imports
import "../styles/styles.css";
import "leaflet/dist/leaflet.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// JavaScript imports
import L from "leaflet";
import App from "./pages/app";
import { showInAppNotification } from "./utils/in-app-notification";
import { setupNetworkStatusNotifier } from "./utils/network-status";
import StoryModel from "./models/StoryModel";
import setupSkipToContent from "./utils/skip-to-content";
import initPWAInstall from "./utils/install-pwa";

// Fix Leaflet's icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        console.log("SW registered:", registration);
      })
      .catch((error) => {
        console.error("SW registration failed:", error);
      });
  });
}

// Initialize the story model
const storyModel = new StoryModel();

// Fungsi untuk menangani rute default
function handleDefaultRoute() {
  // Jika tidak ada hash, atur hash ke halaman beranda atau auth
  if (window.location.hash === "") {
    // Cek login status
    const isLoggedIn = !!storyModel.getToken();

    // Redirect ke halaman beranda jika sudah login, otherwise ke auth
    window.location.hash = isLoggedIn ? "#/" : "#/auth";
    return true;
  }
  return false;
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded, initializing app...");

  // Initialize skip to content functionality
  setupSkipToContent();

  // Initialize network status notifier
  setupNetworkStatusNotifier();

  // Initialize PWA installation
  initPWAInstall();

  // Tangani rute default jika diperlukan
  const redirected = handleDefaultRoute();

  const app = new App({
    content: document.querySelector("#mainContent"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
    storyModel: storyModel,
  });

  try {
    await app.renderPage();
    console.log("Initial page rendering complete");
  } catch (error) {
    console.error("Error during initial page rendering:", error);
    showInAppNotification({
      title: "Error",
      message: "Terjadi kesalahan saat memuat halaman",
      type: "error",
      duration: 5000,
    });
  }

  // Event listener untuk perubahan hash/rute
  window.addEventListener("hashchange", async () => {
    try {
      await app.renderPage();
    } catch (error) {
      console.error("Error during hash change page rendering:", error);
    }
  });
});
