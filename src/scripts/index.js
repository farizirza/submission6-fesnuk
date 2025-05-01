// CSS imports
import "../styles/styles.css";
import "leaflet/dist/leaflet.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// JavaScript imports
import L from "leaflet";
import App from "./pages/app";
import { showInAppNotification } from "./utils/in-app-notification";
import { setupNetworkStatusNotifier } from "./utils/network-status";
import { getToken } from "./data/api";

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
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration);
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  });
}

// Fungsi untuk menangani rute default
function handleDefaultRoute() {
  // Jika tidak ada hash, atur hash ke halaman beranda atau auth
  if (window.location.hash === "") {
    // Cek login status
    const isLoggedIn = !!getToken();

    // Redirect ke halaman beranda jika sudah login, otherwise ke auth
    window.location.hash = isLoggedIn ? "#/" : "#/auth";
    return true;
  }
  return false;
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded, initializing app...");

  // Inisialisasi network status notifier
  setupNetworkStatusNotifier();

  // Tangani rute default jika diperlukan
  const redirected = handleDefaultRoute();

  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
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
