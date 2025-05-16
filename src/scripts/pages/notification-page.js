import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  showTestNotification,
  isSubscribedToNotifications,
} from "../notification";
import { showInAppNotification } from "../utils/in-app-notification";

class NotificationPage {
  async render() {
    return `
      <section class="container notification-page">
        <h1 class="app-title">Pengaturan Notifikasi</h1>

        <div class="notification-info">
          <p>Aktifkan notifikasi untuk mendapatkan pemberitahuan saat ada aktivitas baru di aplikasi. Anda dapat menerima notifikasi ketika Anda berhasil membuat cerita baru.</p>
        </div>

        <div class="notification-status" id="notificationStatus">
          <p>Status: <span id="notificationStatusText">Memeriksa...</span></p>
          <p>Status Browser: <span id="browserStatusText">Memeriksa...</span></p>
        </div>

        <div class="notification-controls">
          <button id="subscribeBtn" class="btn">
            <i class="fas fa-bell"></i> Aktifkan Notifikasi
          </button>
          <button id="unsubscribeBtn" class="btn">
            <i class="fas fa-bell-slash"></i> Nonaktifkan Notifikasi
          </button>
          <button id="testNotificationBtn" class="btn test-btn">
            <i class="fas fa-check-circle"></i> Test Notifikasi
          </button>
        </div>

        <div class="notification-note">
          <p><strong>Catatan:</strong> Untuk menggunakan fitur notifikasi, pastikan browser Anda mendukung Web Push Notification dan Anda telah memberikan izin notifikasi.</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._checkNotificationStatus();
    this._setupEventListeners();
  }

  async _checkNotificationStatus() {
    const subscribeBtn = document.getElementById("subscribeBtn");
    const unsubscribeBtn = document.getElementById("unsubscribeBtn");
    const testNotificationBtn = document.getElementById("testNotificationBtn");
    const statusText = document.getElementById("notificationStatusText");
    const browserStatusText = document.getElementById("browserStatusText");

    // Check browser support
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      statusText.textContent = "Browser Anda tidak mendukung notifikasi";
      browserStatusText.textContent = "Tidak Didukung";
      browserStatusText.className = "status-error";
      subscribeBtn.disabled = true;
      unsubscribeBtn.disabled = true;
      testNotificationBtn.disabled = true;
      return;
    } else {
      browserStatusText.textContent = "Didukung";
      browserStatusText.className = "status-active";
    }

    // Check notification permission
    if (!("Notification" in window)) {
      statusText.textContent = "Browser Anda tidak mendukung notifikasi";
      subscribeBtn.disabled = true;
      unsubscribeBtn.disabled = true;
      testNotificationBtn.disabled = true;
      return;
    }

    const permissionStatus = Notification.permission;
    if (permissionStatus === "denied") {
      statusText.textContent =
        "Notifikasi diblokir oleh browser. Harap ubah pengaturan browser Anda.";
      statusText.className = "status-error";
      subscribeBtn.disabled = true;
      unsubscribeBtn.disabled = true;
      testNotificationBtn.disabled = true;
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const isSubscribed =
        localStorage.getItem("notification_subscribed") === "true";

      // Synchronize localStorage with actual subscription status
      if (subscription && !isSubscribed) {
        localStorage.setItem("notification_subscribed", "true");
      } else if (!subscription && isSubscribed) {
        localStorage.removeItem("notification_subscribed");
      }

      // Update UI based on subscription status
      if (subscription) {
        statusText.textContent = "Notifikasi Aktif";
        statusText.className = "status-active";
        subscribeBtn.disabled = true;
        unsubscribeBtn.disabled = false;
        testNotificationBtn.disabled = false;
      } else {
        statusText.textContent = "Notifikasi Tidak Aktif";
        statusText.className = "status-inactive";
        subscribeBtn.disabled = false;
        unsubscribeBtn.disabled = true;
        testNotificationBtn.disabled = true;
      }
    } catch (error) {
      statusText.textContent = `Error: ${error.message}`;
      console.error("Error checking notification status:", error);
    }
  }

  _setupEventListeners() {
    const subscribeBtn = document.getElementById("subscribeBtn");
    const unsubscribeBtn = document.getElementById("unsubscribeBtn");
    const testNotificationBtn = document.getElementById("testNotificationBtn");

    subscribeBtn.addEventListener("click", async () => {
      subscribeBtn.disabled = true;
      subscribeBtn.textContent = "Memproses...";
      try {
        await subscribeToPushNotifications();

        // Update UI after subscription
        const statusText = document.getElementById("notificationStatusText");
        if (statusText) {
          statusText.textContent = "Notifikasi Aktif";
          statusText.className = "status-active";
        }

        // Update button states
        subscribeBtn.disabled = true;
        unsubscribeBtn.disabled = false;
        testNotificationBtn.disabled = false;

        // Reset button text
        subscribeBtn.innerHTML =
          '<i class="fas fa-bell"></i> Aktifkan Notifikasi';

        // Show in-app notification
        showInAppNotification({
          title: "Notifikasi",
          message: "Berhasil berlangganan notifikasi",
          type: "success",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error subscribing to notifications:", error);
        subscribeBtn.disabled = false;
        subscribeBtn.innerHTML =
          '<i class="fas fa-bell"></i> Aktifkan Notifikasi';
      }
    });

    unsubscribeBtn.addEventListener("click", async () => {
      unsubscribeBtn.disabled = true;
      unsubscribeBtn.textContent = "Memproses...";
      try {
        await unsubscribeFromPushNotifications();

        // Update UI after unsubscription
        const statusText = document.getElementById("notificationStatusText");
        if (statusText) {
          statusText.textContent = "Notifikasi Tidak Aktif";
          statusText.className = "status-inactive";
        }

        // Update button states
        subscribeBtn.disabled = false;
        unsubscribeBtn.disabled = true;
        testNotificationBtn.disabled = true;

        // Reset button text
        unsubscribeBtn.innerHTML =
          '<i class="fas fa-bell-slash"></i> Nonaktifkan Notifikasi';

        // Show in-app notification
        showInAppNotification({
          title: "Notifikasi",
          message: "Berhasil berhenti berlangganan notifikasi",
          type: "info",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error unsubscribing from notifications:", error);
        unsubscribeBtn.disabled = false;
        unsubscribeBtn.innerHTML =
          '<i class="fas fa-bell-slash"></i> Nonaktifkan Notifikasi';
      }
    });

    testNotificationBtn.addEventListener("click", async () => {
      testNotificationBtn.disabled = true;
      testNotificationBtn.textContent = "Mengirim...";
      try {
        await showTestNotification();

        // Show in-app notification
        showInAppNotification({
          title: "Notifikasi",
          message: "Notifikasi test berhasil dikirim",
          type: "info",
          duration: 3000,
        });

        setTimeout(() => {
          testNotificationBtn.disabled = false;
          testNotificationBtn.innerHTML =
            '<i class="fas fa-check-circle"></i> Test Notifikasi';
        }, 2000);
      } catch (error) {
        console.error("Error testing notification:", error);
        testNotificationBtn.disabled = false;
        testNotificationBtn.innerHTML =
          '<i class="fas fa-check-circle"></i> Test Notifikasi';
      }
    });
  }
}

const createNotificationPage = () => {
  return new NotificationPage();
};

export default createNotificationPage;
