import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildBoardingHoldConversionPayload,
  calculateBoardingPriceEstimate,
  classifyHoldConversionError,
  formatBoardingHeldDate,
  getHoldDogSelectionLimit,
  getPetVisitPriceCents,
  getPrivateTrainingSessionPriceCents,
  getWalkingPriceCents,
  isBoardingHoldConfirmation,
  isBoardingKennelType,
  type BoardingKennelType,
} from "@/components/booking-hold-confirmation.logic";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

type Dog = {
  id: string;
  name: string;
  breed?: string | null;
  size?: string | null;
};

type GroomingSelection = {
  category: string;
  size: string;
};

type PricingTier = {
  id: string;
  category: string | null;
  dogSize: string | null;
  priceCents: number;
};

type MobileVetOption = {
  key: string;
  label?: string | null;
};

export type BookingHoldService = {
  id: string;
  service: string;
  bookingModel?: string | null;
  maxDogsPerBooking?: number | null;
  concurrentCapacityDogs?: number | null;
  baseRateCents?: number | null;
  additionalDogEnabled?: boolean;
  additionalDogPriceCents?: number | null;
  additionalDogDiscountPct?: number | null;
  pricingJson?: Record<string, unknown> | null;
  pricingTiers?: PricingTier[];
};

type Props = {
  token: string;
  supplierId: string;
  supplierName: string;
  requestedDogCount: number;
  startAt: string;
  endAt: string;
  service: BookingHoldService;
  bookingModel?: string | null;
  blockPriceCents?: number | null;
  isReturnJourney: boolean;
  onConverted: (
    terminalMessage?: string
  ) => void | Promise<void>;
};

function formatLabel(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function getHttpStatus(error: unknown) {
  return (error as any)?.response?.status || null;
}

function getErrorMessage(error: unknown) {
  return (
    (error as any)?.response?.data?.error ||
    (error as any)?.message ||
    "We couldn’t complete this booking request. Please try again."
  );
}

function readMobileVetOptions(
  pricingJson?: Record<string, unknown> | null
): MobileVetOption[] {
  const value = pricingJson?.mobileVetServices;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is MobileVetOption =>
      Boolean(
        item &&
          typeof item === "object" &&
          typeof (item as MobileVetOption).key ===
            "string"
      )
  );
}

export default function BookingHoldConfirmation({
  token,
  supplierId,
  supplierName,
  requestedDogCount,
  startAt,
  endAt,
  service,
  bookingModel,
  blockPriceCents,
  isReturnJourney,
  onConverted,
}: Props) {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [ownerAddress, setOwnerAddress] =
    useState("");
  const [dogsLoading, setDogsLoading] =
    useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedDogIds, setSelectedDogIds] =
    useState<string[]>([]);
  const [
    groomingSelections,
    setGroomingSelections,
  ] = useState<Record<string, GroomingSelection>>(
    {}
  );
  const [
    mobileVetOffering,
    setMobileVetOffering,
  ] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [notes, setNotes] = useState("");
  const [kennelType, setKennelType] =
    useState<BoardingKennelType>("SOCIAL");
  const [
    accessInstructions,
    setAccessInstructions,
  ] = useState("");
  const [
    acceptedHealthSafety,
    setAcceptedHealthSafety,
  ] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [submitError, setSubmitError] =
    useState("");
  const [terminalError, setTerminalError] =
    useState("");

  const serviceType = service.service;
  const isWalking = serviceType === "WALKING";
  const isGrooming = serviceType === "GROOMING";
  const isPetTransport =
    serviceType === "PET_TRANSPORT";
  const isMobileVet =
    serviceType === "MOBILE_VET";
  const isPetVisit =
    serviceType === "PET_SITTING" &&
    service.bookingModel === "BLOCK_CAPACITY";
  const isBoarding = isBoardingHoldConfirmation(
    serviceType,
    bookingModel
  );

  const walkingPriceCents = getWalkingPriceCents({
    service: serviceType,
    bookingModel,
    baseRateCents: service.baseRateCents,
    additionalDogEnabled: service.additionalDogEnabled,
    additionalDogPriceCents: service.additionalDogPriceCents,
    additionalDogDiscountPct: service.additionalDogDiscountPct,
    selectedDogCount: selectedDogIds.length,
  });

  const trainingSessionPriceCents =
    getPrivateTrainingSessionPriceCents({
      service: serviceType,
      bookingModel,
      baseRateCents: service.baseRateCents,
      selectedDogCount: selectedDogIds.length || undefined,
    });

  const petVisitPriceCents = getPetVisitPriceCents({
    service: serviceType,
    bookingModel,
    blockPriceCents,
    selectedDogCount: selectedDogIds.length,
    additionalDogEnabled: service.additionalDogEnabled,
    additionalDogPriceCents: service.additionalDogPriceCents,
    additionalDogDiscountPct: service.additionalDogDiscountPct,
  });

  const groomingTiers = useMemo(
    () =>
      Array.isArray(service.pricingTiers)
        ? service.pricingTiers
        : [],
    [service.pricingTiers]
  );

  const groomingCategories = useMemo(
    () =>
      Array.from(
        new Set(
          groomingTiers
            .map((tier) => tier.category)
            .filter(
              (value): value is string =>
                Boolean(value)
            )
        )
      ),
    [groomingTiers]
  );

  const mobileVetOptions = useMemo(
    () =>
      readMobileVetOptions(service.pricingJson),
    [service.pricingJson]
  );

  const selectionLimit = useMemo(() => {
    return getHoldDogSelectionLimit({
      requestedDogCount,
      maxDogsPerBooking: service.maxDogsPerBooking,
      concurrentCapacityDogs: service.concurrentCapacityDogs,
      isBoarding,
      isWalking,
      additionalDogEnabled: service.additionalDogEnabled,
    });
  }, [
    isBoarding,
    isWalking,
    requestedDogCount,
    service.additionalDogEnabled,
    service.concurrentCapacityDogs,
    service.maxDogsPerBooking,
  ]);

  const boardingPrice = useMemo(() => {
    if (
      !isBoarding ||
      selectedDogIds.length === 0 ||
      typeof service.baseRateCents !== "number"
    ) {
      return null;
    }

    const selectedDogCount = selectedDogIds.length;
    const estimate = calculateBoardingPriceEstimate({
      startAt,
      endAt,
      selectedDogCount,
      baseRateCents: Number(service.baseRateCents || 0),
      additionalDogEnabled: Boolean(service.additionalDogEnabled),
      additionalDogPriceCents: service.additionalDogPriceCents,
      kennelType,
    });

    return { ...estimate, selectedDogCount };
  }, [
    endAt,
    isBoarding,
    kennelType,
    selectedDogIds.length,
    service.additionalDogEnabled,
    service.additionalDogPriceCents,
    service.baseRateCents,
    startAt,
  ]);

  const requiresOwnerAddress =
    isWalking || isMobileVet || isPetVisit;

  const showsAccessInstructions =
    requiresOwnerAddress || isPetTransport;

  const loadOwnerData = useCallback(async () => {
    setDogsLoading(true);
    setLoadError("");

    const applyDogs = (nextDogs: Dog[]) => {
      setDogs(nextDogs);
      const availableIds = new Set(nextDogs.map((dog) => dog.id));
      setSelectedDogIds((current) =>
        current.filter((dogId) => availableIds.has(dogId))
      );
    };

    const [profileResult, dogsResult] =
      await Promise.allSettled([
        api.get("/api/owner/profile"),
        api.get("/api/owner/dogs"),
      ]);

      const profileStatus =
        profileResult.status === "rejected"
          ? getHttpStatus(profileResult.reason)
          : null;

      const dogsStatus =
        dogsResult.status === "rejected"
          ? getHttpStatus(dogsResult.reason)
          : null;

      if (
        profileStatus === 401 ||
        dogsStatus === 401
      ) {
        applyDogs([]);
        setLoadError(
          "Please log in again to continue."
        );
        setDogsLoading(false);
        return;
      }

      if (
        profileResult.status === "fulfilled"
      ) {
        const profile =
          profileResult.value.data?.profile;

        const address =
          profile?.address || "";

        setOwnerAddress(address);

        if (isPetTransport && address) {
          setPickup(address);
        }

        if (Array.isArray(profile?.dogs)) {
          applyDogs(profile.dogs);
        }
      }

      if (dogsResult.status === "fulfilled") {
        const payload =
          dogsResult.value.data?.dogs ||
          dogsResult.value.data?.data ||
          dogsResult.value.data?.profile?.dogs ||
          [];

        if (Array.isArray(payload)) {
          applyDogs(payload);
        }
      }

      if (
        profileResult.status === "rejected" &&
        dogsResult.status === "rejected"
      ) {
        setLoadError(
          "We couldn’t load your dogs. Please try again."
        );
      }

    setDogsLoading(false);
  }, [isPetTransport]);

  useEffect(() => {
    void loadOwnerData();
  }, [loadOwnerData]);

  useEffect(() => {
    if (!isMobileVet) {
      setMobileVetOffering("");
      return;
    }

    setMobileVetOffering((current) => {
      if (
        current &&
        mobileVetOptions.some(
          (option) => option.key === current
        )
      ) {
        return current;
      }

      return (
        mobileVetOptions[0]?.key ||
        "CHECK_UP"
      );
    });
  }, [isMobileVet, mobileVetOptions]);

  useEffect(() => {
    if (!isGrooming) {
      setGroomingSelections({});
      return;
    }

    setGroomingSelections((current) => {
      const next: Record<
        string,
        GroomingSelection
      > = {};

      selectedDogIds.forEach((dogId) => {
        const dog = dogs.find(
          (item) => item.id === dogId
        );

        const existing = current[dogId];

        const category =
          existing?.category ||
          groomingCategories[0] ||
          "";

        const tiersForCategory =
          groomingTiers.filter(
            (tier) =>
              tier.category === category
          );

        const matchingDogSize =
          tiersForCategory.some(
            (tier) =>
              tier.dogSize === dog?.size
          )
            ? dog?.size || ""
            : "";

        const size =
          existing?.size ||
          matchingDogSize ||
          tiersForCategory[0]?.dogSize ||
          "";

        next[dogId] = {
          category,
          size,
        };
      });

      return next;
    });
  }, [
    dogs,
    groomingCategories,
    groomingTiers,
    isGrooming,
    selectedDogIds,
  ]);

  function toggleDog(dogId: string) {
    setSubmitError("");

    setSelectedDogIds((current) => {
      if (current.includes(dogId)) {
        return current.filter(
          (id) => id !== dogId
        );
      }

      if (
        current.length >= selectionLimit
      ) {
        setSubmitError(
          `This held slot allows up to ${selectionLimit} ${
            selectionLimit === 1
              ? "dog"
              : "dogs"
          }.`
        );

        return current;
      }

      return [...current, dogId];
    });
  }

  function updateGroomingSelection(
    dogId: string,
    field: keyof GroomingSelection,
    value: string
  ) {
    setGroomingSelections((current) => {
      const existing = current[dogId] || {
        category: "",
        size: "",
      };

      const next = {
        ...current,
        [dogId]: {
          ...existing,
          [field]: value,
        },
      };

      if (field === "category") {
        const firstSize =
          groomingTiers.find(
            (tier) =>
              tier.category === value
          )?.dogSize || "";

        next[dogId].size = firstSize;
      }

      return next;
    });
  }

  function buildNotes() {
    const parts: string[] = [];

    if (
      requiresOwnerAddress &&
      ownerAddress
    ) {
      parts.push(
        "Service location: OWNER_HOME."
      );

      parts.push(
        `Owner address: ${ownerAddress}.`
      );
    }

    if (isPetTransport) {
      parts.push(
        `Journey type: ${
          isReturnJourney
            ? "Return"
            : "One way"
        }.`
      );

      parts.push(
        `Pickup point: ${pickup.trim()}.`
      );

      parts.push(
        `Drop-off point: ${dropoff.trim()}.`
      );

      if (isReturnJourney) {
        parts.push(
          `Return pickup point: ${dropoff.trim()}.`
        );

        parts.push(
          `Return drop-off point: ${pickup.trim()}.`
        );
      }
    }

    if (notes.trim()) {
      parts.push(notes.trim());
    }

    return parts.join("\n");
  }

  async function submitBooking() {
    if (submitting) return;

    setSubmitError("");

    if (selectedDogIds.length === 0) {
      setSubmitError(
        "Select at least one dog."
      );
      return;
    }

    if (
      requiresOwnerAddress &&
      !ownerAddress
    ) {
      setSubmitError(
        "Please add your home address to your owner profile before booking this service."
      );
      return;
    }

    if (
      isPetTransport &&
      (!pickup.trim() || !dropoff.trim())
    ) {
      setSubmitError(
        "Enter both the pickup and drop-off points."
      );
      return;
    }

    if (isGrooming) {
      const missingSelection =
        selectedDogIds.some(
          (dogId) =>
            !groomingSelections[dogId]
              ?.category ||
            !groomingSelections[dogId]
              ?.size
        );

      if (missingSelection) {
        setSubmitError(
          "Select a grooming option and size for each dog."
        );
        return;
      }
    }

    if (
      isMobileVet &&
      !mobileVetOffering
    ) {
      setSubmitError(
        "Select the mobile vet service required."
      );
      return;
    }

    if (!acceptedHealthSafety) {
      setSubmitError(
        "Please accept the Health & Safety Policy before booking."
      );
      return;
    }

    let payload: Record<string, unknown>;

    if (isBoarding) {
      try {
        payload = buildBoardingHoldConversionPayload({
          holdToken: token,
          dogIds: selectedDogIds,
          kennelType,
          healthSafetyAccepted: acceptedHealthSafety,
          notes,
        });
      } catch (error) {
        setSubmitError(getErrorMessage(error));
        return;
      }
    } else {
      const finalNotes = buildNotes();
      payload = {
        holdToken: token,
        dogIds: selectedDogIds,
        healthSafetyAccepted: true,
      };

      if (finalNotes) payload.notes = finalNotes;
      if (showsAccessInstructions && accessInstructions.trim()) {
        payload.accessInstructions = accessInstructions.trim();
      }
      if (isGrooming) payload.groomingSelections = groomingSelections;
      if (isMobileVet) payload.mobileVetOffering = mobileVetOffering;
    }

    setSubmitting(true);

    try {
      const response = await api.post(
        "/api/bookings",
        payload
      );

      trackEvent(
        "booking_request_submitted",
        {
          bookingId:
            response.data?.booking?.id ||
            response.data?.id ||
            null,
          supplierId,
          supplierName,
          supplierServiceId: service.id,
          serviceType,
          dogCount:
            selectedDogIds.length,
          bookingSource: "SEND_A_SLOT",
        }
      );

      await onConverted();
    } catch (error) {
      const message = getErrorMessage(error);

      if (!isBoarding) {
        setSubmitError(message);
        return;
      }

      const status = getHttpStatus(error);
      const action = classifyHoldConversionError(status);

      if (action === "TERMINAL_REFETCH") {
        const terminalMessage =
          "This Boarding reservation can no longer be completed. Please ask the supplier to send a new booking link.";
        setTerminalError(terminalMessage);
        try {
          await onConverted(terminalMessage);
        } catch {
          // Keep the safe terminal message visible if the lifecycle refetch fails.
        }
      } else if (action === "NETWORK_RETRY") {
        setSubmitError(
          "We couldn’t reach DogLife. Your booking link is still open, so please try again."
        );
      } else {
        setSubmitError(message);

        if (/selected dogs? (are|is) invalid/i.test(message)) {
          await loadOwnerData();
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (terminalError) {
    return (
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Booking link unavailable
        </p>
        <p className="mt-1 text-sm text-amber-800">
          {terminalError}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Complete your booking request
      </h2>

      <p className="mt-1 text-sm text-gray-600">
        The held {isBoarding
          ? "arrival and departure dates can’t"
          : "date and time can’t"} be changed here. DogLife will
        check the slot, service rules and final price again when you
        submit.
      </p>

      {isBoarding ? (
        <div className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-3 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Arrival
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatBoardingHeldDate(startAt)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Departure
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatBoardingHeldDate(endAt)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-5">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Select dog(s)
          </p>

          <p className="mt-1 text-xs text-gray-500">
            You can select up to{" "}
            {selectionLimit}{" "}
            {selectionLimit === 1
              ? "dog"
              : "dogs"}{" "}
            for this held slot.
          </p>

          {dogsLoading ? (
            <p className="mt-3 text-sm text-gray-500">
              Loading your dogs...
            </p>
          ) : loadError ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {loadError}
            </p>
          ) : dogs.length === 0 ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              No dogs were found. Add a dog
              from My Dogs, then return to
              this link before it expires.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {dogs.map((dog) => (
                <label
                  key={dog.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-3"
                >
                  <input
                    type="checkbox"
                    checked={selectedDogIds.includes(
                      dog.id
                    )}
                    disabled={submitting}
                    onChange={() =>
                      toggleDog(dog.id)
                    }
                  />

                  <span className="text-sm text-gray-900">
                    <span className="font-medium">
                      {dog.name}
                    </span>

                    {dog.breed
                      ? ` · ${dog.breed}`
                      : ""}
                  </span>
                </label>
              ))}
            </div>
          )}

          {isBoarding ? (
            <Button
              type="button"
              variant="outline"
              disabled={dogsLoading || submitting}
              onClick={() => void loadOwnerData()}
              className="mt-3 w-full sm:w-auto"
            >
              Refresh dogs
            </Button>
          ) : null}
        </div>

        {isBoarding ? (
          <div className="space-y-4 rounded-xl border border-gray-200 p-4">
            <div>
              <label
                htmlFor="booking-hold-kennel-type"
                className="text-sm font-medium text-gray-900"
              >
                Kennel preference
              </label>

              <select
                id="booking-hold-kennel-type"
                value={kennelType}
                disabled={submitting}
                onChange={(event) =>
                  isBoardingKennelType(event.target.value)
                    ? setKennelType(event.target.value)
                    : setSubmitError("Select a valid kennel preference.")
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="SOCIAL">Social kennel</option>
                <option value="PRIVATE">Private kennel</option>
              </select>
            </div>

            {boardingPrice ? (
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-semibold">
                  Current total: R
                  {(boardingPrice.totalCents / 100).toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-blue-800">
                  {boardingPrice.nights}{" "}
                  {boardingPrice.nights === 1 ? "night" : "nights"}
                  {" · "}
                  {boardingPrice.selectedDogCount}{" "}
                  {boardingPrice.selectedDogCount === 1 ? "dog" : "dogs"}
                </p>
                <p className="mt-1 text-xs text-blue-800">
                  Price is rechecked when you confirm.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {walkingPriceCents != null ? (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-semibold">
              Current total: R
              {(walkingPriceCents / 100).toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-blue-800">
              Dog Walking · {selectedDogIds.length}{" "}
              {selectedDogIds.length === 1 ? "dog" : "dogs"}
            </p>
            <p className="mt-1 text-xs text-blue-800">
              Price is rechecked when you confirm.
            </p>
          </div>
        ) : null}

        {trainingSessionPriceCents != null ? (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-semibold">
              Current total: R
              {(trainingSessionPriceCents / 100).toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-blue-800">
              Private Training session
            </p>
            <p className="mt-1 text-xs text-blue-800">
              Price is rechecked when you confirm.
            </p>
          </div>
        ) : null}

        {petVisitPriceCents != null ? (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-semibold">
              Current total: R{(petVisitPriceCents / 100).toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-blue-800">
              Pet Visit · {selectedDogIds.length}{" "}
              {selectedDogIds.length === 1 ? "dog" : "dogs"}
            </p>
            <p className="mt-1 text-xs text-blue-800">
              Price is rechecked when you confirm.
            </p>
          </div>
        ) : null}

        {isGrooming &&
        selectedDogIds.length > 0 ? (
          <div className="space-y-3 rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-900">
              Grooming requirements
            </p>

            {selectedDogIds.map(
              (dogId) => {
                const dog = dogs.find(
                  (item) =>
                    item.id === dogId
                );

                const selection =
                  groomingSelections[
                    dogId
                  ] || {
                    category: "",
                    size: "",
                  };

                const sizes =
                  groomingTiers.filter(
                    (tier) =>
                      tier.category ===
                      selection.category
                  );

                return (
                  <div
                    key={dogId}
                    className="space-y-2"
                  >
                    <p className="text-sm font-medium text-gray-700">
                      {dog?.name || "Dog"}
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <select
                        value={
                          selection.category
                        }
                        disabled={
                          submitting
                        }
                        onChange={(
                          event
                        ) =>
                          updateGroomingSelection(
                            dogId,
                            "category",
                            event.target
                              .value
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">
                          Select grooming
                          option
                        </option>

                        {groomingCategories.map(
                          (category) => (
                            <option
                              key={
                                category
                              }
                              value={
                                category
                              }
                            >
                              {formatLabel(
                                category
                              )}
                            </option>
                          )
                        )}
                      </select>

                      <select
                        value={
                          selection.size
                        }
                        disabled={
                          submitting ||
                          !selection.category
                        }
                        onChange={(
                          event
                        ) =>
                          updateGroomingSelection(
                            dogId,
                            "size",
                            event.target
                              .value
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">
                          Select size
                        </option>

                        {sizes.map(
                          (tier) => (
                            <option
                              key={
                                tier.id
                              }
                              value={
                                tier.dogSize ||
                                ""
                              }
                            >
                              {formatLabel(
                                tier.dogSize
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ) : null}

        {isMobileVet ? (
          <div>
            <label
              htmlFor="booking-hold-mobile-vet-offering"
              className="text-sm font-medium text-gray-900"
            >
              Mobile vet service
            </label>

            <select
              id="booking-hold-mobile-vet-offering"
              value={mobileVetOffering}
              disabled={submitting}
              onChange={(event) =>
                setMobileVetOffering(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {mobileVetOptions.length ===
              0 ? (
                <option value="CHECK_UP">
                  Check-up / consultation
                </option>
              ) : (
                mobileVetOptions.map(
                  (option) => (
                    <option
                      key={option.key}
                      value={option.key}
                    >
                      {option.label ||
                        formatLabel(
                          option.key
                        )}
                    </option>
                  )
                )
              )}
            </select>
          </div>
        ) : null}

        {isPetTransport ? (
          <div className="space-y-3 rounded-xl border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isReturnJourney
                  ? "Return journey"
                  : "One-way journey"}
              </p>

              {isReturnJourney ? (
                <p className="mt-1 text-xs text-gray-500">
                  The held return journey is
                  fixed. It will collect your
                  dog from the outbound
                  destination and return them
                  to the original pickup
                  point.
                </p>
              ) : null}
            </div>

            <input
              type="text"
              placeholder="Pickup point"
              value={pickup}
              disabled={submitting}
              onChange={(event) =>
                setPickup(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />

            <input
              type="text"
              placeholder="Drop-off point"
              value={dropoff}
              disabled={submitting}
              onChange={(event) =>
                setDropoff(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        ) : null}

        {requiresOwnerAddress &&
        !ownerAddress &&
        !dogsLoading ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Add your home address to your
            owner profile before submitting
            this booking request.
          </p>
        ) : null}

        {showsAccessInstructions ? (
          <div>
            <label
              htmlFor="booking-hold-access-instructions"
              className="text-sm font-medium text-gray-900"
            >
              Access instructions (optional)
            </label>

            <textarea
              id="booking-hold-access-instructions"
              value={accessInstructions}
              disabled={submitting}
              onChange={(event) =>
                setAccessInstructions(
                  event.target.value
                )
              }
              placeholder="Estate name, parking or entry instructions. Please don’t add gate codes yet."
              className="mt-2 min-h-[88px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        ) : null}

        <div>
          <label
            htmlFor="booking-hold-notes"
            className="text-sm font-medium text-gray-900"
          >
            Notes (optional)
          </label>

          <textarea
            id="booking-hold-notes"
            value={notes}
            disabled={submitting}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="Anything the supplier should know"
            className="mt-2 min-h-[88px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-start gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={acceptedHealthSafety}
            disabled={submitting}
            onChange={(event) =>
              setAcceptedHealthSafety(
                event.target.checked
              )
            }
            className="mt-1"
          />

          <span>
            I confirm my pet information is
            accurate, vaccinations are up to
            date where required, and I agree
            to the{" "}
            <a
              href="/legal/health-safety"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              Health &amp; Safety Policy
            </a>
            .
          </span>
        </label>

        {submitError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {submitError}
          </p>
        ) : null}

        <Button
          type="button"
          disabled={
            submitting ||
            dogsLoading ||
            Boolean(loadError) ||
            dogs.length === 0 ||
            (isBoarding &&
              (selectedDogIds.length === 0 ||
                !acceptedHealthSafety))
          }
          onClick={() =>
            void submitBooking()
          }
          className="w-full"
        >
          {submitting
            ? "Submitting request..."
            : "Request booking"}
        </Button>

        <p className="text-center text-xs text-gray-500">
          DogLife will confirm current
          availability, service rules and the
          final price before creating the
          request.
        </p>
      </div>
    </div>
  );
}
