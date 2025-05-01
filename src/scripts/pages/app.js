import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import { getToken, logout } from "../data/api";
import { showInAppNotification } from "../utils/in-app-notification";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
    this.#setupLogout();
    this.#updateAuthUI();
    this._setupConnectivityCheck();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  #setupLogout() {
    const logoutButton = document.querySelector(".logout-link");
    if (logoutButton) {
      logoutButton.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
        this.#updateAuthUI();
      });
    }
  }

  #updateAuthUI() {
    const authOnlyElements = document.querySelectorAll(".auth-only");
    const guestLink = document.querySelector(".guest-link");
    const isAuthenticated = !!getToken();

    authOnlyElements.forEach((element) => {
      element.style.display = isAuthenticated ? "block" : "none";
    });

    if (guestLink) {
      guestLink.style.display = isAuthenticated ? "none" : "block";
    }
  }

  _setupConnectivityCheck() {
    const updateOnlineStatus = () => {
      const statusContainer = document.createElement("div");
      statusContainer.id = "connectivity-status";
      statusContainer.style.display = navigator.onLine ? "none" : "block";
      statusContainer.innerHTML = `
        <div class="offline-banner">
          <i class="fas fa-wifi"></i> Anda sedang offline. Beberapa fitur mungkin terbatas.
        </div>
      `;

      const existingStatus = document.getElementById("connectivity-status");
      if (existingStatus) {
        existingStatus.remove();
      }

      document.body.insertBefore(statusContainer, document.body.firstChild);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();
  }

  async renderPage() {
    try {
      // Get current active route/URL
      const url = getActiveRoute();

      // Redirect to default route if URL is not valid
      if (!url || !routes[url]) {
        console.log("Route not found, redirecting to default page");
        window.location.hash = getToken() ? "#/" : "#/auth";
        return;
      }

      const page = routes[url];

      if ("startViewTransition" in document) {
        await document.startViewTransition(async () => {
          this.#content.innerHTML = await page.render();
          await page.afterRender();
        }).finished;
      } else {
        this.#content.innerHTML = await page.render();
        await page.afterRender();
      }

      this.#updateAuthUI();
    } catch (error) {
      console.error("Error in renderPage:", error);

      // Display error in content area
      this.#content.innerHTML = `
        <div class="error-container">
          <h2>Terjadi Kesalahan</h2>
          <p>Maaf, terjadi kesalahan saat memuat halaman.</p>
          <p class="error-message">${error.message}</p>
          <a href="#/" class="back-button">Kembali ke Beranda</a>
        </div>
      `;

      // Show notification
      showInAppNotification({
        title: "Error",
        message: "Gagal memuat halaman: " + error.message,
        type: "error",
        duration: 5000,
      });
    }
  }
}

export default App;
