// src/pages/dashboard.tsx

import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(cents?: number | null) {
  if (!cents) return "—";
  return `R${(cents / 100).toFixed(0)}`;
}

function formatLabel(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    case "CONFIRMED":
      return "bg-green-100 text-green-700";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700";
    case "COMPLETED_UNBILLED":
      return "bg-purple-100 text-purple-700";
    case "COMPLETED":
      return "bg-gray-100 text-gray-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function splitNotesIntoParts(notes?: string | null) {
  if (!notes || typeof notes !== "string") return [];

  return notes
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
}

function uniqueParts(parts: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of parts) {
    const key = part.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(part);
    }
  }

  return result;
}

function parseBookingNotes(notes?: string | null) {
  const parts = uniqueParts(splitNotesIntoParts(notes));

  return {
    details: parts,
    addresses: [],
    general: [],
  };
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    today: true,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const res = await api.get("/api/bookings");
      return res.data.bookings;
    },
  });

  const { data: notifications = [] } = useQuery({
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

  // ✅ FIXED LOCATION
  function handleNotificationClick(notification: any) {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    if (!notification.referenceId) return;

    const bookingElement = document.getElementById(
      `booking-${notification.referenceId}`
    );

    if (bookingElement) {
      bookingElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(0, 3).map((n: any) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`cursor-pointer rounded-lg border p-4 ${
                n.read
                  ? "border-gray-200 bg-gray-50"
                  : "border-yellow-200 bg-yellow-50"
              }`}
            >
              <p className="font-semibold">{n.title}</p>
              <p className="text-sm text-gray-600">
                {n.booking
                  ? `${n.booking.serviceLabel} with ${
                      n.booking.dogNames || "your dog"
                    } on ${formatDate(n.booking.startAt)}`
                  : n.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Bookings */}
      <div className="space-y-4">
        {bookings.map((booking: any) => (
          <div
            key={booking.id}
            id={`booking-${booking.id}`}
            className="border p-4 rounded"
          >
            <p className="font-semibold">{booking.serviceType}</p>
            <p>{formatDate(booking.startAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}