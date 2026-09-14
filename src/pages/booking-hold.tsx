import { useCallback, useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import BookingHoldConfirmation, {
  type BookingHoldService,
} from "@/components/booking-hold-confirmation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { safeInternalReturnPath } from "@/lib/safeReturnPath";

type HoldState =
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "CONVERTED";

type PublicHold = {
  state: HoldState;
  supplierId?: string;
  supplierServiceId?: string;
  serviceType?: string | null;
  startAt: string;
  endAt: string;
  returnStartAt?: string | null;
  returnEndAt?: string | null;
  requestedDogCount: number;
  expiresAt: string;
  supplier?: {
    businessName?: string | null;
    logoUrl?: string | null;
    publicSlug?: string | null;
  } | null;
  service?: BookingHoldService | null;
};

type PublicHoldResponse = {
  ok?: boolean;
  hold?: PublicHold;
};

type LoadState =
  | "LOADING"
  | "READY"
  | "INVALID"
  | "ERROR";

const SERVICE_LABELS: Record<string, string> = {
  WALKING: "Dog walking",
  GROOMING: "Grooming",
  TRAINING: "Training",
  MOBILE_VET: "Mobile vet",
  PET_TRANSPORT: "Pet transport",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-ZA", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Johannesburg",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-ZA", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Africa/Johannesburg",
});

function serviceLabel(value?: string | null) {
  if (!value) {
    return "Dog service";
  }

  return (
    SERVICE_LABELS[value] ||
    value
      .toLowerCase()
      .split("_")
      .map(
        (part) =>
          part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join(" ")
  );
}

function formatDate(value: string) {
  return DATE_FORMATTER.format(new Date(value));
}

function formatTime(value: string) {
  return TIME_FORMATTER.format(new Date(value));
}

function formatInterval(startAt: string, endAt: string) {
  return `${formatDate(startAt)} · ${formatTime(
    startAt
  )} – ${formatTime(endAt)}`;
}

export default function BookingHoldPage() {
  const { token } = useParams<{ token: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    role,
    isLoading: authLoading,
  } = useAuth();

  const [loadState, setLoadState] =
    useState<LoadState>("LOADING");
  const [hold, setHold] = useState<PublicHold | null>(
    null
  );

  const loadHold = useCallback(async () => {
    if (!token) {
      setHold(null);
      setLoadState("INVALID");
      return;
    }

    setLoadState("LOADING");

    try {
      const response = await api.get<PublicHoldResponse>(
        `/api/booking-holds/public/${encodeURIComponent(
          token
        )}`
      );

      if (!response.data?.hold) {
        setHold(null);
        setLoadState("INVALID");
        return;
      }

      setHold(response.data.hold);
      setLoadState("READY");
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setHold(null);
        setLoadState("INVALID");
        return;
      }

      setHold(null);
      setLoadState("ERROR");
    }
  }, [token]);

  useEffect(() => {
    void loadHold();
  }, [loadHold]);

  const returnTo =
    safeInternalReturnPath(location.pathname) || "/";

  if (loadState === "LOADING") {
    return (
      <div className="mx-auto w-full max-w-xl py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-600">
            Loading your booking link...
          </p>
        </div>
      </div>
    );
  }

  if (loadState === "ERROR") {
    return (
      <div className="mx-auto w-full max-w-xl py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            We couldn’t load this booking link
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            Please try again.
          </p>

          <Button
            type="button"
            onClick={() => void loadHold()}
            className="mt-6 w-full"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (loadState === "INVALID" || !hold) {
    return (
      <div className="mx-auto w-full max-w-xl py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            This booking link is unavailable
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            Please check the link or ask the supplier to send
            you a new one.
          </p>
        </div>
      </div>
    );
  }

  const supplierName =
    hold.supplier?.businessName || "Your DogLife supplier";

  const currentService =
    hold.service?.service || hold.serviceType;

  const hasReturnJourney =
    Boolean(hold.returnStartAt) &&
    Boolean(hold.returnEndAt);

  const dogCountText = `Up to ${
    hold.requestedDogCount
  } ${hold.requestedDogCount === 1 ? "dog" : "dogs"}`;

  const lifecycleCopy: Record<
    Exclude<HoldState, "ACTIVE">,
    {
      title: string;
      message: string;
    }
  > = {
    EXPIRED: {
      title: "This held slot has expired",
      message:
        "The appointment is no longer being held. You can check the supplier’s current availability.",
    },
    CANCELLED: {
      title: "This offered slot is no longer available",
      message:
        "The supplier has cancelled this held slot. You can check their current availability.",
    },
    CONVERTED: {
      title: "Your booking request has been sent",
      message:
        "The held slot has been converted into a booking request. The supplier can now review and confirm it.",
    },
  };

  if (hold.state !== "ACTIVE") {
    const copy = lifecycleCopy[hold.state];

    return (
      <div className="mx-auto w-full max-w-xl py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SupplierHeading
            businessName={supplierName}
            logoUrl={hold.supplier?.logoUrl}
          />

          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            {copy.title}
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            {copy.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl py-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <SupplierHeading
          businessName={supplierName}
          logoUrl={hold.supplier?.logoUrl}
        />

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            DogLife booking
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            A slot has been held for you
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Review the appointment details below, then sign in
            or join DogLife to continue.
          </p>
        </div>

        <div className="mt-6 space-y-4 rounded-xl bg-gray-50 p-4">
          <SummaryRow
            label="Service"
            value={serviceLabel(currentService)}
          />

          {hasReturnJourney &&
          hold.returnStartAt &&
          hold.returnEndAt ? (
            <>
              <SummaryRow
                label="Outbound"
                value={formatInterval(
                  hold.startAt,
                  hold.endAt
                )}
              />

              <SummaryRow
                label="Return"
                value={formatInterval(
                  hold.returnStartAt,
                  hold.returnEndAt
                )}
              />
            </>
          ) : (
            <SummaryRow
              label="Held appointment"
              value={formatInterval(
                hold.startAt,
                hold.endAt
              )}
            />
          )}

          <SummaryRow
            label="Dogs"
            value={dogCountText}
          />

          <SummaryRow
            label="Held until"
            value={`${formatDate(
              hold.expiresAt
            )} · ${formatTime(hold.expiresAt)}`}
          />
        </div>

        <div className="mt-6">
          {authLoading ? (
            <Button
              type="button"
              disabled
              className="w-full"
            >
              Checking your account...
            </Button>
          ) : !user ? (
            <div className="space-y-3">
              <Button
                type="button"
                onClick={() =>
                  navigate("/auth/login", {
                    state: { returnTo },
                  })
                }
                className="w-full"
              >
                Log in to continue
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate("/auth/register", {
                    state: { returnTo },
                  })
                }
                className="w-full"
              >
                Join DogLife
              </Button>
            </div>
          ) : role !== "OWNER" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                An owner account is required to continue this
                booking.
              </p>

              <p className="mt-1 text-sm text-amber-800">
                You’re currently signed in with a different
                DogLife account type.
              </p>
            </div>
          ) : !user.onboardingCompleted ? (
            <Button
              type="button"
              onClick={() =>
                navigate("/owner/onboarding", {
                  state: { returnTo },
                })
              }
              className="w-full"
            >
              Complete setup to continue
            </Button>
          ) : !token ||
            !hold.supplierId ||
            !hold.service ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">
                This booking link is missing required service
                information.
              </p>

              <p className="mt-1 text-sm text-red-700">
                Please ask the supplier to create and send a new
                booking link.
              </p>
            </div>
          ) : (
            <BookingHoldConfirmation
              token={token}
              supplierId={hold.supplierId}
              supplierName={supplierName}
              requestedDogCount={hold.requestedDogCount}
              service={hold.service}
              isReturnJourney={hasReturnJourney}
              onConverted={loadHold}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SupplierHeading({
  businessName,
  logoUrl,
}: {
  businessName: string;
  logoUrl?: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="h-12 w-12 rounded-full border border-gray-200 object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-700"
        >
          {businessName.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Offered by
        </p>

        <p className="truncate font-semibold text-gray-900">
          {businessName}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}