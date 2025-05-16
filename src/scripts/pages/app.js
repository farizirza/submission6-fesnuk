import { getRoute } from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import { showInAppNotification } from "../utils/in-app-notification";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #storyModel = null;

  constructor({ navigationDrawer, drawerButton, content, storyModel }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#storyModel = storyModel;

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
        this.#storyModel.logout();
        this.#updateAuthUI();

        // Force redirecting to auth page after logout
        window.location.hash = "#/auth";
      });
    }
  }

  #updateAuthUI() {
    const authOnlyElements = document.querySelectorAll(".auth-only");
    const guestLink = document.querySelector(".guest-link");
    const isAuthenticated = !!this.#storyModel.getToken();

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

      // If URL is completely empty, redirect to default route
      if (!url) {
        console.log("Empty route, redirecting to default page");
        window.location.hash = this.#storyModel.getToken() ? "#/" : "#/auth";
        return;
      }

      // Get the page handler (will return NotFoundPage if route doesn't exist)
      const page = getRoute(url);

      // Initialize the page with the story model if it's a factory function
      const pageInstance =
        typeof page === "function" ? page(this.#storyModel) : page;

      if ("startViewTransition" in document) {
        await document.startViewTransition(async () => {
          this.#content.innerHTML = await pageInstance.render();
          await pageInstance.afterRender();
        }).finished;
      } else {
        this.#content.innerHTML = await pageInstance.render();
        await pageInstance.afterRender();
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
