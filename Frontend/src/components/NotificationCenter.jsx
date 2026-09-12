import { useEffect, useState } from "react";
import {
  getNotificationPublicKey,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from "../api";
import { DashboardIcon } from "./DashboardLayout";

const decodeBase64Key = (value) => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushAvailable, setPushAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Notifications should never block the dashboard.
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkPush = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
      try {
        const keyData = await getNotificationPublicKey();
        setPushAvailable(Boolean(keyData.enabled && keyData.publicKey));
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(Boolean(subscription));
      } catch {
        setPushAvailable(false);
      }
    };
    checkPush();
  }, []);

  const enablePush = async () => {
    setBusy(true);
    try {
      const keyData = await getNotificationPublicKey();
      if (!keyData.enabled || !keyData.publicKey) throw new Error("Push notifications are not configured yet.");
      const permission = await window.Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission was not granted.");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeBase64Key(keyData.publicKey),
      });
      await subscribeToNotifications(subscription.toJSON());
      setPushEnabled(true);
    } catch (error) {
      window.alert(error.message || "Unable to enable phone notifications.");
    } finally {
      setBusy(false);
    }
  };

  const markRead = async (item) => {
    if (item.readAt) return;
    await markNotificationRead(item._id);
    setNotifications((current) => current.map((notification) => notification._id === item._id ? { ...notification, readAt: new Date().toISOString() } : notification));
    setUnreadCount((current) => Math.max(0, current - 1));
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    setUnreadCount(0);
  };

  return (
    <div className="notification-center">
      <button type="button" className="notification-trigger" onClick={() => setOpen((current) => !current)} aria-label="Open notifications" title="Notifications">
        <DashboardIcon name="bell" />
        {unreadCount > 0 ? <span className="notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
      </button>
      {open ? (
        <div className="notification-popover">
          <div className="notification-popover-header">
            <div><strong>Notifications</strong><small>Appointment updates</small></div>
            {unreadCount ? <button type="button" onClick={markAllRead}>Mark all read</button> : null}
          </div>
          {pushAvailable && !pushEnabled ? (
            <button type="button" className="notification-enable" onClick={enablePush} disabled={busy}>
              {busy ? "Enabling..." : "Enable phone notifications"}
            </button>
          ) : null}
          {!notifications.length ? <p className="notification-empty">No appointment notifications yet.</p> : (
            <div className="notification-list">
              {notifications.map((item) => (
                <button type="button" key={item._id} className={`notification-item ${item.readAt ? "read" : "unread"}`} onClick={() => markRead(item)}>
                  <strong>{item.title}</strong><span>{item.message}</span><small>{new Date(item.createdAt).toLocaleString()}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
