import BasePresenter from "./BasePresenter";
import { showInAppNotification } from "../utils/in-app-notification";

class StoriesPresenter extends BasePresenter {
  constructor(storyModel, view) {
    super(storyModel, view);
    this.currentPage = 1;
    this.pageSize = 9; // 9 stories per halaman
    this.totalPages = 1;
  }

  async loadStories(page = 1) {
    try {
      this.view.showLoading();
      this.currentPage = page;

      // Ambil data untuk halaman yang diminta
      const response = await this.model.getStories(page, this.pageSize);

      // Handle API response format differences
      const stories = response.stories || [];

      // Hitung total pages
      this.totalPages = Math.max(
        response.totalPages ||
          (response.totalStory
            ? Math.ceil(response.totalStory / this.pageSize)
            : 1),
        1
      );

      // Buat array yang berisi semua nomor halaman (untuk pagination)
      const allPages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

      // Render stories list
      this.view.renderStories(stories);

      // Render pagination setelah data di-render
      this.view.renderPagination(
        this.currentPage,
        this.totalPages,
        allPages,
        this.changePage.bind(this)
      );

      // Render map only if we have stories with coordinates
      if (
        stories.length > 0 &&
        stories.some((story) => story.lat && story.lon)
      ) {
        try {
          this.view.renderMap(stories);
        } catch (mapError) {
          console.error("Error rendering map:", mapError);
        }
      }
    } catch (error) {
      console.error("Error in StoriesPresenter:", error);
      this.view.renderError(error.message);
      showInAppNotification({
        title: "Error",
        message: `Failed to load stories: ${error.message}`,
        type: "error",
        duration: 5000,
      });
    }
  }

  async changePage(newPage) {
    if (newPage !== this.currentPage) {
      try {
        this.view.showLoading();

        // Load stories for the new page
        await this.loadStories(newPage);

        // Scroll to top setelah konten baru dimuat
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        console.error("Error changing page:", error);
        showInAppNotification({
          title: "Error",
          message: `Failed to change page: ${error.message}`,
          type: "error",
          duration: 5000,
        });
      }
    }
  }

  async addStory(storyData) {
    try {
      await this.model.addStory(storyData);
      window.location.hash = "#/";
    } catch (error) {
      console.error("Error adding story:", error);
      throw error;
    }
  }

  async addGuestStory(storyData) {
    try {
      await this.model.addGuestStory(storyData);
      window.location.hash = "#/";
    } catch (error) {
      console.error("Error adding guest story:", error);
      throw error;
    }
  }
}

export default StoriesPresenter;
