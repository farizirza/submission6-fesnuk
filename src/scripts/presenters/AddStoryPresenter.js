import BasePresenter from "./BasePresenter";
import { showInAppNotification } from "../utils/in-app-notification";

class AddStoryPresenter extends BasePresenter {
  constructor(model, view) {
    super(model, view);
  }

  async addStory(storyData) {
    try {
      await this.model.addStory(storyData);
      window.location.hash = "#/";
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
}

export default AddStoryPresenter;
