import BasePresenter from "./BasePresenter";
import { showInAppNotification } from "../utils/in-app-notification";

class GuestStoryPresenter extends BasePresenter {
  constructor(model, view) {
    super(model, view);
  }

  async addGuestStory(storyData) {
    try {
      await this.model.addGuestStory(storyData);
      window.location.hash = "#/";
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
}

export default GuestStoryPresenter;
