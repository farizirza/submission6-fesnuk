import BasePresenter from "./BasePresenter";
import { showInAppNotification } from "../utils/in-app-notification";

class DetailStoryPresenter extends BasePresenter {
  constructor(model, view) {
    super(model, view);
  }

  async loadStoryDetail(id) {
    try {
      const story = await this.model.getStoryDetail(id);
      this.view.renderStoryDetail(story);

      if (story.lat && story.lon) {
        this.view.renderMap(story);
      }
    } catch (error) {
      console.error("Error loading story:", error);
      this.view.renderError(error.message);
      showInAppNotification({
        title: "Error",
        message: `Failed to load story detail: ${error.message}`,
        type: "error",
        duration: 5000,
      });
    }
  }

  async archiveStory(story) {
    try {
      await this.model.archiveStoryForOffline(story);
      showInAppNotification({
        title: "Berhasil",
        message: "Cerita berhasil diarsipkan untuk dilihat secara offline.",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error archiving story:", error);
      showInAppNotification({
        title: "Error",
        message: `Gagal mengarsipkan cerita: ${error.message}`,
        type: "error",
        duration: 5000,
      });
      throw error;
    }
  }
}

export default DetailStoryPresenter;
