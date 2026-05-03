import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

function formatDate(date?: string | null) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/api/notifications");
      return res.data;
    },
  });

  const notifications = Array.isArray(data?.notifications)
    ? data.notifications
    : [];

  const unreadCount =
    typeof data?.unreadCount === "number"
      ? data.unreadCount
      : notifications.filter((n: any) => !n.read).length;

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

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 pb-10 pt-28">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
          </p>
        </div>

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
            onClick={() => {
              if (!n.read) markAsReadMutation.mutate(n.id);
            }}
            className={`w-full rounded-2xl border p-4 text-left ${
              n.read
                ? "border-gray-200 bg-white"
                : "border-yellow-200 bg-yellow-50"
            }`}
          >
            <p className="font-semibold text-gray-900">{n.title}</p>
            <p className="mt-1 text-sm text-gray-600">
              {n.booking
                ? `${n.booking.serviceLabel} with ${
                    n.booking.dogNames || "your dog"
                  } on ${formatDate(n.booking.startAt)}`
                : n.message}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              {formatDate(n.createdAt)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}