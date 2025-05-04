/**
 * Sets up the skip to content functionality
 * Prevents default hash navigation to avoid conflicts with SPA routes
 */
const setupSkipToContent = () => {
  const skipLink = document.querySelector(".skip-link");
  const mainContent = document.getElementById("mainContent");

  if (skipLink && mainContent) {
    skipLink.addEventListener("click", (event) => {
      event.preventDefault(); // Prevent hash navigation
      skipLink.blur(); // Remove focus from the skip link

      // Add focus to main content and scroll into view
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: "smooth" });
    });
  }
};

export default setupSkipToContent;
