const CACHE_NAME = "doglife-v4-push-polish-2026-07-29";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }

            return Promise.resolve();
          })
        )
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("push", (event) => {
  let data = {
    title: "DogLife",
    body: "You have a new notification.",
    url: "/notifications",
    tag: undefined,
  };

  if (event.data) {
    try {
      data = {
        ...data,
        ...event.data.json(),
      };
    } catch {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body || "You have a new notification.",
    icon: "/icon-512.png",
    badge: "/icon-512.png",
    tag: data.tag || undefined,
    data: {
      url: data.url || "/notifications",
    },
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "DogLife",
      notificationOptions
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url || "/notifications";

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(async (clientList) => {
        for (const client of clientList) {
          if ("navigate" in client) {
            await client.navigate(targetUrl);
          }

          if ("focus" in client) {
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }

        return undefined;
      })
  );
});