/**
 * Utilitas untuk menampilkan notifikasi di dalam aplikasi web
 */

// Simpan notifikasi aktif
let activeNotifications = [];
let notificationCounter = 0;

/**
 * Tampilkan notifikasi di dalam aplikasi
 * @param {Object} options - Opsi notifikasi
 * @param {string} options.title - Judul notifikasi
 * @param {string} options.message - Pesan notifikasi
 * @param {string} options.type - Tipe notifikasi (success, error, info, warning)
 * @param {number} options.duration - Durasi tampil dalam milidetik
 * @returns {number} ID notifikasi
 */
export function showInAppNotification({
  title = "",
  message = "",
  type = "info",
  duration = 5000,
}) {
  // Buat container untuk notifikasi jika belum ada
  let notificationContainer = document.getElementById(
    "app-notification-container"
  );
  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "app-notification-container";
    document.body.appendChild(notificationContainer);
  }

  // Buat ID unik untuk notifikasi
  const notificationId = ++notificationCounter;

  // Buat elemen notifikasi
  const notification = document.createElement("div");
  notification.className = `app-notification app-notification-${type}`;
  notification.id = `notification-${notificationId}`;
  notification.setAttribute("role", "alert");

  // Tambahkan animation class
  notification.classList.add("notification-slide-in");

  // Icon berdasarkan tipe
  let icon = "";
  switch (type) {
    case "success":
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case "error":
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case "warning":
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle"></i>';
  }

  // Buat konten notifikasi
  notification.innerHTML = `
    <div class="notification-icon">${icon}</div>
    <div class="notification-content">
      ${title ? `<div class="notification-title">${title}</div>` : ""}
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close" aria-label="Close">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Tambahkan ke container
  notificationContainer.appendChild(notification);

  // Simpan referensi notifikasi
  activeNotifications.push({
    id: notificationId,
    element: notification,
    timer: null,
  });

  // Tambahkan event listener untuk tombol tutup
  const closeButton = notification.querySelector(".notification-close");
  closeButton.addEventListener("click", () => {
    closeNotification(notificationId);
  });

  // Set timer untuk menghilangkan notifikasi
  const timer = setTimeout(() => {
    closeNotification(notificationId);
  }, duration);

  // Update timer di activeNotifications
  const notificationObj = activeNotifications.find(
    (n) => n.id === notificationId
  );
  if (notificationObj) {
    notificationObj.timer = timer;
  }

  return notificationId;
}

/**
 * Tutup notifikasi berdasarkan ID
 * @param {number} id - ID notifikasi
 */
export function closeNotification(id) {
  const notificationObj = activeNotifications.find((n) => n.id === id);
  if (!notificationObj) return;

  const { element, timer } = notificationObj;

  // Hapus timer jika ada
  if (timer) {
    clearTimeout(timer);
  }

  // Animasi keluar
  element.classList.add("notification-slide-out");
  element.classList.remove("notification-slide-in");

  // Hapus elemen setelah animasi selesai
  element.addEventListener("animationend", () => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }

    // Hapus dari array aktif
    activeNotifications = activeNotifications.filter((n) => n.id !== id);

    // Hapus container jika tidak ada notifikasi lagi
    const container = document.getElementById("app-notification-container");
    if (container && activeNotifications.length === 0) {
      container.remove();
    }
  });
}

/**
 * Tutup semua notifikasi
 */
export function closeAllNotifications() {
  [...activeNotifications].forEach((notification) => {
    closeNotification(notification.id);
  });
}
