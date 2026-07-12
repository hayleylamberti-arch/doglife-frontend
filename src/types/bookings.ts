export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED_UNBILLED"
  | "COMPLETED"
  | "CANCELLED";

export type BookingDogProfile = {
  id: string;
  name: string;
  breed?: string | null;
  size?: string | null;
  sex?: string | null;
  isNeutered?: boolean | null;
  isVaccinated?: boolean | null;
  vaccinationExpiryDate?: string | null;
  kennelCoughAt?: string | null;
  dewormedAt?: string | null;
  tickFleaTreatedAt?: string | null;
  behavioralNotes?: string | null;
  goodWithDogs?: boolean | null;
  goodWithChildren?: boolean | null;
  medicalNotes?: string | null;
  vetName?: string | null;
  vetPhone?: string | null;
};

export type BookingDog = {
  bookingId?: string;
  dogId?: string;
  dog?: BookingDogProfile;
};

export type BookingEvent = {
  id: string;
  type: string;
  message?: string | null;
  createdAt?: string;
};

export type BookingReview = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt?: string;
};

export type ReviewInput = {
  rating: string;
  comment: string;
};

export type ServiceLocationSummary = {
  type: "OWNER_HOME" | "SUPPLIER_LOCATION" | "TRANSPORT";
  label?: string | null;
  addressLine?: string | null;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
};

export type TransportAreaSummary = {
  type: "TRANSPORT_AREAS";
  label?: string | null;
  pickupSuburb?: string | null;
  dropoffSuburb?: string | null;
};

export type BookingOwner = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export type BookingSupplier = {
  id?: string;
  userId?: string;
  businessName?: string | null;
  businessAddress?: string | null;
  suburb?: string | null;
  ratingAverage?: number | null;
  ratingCount?: number | null;
  completedBookingsCount?: number | null;
};

export type BookingSupplierService = {
  id?: string;
  service?: string | null;
  unit?: string | null;
  durationMinutes?: number | null;
  bufferMinutes?: number | null;
  baseRateCents?: number | null;
};

export type BaseBooking = {
  id: string;
  status: BookingStatus;
  startAt: string;
  endAt: string;

  journeyType?: "ONE_WAY" | "RETURN" | null;
  returnStartAt?: string | null;
  returnEndAt?: string | null;

  totalCents?: number | null;
  serviceType?: string | null;
  serviceArea?: string | null;

  pickupSuburb?: string | null;
  dropoffSuburb?: string | null;
  transportAreaSummary?: TransportAreaSummary | null;

  notes?: string | null;
  accessInstructions?: string | null;
  accessInstructionsUpdatedAt?: string | null;
  completedAt?: string | null;

  serviceLocationSummary?: ServiceLocationSummary | null;

  owner?: BookingOwner | null;
  supplier?: BookingSupplier | null;
  supplierService?: BookingSupplierService | null;

  dogs?: BookingDog[];
  events?: BookingEvent[];
};

export type SupplierBooking = BaseBooking & {
  supplierReview?: BookingReview | null;
  hasSupplierReviewed?: boolean;
};

export type OwnerBooking = BaseBooking & {
  ownerReview?: BookingReview | null;
  hasOwnerReviewed?: boolean;
};