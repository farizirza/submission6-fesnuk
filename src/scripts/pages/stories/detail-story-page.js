import { parseActivePathname } from "../../routes/url-parser";
import { showFormattedDate } from "../../utils";
import DetailStoryPresenter from "../../presenters/DetailStoryPresenter";

class DetailStoryPage {
  #map = null;

  constructor(storyModel) {
    this.storyModel = storyModel;
    this.presenter = new DetailStoryPresenter(storyModel, this);
  }

  async render() {
    return `
      <section class="container">
        <div class="skip-link">
          <a href="#main-content" class="skip-to-content">Skip to Content</a>
        </div>

        <div id="main-content" class="story-detail" tabindex="-1">
          <div class="loading-indicator">Loading story...</div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    try {
      // Setup skip-to-content
      const skipLink = document.querySelector(".skip-to-content");
      const mainContent = document.getElementById("main-content");

      if (skipLink && mainContent) {
        skipLink.addEventListener("click", (event) => {
          event.preventDefault();
          skipLink.blur();
          mainContent.focus();
          mainContent.scrollIntoView({ behavior: "smooth" });
        });
      }

      const { id } = parseActivePathname();
      await this.presenter.loadStoryDetail(id);
    } catch (error) {
      console.error("Error loading story:", error);
      this.renderError(error.message);
    }
  }

  renderStoryDetail(story) {
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

  renderError(message) {
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

  renderMap(story) {
    this._initializeMap(story);
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

// Use factory function to create DetailStoryPage with model dependency
export default (storyModel) => new DetailStoryPage(storyModel);
