/* global clients */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text() || "You have a new Medixo update." };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Medixo", {
      body: data.body || "You have a new appointment update.",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: data.notificationId || "medixo-notification",
      data: { url: data.url || "/patient-dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/patient-dashboard", self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((client) => "focus" in client);
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      return clients.openWindow(url);
    })
  );
});
