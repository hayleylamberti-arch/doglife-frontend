import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function SupplierBookings() {

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["supplier-bookings"],
    queryFn: async () => {
      const res = await api.get("/api/supplier/bookings");
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="p-6">Loading bookings...</div>;
  }

  const bookings = data?.bookings || [];

  async function acceptBooking(id: string) {

    await api.post(`/api/bookings/${id}/accept`);
    refetch();

  }

  async function declineBooking(id: string) {

    await api.post(`/api/bookings/${id}/decline`);
    refetch();

  }

  return (

    <div className="max-w-5xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Booking Requests
      </h1>

      {bookings.length === 0 && (
        <p className="text-muted-foreground">
          No booking requests yet.
        </p>
      )}

      {bookings.map((booking: any) => (

        <div
          key={booking.id}
          className="border rounded-xl p-5 bg-white flex justify-between items-center"
        >

          <div>

            <p className="font-medium">
              {booking.serviceType}
            </p>

            <p className="text-sm text-gray-500">
              {new Date(booking.startAt).toLocaleString()}
            </p>

            <p className="text-sm text-gray-500">
              Status: {booking.status}
            </p>

          </div>

          {booking.status === "PENDING" && (

            <div className="flex gap-2">

              <button
                onClick={() => acceptBooking(booking.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-md"
              >
                Accept
              </button>

              <button
                onClick={() => declineBooking(booking.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Decline
              </button>

            </div>

          )}

        </div>

      ))}

    </div>

  );

}