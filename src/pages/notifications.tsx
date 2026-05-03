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

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/api/notifications");
      return res.data.notifications;
    },
  });

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

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
            {markAllAsReadMutation.isPending ? "Updating..." : "Mark all as read"}
          </button>
        ) : null}
      </div>

      {isLoading ? <p className="text-gray-500">Loading notifications...</p> : null}

      {!isLoading && notifications.length === 0 ? (
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
            className={`w-full rounded-2xl border p-4 text-left transition ${
              n.read
                ? "border-gray-200 bg-white"
                : "border-yellow-200 bg-yellow-50"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
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
              </div>

              {!n.read ? (
                <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                  New
                </span>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}