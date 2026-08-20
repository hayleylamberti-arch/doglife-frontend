import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/api";
import ServiceOperatingHours from "@/components/service-operating-hours";

const SERVICE_TYPES = [
  "WALKING",
  "GROOMING",
  "BOARDING",
  "TRAINING",
  "DAYCARE",
  "PET_SITTING",
  "PET_TRANSPORT",
  "MOBILE_VET",
];

const DOG_SIZES = ["small", "medium", "large", "xl"];
type TrainingBookingMode = "APPOINTMENT" | "SESSION_EVENT";

const MOBILE_VET_SERVICES = [
  { key: "CHECK_UP", label: "Check-up / consultation" },
  { key: "VACCINATION", label: "Vaccination / inoculation" },
  { key: "DEWORMING", label: "Deworming" },
  { key: "MICROCHIPPING", label: "Microchipping" },
  { key: "MINOR_TREATMENT", label: "Minor treatment" },
  { key: "FOLLOW_UP", label: "Follow-up visit" },
  { key: "EUTHANASIA", label: "Euthanasia" },
  { key: "OTHER", label: "Other mobile vet service" },
];

function emptyMobileVetPrices() {
  return MOBILE_VET_SERVICES.reduce((acc, item) => {
    acc[item.key] = "";
    return acc;
  }, {} as Record<string, string>);
}

function centsToRandInput(value?: number | null) {
  if (value == null) return "";
  return String(value / 100);
}

function linesToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToLines(value?: unknown) {
  return Array.isArray(value) ? value.filter(Boolean).join("\n") : "";
}

function buildExpectationsPricingJson(
  existing: Record<string, any> | null | undefined,
  supplierProvides: string,
  ownerProvides: string,
  goodToKnow: string
) {
  return {
    ...(existing || {}),
    supplierProvides: linesToArray(supplierProvides),
    ownerProvides: linesToArray(ownerProvides),
    goodToKnow: linesToArray(goodToKnow),
  };
}

function getMobileVetPricesFromService(service: any) {
  const prices = emptyMobileVetPrices();
  const savedServices = service?.pricingJson?.mobileVetServices || [];

  savedServices.forEach((item: any) => {
    if (item?.key && item?.priceCents != null) {
      prices[item.key] = centsToRandInput(item.priceCents);
    }
  });

  return prices;
}

function getLowestMobileVetPriceCents(prices: Record<string, string>) {
  const validPrices = Object.values(prices)
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value) && value > 0);

  if (validPrices.length === 0) return null;

  return Math.round(Math.min(...validPrices) * 100);
}

function buildMobileVetPricingJson(prices: Record<string, string>) {
  const enabledServices = MOBILE_VET_SERVICES.map((item) => {
    const rawPrice = prices[item.key];

    if (rawPrice === "" || Number(rawPrice) < 0) return null;

    return {
      key: item.key,
      label: item.label,
      priceCents: Math.round(Number(rawPrice) * 100),
    };
  }).filter(Boolean);

  return {
    mobileVetServices: enabledServices,
  };
}

function formatPetSittingLocation(value?: string | null) {
  switch (value) {
    case "OWNER_HOME":
      return "Owner’s home only";
    case "SITTER_HOME":
      return "Sitter’s home only";
    case "BOTH":
      return "Owner’s home or sitter’s home";
    default:
      return "Location not set";
  }
}

function formatService(service: string) {
  const map: Record<string, string> = {
    WALKING: "🐕 Dog Walking",
    GROOMING: "✂️ Grooming",
    BOARDING: "🏠 Boarding",
    TRAINING: "🎓 Training",
    DAYCARE: "🐾 Daycare",
    PET_SITTING: "🩷 Pet Sitting",
    PET_TRANSPORT: "🚗 Transport",
    MOBILE_VET: "🩺 Mobile Vet",
  };

  return map[service] ?? service;
}

function getServiceUnit(service: string, s: any) {
  switch (service) {
    case "WALKING":
    case "TRAINING":
    case "MOBILE_VET":
    case "PET_TRANSPORT":
      return `${s.durationMinutes || 30} mins`;
    case "BOARDING":
      return "per night";
    case "PET_SITTING":
      return s.bookingModel === "BLOCK_CAPACITY" ? "per visit" : "per night";
    case "DAYCARE":
      return "per day";
    default:
      return "";
  }
}

function formatBufferMinutes(value?: number | null) {
  if (value == null || value === 0) return "No buffer";
  return `${value} min buffer`;
}

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Failed to save service"
    );
  }

  if (error instanceof Error) return error.message;

  return "Failed to save service";
}

function shouldShowDogCapacity(serviceType: string) {
  return ["BOARDING", "DAYCARE", "PET_SITTING", "WALKING"].includes(serviceType);
}

function formatRandFromCents(value?: number | null) {
  return `R${(((value ?? 0) as number) / 100).toFixed(0)}`;
}

function formatDate(value?: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function serviceDefaults(serviceType: string) {
  switch (serviceType) {
    case "WALKING":
      return { unit: "PER_WALK" };
    case "TRAINING":
      return { unit: "PER_SESSION" };
    case "MOBILE_VET":
      return { unit: "PER_VISIT" };
    case "PET_TRANSPORT":
      return { unit: "PER_TRIP" };
    case "BOARDING":
      return { unit: "PER_NIGHT" };
    case "PET_SITTING":
      return { unit: "PER_NIGHT" };
    case "DAYCARE":
      return { unit: "PER_DAY" };
    case "GROOMING":
      return { unit: "PER_VISIT" };
    default:
      return { unit: "PER_VISIT" };
  }
}

type EditServiceForm = {
  price: string;
  durationMinutes: string;
  bufferMinutes: string;
  maxDogsPerBooking: string;
  concurrentCapacityDogs: string;
  additionalDogEnabled: boolean;
  additionalDogPrice: string;
  daycareHalfDayPrice: string;
  daycareFullDayPrice: string;
  petSittingLocation: string;
  mobileVetPrices: Record<string, string>;
  supplierProvides: string;
  ownerProvides: string;
  goodToKnow: string;
};

function emptyGroomingPrices() {
  return {
    small: "",
    medium: "",
    large: "",
    xl: "",
  };
}

function getTierPrice(tiers: any[], category: string, dogSize: string) {
  const match = tiers.find(
    (tier) => tier.category === category && tier.dogSize === dogSize
  );

  return match ? centsToRandInput(match.priceCents) : "";
}

export default function SupplierServicesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["supplier-services"],
    queryFn: async () => {
      const res = await api.get("/api/supplierServices");
      return res.data.services;
    },
  });

  const services = data ?? [];

  const [serviceType, setServiceType] = useState("");

  const [trainingBookingMode, setTrainingBookingMode] =
    useState<TrainingBookingMode>("APPOINTMENT");

  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [bufferMinutes, setBufferMinutes] = useState("");

  const [boardingExtraDogEnabled, setBoardingExtraDogEnabled] = useState(false);
  const [boardingExtraDogPrice, setBoardingExtraDogPrice] = useState("");

  const [daycareHalfDayPrice, setDaycareHalfDayPrice] = useState("");
  const [daycareFullDayPrice, setDaycareFullDayPrice] = useState("");
  const [daycareExtraDogEnabled, setDaycareExtraDogEnabled] = useState(false);
  const [daycareExtraDogPrice, setDaycareExtraDogPrice] = useState("");

  const [petSittingBookingMode, setPetSittingBookingMode] =
    useState<"DATE_RANGE_CAPACITY" | "BLOCK_CAPACITY">("DATE_RANGE_CAPACITY");

  const [petSittingLocation, setPetSittingLocation] = useState("BOTH");
  const [mobileVetPrices, setMobileVetPrices] = useState(emptyMobileVetPrices());

  const [petVisitBlockLabel, setPetVisitBlockLabel] = useState("");
  const [petVisitBlockStartTime, setPetVisitBlockStartTime] = useState("");
  const [petVisitBlockEndTime, setPetVisitBlockEndTime] = useState("");
  const [petVisitBlockPrice, setPetVisitBlockPrice] = useState("");

  const [maxDogsPerBooking, setMaxDogsPerBooking] = useState("");
  const [concurrentCapacityDogs, setConcurrentCapacityDogs] = useState("");

  const [supplierProvides, setSupplierProvides] = useState("");
  const [ownerProvides, setOwnerProvides] = useState("");
  const [goodToKnow, setGoodToKnow] = useState("");

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditServiceForm | null>(null);

  const [blockInputs, setBlockInputs] = useState<
    Record<string, { startDate: string; endDate: string; reason: string }>
  >({});

  const [washBrush, setWashBrush] = useState(emptyGroomingPrices());
  const [washCut, setWashCut] = useState(emptyGroomingPrices());

  const resetForm = () => {
    setServiceType("");
    setTrainingBookingMode("APPOINTMENT");
    setPrice("");
    setDuration("");
    setBufferMinutes("");
    setBoardingExtraDogEnabled(false);
    setBoardingExtraDogPrice("");
    setDaycareHalfDayPrice("");
    setDaycareFullDayPrice("");
    setDaycareExtraDogEnabled(false);
    setDaycareExtraDogPrice("");
    setPetSittingBookingMode("DATE_RANGE_CAPACITY");
    setPetSittingLocation("BOTH");
    setMobileVetPrices(emptyMobileVetPrices());
    setMaxDogsPerBooking("");
    setConcurrentCapacityDogs("");
    setSupplierProvides("");
    setOwnerProvides("");
    setGoodToKnow("");
    setWashBrush(emptyGroomingPrices());
    setWashCut(emptyGroomingPrices());
  };

  const startEditing = (s: any) => {
    const tiers = s.pricingTiers || [];

    if (s.service === "GROOMING") {
      setWashBrush({
        small: getTierPrice(tiers, "WASH_BRUSH", "SMALL"),
        medium: getTierPrice(tiers, "WASH_BRUSH", "MEDIUM"),
        large: getTierPrice(tiers, "WASH_BRUSH", "LARGE"),
        xl: getTierPrice(tiers, "WASH_BRUSH", "XL"),
      });

      setWashCut({
        small: getTierPrice(tiers, "WASH_CUT", "SMALL"),
        medium: getTierPrice(tiers, "WASH_CUT", "MEDIUM"),
        large: getTierPrice(tiers, "WASH_CUT", "LARGE"),
        xl: getTierPrice(tiers, "WASH_CUT", "XL"),
      });
    }

    setEditingServiceId(s.id);
    setEditForm({
      price: centsToRandInput(s.baseRateCents),
      durationMinutes: s.durationMinutes ? String(s.durationMinutes) : "",
      bufferMinutes: s.bufferMinutes ? String(s.bufferMinutes) : "",
      maxDogsPerBooking: s.maxDogsPerBooking ? String(s.maxDogsPerBooking) : "",
      concurrentCapacityDogs: s.concurrentCapacityDogs
        ? String(s.concurrentCapacityDogs)
        : "",
      additionalDogEnabled: Boolean(s.additionalDogEnabled),
      additionalDogPrice: centsToRandInput(s.additionalDogPriceCents),
      daycareHalfDayPrice: centsToRandInput(s.pricingJson?.halfDayPriceCents),
      daycareFullDayPrice: centsToRandInput(
        s.pricingJson?.fullDayPriceCents ?? s.baseRateCents
      ),
      petSittingLocation: s.pricingJson?.petSittingLocation || "BOTH",
      mobileVetPrices: getMobileVetPricesFromService(s),
      supplierProvides: arrayToLines(s.pricingJson?.supplierProvides),
      ownerProvides: arrayToLines(s.pricingJson?.ownerProvides),
      goodToKnow: arrayToLines(s.pricingJson?.goodToKnow),
    });
  };

  const cancelEditing = () => {
    setEditingServiceId(null);
    setEditForm(null);
  };

  const updateMutation = useMutation({
    mutationFn: async ({ service }: { service: any }) => {
      if (!editForm) throw new Error("Nothing to update");

      const payload: any = {
        bufferMinutes: Number(editForm.bufferMinutes || "0"),
        maxDogsPerBooking:
          editForm.maxDogsPerBooking === ""
            ? null
            : Number(editForm.maxDogsPerBooking),
        concurrentCapacityDogs:
  service.service === "PET_SITTING" &&
  service.bookingModel === "BLOCK_CAPACITY"
    ? null
    : editForm.concurrentCapacityDogs === ""
      ? null
      : Number(editForm.concurrentCapacityDogs),
        additionalDogEnabled: editForm.additionalDogEnabled,
        additionalDogPriceCents: editForm.additionalDogEnabled
          ? Math.round(Number(editForm.additionalDogPrice || "0") * 100)
          : null,
        pricingJson: buildExpectationsPricingJson(
          service.pricingJson || {},
          editForm.supplierProvides,
          editForm.ownerProvides,
          editForm.goodToKnow
        ),
      };

      if (service.service === "GROOMING") {
        if (!editForm.durationMinutes || Number(editForm.durationMinutes) <= 0) {
          throw new Error("Enter a valid grooming slot length");
        }

        payload.durationMinutes = Number(editForm.durationMinutes);
        payload.baseRateCents = 1;
        payload.groomingOptions = { washBrush, washCut };

        return api.patch(`/api/supplierServices/${service.id}`, payload);
      }

      if (service.service === "DAYCARE") {
        if (
          editForm.daycareHalfDayPrice === "" ||
          editForm.daycareFullDayPrice === ""
        ) {
          throw new Error("Half day and full day prices are required");
        }

        payload.baseRateCents = Math.round(
          Number(editForm.daycareFullDayPrice) * 100
        );
        payload.pricingJson = {
          ...payload.pricingJson,
          halfDayPriceCents: Math.round(
            Number(editForm.daycareHalfDayPrice) * 100
          ),
          fullDayPriceCents: Math.round(
            Number(editForm.daycareFullDayPrice) * 100
          ),
        };
      } else if (service.service === "PET_SITTING") {
        if (service.bookingModel !== "BLOCK_CAPACITY" && (!editForm.price || Number(editForm.price) <= 0)) {
          throw new Error("Enter a valid pet sitting price");
        }

        payload.baseRateCents = Math.round(Number(editForm.price) * 100);
        payload.pricingJson = {
          ...payload.pricingJson,
          petSittingLocation:
  service.bookingModel === "BLOCK_CAPACITY"
    ? "OWNER_HOME"
    : editForm.petSittingLocation || "BOTH",
        };
      } else if (service.service === "MOBILE_VET") {
        const lowestPrice = getLowestMobileVetPriceCents(editForm.mobileVetPrices);

        if (!lowestPrice) {
          throw new Error("Add at least one mobile vet service price");
        }

        if (!editForm.durationMinutes || Number(editForm.durationMinutes) <= 0) {
          throw new Error("Enter a valid mobile vet duration");
        }

        payload.baseRateCents = lowestPrice;
        payload.durationMinutes = Number(editForm.durationMinutes);
        payload.pricingJson = {
          ...payload.pricingJson,
          ...buildMobileVetPricingJson(editForm.mobileVetPrices),
        };
      } else {
        if (!editForm.price || Number(editForm.price) <= 0) {
          throw new Error("Enter a valid price");
        }

        payload.baseRateCents = Math.round(Number(editForm.price) * 100);
      }

      if (
        !["BOARDING", "PET_SITTING", "DAYCARE", "MOBILE_VET"].includes(
          service.service
        )
      ) {
        if (!editForm.durationMinutes || Number(editForm.durationMinutes) <= 0) {
          throw new Error("Enter a valid duration");
        }

        payload.durationMinutes = Number(editForm.durationMinutes);
      }

      return api.patch(`/api/supplierServices/${service.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
      cancelEditing();
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: async ({
      serviceId,
      startDate,
      endDate,
      reason,
    }: {
      serviceId: string;
      startDate: string;
      endDate: string;
      reason: string;
    }) => {
      if (!startDate || !endDate) {
        throw new Error("Choose both an unavailable-from and unavailable-until date");
      }

      if (startDate > endDate) {
        throw new Error(
          "The unavailable-until date must be the same as or later than the start date."
        );
      }

      return api.post(`/api/supplierServices/${serviceId}/availability-blocks`, {
        startAt: `${startDate}T00:00:00.000Z`,
        endAt: `${endDate}T23:59:59.000Z`,
        reason: reason || null,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
      setBlockInputs((prev) => ({
        ...prev,
        [variables.serviceId]: { startDate: "", endDate: "", reason: "" },
      }));
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) =>
      api.delete(`/api/supplierServices/availability-blocks/${blockId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!serviceType) throw new Error("Select a service");

      const defaults = serviceDefaults(serviceType);
      const showDogCapacity = shouldShowDogCapacity(serviceType);
      const isDaycare = serviceType === "DAYCARE";
      const isBoarding = serviceType === "BOARDING";
      const isPetSitting = serviceType === "PET_SITTING";
      const isMobileVet = serviceType === "MOBILE_VET";
      const expectationsPricingJson = buildExpectationsPricingJson(
        null,
        supplierProvides,
        ownerProvides,
        goodToKnow
      );

      if (
        showDogCapacity &&
        maxDogsPerBooking &&
        Number(maxDogsPerBooking) <= 0
      ) {
        throw new Error("Enter a valid maximum dogs per booking");
      }

      if (
        showDogCapacity &&
        concurrentCapacityDogs &&
        Number(concurrentCapacityDogs) <= 0
      ) {
        throw new Error("Enter a valid concurrent capacity");
      }

      if (
        showDogCapacity &&
        maxDogsPerBooking &&
        concurrentCapacityDogs &&
        Number(concurrentCapacityDogs) < Number(maxDogsPerBooking)
      ) {
        throw new Error(
          "Concurrent capacity cannot be less than maximum dogs per booking"
        );
      }

      if (serviceType === "GROOMING") {
        if (!duration || Number(duration) <= 0) {
          throw new Error("Enter a valid grooming slot length");
        }

        return api.post("/api/supplierServices", {
          services: [
            {
              service: "GROOMING",
              unit: defaults.unit,
              baseRateCents: 1,
              durationMinutes: Number(duration),
              bufferMinutes: Number(bufferMinutes || "0"),
              groomingOptions: { washBrush, washCut },
              pricingJson: expectationsPricingJson,
              maxDogsPerBooking: null,
              concurrentCapacityDogs: null,
            },
          ],
        });
      }

      if (isDaycare) {
        if (daycareHalfDayPrice === "" || Number(daycareHalfDayPrice) < 0) {
          throw new Error("Enter a valid half day price");
        }

        if (daycareFullDayPrice === "" || Number(daycareFullDayPrice) < 0) {
          throw new Error("Enter a valid full day price");
        }

        if (!maxDogsPerBooking || Number(maxDogsPerBooking) <= 0) {
          throw new Error("Enter a valid maximum dogs per booking");
        }

        return api.post("/api/supplierServices", {
          services: [
            {
              service: serviceType,
              unit: defaults.unit,
              baseRateCents: Math.round(Number(daycareFullDayPrice) * 100),
              durationMinutes: null,
              bufferMinutes: Number(bufferMinutes || "0"),
              pricingJson: {
                ...expectationsPricingJson,
                halfDayPriceCents: Math.round(Number(daycareHalfDayPrice) * 100),
                fullDayPriceCents: Math.round(Number(daycareFullDayPrice) * 100),
              },
              additionalDogEnabled: daycareExtraDogEnabled,
              additionalDogPriceCents: daycareExtraDogEnabled
                ? Math.round(Number(daycareExtraDogPrice) * 100)
                : null,
              maxDogsPerBooking: Number(maxDogsPerBooking),
              concurrentCapacityDogs:
                Number(concurrentCapacityDogs || "0") || null,
            },
          ],
        });
      }

      if (isMobileVet) {
        const lowestPrice = getLowestMobileVetPriceCents(mobileVetPrices);

        if (!lowestPrice) {
          throw new Error("Add at least one mobile vet service price");
        }

        if (!duration || Number(duration) <= 0) {
          throw new Error("Enter a valid mobile vet visit length");
        }

        return api.post("/api/supplierServices", {
          services: [
            {
              service: serviceType,
              unit: defaults.unit,
              baseRateCents: lowestPrice,
              durationMinutes: Number(duration),
              bufferMinutes: Number(bufferMinutes || "0"),
              pricingJson: {
                ...expectationsPricingJson,
                ...buildMobileVetPricingJson(mobileVetPrices),
              },
              maxDogsPerBooking: null,
              concurrentCapacityDogs: null,
            },
          ],
        });
      }

      if (
        serviceType === "TRAINING" &&
        trainingBookingMode === "SESSION_EVENT"
      ) {
        return api.post("/api/supplierServices", {
          services: [
            {
              service: "TRAINING",
              bookingModel: "SESSION_EVENT",
              unit: defaults.unit,
              baseRateCents: 0,
              durationMinutes: null,
              bufferMinutes: null,
              pricingJson: expectationsPricingJson,
              maxDogsPerBooking: null,
              concurrentCapacityDogs: null,
            },
          ],
        });
      }

      if (!(isPetSitting && petSittingBookingMode === "BLOCK_CAPACITY") && (!price || Number(price) <= 0)) {
        throw new Error("Enter a valid price");
      }

      const requiresDuration = !["BOARDING", "PET_SITTING", "DAYCARE"].includes(
        serviceType
      );

      if (requiresDuration && (!duration || Number(duration) <= 0)) {
        throw new Error("Enter a valid time in minutes");
      }

      if (
        isBoarding &&
        boardingExtraDogEnabled &&
        (!boardingExtraDogPrice || Number(boardingExtraDogPrice) < 0)
      ) {
        throw new Error("Enter a valid extra dog price");
      }

      return api.post("/api/supplierServices", {
        services: [
          {
            service: serviceType,
            bookingModel:
              serviceType === "TRAINING"
                ? trainingBookingMode
                : isPetSitting
                ? petSittingBookingMode
                : undefined,
            unit:
              isPetSitting && petSittingBookingMode === "BLOCK_CAPACITY"
                ? "PER_VISIT"
                : defaults.unit,
            baseRateCents:
  isPetSitting && petSittingBookingMode === "BLOCK_CAPACITY"
    ? 0
    : Math.round(Number(price) * 100),
            durationMinutes: requiresDuration ? Number(duration) : null,
            bufferMinutes: Number(bufferMinutes || "0"),
            additionalDogEnabled: isBoarding ? boardingExtraDogEnabled : false,
            additionalDogPriceCents:
              isBoarding && boardingExtraDogEnabled
                ? Math.round(Number(boardingExtraDogPrice) * 100)
                : null,
            pricingJson: isPetSitting
              ? {
                  ...expectationsPricingJson,
                  petSittingLocation: petSittingBookingMode === "BLOCK_CAPACITY" ? "OWNER_HOME" : petSittingLocation,
                }
              : expectationsPricingJson,
            maxDogsPerBooking: showDogCapacity
              ? Number(maxDogsPerBooking || "0") || null
              : null,
            concurrentCapacityDogs:
  isPetSitting && petSittingBookingMode === "BLOCK_CAPACITY"
    ? null
    : showDogCapacity
      ? Number(concurrentCapacityDogs || "0") || null
      : null,
          },
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/supplierServices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
    },
    onError: (error) => {
      alert(getApiErrorMessage(error));
    },
  });

  const createPetVisitBlockMutation = useMutation({
  mutationFn: async (serviceId: string) => {
    if (!petVisitBlockLabel.trim()) {
      throw new Error("Enter a pet visit block name");
    }

    if (!petVisitBlockStartTime || !petVisitBlockEndTime) {
      throw new Error("Enter a start and end time");
    }

    if (
      petVisitBlockPrice === "" ||
      !Number.isFinite(Number(petVisitBlockPrice)) ||
      Number(petVisitBlockPrice) < 0
    ) {
      throw new Error("Enter a valid pet visit price");
    }

    return api.post(`/api/supplierServices/${serviceId}/booking-blocks`, {
      label: petVisitBlockLabel.trim(),
      startTime: petVisitBlockStartTime,
      endTime: petVisitBlockEndTime,
      priceCents: Math.round(Number(petVisitBlockPrice) * 100),
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["supplier-services"] });
    setPetVisitBlockLabel("");
    setPetVisitBlockStartTime("");
    setPetVisitBlockEndTime("");
    setPetVisitBlockPrice("");
  },
  onError: (error) => {
    alert(getApiErrorMessage(error));
  },
});

  const groupedServices = services.reduce((acc: any, service: any) => {
    if (!acc[service.service]) acc[service.service] = [];
    acc[service.service].push(service);
    return acc;
  }, {});

  const showDurationInput =
    serviceType &&
    !["GROOMING", "BOARDING", "PET_SITTING", "DAYCARE"].includes(serviceType);

  const showBufferInput = Boolean(serviceType);
  const isBoarding = serviceType === "BOARDING";
  const isDaycare = serviceType === "DAYCARE";
  const isTraining = serviceType === "TRAINING";

  const isSessionEventTraining =
    isTraining && trainingBookingMode === "SESSION_EVENT";

  const isPetSitting = serviceType === "PET_SITTING";
  const isMobileVet = serviceType === "MOBILE_VET";
  const showDogCapacityInput = shouldShowDogCapacity(serviceType);

  const renderExpectationInputs = (
    currentSupplierProvides: string,
    currentOwnerProvides: string,
    currentGoodToKnow: string,
    onSupplierProvidesChange: (value: string) => void,
    onOwnerProvidesChange: (value: string) => void,
    onGoodToKnowChange: (value: string) => void
  ) => (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div>
        <p className="font-medium">Service expectations</p>
        <p className="text-sm text-gray-500">
          Add one item per line. These will appear on your public supplier profile.
        </p>
      </div>

      <textarea
        rows={3}
        value={currentSupplierProvides}
        onChange={(e) => onSupplierProvidesChange(e.target.value)}
        placeholder={"What you provide, one per line\nExample: Poop bags\nWater breaks"}
        className="border rounded px-3 py-2 block w-full"
      />

      <textarea
        rows={3}
        value={currentOwnerProvides}
        onChange={(e) => onOwnerProvidesChange(e.target.value)}
        placeholder={"What the owner provides, one per line\nExample: Collar or harness\nAccess to dog"}
        className="border rounded px-3 py-2 block w-full"
      />

      <textarea
        rows={3}
        value={currentGoodToKnow}
        onChange={(e) => onGoodToKnowChange(e.target.value)}
        placeholder={"Good to know, one per line\nExample: Please mention nervous behaviour before booking."}
        className="border rounded px-3 py-2 block w-full"
      />
    </div>
  );

  const renderSavedExpectations = (s: any) => {
    const supplierItems = s.pricingJson?.supplierProvides || [];
    const ownerItems = s.pricingJson?.ownerProvides || [];
    const notes = s.pricingJson?.goodToKnow || [];

    if (!supplierItems.length && !ownerItems.length && !notes.length) return null;

    return (
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {supplierItems.length ? (
          <div className="rounded border bg-green-50 p-3 text-green-800">
            <p className="font-medium">What we provide</p>
            {supplierItems.map((item: string) => (
              <p key={item}>✓ {item}</p>
            ))}
          </div>
        ) : null}

        {ownerItems.length ? (
          <div className="rounded border bg-blue-50 p-3 text-blue-800">
            <p className="font-medium">What owner provides</p>
            {ownerItems.map((item: string) => (
              <p key={item}>✓ {item}</p>
            ))}
          </div>
        ) : null}

        {notes.length ? (
          <div className="rounded border bg-gray-50 p-3 text-gray-700">
            <p className="font-medium">Good to know</p>
            {notes.map((item: string) => (
              <p key={item}>• {item}</p>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderEditForm = (s: any) => {
    if (editingServiceId !== s.id || !editForm) return null;

    const showCapacity = shouldShowDogCapacity(s.service);
    const showDuration = ![
      "BOARDING",
      "PET_SITTING",
      "DAYCARE",
      "GROOMING",
    ].includes(s.service);

    return (
      <div className="rounded-lg border border-gray-200 p-3 space-y-3 bg-gray-50">
        <p className="font-medium text-gray-700">Edit Service</p>

        {s.service === "GROOMING" ? (
          <>
            <input
              type="number"
              min="1"
              placeholder="Grooming slot length (mins)"
              value={editForm.durationMinutes}
              onChange={(e) =>
                setEditForm({ ...editForm, durationMinutes: e.target.value })
              }
              className="border rounded px-3 py-2 block w-full"
            />

            <p className="font-medium">Wash & Brush</p>
            {DOG_SIZES.map((size) => (
              <input
                key={`edit-wash-brush-${size}`}
                type="number"
                min="0"
                placeholder={`${size} price`}
                value={(washBrush as any)[size]}
                onChange={(e) =>
                  setWashBrush((prev) => ({ ...prev, [size]: e.target.value }))
                }
                className="border rounded px-3 py-2 block w-full"
              />
            ))}

            <p className="font-medium">Wash & Cut</p>
            {DOG_SIZES.map((size) => (
              <input
                key={`edit-wash-cut-${size}`}
                type="number"
                min="0"
                placeholder={`${size} price`}
                value={(washCut as any)[size]}
                onChange={(e) =>
                  setWashCut((prev) => ({ ...prev, [size]: e.target.value }))
                }
                className="border rounded px-3 py-2 block w-full"
              />
            ))}
          </>
        ) : s.service === "DAYCARE" ? (
          <>
            <input
              type="number"
              min="0"
              placeholder="Half day price (R)"
              value={editForm.daycareHalfDayPrice}
              onChange={(e) =>
                setEditForm({ ...editForm, daycareHalfDayPrice: e.target.value })
              }
              className="border rounded px-3 py-2 block w-full"
            />
            <input
              type="number"
              min="0"
              placeholder="Full day price (R)"
              value={editForm.daycareFullDayPrice}
              onChange={(e) =>
                setEditForm({ ...editForm, daycareFullDayPrice: e.target.value })
              }
              className="border rounded px-3 py-2 block w-full"
            />
          </>
        ) : s.service === "MOBILE_VET" ? (
          <div className="space-y-3 rounded-lg border border-gray-200 p-3">
            <input
              type="number"
              min="1"
              placeholder="Visit length (mins)"
              value={editForm.durationMinutes}
              onChange={(e) =>
                setEditForm({ ...editForm, durationMinutes: e.target.value })
              }
              className="border rounded px-3 py-2 block w-full"
            />

            <p className="font-medium">Mobile vet services</p>

            {MOBILE_VET_SERVICES.map((vetService) => (
              <div key={`edit-${vetService.key}`} className="grid gap-2 md:grid-cols-2">
                <label className="text-sm text-gray-700">{vetService.label}</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Price (R)"
                  value={editForm.mobileVetPrices[vetService.key] || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      mobileVetPrices: {
                        ...editForm.mobileVetPrices,
                        [vetService.key]: e.target.value,
                      },
                    })
                  }
                  className="border rounded px-3 py-2 block w-full"
                />
              </div>
            ))}
          </div>
        ) : s.service === "PET_SITTING" &&
  s.bookingModel === "BLOCK_CAPACITY" ? null : (
  <input
    type="number"
    min="0"
    placeholder="Price (R)"
    value={editForm.price}
    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
    className="border rounded px-3 py-2 block w-full"
  />
)}

        {s.service === "PET_SITTING" && s.bookingModel !== "BLOCK_CAPACITY" ? (
          <select
            value={editForm.petSittingLocation}
            onChange={(e) =>
              setEditForm({ ...editForm, petSittingLocation: e.target.value })
            }
            className="border rounded px-3 py-2 block w-full"
          >
            <option value="BOTH">Owner home or sitter home</option>
            <option value="OWNER_HOME">Owner’s home only</option>
            <option value="SITTER_HOME">Sitter’s home only</option>
          </select>
        ) : null}
        {s.service === "PET_SITTING" && s.bookingModel === "BLOCK_CAPACITY" ? <p className="text-sm text-gray-600">Pet sitting location: Owner’s home only</p> : null}

        {showDuration ? (
          <input
            type="number"
            min="1"
            placeholder="Duration minutes"
            value={editForm.durationMinutes}
            onChange={(e) =>
              setEditForm({ ...editForm, durationMinutes: e.target.value })
            }
            className="border rounded px-3 py-2 block w-full"
          />
        ) : null}

        <input
          type="number"
          min="0"
          placeholder="Buffer minutes"
          value={editForm.bufferMinutes}
          onChange={(e) =>
            setEditForm({ ...editForm, bufferMinutes: e.target.value })
          }
          className="border rounded px-3 py-2 block w-full"
        />

        {showCapacity ? (
          <>
            <input
              type="number"
              min="1"
              placeholder="Maximum dogs per booking"
              value={editForm.maxDogsPerBooking}
              onChange={(e) =>
                setEditForm({ ...editForm, maxDogsPerBooking: e.target.value })
              }
              className="border rounded px-3 py-2 block w-full"
            />
            {!(
  s.service === "PET_SITTING" &&
  s.bookingModel === "BLOCK_CAPACITY"
) ? (
  <input
    type="number"
    min="1"
    placeholder="Total concurrent dog capacity"
    value={editForm.concurrentCapacityDogs}
    onChange={(e) =>
      setEditForm({
        ...editForm,
        concurrentCapacityDogs: e.target.value,
      })
    }
    className="border rounded px-3 py-2 block w-full"
  />
) : null}
          </>
        ) : null}

        {s.service === "BOARDING" || s.service === "DAYCARE" ? (
          <>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={editForm.additionalDogEnabled}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    additionalDogEnabled: e.target.checked,
                  })
                }
              />
              Enable extra dog pricing
            </label>

            {editForm.additionalDogEnabled ? (
              <input
                type="number"
                min="0"
                placeholder="Extra dog price (R)"
                value={editForm.additionalDogPrice}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    additionalDogPrice: e.target.value,
                  })
                }
                className="border rounded px-3 py-2 block w-full"
              />
            ) : null}
          </>
        ) : null}

        {renderExpectationInputs(
          editForm.supplierProvides,
          editForm.ownerProvides,
          editForm.goodToKnow,
          (value) => setEditForm({ ...editForm, supplierProvides: value }),
          (value) => setEditForm({ ...editForm, ownerProvides: value }),
          (value) => setEditForm({ ...editForm, goodToKnow: value })
        )}

        <div className="flex gap-2">
          <button
            onClick={() => updateMutation.mutate({ service: s })}
            disabled={updateMutation.isPending}
            className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </button>

          <button onClick={cancelEditing} className="rounded border px-3 py-2 text-sm">
            Cancel
          </button>
        </div>

        {updateMutation.isError ? (
          <p className="text-sm text-red-600">
            {getApiErrorMessage(updateMutation.error)}
          </p>
        ) : null}
      </div>
    );
  };

    const [sessionInputs, setSessionInputs] = useState<
    Record<
      string,
      {
        name: string;
        description: string;
        startAt: string;
        endAt: string;
        capacityDogs: string;
        price: string;
      }
    >
  >({});

  const createSessionMutation = useMutation({
    mutationFn: async ({
      serviceId,
      name,
      description,
      startAt,
      endAt,
      capacityDogs,
      price,
    }: {
      serviceId: string;
      name: string;
      description: string;
      startAt: string;
      endAt: string;
      capacityDogs: string;
      price: string;
    }) => {
      if (!name.trim()) {
        throw new Error("Enter a session name");
      }

      if (!startAt || !endAt) {
        throw new Error("Choose the session start and end times");
      }

            const parsedStartAt = new Date(startAt);
      const parsedEndAt = new Date(endAt);

      if (
        Number.isNaN(parsedStartAt.getTime()) ||
        Number.isNaN(parsedEndAt.getTime())
      ) {
        throw new Error("Enter valid session dates and times");
      }

      if (parsedEndAt <= parsedStartAt) {
        throw new Error("The session must end after it starts");
      }

      const startMinutes =
        parsedStartAt.getHours() * 60 + parsedStartAt.getMinutes();

      const endMinutes =
        parsedEndAt.getHours() * 60 + parsedEndAt.getMinutes();

      const occurrenceDurationMinutes = endMinutes - startMinutes;

      if (occurrenceDurationMinutes <= 0) {
        throw new Error(
          "The session end time must be later than the session start time"
        );
      }

      const occurrenceDurationMs =
        occurrenceDurationMinutes * 60 * 1000;

      const occurrences: Array<{
        label: string;
        startAt: string;
        endAt: string;
      }> = [];

      const occurrenceCursor = new Date(parsedStartAt);

      while (occurrenceCursor <= parsedEndAt) {
        const occurrenceStart = new Date(occurrenceCursor);

        const occurrenceEnd = new Date(
          occurrenceStart.getTime() + occurrenceDurationMs
        );

        if (occurrenceEnd > parsedEndAt) {
          break;
        }

        occurrences.push({
          label: name.trim(),
          startAt: occurrenceStart.toISOString(),
          endAt: occurrenceEnd.toISOString(),
        });

        occurrenceCursor.setDate(occurrenceCursor.getDate() + 7);
      }

      const parsedCapacityDogs = Number(capacityDogs);

      if (
        !Number.isInteger(parsedCapacityDogs) ||
        parsedCapacityDogs <= 0
      ) {
        throw new Error("Session capacity must be at least 1");
      }

      const parsedPrice = Number(price);

      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        throw new Error("Enter a valid session price");
      }

      return api.post(`/api/supplierServices/${serviceId}/sessions`, {
        name: name.trim(),
        description: description.trim() || null,
        startAt: parsedStartAt.toISOString(),
        endAt: parsedEndAt.toISOString(),
        capacityDogs: parsedCapacityDogs,
        priceCents: Math.round(parsedPrice * 100),
        occurrences,
      });
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["supplier-services"],
      });

      setSessionInputs((previous) => ({
        ...previous,
        [variables.serviceId]: {
          name: "",
          description: "",
          startAt: "",
          endAt: "",
          capacityDogs: "",
          price: "",
        },
      }));
    },
  });

  const formatSessionDateTime = (value?: string | null) => {
    if (!value) return "";

    return new Date(value).toLocaleString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderSessionManager = (s: any) => {
    if (s.bookingModel !== "SESSION_EVENT") {
      return null;
    }

    const input = sessionInputs[s.id] || {
      name: "",
      description: "",
      startAt: "",
      endAt: "",
      capacityDogs: "",
      price: "",
    };

    const sessions = s.sessions || [];

    const isCreatingThisSession =
      createSessionMutation.isPending &&
      createSessionMutation.variables?.serviceId === s.id;

    const updateSessionInput = (
      field:
        | "name"
        | "description"
        | "startAt"
        | "endAt"
        | "capacityDogs"
        | "price",
      value: string
    ) => {
      setSessionInputs((previous) => ({
        ...previous,
        [s.id]: {
          ...input,
          [field]: value,
        },
      }));
    };

    return (
      <div className="mt-4 space-y-4 rounded-lg border border-gray-200 p-4">
        <div>
          <p className="font-medium text-gray-800">Group class sessions</p>

          <p className="text-sm text-gray-600">
            Create each class or course session with its own date, time, price
            and dog capacity.
          </p>
        </div>

        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session: any) => (
              <div
                key={session.id}
                className="rounded-lg border bg-gray-50 p-3"
              >
                <p className="font-medium text-gray-800">{session.name}</p>

                {session.description ? (
                  <p className="mt-1 text-sm text-gray-600">
                    {session.description}
                  </p>
                ) : null}

                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  {session.occurrences?.length > 0 ? (
                    <div className="space-y-1">
                      {session.occurrences.map((occurrence: any) => (
                        <p key={occurrence.id}>
                          {formatSessionDateTime(occurrence.startAt)} –{" "}
                          {formatSessionDateTime(occurrence.endAt)}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p>
                      {formatSessionDateTime(session.startAt)} –{" "}
                      {formatSessionDateTime(session.endAt)}
                    </p>
                  )}

                  <p>
                    Price: {formatRandFromCents(session.priceCents)}
                  </p>

                  <p>Capacity: {session.capacityDogs} dogs</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No group class sessions have been added yet.
          </p>
        )}

        <div className="space-y-3 rounded-lg border bg-white p-4">
          <p className="font-medium text-gray-800">Add a session</p>

          <input
            type="text"
            placeholder="Session name, e.g. Saturday Puppy Class"
            value={input.name}
            onChange={(event) =>
              updateSessionInput("name", event.target.value)
            }
            className="block w-full rounded border px-3 py-2"
          />

          <textarea
            rows={3}
            placeholder="Description (optional)"
            value={input.description}
            onChange={(event) =>
              updateSessionInput("description", event.target.value)
            }
            className="block w-full rounded border px-3 py-2"
          />

          <div className="grid gap-3 md:grid-cols-2">
  <label className="space-y-1">
    <span className="text-sm font-medium text-gray-700">
      Start date
    </span>

    <input
      type="date"
      value={input.startAt ? input.startAt.slice(0, 10) : ""}
      onChange={(event) => {
        const existingTime = input.startAt.slice(11, 16) || "09:00";
        updateSessionInput(
          "startAt",
          event.target.value
            ? `${event.target.value}T${existingTime}`
            : ""
        );
      }}
      className="block w-full rounded border px-3 py-2"
    />
  </label>

  <label className="space-y-1">
    <span className="text-sm font-medium text-gray-700">
      Start time
    </span>

    <input
      type="time"
      value={input.startAt ? input.startAt.slice(11, 16) : ""}
      onChange={(event) => {
        const existingDate = input.startAt.slice(0, 10);
        updateSessionInput(
          "startAt",
          existingDate
            ? `${existingDate}T${event.target.value}`
            : ""
        );
      }}
      className="block w-full rounded border px-3 py-2"
    />
  </label>

  <label className="space-y-1">
    <span className="text-sm font-medium text-gray-700">
      End date
    </span>

    <input
      type="date"
      min={input.startAt ? input.startAt.slice(0, 10) : undefined}
      value={input.endAt ? input.endAt.slice(0, 10) : ""}
      onChange={(event) => {
        const existingTime = input.endAt.slice(11, 16) || "10:00";
        updateSessionInput(
          "endAt",
          event.target.value
            ? `${event.target.value}T${existingTime}`
            : ""
        );
      }}
      className="block w-full rounded border px-3 py-2"
    />
  </label>

  <label className="space-y-1">
    <span className="text-sm font-medium text-gray-700">
      End time
    </span>

    <input
      type="time"
      value={input.endAt ? input.endAt.slice(11, 16) : ""}
      onChange={(event) => {
        const existingDate = input.endAt.slice(0, 10);
        updateSessionInput(
          "endAt",
          existingDate
            ? `${existingDate}T${event.target.value}`
            : ""
        );
      }}
      className="block w-full rounded border px-3 py-2"
    />
  </label>
</div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">
                Price per dog (R)
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 350"
                value={input.price}
                onChange={(event) =>
                  updateSessionInput("price", event.target.value)
                }
                className="block w-full rounded border px-3 py-2"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">
                Dog capacity
              </span>

              <input
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 8"
                value={input.capacityDogs}
                onChange={(event) =>
                  updateSessionInput("capacityDogs", event.target.value)
                }
                className="block w-full rounded border px-3 py-2"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() =>
              createSessionMutation.mutate({
                serviceId: s.id,
                name: input.name,
                description: input.description,
                startAt: input.startAt,
                endAt: input.endAt,
                capacityDogs: input.capacityDogs,
                price: input.price,
              })
            }
            disabled={isCreatingThisSession}
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreatingThisSession ? "Adding session..." : "Add session"}
          </button>

          {createSessionMutation.isError &&
          createSessionMutation.variables?.serviceId === s.id ? (
            <p className="text-sm text-red-600">
              {getApiErrorMessage(createSessionMutation.error)}
            </p>
          ) : null}
        </div>
      </div>
    );
  };

  const renderAvailabilityBlocks = (s: any) => {
  const input = blockInputs[s.id] || {
    startDate: "",
    endDate: "",
    reason: "",
  };

  const isAddingThisBlock =
    createBlockMutation.isPending &&
    createBlockMutation.variables?.serviceId === s.id;

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-gray-200 p-4">
      <div className="space-y-1">
        <p className="font-medium text-gray-800">Unavailable dates</p>

        <p className="text-sm text-gray-600">
          Add holidays, leave or other dates when you cannot offer this
          service. Dog owners will not be able to request this service during
          the selected period.
        </p>
      </div>

      {s.availabilityBlocks?.length ? (
        <div className="space-y-2">
          {s.availabilityBlocks.map((block: any) => (
            <div
              key={block.id}
              className="flex flex-col gap-3 rounded-lg border bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-gray-800">
                  Unavailable: {formatDate(block.startAt)} –{" "}
                  {formatDate(block.endAt)}
                </p>

                {block.reason ? (
                  <p className="mt-1 text-sm text-gray-500">
                    {block.reason}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => deleteBlockMutation.mutate(block.id)}
                disabled={deleteBlockMutation.isPending}
                className="self-start rounded border px-3 py-2 text-sm text-gray-700 disabled:opacity-50 sm:self-auto"
              >
                {deleteBlockMutation.isPending ? "Removing..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          This service has no unavailable dates.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">
            Unavailable from
          </span>

          <input
            type="date"
            value={input.startDate}
            onChange={(e) =>
              setBlockInputs((prev) => ({
                ...prev,
                [s.id]: {
                  ...input,
                  startDate: e.target.value,
                },
              }))
            }
            className="block w-full rounded border px-3 py-2"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">
            Unavailable until
          </span>

          <input
            type="date"
            min={input.startDate || undefined}
            value={input.endDate}
            onChange={(e) =>
              setBlockInputs((prev) => ({
                ...prev,
                [s.id]: {
                  ...input,
                  endDate: e.target.value,
                },
              }))
            }
            className="block w-full rounded border px-3 py-2"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">
            Reason (optional)
          </span>

          <input
            type="text"
            placeholder="e.g. December holiday"
            value={input.reason}
            onChange={(e) =>
              setBlockInputs((prev) => ({
                ...prev,
                [s.id]: {
                  ...input,
                  reason: e.target.value,
                },
              }))
            }
            className="block w-full rounded border px-3 py-2"
          />
        </label>
      </div>

      <p className="text-xs text-gray-500">
        Both the start and end dates will be unavailable. This only affects
        this service.
      </p>

      <button
        type="button"
        onClick={() =>
          createBlockMutation.mutate({
            serviceId: s.id,
            startDate: input.startDate,
            endDate: input.endDate,
            reason: input.reason,
          })
        }
        disabled={
          isAddingThisBlock ||
          !input.startDate ||
          !input.endDate
        }
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAddingThisBlock ? "Blocking dates..." : "Block these dates"}
      </button>

      {createBlockMutation.isError &&
      createBlockMutation.variables?.serviceId === s.id ? (
        <p className="text-sm text-red-600">
          {getApiErrorMessage(createBlockMutation.error)}
        </p>
      ) : null}
    </div>
  );
};

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Manage Services</h1>

      <div className="border rounded-xl p-6 bg-white space-y-4">
        <h2 className="text-lg font-medium">Add New Service</h2>

        <select
          value={serviceType}
          onChange={(e) => {
            setServiceType(e.target.value);
            setTrainingBookingMode("APPOINTMENT");
            setPrice("");
            setDuration("");
            setBufferMinutes("");
            setBoardingExtraDogEnabled(false);
            setBoardingExtraDogPrice("");
            setDaycareHalfDayPrice("");
            setDaycareFullDayPrice("");
            setDaycareExtraDogEnabled(false);
            setDaycareExtraDogPrice("");
            setPetSittingLocation("BOTH");
            setMobileVetPrices(emptyMobileVetPrices());
            setMaxDogsPerBooking("");
            setConcurrentCapacityDogs("");
            setSupplierProvides("");
            setOwnerProvides("");
            setGoodToKnow("");
            setWashBrush(emptyGroomingPrices());
            setWashCut(emptyGroomingPrices());
          }}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="">Select service</option>
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>
              {formatService(s)}
            </option>
          ))}
        </select>

        {isTraining ? (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <div>
              <p className="font-medium">Training booking type</p>

              <p className="text-sm text-gray-500">
                Choose how dog owners will book this training service.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input
                type="radio"
                name="trainingBookingMode"
                value="APPOINTMENT"
                checked={trainingBookingMode === "APPOINTMENT"}
                onChange={() =>
                  setTrainingBookingMode("APPOINTMENT")
                }
                className="mt-1"
              />

              <span>
                <span className="block font-medium">
                  Private one-on-one training
                </span>

                <span className="block text-sm text-gray-500">
                  The owner chooses an available appointment time for their dog.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input
                type="radio"
                name="trainingBookingMode"
                value="SESSION_EVENT"
                checked={trainingBookingMode === "SESSION_EVENT"}
                onChange={() =>
                  setTrainingBookingMode("SESSION_EVENT")
                }
                className="mt-1"
              />

              <span>
                <span className="block font-medium">
                  Group class or course
                </span>
                <span className="block text-sm text-gray-500">
                  You create named sessions such as Saturday Puppy Class, each
                  with its own date, time, price and capacity.
                </span>
              </span>
            </label>
          </div>

        ) : null}

        {serviceType &&
  serviceType !== "GROOMING" &&
  serviceType !== "DAYCARE" &&
  serviceType !== "MOBILE_VET" &&
  !isSessionEventTraining &&
  !(isPetSitting && petSittingBookingMode === "BLOCK_CAPACITY") ? (
          <input
            type="number"
            min="0"
            placeholder="Price (R)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border rounded px-3 py-2 block w-full"
          />
        ) : null}

        {isPetSitting ? (
  <div className="space-y-4 rounded-lg border border-gray-200 p-4">
    <div>
      <p className="font-medium">Pet sitting type</p>
      <p className="mt-1 text-sm text-gray-500">
        Choose whether you offer overnight pet sitting or scheduled pet visits.
      </p>

      <select
        value={petSittingBookingMode}
        onChange={(e) =>
          setPetSittingBookingMode(
            e.target.value as
              | "DATE_RANGE_CAPACITY"
              | "BLOCK_CAPACITY"
          )
        }
        className="mt-2 border rounded px-3 py-2 block w-full"
      >
        <option value="DATE_RANGE_CAPACITY">
          Overnight pet sitting
        </option>
        <option value="BLOCK_CAPACITY">
          Pet visits
        </option>
      </select>
    </div>

    {petSittingBookingMode === "BLOCK_CAPACITY" ? (
  <div>
    <p className="font-medium">Pet sitting location</p>
    <p className="mt-2 text-sm text-gray-600">Owner’s home only</p>
  </div>
) : (
  <div>
    <p className="font-medium">Pet sitting location</p>
    <select
      value={petSittingLocation}
      onChange={(e) => setPetSittingLocation(e.target.value)}
      className="mt-2 border rounded px-3 py-2 block w-full"
    >
      <option value="BOTH">Owner home or sitter home</option>
      <option value="OWNER_HOME">Owner’s home only</option>
      <option value="SITTER_HOME">Sitter’s home only</option>
    </select>
  </div>
)}
  </div>
) : null}

        {isMobileVet ? (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <p className="font-medium">Mobile vet services</p>

            <input
              type="number"
              min="1"
              placeholder="Visit length (mins)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="border rounded px-3 py-2 block w-full"
            />

            {MOBILE_VET_SERVICES.map((vetService) => (
              <div key={vetService.key} className="grid gap-2 md:grid-cols-2">
                <label className="text-sm text-gray-700">
                  {vetService.label}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Price (R)"
                  value={mobileVetPrices[vetService.key]}
                  onChange={(e) =>
                    setMobileVetPrices((prev) => ({
                      ...prev,
                      [vetService.key]: e.target.value,
                    }))
                  }
                  className="border rounded px-3 py-2 block w-full"
                />
              </div>
            ))}
          </div>
        ) : null}

        {isDaycare ? (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <input
              type="number"
              min="0"
              placeholder="Half day price (R)"
              value={daycareHalfDayPrice}
              onChange={(e) => setDaycareHalfDayPrice(e.target.value)}
              className="border rounded px-3 py-2 block w-full"
            />

            <input
              type="number"
              min="0"
              placeholder="Full day price (R)"
              value={daycareFullDayPrice}
              onChange={(e) => setDaycareFullDayPrice(e.target.value)}
              className="border rounded px-3 py-2 block w-full"
            />
          </div>
        ) : null}

        {isBoarding ? (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={boardingExtraDogEnabled}
                onChange={(e) => setBoardingExtraDogEnabled(e.target.checked)}
              />
              Enable extra dog pricing
            </label>

            {boardingExtraDogEnabled ? (
              <input
                type="number"
                min="0"
                placeholder="Extra dog price (R)"
                value={boardingExtraDogPrice}
                onChange={(e) => setBoardingExtraDogPrice(e.target.value)}
                className="border rounded px-3 py-2 block w-full"
              />
            ) : null}
          </div>
        ) : null}

        {isDaycare ? (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={daycareExtraDogEnabled}
                onChange={(e) => setDaycareExtraDogEnabled(e.target.checked)}
              />
              Enable extra dog pricing
            </label>

            {daycareExtraDogEnabled ? (
              <input
                type="number"
                min="0"
                placeholder="Extra dog price (R)"
                value={daycareExtraDogPrice}
                onChange={(e) => setDaycareExtraDogPrice(e.target.value)}
                className="border rounded px-3 py-2 block w-full"
              />
            ) : null}
          </div>
        ) : null}

        {showDogCapacityInput ? (
  <div className="space-y-3 rounded-lg border border-gray-200 p-4">
    <input
      type="number"
      min="1"
      placeholder="Maximum dogs per booking"
      value={maxDogsPerBooking}
      onChange={(e) => setMaxDogsPerBooking(e.target.value)}
      className="border rounded px-3 py-2 block w-full"
    />

    {!(
      isPetSitting &&
      petSittingBookingMode === "BLOCK_CAPACITY"
    ) ? (
      <input
        type="number"
        min="1"
        placeholder="Total concurrent dog capacity"
        value={concurrentCapacityDogs}
        onChange={(e) => setConcurrentCapacityDogs(e.target.value)}
        className="border rounded px-3 py-2 block w-full"
      />
    ) : null}
  </div>
) : null}

        {showDurationInput &&
        !isMobileVet &&
        !isSessionEventTraining ? (
          <input
            type="number"
            min="1"
            placeholder="Time (mins)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="border rounded px-3 py-2 block w-full"
          />
        ) : null}

        {showBufferInput &&
        serviceType !== "GROOMING" &&
        !isSessionEventTraining ? (
          <input
            type="number"
            min="0"
            placeholder="Time buffer (mins)"
            value={bufferMinutes}
            onChange={(e) => setBufferMinutes(e.target.value)}
            className="border rounded px-3 py-2 block w-full"
          />
        ) : null}

        {serviceType === "GROOMING" ? (
          <>
            <input
              type="number"
              min="1"
              placeholder="Grooming slot length (mins)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="border rounded px-3 py-2 block w-full"
            />

            <p className="font-medium">Wash & Brush</p>
            {DOG_SIZES.map((size) => (
              <input
                key={`wash-brush-${size}`}
                type="number"
                min="0"
                placeholder={`${size} price`}
                value={(washBrush as any)[size]}
                onChange={(e) =>
                  setWashBrush((prev) => ({
                    ...prev,
                    [size]: e.target.value,
                  }))
                }
                className="border rounded px-3 py-2 block w-full"
              />
            ))}

            <p className="font-medium">Wash & Cut</p>
            {DOG_SIZES.map((size) => (
              <input
                key={`wash-cut-${size}`}
                type="number"
                min="0"
                placeholder={`${size} price`}
                value={(washCut as any)[size]}
                onChange={(e) =>
                  setWashCut((prev) => ({
                    ...prev,
                    [size]: e.target.value,
                  }))
                }
                className="border rounded px-3 py-2 block w-full"
              />
            ))}

            <input
              type="number"
              min="0"
              placeholder="Time buffer (mins)"
              value={bufferMinutes}
              onChange={(e) => setBufferMinutes(e.target.value)}
              className="border rounded px-3 py-2 block w-full"
            />
          </>
        ) : null}

        {serviceType
          ? renderExpectationInputs(
              supplierProvides,
              ownerProvides,
              goodToKnow,
              setSupplierProvides,
              setOwnerProvides,
              setGoodToKnow
            )
          : null}

        {serviceType ? (
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {createMutation.isPending ? "Saving..." : "Add Service"}
          </button>
        ) : null}

        {createMutation.isError ? (
          <p className="text-sm text-red-600">
            {getApiErrorMessage(createMutation.error)}
          </p>
        ) : null}
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Your Services</h2>

        {isLoading ? <p>Loading services...</p> : null}

        {!isLoading && Object.keys(groupedServices).length === 0 ? (
          <p className="text-gray-500">No services added yet.</p>
        ) : null}

        {Object.entries(groupedServices).map(([type, group]: any) => (
          <div key={type} className="border rounded-lg p-4 mb-4 bg-white">
            <p className="font-medium">{formatService(type)}</p>

            <div className="text-sm text-gray-500 mt-2 space-y-4">
              {group.map((s: any) => (
                <div key={s.id} className="rounded border p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {type === "TRAINING" &&
                      s.bookingModel === "SESSION_EVENT" ? (
                        <>
                          <p className="font-medium text-gray-700">
                            Group class or course
                          </p>
                          <p>
                            Pricing and schedule are set per session.
                          </p>
                        </>
                      ) : type === "GROOMING" ? (
                        <>
                          {(s.pricingTiers || []).filter(
                            (t: any) => t.category === "WASH_BRUSH"
                          ).length > 0 ? (
                            <>
                              <p className="font-medium">Wash & Brush</p>
                              {(s.pricingTiers || [])
                                .filter((t: any) => t.category === "WASH_BRUSH")
                                .map((t: any) => (
                                  <p key={t.id}>
                                    {t.dogSize.toLowerCase()}: R
                                    {t.priceCents / 100}
                                  </p>
                                ))}
                            </>
                          ) : null}

                          {(s.pricingTiers || []).filter(
                            (t: any) => t.category === "WASH_CUT"
                          ).length > 0 ? (
                            <>
                              <p className="font-medium mt-2">Wash & Cut</p>
                              {(s.pricingTiers || [])
                                .filter((t: any) => t.category === "WASH_CUT")
                                .map((t: any) => (
                                  <p key={t.id}>
                                    {t.dogSize.toLowerCase()}: R
                                    {t.priceCents / 100}
                                  </p>
                                ))}
                            </>
                          ) : null}
                        </>
                      ) : type === "DAYCARE" ? (
                        <>
                          <p>
                            Half day:{" "}
                            {formatRandFromCents(s.pricingJson?.halfDayPriceCents)}
                          </p>
                          <p>
                            Full day:{" "}
                            {formatRandFromCents(
                              s.pricingJson?.fullDayPriceCents ??
                                s.baseRateCents
                            )}
                          </p>
                        </>
                      ) : type === "PET_SITTING" ? (
                        <>
                          {s.bookingModel !== "BLOCK_CAPACITY" ? <p>R{(s.baseRateCents / 100).toFixed(0)}{" "}{getServiceUnit(type, s)}</p> : null}
                          <p>
                            Location:{" "}
                            {formatPetSittingLocation(
                              s.pricingJson?.petSittingLocation
                            )}
                          </p>
                        </>
                      ) : type === "MOBILE_VET" ? (
                        <>
                          {s.pricingJson?.mobileVetServices?.length ? (
                            s.pricingJson.mobileVetServices.map((item: any) => (
                              <p key={item.key}>
                                {item.label}: {formatRandFromCents(item.priceCents)}
                              </p>
                            ))
                          ) : (
                            <p>
                              From {formatRandFromCents(s.baseRateCents)}{" "}
                              {getServiceUnit(type, s)}
                            </p>
                          )}
                        </>
                      ) : (
                        <p>
                          R{(s.baseRateCents / 100).toFixed(0)}{" "}
                          {getServiceUnit(type, s)}
                        </p>
                      )}

                      <p>{formatBufferMinutes(s.bufferMinutes)}</p>

                      {s.maxDogsPerBooking ? (
                        <p>Max dogs per booking: {s.maxDogsPerBooking}</p>
                      ) : null}

                      {s.concurrentCapacityDogs ? (
                        <p>
                          Total concurrent capacity: {s.concurrentCapacityDogs}
                        </p>
                      ) : null}

                      {(type === "BOARDING" || type === "DAYCARE") &&
                      s.additionalDogEnabled ? (
                        <p>
                          Extra dog: {formatRandFromCents(s.additionalDogPriceCents)}
                        </p>
                      ) : null}

                      {type === "PET_SITTING" && s.bookingModel === "BLOCK_CAPACITY" ? (
  <div className="mt-3 rounded border bg-gray-50 p-3">
    <p className="font-medium text-gray-700">Set your pet visit times & prices</p>
<p className="mt-1 text-sm text-gray-600">Create the bookable visit windows owners can choose from, for example Morning 08:00–10:00 or Midday 11:00–13:00.</p>
    <input
  type="text"
  placeholder="Visit name, e.g. Morning visit"
  value={petVisitBlockLabel}
  onChange={(e) => setPetVisitBlockLabel(e.target.value)}
  className="mt-2 border rounded px-3 py-2 block w-full"
/>

<div className="mt-2 grid grid-cols-2 gap-2">
  <label className="text-sm text-gray-600">Start time</label>
  <label className="text-sm text-gray-600">End time</label>
</div>

<input
  type="time"
  value={petVisitBlockStartTime}
  onChange={(e) => setPetVisitBlockStartTime(e.target.value)}
  className="mt-1 mr-[2%] min-w-0 border rounded px-3 py-2 inline-block w-[48%]"
/>

<input
  type="time"
  value={petVisitBlockEndTime}
  onChange={(e) => setPetVisitBlockEndTime(e.target.value)}
  className="mt-1 min-w-0 border rounded px-3 py-2 inline-block w-[48%]"
/>

<input
  type="number"
  min="0"
  placeholder="Visit price (R)"
  value={petVisitBlockPrice}
  onChange={(e) => setPetVisitBlockPrice(e.target.value)}
  className="mt-2 border rounded px-3 py-2 block w-full"
/>

<button
  type="button"
  onClick={() => createPetVisitBlockMutation.mutate(s.id)}
  disabled={createPetVisitBlockMutation.isPending}
  className="mt-2 rounded bg-black px-3 py-2 text-white disabled:opacity-50"
>
  {createPetVisitBlockMutation.isPending ? "Adding..." : "Add visit block"}
</button>

    {(s.bookingBlocks || []).length ? (
      (s.bookingBlocks || []).map((block: any) => (
        <p key={block.id}>
          {block.label}: {block.startTime}–{block.endTime} ·{" "}
          {formatRandFromCents(block.priceCents)}
          {block.isActive === false ? " · Inactive" : ""}
        </p>
      ))
    ) : (
      <p>No pet visit blocks configured yet.</p>
    )}
  </div>
) : null}
                      {renderSavedExpectations(s)}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(s)}
                        className="rounded border px-3 py-1"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteMutation.mutate(s.id)}
                        className="rounded border px-3 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {renderEditForm(s)}

                  {renderSessionManager(s)}

                  <ServiceOperatingHours
                    serviceId={s.id}
                    operatingHours={s.operatingHours || []}
                  />

                  {renderAvailabilityBlocks(s)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}