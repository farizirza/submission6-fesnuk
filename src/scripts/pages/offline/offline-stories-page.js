import { deleteStory, getArchivedStories } from "../../data/idb-helper";
import { showInAppNotification } from "../../utils/in-app-notification";
import { showFormattedDate } from "../../utils";

class OfflineStoriesPage {
  constructor(storyModel) {
    this.storyModel = storyModel;
    this.archivedStories = [];
  }

  async render() {
    return `
      <section class="container offline-stories-page">
        <h1 class="app-title">Cerita Tersimpan Offline</h1>

        <div class="offline-info">
          <p>Halaman ini menampilkan cerita yang tersimpan secara offline di perangkat Anda. Anda dapat melihat cerita yang diarsipkan untuk dilihat offline dan cerita yang menunggu untuk dikirim ke server saat Anda kembali online.</p>
        </div>

        <div class="offline-controls">
          <button id="refreshOfflineBtn" class="btn">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>

        <h2 class="section-title">Cerita Diarsipkan</h2>
        <div id="archivedStoriesList" class="offline-stories-list">
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p class="loading-text">Memuat cerita arsip...</p>
          </div>
        </div>

        <div class="no-stories-message" id="noArchivedMessage" style="display: none;">
          <p>Tidak ada cerita yang diarsipkan untuk dilihat offline.</p>
          <p class="archive-tip">Kunjungi halaman cerita dan klik tombol arsip <i class="fas fa-archive"></i> untuk menyimpan cerita agar dapat dilihat offline.</p>
        </div>


      </section>
    `;
  }

  async afterRender() {
    this._setupEventListeners();
    await this._loadOfflineStories();
  }

  async _loadOfflineStories() {
    try {
      // Get archived stories (stories saved for offline viewing)
      await this._loadArchivedStories();
    } catch (error) {
      console.error("Error loading offline stories:", error);
      showInAppNotification({
        title: "Error",
        message: "Terjadi kesalahan saat memuat cerita offline",
        type: "error",
        duration: 5000,
      });
    }
  }

  async _loadArchivedStories() {
    try {
      const storiesContainer = document.getElementById("archivedStoriesList");
      const noStoriesMessage = document.getElementById("noArchivedMessage");

      // Get archived stories from IndexedDB
      this.archivedStories = await getArchivedStories();
      console.log("Archived stories:", this.archivedStories);

      // Check if we have any archived stories
      if (!this.archivedStories || this.archivedStories.length === 0) {
        storiesContainer.style.display = "none";
        noStoriesMessage.style.display = "block";
        return;
      }

      // Sort stories by archive date (newest first)
      this.archivedStories.sort((a, b) => {
        const dateA = a.archivedAt
          ? new Date(a.archivedAt)
          : new Date(a.createdAt || 0);
        const dateB = b.archivedAt
          ? new Date(b.archivedAt)
          : new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      // Display stories
      storiesContainer.style.display = "block";
      noStoriesMessage.style.display = "none";

      storiesContainer.innerHTML = this.archivedStories
        .map(
          (story) => `
        <div class="offline-story-card archived-story" data-id="${story.id}">
          <div class="offline-story-content">
            <h3>${story.name || "Cerita Arsip"}</h3>
            <div class="story-image-container">
              <img src="${story.photoUrl}" alt="Foto oleh ${
            story.name || "Penulis"
          }" class="story-thumbnail">
            </div>
            <p class="story-description">${this._truncateText(
              story.description || "No description",
              150
            )}</p>
            <p class="story-meta">
              <span class="story-date">Dibuat: ${showFormattedDate(
                story.createdAt,
                "id-ID"
              )}</span>
              <span class="story-date">Diarsipkan: ${showFormattedDate(
                story.archivedAt,
                "id-ID"
              )}</span>
            </p>
            ${
              story.lat && story.lon
                ? `
              <p class="story-location">
                <i class="fas fa-map-marker-alt"></i> Lokasi tersedia
              </p>
            `
                : ""
            }
          </div>
          <div class="offline-story-actions">
            <button class="btn view-story-btn" data-id="${story.id}">
              <i class="fas fa-eye"></i> Lihat
            </button>
            <button class="btn delete-archived-btn" data-id="${story.id}">
              <i class="fas fa-trash"></i> Hapus
            </button>
          </div>
        </div>
      `
        )
        .join("");

      // Add event listeners to buttons
      const viewButtons = storiesContainer.querySelectorAll(".view-story-btn");
      viewButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
          const storyId = parseInt(event.currentTarget.dataset.id, 10);
          this._viewArchivedStory(storyId);
        });
      });

      const deleteButtons = storiesContainer.querySelectorAll(
        ".delete-archived-btn"
      );
      deleteButtons.forEach((button) => {
        button.addEventListener("click", async (event) => {
          const storyId = parseInt(event.currentTarget.dataset.id, 10);
          await this._deleteOfflineStory(storyId);
        });
      });
    } catch (error) {
      console.error("Error loading archived stories:", error);
      throw error;
    }
  }

  _viewArchivedStory(id) {
    const story = this.archivedStories.find((s) => s.id === id);
    if (!story) return;

    // Create modal to view the story
    const modal = document.createElement("div");
    modal.className = "story-modal";
    modal.innerHTML = `
      <div class="story-modal-content">
        <span class="close-modal">&times;</span>
        <h2>${story.name || "Cerita Arsip"}</h2>
        <div class="story-modal-image">
          <img src="${story.photoUrl}" alt="Foto oleh ${
      story.name || "Penulis"
    }" class="full-story-image">
        </div>
        <div class="story-modal-details">
          <p class="story-description">${story.description}</p>
          <p class="story-date">Dibuat: ${showFormattedDate(
            story.createdAt,
            "id-ID"
          )}</p>
          ${
            story.lat && story.lon
              ? `
            <div id="story-map-${story.id}" class="story-map" style="height: 300px;"></div>
          `
              : ""
          }
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listener to close modal
    const closeBtn = modal.querySelector(".close-modal");
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    // Close modal when clicking outside the content
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        document.body.removeChild(modal);
      }
    });

    // Initialize map if coordinates are available
    if (story.lat && story.lon) {
      setTimeout(() => {
        try {
          const map = L.map(`story-map-${story.id}`).setView(
            [story.lat, story.lon],
            13
          );
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(map);

          L.marker([story.lat, story.lon])
            .addTo(map)
            .bindPopup(
              `<b>${
                story.name || "Lokasi Cerita"
              }</b><br>${story.description.substring(0, 50)}...`
            )
            .openPopup();
        } catch (error) {
          console.error("Error initializing map:", error);
        }
      }, 300);
    }
  }

  async _deleteOfflineStory(id) {
    try {
      if (confirm("Apakah Anda yakin ingin menghapus cerita ini?")) {
        await deleteStory(id);
        showInAppNotification({
          title: "Sukses",
          message: "Cerita berhasil dihapus",
          type: "success",
          duration: 3000,
        });
        await this._loadOfflineStories();
      }
    } catch (error) {
      console.error("Error deleting offline story:", error);
      showInAppNotification({
        title: "Error",
        message: "Terjadi kesalahan saat menghapus cerita",
        type: "error",
        duration: 5000,
      });
    }
  }

  _setupEventListeners() {
    const refreshBtn = document.getElementById("refreshOfflineBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        await this._loadOfflineStories();
      });
    }
  }

  _truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  _formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

export default (storyModel) => new OfflineStoriesPage(storyModel);
