import { addGuestStory } from "../../data/api";
import GuestStoryPresenter from "../../presenters/GuestStoryPresenter";

class GuestStoryPage {
  #map = null;
  #stream = null;
  #selectedLocation = null;
  #photoPreview = null;
  #selectedFile = null;
  #presenter = null;

  constructor(storyModel) {
    this.storyModel = storyModel;
    this.#presenter = new GuestStoryPresenter(storyModel, this);
  }

  async render() {
    return `
      <section class="container">
        <h1 class="app-title">Tambah Cerita Sebagai Tamu</h1>
        
        <form id="guestStoryForm" class="story-form">
          <div class="form-group">
            <label for="description">Cerita Anda</label>
            <textarea id="description" name="description" required></textarea>
          </div>

          <div class="form-group">
            <label>Foto</label>
            <div class="photo-input-container">
              <div class="camera-container">
                <video id="camera-preview" autoplay playsinline></video>
                <button type="button" id="captureButton" class="camera-button">
                  <i class="fas fa-camera"></i> Ambil Foto
                </button>
              </div>

              <div class="separator">atau</div>

              <div class="upload-container">
                <input type="file" id="photoInput" accept="image/*" class="photo-input">
                <label for="photoInput" class="upload-button">
                  <i class="fas fa-upload"></i> Pilih File
                </label>
                <small class="input-help">Maksimal 1MB (JPG, PNG, GIF)</small>
              </div>
            </div>

            <div class="preview-container" style="display: none;">
              <img id="imagePreview" alt="Preview" style="max-width: 100%; margin-top: 1rem;">
              <button type="button" class="remove-photo-button" id="removePhotoButton">
                <i class="fas fa-times"></i> Hapus Foto
              </button>
            </div>
            
            <canvas id="photoCanvas" style="display: none;"></canvas>
          </div>

          <div class="form-group">
            <label>Lokasi (Opsional)</label>
            <div id="map" style="height: 300px; margin-bottom: 1rem;"></div>
            <p id="selectedLocation" class="selected-location">Klik pada peta untuk memilih lokasi</p>
          </div>

          <button type="submit" class="submit-button">
            <i class="fas fa-paper-plane"></i> Kirim Cerita
          </button>

          <div class="auth-prompt">
            <p>Ingin fitur lebih? <a href="#/auth">Login atau Register</a></p>
          </div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this._initializeMap();
    await this._initializeCamera();
    this._setupFormSubmission();
    this._setupPhotoInput();
    this._setupPhotoPreview();
  }

  async dispose() {
    if (this.#stream) {
      this.#stream.getTracks().forEach((track) => track.stop());
    }
  }

  _initializeMap() {
    this.#map = L.map("map").setView([-2.5489, 118.0149], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      this.#selectedLocation = { lat, lng };

      // Clear existing markers and add new one
      this.#map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          this.#map.removeLayer(layer);
        }
      });

      L.marker([lat, lng]).addTo(this.#map);
      document.getElementById(
        "selectedLocation"
      ).textContent = `Lokasi dipilih: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    });
  }

  _setupPhotoInput() {
    const photoInput = document.getElementById("photoInput");
    const imagePreview = document.getElementById("imagePreview");
    const previewContainer = document.querySelector(".preview-container");
    const removePhotoButton = document.getElementById("removePhotoButton");

    photoInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
        alert("File harus berupa gambar (JPG, PNG, atau GIF)");
        photoInput.value = "";
        return;
      }

      if (file.size > 1024 * 1024) {
        alert("Ukuran file tidak boleh lebih dari 1MB");
        photoInput.value = "";
        return;
      }

      this.#selectedFile = file;
      const reader = new FileReader();

      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        previewContainer.style.display = "block";
      };

      reader.readAsDataURL(file);
    });

    removePhotoButton.addEventListener("click", () => {
      this.#selectedFile = null;
      photoInput.value = "";
      previewContainer.style.display = "none";
    });
  }

  _setupPhotoPreview() {
    const canvas = document.getElementById("photoCanvas");
    this.#photoPreview = canvas;
  }

  async _initializeCamera() {
    try {
      this.#stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      const videoPreview = document.getElementById("camera-preview");
      videoPreview.srcObject = this.#stream;
    } catch (error) {
      console.error("Error accessing camera:", error);
      const cameraContainer = document.querySelector(".camera-container");
      cameraContainer.innerHTML =
        '<p class="error-message">Kamera tidak tersedia. Silakan gunakan opsi upload file.</p>';
    }

    const captureButton = document.getElementById("captureButton");
    if (captureButton) {
      captureButton.addEventListener("click", () => {
        const video = document.getElementById("camera-preview");
        const canvas = this.#photoPreview;
        const context = canvas.getContext("2d");
        const previewContainer = document.querySelector(".preview-container");
        const imagePreview = document.getElementById("imagePreview");

        const aspectRatio = video.videoWidth / video.videoHeight;
        let targetWidth = 1280;
        let targetHeight = targetWidth / aspectRatio;

        if (targetHeight > 720) {
          targetHeight = 720;
          targetWidth = targetHeight * aspectRatio;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        context.drawImage(video, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            this.#selectedFile = new File([blob], "photo.jpg", {
              type: "image/jpeg",
            });
            imagePreview.src = URL.createObjectURL(blob);
            previewContainer.style.display = "block";
          },
          "image/jpeg",
          0.8
        );
      });
    }
  }

  _setupFormSubmission() {
    const form = document.getElementById("guestStoryForm");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const description = document.getElementById("description").value;

      if (!this.#selectedFile) {
        alert("Silakan pilih atau ambil foto terlebih dahulu");
        return;
      }

      try {
        const storyData = {
          description,
          photo: this.#selectedFile,
        };

        if (this.#selectedLocation) {
          storyData.lat = this.#selectedLocation.lat;
          storyData.lon = this.#selectedLocation.lng;
        }

        await this.#presenter.addGuestStory(storyData);
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    });
  }
}

const createGuestStoryPage = (storyModel) => {
  return new GuestStoryPage(storyModel);
};

export default createGuestStoryPage;
