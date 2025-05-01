import { showInAppNotification } from "./in-app-notification";

/**
 * Setup event listeners untuk status jaringan
 * dan menampilkan notifikasi saat status berubah
 */
export function setupNetworkStatusNotifier() {
  // Cek status awal
  const isOnline = navigator.onLine;

  // Listener untuk saat koneksi terputus
  window.addEventListener("offline", () => {
    showInAppNotification({
      title: "Offline",
      message: "Anda sedang offline. Beberapa fitur mungkin tidak tersedia.",
      type: "warning",
      duration: 5000,
    });
  });

  // Listener untuk saat kembali online
  window.addEventListener("online", () => {
    showInAppNotification({
      title: "Online",
      message: "Anda kembali online. Semua fitur tersedia.",
      type: "success",
      duration: 3000,
    });
  });

  // Jika saat aplikasi dimuat sudah offline, tampilkan notifikasi
  if (!isOnline) {
    setTimeout(() => {
      showInAppNotification({
        title: "Offline",
        message: "Anda sedang offline. Beberapa fitur mungkin tidak tersedia.",
        type: "warning",
        duration: 5000,
      });
    }, 2000);
  }
}
