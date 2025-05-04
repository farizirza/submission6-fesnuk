import HomePage from "../pages/home/home-page";
import AboutPage from "../pages/about/about-page";
import StoriesPage from "../pages/stories/stories-page";
import AddStoryPage from "../pages/stories/add-story-page";
import GuestStoryPage from "../pages/stories/guest-story-page";
import DetailStoryPage from "../pages/stories/detail-story-page";
import AuthPage from "../pages/auth/auth-page";
import NotificationPage from "../pages/notification-page";

let currentPage = null;

const disposePage = async () => {
  if (currentPage && typeof currentPage.dispose === "function") {
    try {
      await currentPage.dispose();
    } catch (error) {
      console.error("Error disposing page:", error);
    }
  }
};

// Higher-order function for auth checking
const checkAuth = (pageFactory) => {
  return (model) => {
    return {
      async render() {
        if (!model.getToken()) {
          window.location.hash = "#/auth";
          return "";
        }
        await disposePage();
        currentPage =
          typeof pageFactory === "function" ? pageFactory(model) : pageFactory;
        return currentPage.render();
      },
      async afterRender() {
        if (!model.getToken()) return;
        return currentPage.afterRender();
      },
    };
  };
};

// Higher-order function for page wrapping with dispose
const wrapWithDispose = (pageFactory) => {
  return (model) => {
    return {
      async render() {
        await disposePage();
        currentPage =
          typeof pageFactory === "function" ? pageFactory(model) : pageFactory;
        return currentPage.render();
      },
      async afterRender() {
        return currentPage.afterRender();
      },
    };
  };
};

const routes = {
  "/": checkAuth(StoriesPage),
  "/about": wrapWithDispose(new AboutPage()),
  "/add": checkAuth((model) => new AddStoryPage(model)),
  "/guest": wrapWithDispose((model) => new GuestStoryPage(model)),
  "/auth": wrapWithDispose((model) => new AuthPage(model)),
  "/stories/:id": checkAuth((model) => new DetailStoryPage(model)),
  "/notifications": checkAuth((model) => new NotificationPage(model)),
};

export default routes;
