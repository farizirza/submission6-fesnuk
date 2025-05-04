class BasePresenter {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  // Common presenter methods can be added here
  isAuthenticated() {
    return !!this.model.getToken();
  }
}

export default BasePresenter;
