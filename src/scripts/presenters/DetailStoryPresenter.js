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
}

export default DetailStoryPresenter;
