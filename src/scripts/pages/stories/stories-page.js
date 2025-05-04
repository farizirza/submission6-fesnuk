import { showFormattedDate } from "../../utils";
import StoriesPresenter from "../../presenters/StoriesPresenter";

class StoriesPage {
  constructor(storyModel) {
    this.storyModel = storyModel;
    this.presenter = new StoriesPresenter(storyModel, this);
    this.map = null; // Menyimpan referensi ke map
  }

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

        <div id="pagination-container" class="pagination-container">
          <!-- Pagination loading indicator -->
          <div class="loading-pagination">
            <span>Memuat pagination...</span>
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
    const skeletons = Array(9)
      .fill(null)
      .map(() => '<div class="story-item skeleton skeleton-story"></div>')
      .join("");
    return skeletons;
  }

  async afterRender() {
    try {
      // Tambahkan indikator loading awal yang jelas
      const paginationContainer = document.querySelector(
        "#pagination-container"
      );

      if (paginationContainer) {
        // Tampilkan loading indicator untuk pagination yang jelas
        paginationContainer.innerHTML = `
          <div class="loading-pagination">
            <div class="loading-spinner"></div>
            <span>Memuat halaman...</span>
          </div>
        `;
      }

      // Load stories menggunakan presenter
      await this.presenter.loadStories();
    } catch (error) {
      this.renderError(error.message);
    }
  }

  showLoading() {
    const storiesContainer = document.querySelector("#stories");
    if (storiesContainer) {
      storiesContainer.innerHTML = this._createSkeletonLoading();
    }

    // Tampilkan loading indicator untuk pagination
    const paginationContainer = document.querySelector("#pagination-container");
    if (paginationContainer) {
      paginationContainer.innerHTML = `
        <div class="loading-pagination">
          <div class="loading-spinner"></div>
          <span>Memuat halaman...</span>
        </div>
      `;
    }
  }

  renderStories(stories) {
    const storiesContainer = document.querySelector("#stories");
    storiesContainer.innerHTML = "";

    if (stories.length === 0) {
      storiesContainer.innerHTML = `
        <div class="empty-state">
          <p>Tidak ada cerita yang tersedia. Mulai berbagi cerita Anda!</p>
        </div>
      `;
      return;
    }

    stories.forEach((story) => {
      const storyElement = this._createStoryElement(story);
      storiesContainer.appendChild(storyElement);
    });
  }

  renderPagination(currentPage, totalPages, allPages, onPageChange) {
    const paginationContainer = document.querySelector("#pagination-container");
    if (!paginationContainer) {
      return;
    }

    // Jangan tampilkan pagination jika hanya 1 halaman
    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }

    let paginationHTML = `<div class="pagination">`;

    // Previous button
    paginationHTML += `
      <button class="pagination-button prev-button" ${
        currentPage === 1 ? "disabled" : ""
      } title="Halaman sebelumnya">
        <i class="fas fa-angle-left"></i>
      </button>
    `;

    // Simple pagination logic to show exactly 7 pages when possible
    if (totalPages <= 7) {
      // If 7 or fewer pages, just show all page numbers
      for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
          <button class="pagination-button ${
            i === currentPage ? "active" : ""
          }" data-page="${i}">
            ${i}
          </button>
        `;
      }
    } else {
      // More than 7 pages, we need to be selective
      let pagesToShow = [];

      // Always include page 1
      pagesToShow.push(1);

      // Always include current page and some pages around it
      for (
        let i = Math.max(2, currentPage - 2);
        i <= Math.min(totalPages - 1, currentPage + 2);
        i++
      ) {
        pagesToShow.push(i);
      }

      // Always include the last page
      pagesToShow.push(totalPages);

      // Sort and remove duplicates
      pagesToShow = [...new Set(pagesToShow)].sort((a, b) => a - b);

      // If we have fewer than 7 pages, add more around the current page
      while (pagesToShow.length < 7 && pagesToShow.length < totalPages) {
        // Try to add pages after the current page
        let nextPageToAdd =
          currentPage +
          (pagesToShow.length - pagesToShow.indexOf(currentPage) - 1);
        if (
          nextPageToAdd < totalPages &&
          !pagesToShow.includes(nextPageToAdd)
        ) {
          pagesToShow.push(nextPageToAdd);
          pagesToShow.sort((a, b) => a - b);
          continue;
        }

        // If we couldn't add after, try before
        let prevPageToAdd =
          currentPage - (pagesToShow.indexOf(currentPage) + 1);
        if (prevPageToAdd > 1 && !pagesToShow.includes(prevPageToAdd)) {
          pagesToShow.push(prevPageToAdd);
          pagesToShow.sort((a, b) => a - b);
          continue;
        }

        // If we can't add more pages, break
        break;
      }

      // Render the selected pages with ellipses where needed
      for (let i = 0; i < pagesToShow.length; i++) {
        // Add ellipsis if there's a gap
        if (i > 0 && pagesToShow[i] > pagesToShow[i - 1] + 1) {
          paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }

        // Add the page button
        paginationHTML += `
          <button class="pagination-button ${
            pagesToShow[i] === currentPage ? "active" : ""
          }" data-page="${pagesToShow[i]}">
            ${pagesToShow[i]}
          </button>
        `;
      }
    }

    // Next button
    paginationHTML += `
      <button class="pagination-button next-button" ${
        currentPage === totalPages ? "disabled" : ""
      } title="Halaman berikutnya">
        <i class="fas fa-angle-right"></i>
      </button>
    `;

    paginationHTML += `</div>`;
    paginationContainer.innerHTML = paginationHTML;

    // Add event listeners
    const prevButton = paginationContainer.querySelector(".prev-button");
    if (prevButton) {
      prevButton.addEventListener("click", () => {
        if (currentPage > 1 && !prevButton.hasAttribute("disabled")) {
          onPageChange(currentPage - 1);
        }
      });
    }

    const nextButton = paginationContainer.querySelector(".next-button");
    if (nextButton) {
      nextButton.addEventListener("click", () => {
        if (currentPage < totalPages && !nextButton.hasAttribute("disabled")) {
          onPageChange(currentPage + 1);
        }
      });
    }

    const pageButtons = paginationContainer.querySelectorAll(
      ".pagination-button[data-page]"
    );
    pageButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const pageNum = parseInt(button.dataset.page, 10);
        if (pageNum && pageNum !== currentPage) {
          onPageChange(pageNum);
        }
      });
    });
  }

  renderError(message) {
    const storiesContainer = document.querySelector("#stories");
    storiesContainer.innerHTML = `
      <div class="error-container">
        <p class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          Gagal memuat cerita. ${message}
        </p>
      </div>
    `;
  }

  renderMap(stories) {
    const mapElement = document.getElementById("map");
    const mapLoading = document.getElementById("map-loading");

    // Show map and initialize
    mapElement.style.display = "block";
    mapLoading.style.display = "none";

    // Jika map sudah diinisialisasi, update marker saja
    if (this.map) {
      this._updateMapMarkers(stories);
      this.invalidateMap();
    } else {
      // Jika map belum diinisialisasi, buat map baru
      this._initializeMap(stories);
    }
  }

  _updateMapMarkers(stories) {
    // Hapus semua marker yang ada
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });

    // Tambahkan marker baru
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
          .addTo(this.map);
      });
  }

  _initializeMap(stories) {
    // Cek apakah ada elemen map sebelum menginisialisasi
    const mapElement = document.getElementById("map");
    if (!mapElement) {
      return;
    }

    // Check if map is already initialized
    if (this.map) {
      this._updateMapMarkers(stories);
      return;
    }

    // Initialize map
    this.map = L.map("map").setView([-2.5489, 118.0149], 5);

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
    osmLayer.addTo(this.map);

    // Add layer control
    L.control
      .layers(baseLayers, null, {
        collapsed: false,
      })
      .addTo(this.map);

    // Add stories markers
    this._updateMapMarkers(stories);
  }

  invalidateMap() {
    // Fix untuk masalah ukuran peta saat halaman direndering ulang
    if (this.map) {
      setTimeout(() => {
        this.map.invalidateSize();
      }, 100);
    }
  }

  dispose() {
    if (this.map) {
      // Hapus map instance ketika halaman dibuang
      this.map.remove();
      this.map = null;
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
}

// Use factory function to create StoriesPage with model dependency
export default (storyModel) => new StoriesPage(storyModel);
