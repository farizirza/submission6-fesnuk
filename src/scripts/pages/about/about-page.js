class AboutPage {
  constructor(storyModel) {
    this.storyModel = storyModel;
  }

  async render() {
    return `
      <section class="container about-section">
        <h1 class="about-title">Tentang Fesnuk</h1>

        <div class="about-content">
          <div class="app-description">
            <div class="app-logo">
              <i class="fas fa-camera-retro"></i>
            </div>
            <h2 class="app-name">Fesnuk - Platform Berbagi Cerita</h2>

            <div class="description-section">
              <p class="description-text">
                Fesnuk adalah aplikasi berbagi cerita yang memungkinkan pengguna untuk membagikan momen berharga mereka dalam bentuk gambar dan narasi. Aplikasi ini dikembangkan dengan menggunakan arsitektur Model-View-Presenter (MVP) untuk memastikan kode yang terstruktur dan mudah dimaintain.
              </p>

              <p class="description-text">
                Dengan Fesnuk, Anda dapat:
              </p>

              <ul class="feature-list">
                <li><i class="fas fa-share-alt"></i> Berbagi cerita dengan foto dan deskripsi</li>
                <li><i class="fas fa-map-marker-alt"></i> Menambahkan lokasi pada cerita Anda</li>
                <li><i class="fas fa-globe"></i> Menjelajahi cerita dari pengguna lain</li>
                <li><i class="fas fa-user-clock"></i> Membagikan cerita sebagai tamu tanpa perlu mendaftar</li>
                <li><i class="fas fa-bell"></i> Menerima notifikasi saat menambahkan cerita</li>
              </ul>
            </div>

            <div class="tech-section">
              <h3>Teknologi yang Digunakan</h3>
              <ul class="tech-list">
                <li><i class="fab fa-js"></i> JavaScript ES6+</li>
                <li><i class="fab fa-html5"></i> HTML5 & <i class="fab fa-css3-alt"></i>CSS3</li>
                <li><i class="fas fa-code"></i> Model-View-Presenter Architecture</li>
                <li><i class="fas fa-map"></i> Leaflet Maps Integration</li>
                <li><i class="fas fa-database"></i> Web Storage API</li>
                <li><i class="fas fa-mobile-alt"></i> Progressive Web App (PWA)</li>
              </ul>
            </div>

            <div class="pwa-section">
              <h3>Install Aplikasi</h3>
              <p>Fesnuk dapat diinstal sebagai aplikasi di perangkat Anda untuk pengalaman yang lebih baik.</p>
              <button id="manualInstallBtn" class="btn btn-primary">
                <i class="fas fa-download"></i> Install Aplikasi
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Set up the manual install button
    const installButton = document.getElementById("manualInstallBtn");
    if (installButton) {
      // Check if the app is already installed
      if (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
      ) {
        installButton.textContent = "Aplikasi Sudah Terinstal";
        installButton.disabled = true;
        return;
      }

      // Check if we have a saved install prompt
      if (window.deferredPrompt) {
        installButton.addEventListener("click", async () => {
          try {
            // Show the installation prompt
            window.deferredPrompt.prompt();

            // Wait for the user to respond to the prompt
            const { outcome } = await window.deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);

            // Clear the saved prompt since it can't be used again
            window.deferredPrompt = null;

            if (outcome === "accepted") {
              installButton.textContent = "Aplikasi Terinstal!";
              installButton.disabled = true;
            }
          } catch (error) {
            console.error("Error showing install prompt:", error);
            alert(
              "Tidak dapat menampilkan prompt instalasi. Coba gunakan tombol instalasi dari browser Anda."
            );
          }
        });
      } else {
        // No install prompt available
        installButton.textContent = "Buka di Chrome untuk Install";
        installButton.addEventListener("click", () => {
          alert(
            'Untuk menginstal aplikasi, buka di Chrome dan gunakan menu "Add to Home Screen" atau "Install".'
          );
        });
      }
    }
  }
}

// Use factory function to create AboutPage with model dependency
export default (storyModel) => new AboutPage(storyModel);
