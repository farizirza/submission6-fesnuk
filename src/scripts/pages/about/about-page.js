export default class AboutPage {
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
                <li><i class="fab fa-html5"></i> HTML5 & <i class="fab fa-css3-alt"></i> CSS3</li>
                <li><i class="fas fa-code"></i> Model-View-Presenter Architecture</li>
                <li><i class="fas fa-map"></i> Leaflet Maps Integration</li>
                <li><i class="fas fa-database"></i> Web Storage API</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Animations could be added here if needed
  }
}
