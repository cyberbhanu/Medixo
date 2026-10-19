import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotificationPublicKey,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from "../api";
import { DashboardIcon } from "./DashboardLayout";
import { getDashboardPath, getStoredUser } from "../utils/auth";

const decodeBase64Key = (value) => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
};

const getPushErrorMessage = (error) =>
  error?.response?.data?.error || error?.message || "Unable to update notifications. Please try again.";

const isAppleTouchDevice = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export default function NotificationCenter({ refreshInterval = 30000, showPermissionPrompt = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushState, setPushState] = useState("checking");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notificationError, setNotificationError] = useState("");
  const [pushError, setPushError] = useState("");

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setLastUpdated(new Date());
      setNotificationError("");
    } catch (error) {
      setNotificationError(getPushErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(() => loadNotifications({ silent: true }), refreshInterval);
    return () => window.clearInterval(interval);
  }, [loadNotifications, refreshInterval]);

  useEffect(() => {
    let cancelled = false;
    const checkPush = async () => {
      if (!window.isSecureContext) {
        setPushState("unsupported");
        return;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setPushState(isAppleTouchDevice() ? "install-required" : "unsupported");
        return;
      }

      if (window.Notification.permission === "denied") {
        setPushState("denied");
        return;
      }

      try {
        const keyData = await getNotificationPublicKey();
        if (!keyData.enabled || !keyData.publicKey) {
          if (!cancelled) setPushState("unavailable");
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscribeToNotifications(subscription.toJSON());
          if (!cancelled) setPushState("enabled");
          return;
        }

        if (!cancelled) setPushState("ready");
      } catch (error) {
        if (!cancelled) {
          setPushState("error");
          setPushError(getPushErrorMessage(error));
        }
      }
    };

    checkPush();
    return () => {
      cancelled = true;
    };
  }, []);

  const enablePush = async () => {
    setBusy(true);
    setPushError("");
    try {
      const keyData = await getNotificationPublicKey();
      if (!keyData.enabled || !keyData.publicKey) {
        setPushState("unavailable");
        return;
      }

      const permission = window.Notification.permission === "granted"
        ? "granted"
        : await window.Notification.requestPermission();
      if (permission !== "granted") {
        setPushState(permission === "denied" ? "denied" : "ready");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeBase64Key(keyData.publicKey),
        });
      }

      await subscribeToNotifications(subscription.toJSON());
      setPushState("enabled");
    } catch (error) {
      setPushState("error");
      setPushError(getPushErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const markRead = async (item) => {
    if (item.readAt) return true;
    try {
      await markNotificationRead(item._id);
      setNotifications((current) => current.map((notification) => notification._id === item._id
        ? { ...notification, readAt: new Date().toISOString() }
        : notification));
      setUnreadCount((current) => Math.max(0, current - 1));
      setNotificationError("");
      return true;
    } catch (error) {
      setNotificationError(getPushErrorMessage(error));
      return false;
    }
  };

  const openNotification = async (item) => {
    if (!await markRead(item)) return;
    const user = getStoredUser();
    navigate(item.data?.url || getDashboardPath(user?.role));
    setOpen(false);
  };

  const markAllRead = async () => {
    setBusy(true);
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setUnreadCount(0);
      setNotificationError("");
    } catch (error) {
      setNotificationError(getPushErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const unreadNotifications = notifications.filter((item) => !item.readAt);
  const readNotifications = notifications.filter((item) => item.readAt);
  const updatedLabel = lastUpdated
    ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Checking for updates...";

  const renderNotification = (item) => (
    <button type="button" key={item._id} className={`notification-item ${item.readAt ? "read" : "unread"}`} onClick={() => openNotification(item)}>
      <span className="notification-item-marker" aria-hidden="true" />
      <span className="notification-item-content"><strong>{item.title}</strong><span>{item.message}</span><small>{new Date(item.createdAt).toLocaleString()}</small></span>
    </button>
  );

  const showInlinePermissionPrompt = showPermissionPrompt && ["ready", "error"].includes(pushState);

  const pushStatusText = {
    checking: "Checking this browser...",
    ready: "Push alerts are available on this device.",
    enabled: "Push alerts are enabled on this device.",
    denied: "Notifications are blocked. Allow them in your browser or device settings.",
    "install-required": "On iPhone or iPad, install Medixo from Share > Add to Home Screen, then open the installed app to enable push alerts.",
    unsupported: "Push alerts need a supported browser and a secure connection (HTTPS or localhost).",
    unavailable: "Push alerts are not configured on this server yet.",
    error: "Push alerts could not be set up. Please try again.",
  }[pushState];

  return (
    <div className="notification-center">
      <button type="button" className="notification-trigger" onClick={() => setOpen((current) => !current)} aria-label="Open notifications" title="Notifications">
        <DashboardIcon name="bell" />
        {unreadCount > 0 ? <span className="notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
      </button>
      {showInlinePermissionPrompt ? (
        <div className="notification-inline-prompt" role="status">
          <strong>Stay updated on appointments</strong>
          <span>Allow notifications to receive new bookings and queue changes.</span>
          <button type="button" className="notification-enable" onClick={enablePush} disabled={busy}>
            {busy ? "Enabling..." : pushState === "error" ? "Retry notifications" : "Allow notifications"}
          </button>
        </div>
      ) : null}
      {open ? (
        <div className="notification-popover">
          <div className="notification-popover-header">
            <div><strong>Notifications</strong><small>Appointment updates · {updatedLabel}</small></div>
            <div className="notification-popover-actions">
              <button type="button" onClick={() => loadNotifications()} disabled={refreshing} title="Refresh notifications">{refreshing ? "Refreshing" : "Refresh"}</button>
              <button type="button" className="notification-close" onClick={() => setOpen(false)} aria-label="Close notifications" title="Close notifications">x</button>
            </div>
          </div>
          <div className="notification-status-row"><span className="notification-live-dot" /> Live updates every {Math.round(refreshInterval / 1000)}s <span className="notification-unread-label">{unreadCount} unread</span></div>
          <div className={`notification-push-status notification-push-status-${pushState}`} role="status">{pushStatusText}</div>
          {["ready", "enabled"].includes(pushState) ? (
            <p className="notification-platform-note">On iPhone or iPad, add Medixo to your Home Screen and enable alerts from the installed app.</p>
          ) : null}
          {["ready", "error"].includes(pushState) ? (
            <button type="button" className="notification-enable" onClick={enablePush} disabled={busy}>
              {busy ? "Enabling..." : pushState === "error" ? "Retry push notifications" : "Enable push notifications"}
            </button>
          ) : null}
          {pushError ? <p className="notification-error" role="alert">{pushError}</p> : null}
          {notificationError ? <p className="notification-error" role="alert">{notificationError}</p> : null}
          {!notifications.length ? <p className="notification-empty">No appointment notifications yet.</p> : <div className="notification-list">
            {unreadNotifications.length ? <div className="notification-section-label">New</div> : null}
            {unreadNotifications.map(renderNotification)}
            {readNotifications.length ? <div className="notification-section-label">Earlier</div> : null}
            {readNotifications.map(renderNotification)}
          </div>}
          {unreadCount ? <button type="button" className="notification-mark-all" onClick={markAllRead} disabled={busy}>Mark all as read</button> : null}
        </div>
      ) : null}
    </div>
  );
}
