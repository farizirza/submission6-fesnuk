import BasePresenter from "./BasePresenter";
import { showInAppNotification } from "../utils/in-app-notification";

class AuthPresenter extends BasePresenter {
  constructor(model, view) {
    super(model, view);
  }

  async login(credentials) {
    try {
      await this.model.login(credentials);
      showInAppNotification({
        title: "Login Berhasil",
        message: "Selamat datang kembali!",
        type: "success",
        duration: 3000,
      });
      window.location.hash = "#/";
    } catch (error) {
      this.view.showError(error.message);
    }
  }

  async register(userData) {
    try {
      await this.model.register(userData);
      showInAppNotification({
        title: "Registrasi Berhasil",
        message: "Akun Anda berhasil dibuat. Silakan login.",
        type: "success",
        duration: 5000,
      });
      this.view.showRegisterSuccess();
    } catch (error) {
      this.view.showError(error.message);
    }
  }
}

export default AuthPresenter;
