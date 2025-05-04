import AuthPresenter from "../../presenters/AuthPresenter";

class AuthPage {
  constructor(storyModel) {
    this.storyModel = storyModel;
    this.presenter = new AuthPresenter(storyModel, this);
  }

  async render() {
    return `
      <section class="container">
        <div class="auth-form">
          <div class="auth-tabs">
            <button id="loginTab" class="auth-tab active">Login</button>
            <button id="registerTab" class="auth-tab">Register</button>
          </div>

          <div class="error-message" id="authError" style="display: none;"></div>

          <form id="loginForm" class="login-form">
            <div class="form-group">
              <label for="loginEmail">Email</label>
              <input type="email" id="loginEmail" name="email" required>
            </div>
            <div class="form-group">
              <label for="loginPassword">Password</label>
              <input type="password" id="loginPassword" name="password" required>
            </div>
            <button type="submit" class="submit-button">Login</button>
          </form>

          <form id="registerForm" class="register-form" style="display: none;">
            <div class="form-group">
              <label for="registerName">Nama</label>
              <input type="text" id="registerName" name="name" required minlength="3">
            </div>
            <div class="form-group">
              <label for="registerEmail">Email</label>
              <input type="email" id="registerEmail" name="email" required>
            </div>
            <div class="form-group">
              <label for="registerPassword">Password</label>
              <input type="password" id="registerPassword" name="password" required minlength="8" aria-describedby="passwordHelp">
              <small id="passwordHelp" class="input-help">Password minimal 8 karakter</small>
            </div>
            <button type="submit" class="submit-button">Register</button>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._setupTabs();
    this._setupLoginForm();
    this._setupRegisterForm();
  }

  _setupTabs() {
    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const authError = document.getElementById("authError");

    loginTab.addEventListener("click", () => {
      loginTab.classList.add("active");
      registerTab.classList.remove("active");
      loginForm.style.display = "block";
      registerForm.style.display = "none";
      authError.style.display = "none";
    });

    registerTab.addEventListener("click", () => {
      registerTab.classList.add("active");
      loginTab.classList.remove("active");
      registerForm.style.display = "block";
      loginForm.style.display = "none";
      authError.style.display = "none";
    });
  }

  showError(message) {
    const authError = document.getElementById("authError");
    authError.textContent = message;
    authError.style.display = "block";
  }

  showRegisterSuccess() {
    alert("Registrasi berhasil! Silakan login.");
    document.getElementById("loginTab").click();
  }

  _setupLoginForm() {
    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      await this.presenter.login({ email, password });
    });
  }

  _setupRegisterForm() {
    const registerForm = document.getElementById("registerForm");

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("registerName").value;
      const email = document.getElementById("registerEmail").value;
      const password = document.getElementById("registerPassword").value;

      try {
        if (password.length < 8) {
          throw new Error("Password harus minimal 8 karakter");
        }

        if (name.length < 3) {
          throw new Error("Nama harus minimal 3 karakter");
        }

        await this.presenter.register({ name, email, password });
      } catch (error) {
        this.showError(error.message);
      }
    });
  }
}

// Use factory function to create AuthPage with model dependency
export default (storyModel) => new AuthPage(storyModel);
