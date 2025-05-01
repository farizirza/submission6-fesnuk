import { getStories } from "../../data/api";
import { showFormattedDate } from "../../utils";

class StoriesPage {
  async render() {
    return `
      <section class="container">
        <h1 class="app-title">Cerita Pengguna</h1>
        
        <div class="skip-link">
          <a href="#main-story-content" class="skip-to-content">Skip to Content</a>
        </div>

        <div id="main-story-content" class="stories-list">
          <div id="stories" class="stories-grid">
            ${this._createSkeletonLoading()}
          </div>
        </div>

        <div class="story-map-container">
          <div class="loading-container" id="map-loading">
            <div class="loading-spinner"></div>
            <p class="loading-text">Memuat peta...</p>
          </div>
          <div id="map" style="height: 400px; display: none;"></div>
        </div>

        <a href="#/add" class="add-story-button">
          <i class="fas fa-plus"></i>
        </a>
      </section>
    `;
  }

  _createSkeletonLoading() {
    const skeletons = Array(6)
      .fill(null)
      .map(() => '<div class="story-item skeleton skeleton-story"></div>')
      .join("");
    return skeletons;
  }

  async afterRender() {
    try {
      const stories = await getStories();
      const storiesContainer = document.querySelector("#stories");
      const mapElement = document.getElementById("map");
      const mapLoading = document.getElementById("map-loading");

      // Update stories grid
      storiesContainer.innerHTML = "";
      stories.forEach((story) => {
        const storyElement = this._createStoryElement(story);
        storiesContainer.appendChild(storyElement);
      });

      // Show map and initialize
      mapElement.style.display = "block";
      mapLoading.style.display = "none";
      this._initializeMap(stories);
    } catch (error) {
      console.error("Error loading stories:", error);
      const storiesContainer = document.querySelector("#stories");
      storiesContainer.innerHTML = `
        <div class="error-container">
          <p class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            Gagal memuat cerita. ${error.message}
          </p>
        </div>
      `;
    }
  }

  _createStoryElement(story) {
    const article = document.createElement("article");
    article.className = "story-item";
    article.innerHTML = `
      <a href="#/stories/${story.id}" class="story-link">
        <img src="${story.photoUrl}" alt="Foto oleh ${
      story.name
    }" class="story-image" loading="lazy">
        <div class="story-info">
          <p class="story-author">${story.name}</p>
          <p class="story-description">${story.description}</p>
          <p class="story-date">${showFormattedDate(
            story.createdAt,
            "id-ID"
          )}</p>
        </div>
      </a>
    `;
    return article;
  }

  _initializeMap(stories) {
    const map = L.map("map").setView([-2.5489, 118.0149], 5);

    // Define multiple tile layers
    const osmLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      }
    );

    const topoLayer = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        attribution:
          "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)",
      }
    );

    // Create base layers object
    const baseLayers = {
      "Street View": osmLayer,
      Satellite: satelliteLayer,
      Topographic: topoLayer,
    };

    // Add the default layer
    osmLayer.addTo(map);

    // Add layer control
    L.control
      .layers(baseLayers, null, {
        collapsed: false,
      })
      .addTo(map);

    // Add stories markers
    stories
      .filter((story) => story.lat && story.lon)
      .forEach((story) => {
        L.marker([story.lat, story.lon])
          .bindPopup(
            `
            <div class="story-popup">
              <p class="popup-author">${story.name}</p>
              <img src="${story.photoUrl}" alt="Foto oleh ${story.name}" style="width: 150px; height: auto;">
              <p class="popup-description">${story.description}</p>
              <a href="#/stories/${story.id}" class="popup-link">Lihat Detail</a>
            </div>
          `
          )
          .addTo(map);
      });
  }
}

export default StoriesPage;
