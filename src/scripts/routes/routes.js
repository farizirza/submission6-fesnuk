import HomePage from "../pages/home/home-page";
import AboutPage from "../pages/about/about-page";
import StoriesPage from "../pages/stories/stories-page";
import AddStoryPage from "../pages/stories/add-story-page";
import GuestStoryPage from "../pages/stories/guest-story-page";
import DetailStoryPage from "../pages/stories/detail-story-page";
import AuthPage from "../pages/auth/auth-page";
import NotificationPage from "../pages/notification-page";
import { getToken } from "../data/api";

let currentPage = null;

const disposePage = async () => {
  if (currentPage && typeof currentPage.dispose === "function") {
    await currentPage.dispose();
  }
};

const checkAuth = (page) => {
  return {
    async render() {
      if (!getToken()) {
        window.location.hash = "#/auth";
        return "";
      }
      await disposePage();
      currentPage = page;
      return page.render();
    },
    async afterRender() {
      if (!getToken()) return;
      return page.afterRender();
    },
  };
};

const wrapWithDispose = (page) => {
  return {
    async render() {
      await disposePage();
      currentPage = page;
      return page.render();
    },
    async afterRender() {
      return page.afterRender();
    },
  };
};

const routes = {
  "/": checkAuth(new StoriesPage()),
  "/about": wrapWithDispose(new AboutPage()),
  "/add": checkAuth(new AddStoryPage()),
  "/guest": wrapWithDispose(new GuestStoryPage()),
  "/auth": wrapWithDispose(new AuthPage()),
  "/stories/:id": checkAuth(new DetailStoryPage()),
  "/notifications": checkAuth(new NotificationPage()),
};

export default routes;
