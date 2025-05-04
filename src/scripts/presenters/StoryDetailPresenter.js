import BasePresenter from "./BasePresenter";
import { showInAppNotification } from "../utils/in-app-notification";

class StoryDetailPresenter extends BasePresenter {
  constructor(storyModel, view) {
    super(storyModel, view);
  }

  async loadStoryDetail(id) {
    try {
      const story = await this.model.getStoryDetail(id);
      this.view.renderStoryDetail(story);

      if (story.lat && story.lon) {
        this.view.renderMap(story);
      }
    } catch (error) {
      console.error("Error in StoryDetailPresenter:", error);
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

export default StoryDetailPresenter;
