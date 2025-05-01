import { getStoryDetail } from "../../data/api";
import { showFormattedDate } from "../../utils";
import { parseActivePathname } from "../../routes/url-parser";

class DetailStoryPage {
  #map = null;

  async render() {
    return `
      <section class="container">
        <div class="skip-link">
          <a href="#main-content" class="skip-to-content">Skip to Content</a>
        </div>

        <div id="main-content" class="story-detail">
          <div class="loading-indicator">Loading story...</div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    try {
      const { id } = parseActivePathname();
      const story = await getStoryDetail(id);

      this._displayStoryDetail(story);
      if (story.lat && story.lon) {
        this._initializeMap(story);
      }
    } catch (error) {
      console.error("Error loading story:", error);
      this._displayError(error.message);
    }
  }

  _displayStoryDetail(story) {
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = `
      <article class="story-detail-content">
        <h1 class="story-title">Cerita dari ${story.name}</h1>
        
        <img src="${story.photoUrl}" alt="Foto oleh ${
      story.name
    }" class="story-detail-image">
        
        <div class="story-meta">
          <p class="story-author">${story.name}</p>
          <p class="story-date">${showFormattedDate(story.createdAt)}</p>
        </div>

        <p class="story-description">${story.description}</p>

        ${
          story.lat && story.lon ? '<div id="map" class="story-map"></div>' : ""
        }
        
        <a href="#/" class="back-button">
          <i class="fas fa-arrow-left"></i> Kembali ke Daftar Cerita
        </a>
      </article>
    `;
  }

  _displayError(message) {
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = `
      <div class="error-container">
        <p class="error-message">${message}</p>
        <a href="#/" class="back-button">
          <i class="fas fa-arrow-left"></i> Kembali ke Daftar Cerita
        </a>
      </div>
    `;
  }

  _initializeMap(story) {
    this.#map = L.map("map").setView([story.lat, story.lon], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker([story.lat, story.lon])
      .bindPopup(
        `
        <div class="story-popup">
          <p class="popup-author">Lokasi cerita oleh ${story.name}</p>
        </div>
      `
      )
      .addTo(this.#map);
  }
}

export default DetailStoryPage;
