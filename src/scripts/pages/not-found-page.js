class NotFoundPage {
  async render() {
    return `
      <section class="container not-found-page">
        <div class="not-found-content">
          <h1 class="not-found-title">404</h1>
          <h2 class="not-found-subtitle">Halaman Tidak Ditemukan</h2>
          <p class="not-found-message">Maaf, halaman yang Anda cari tidak ditemukan atau tidak tersedia.</p>
          <div class="not-found-actions">
            <a href="#/" class="btn btn-primary">
              <i class="fas fa-home"></i> Kembali ke Beranda
            </a>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // No additional logic needed for this page
  }
}

export default () => new NotFoundPage();
