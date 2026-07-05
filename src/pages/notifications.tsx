import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { registerPushNotifications } from "@/lib/pushNotifications";

function formatDate(date?: string | null) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function firstNameOnly(value?: string | null) {
  if (!value) return "";
  return String(value).trim().split(/\s+/)[0];
}

function firstNamesOnlyList(value?: string | null) {
  if (!value) return "";

  return String(value)
    .split(",")
    .map((name) => firstNameOnly(name))
    .filter(Boolean)
    .join(", ");
}

function formatLabel(value?: string | null) {
  if (!value) return "";

  const labelMap: Record<string, string> = {
    WALKING: "Dog Walking",
    TRAINING: "Dog Training",
    GROOMING: "Dog Grooming",
    BOARDING: "Dog Boarding",
    DAYCARE: "Doggy Daycare",
    PET_SITTING: "Pet Sitting",
    PET_TRANSPORT: "Pet Transport",
    MOBILE_VET: "Mobile Vet",
    OWNER_HOME: "Owner’s home",
    SUPPLIER_HOME: "Supplier’s premises",
    SUPPLIER_LOCATION: "Supplier’s premises",
    HALF_DAY: "Half Day",
    FULL_DAY: "Full Day",
    RETURN: "Return Journey",
    ONE_WAY: "One-way Journey",
  };

  if (labelMap[value]) return labelMap[value];

  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getNotificationBookingText(notification: any) {
  const booking = notification.booking;

  if (!booking) return notification.message || "";

  const serviceLabel = formatLabel(booking.serviceLabel);
  const dogNames = firstNamesOnlyList(booking.dogNames) || "your dog";

  return `${serviceLabel} with ${dogNames} on ${formatDate(booking.startAt)}`;
}

function shouldShowMessage(notification: any) {
  // If the notification has booking details, the booking summary already explains it.
  // This prevents duplicate lines like:
  // "Dog Walking with Moose..." + "Hayley requested walking for Moose."
  if (notification.booking) return false;

  return Boolean(notification.message);
}

function getReviewPath(role?: string | null, bookingId?: string | null) {
  if (!bookingId) return null;

  if (role === "SUPPLIER") {
    return `/supplier/dashboard?bookingId=${bookingId}&action=review`;
  }

  return `/owner/dashboard?bookingId=${bookingId}&action=review`;
}

function getBookingPath(role?: string | null, bookingId?: string | null) {
  if (!bookingId) return null;

  if (role === "SUPPLIER") {
    return `/supplier/dashboard?bookingId=${bookingId}`;
  }

  return `/owner/dashboard?bookingId=${bookingId}`;
}

function hasAlreadyReviewed(role?: string | null, booking?: any) {
  if (!booking) return false;

  if (role === "SUPPLIER") {
    return Boolean(booking.hasSupplierReviewed);
  }

  return Boolean(booking.hasOwnerReviewed);
}

function shouldOpenReview(role?: string | null, notification?: any) {
  const booking = notification?.booking;
  const bookingId = notification?.referenceId || booking?.id;

  if (!bookingId || !booking) return false;

  const title = String(notification?.title || "").toLowerCase();
  const message = String(notification?.message || "").toLowerCase();

  const looksLikeReviewNotification =
    title.includes("leave a review") ||
    title.includes("review") ||
    message.includes("leave a review") ||
    message.includes("how was your experience");

  if (!looksLikeReviewNotification) return false;
  if (booking.status !== "COMPLETED") return false;
  if (hasAlreadyReviewed(role, booking)) return false;

  return true;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [isEnablingPush, setIsEnablingPush] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/api/notifications");
      return res.data;
    },
  });

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/api/me");
      return res.data;
    },
  });

  const currentRole = meData?.user?.role || meData?.role || null;

  const notifications = Array.isArray(data?.notifications)
    ? data.notifications
    : [];

  const unreadCount =
    typeof data?.unreadCount === "number"
      ? data.unreadCount
      : notifications.filter((n: any) => !n.read).length;

  async function handleEnablePush() {
    try {
      setIsEnablingPush(true);
      setPushStatus(null);

      await registerPushNotifications();

      setPushStatus("Push notifications enabled.");
    } catch (err: any) {
      setPushStatus(err?.message || "Could not enable push notifications.");
    } finally {
      setIsEnablingPush(false);
    }
  }

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  async function handleNotificationClick(notification: any) {
    if (!notification.read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }

    const bookingId = notification.referenceId || notification.booking?.id || null;

    if (!bookingId) return;

    const destination = shouldOpenReview(currentRole, notification)
      ? getReviewPath(currentRole, bookingId)
      : getBookingPath(currentRole, bookingId);

    if (destination) {
      navigate(destination);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 pb-10 pt-28">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={handleEnablePush}
            disabled={isEnablingPush}
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            {isEnablingPush ? "Enabling..." : "Enable push notifications"}
          </button>

          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Mark all as read
            </button>
          ) : null}
        </div>
      </div>

      {pushStatus ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          {pushStatus}
        </div>
      ) : null}

      {isLoading ? <p className="text-gray-500">Loading notifications...</p> : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load notifications.
        </div>
      ) : null}

      {!isLoading && !error && notifications.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
          No notifications yet.
        </div>
      ) : null}

      <div className="space-y-3">
        {notifications.map((n: any) => (
          <button
            key={n.id}
            type="button"
            onClick={() => handleNotificationClick(n)}
            className={`w-full rounded-2xl border p-4 text-left ${
              n.read ? "border-gray-200 bg-white" : "border-yellow-200 bg-yellow-50"
            }`}
          >
            <p className="font-semibold text-gray-900">{n.title}</p>

            <p className="mt-1 text-sm text-gray-600">
              {getNotificationBookingText(n)}
            </p>

            {shouldShowMessage(n) ? (
              <p className="mt-1 text-sm text-gray-500">{n.message}</p>
            ) : null}

            <p className="mt-2 text-xs text-gray-400">{formatDate(n.createdAt)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}