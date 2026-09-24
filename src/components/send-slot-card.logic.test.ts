import assert from "node:assert/strict";

import {
  buildBoardingHoldCreatePayload,
  getEffectiveSendSlotBookingModel,
  getBoardingDateValidationError,
  getBoardingDogCountCeiling,
  getBoardingHoldCreateError,
  getSendSlotDogCountMaximum,
  isEligibleBoardingSendSlotService,
  isEligibleSendSlotService,
  isPrivateTrainingSetupRequired,
} from "./send-slot-card.logic.js";

const privateTrainingService = {
  id: "training-service",
  service: "TRAINING",
  bookingModel: null,
  trainingBookingMode: null,
  isActive: true,
  maxDogsPerBooking: null,
  concurrentCapacityDogs: null,
};

assert.equal(
  getEffectiveSendSlotBookingModel(privateTrainingService),
  "APPOINTMENT",
);
assert.equal(isEligibleSendSlotService(privateTrainingService), true);
assert.equal(isPrivateTrainingSetupRequired(privateTrainingService), true);
assert.equal(
  getSendSlotDogCountMaximum(privateTrainingService),
  null,
);
assert.equal(
  getSendSlotDogCountMaximum({
    ...privateTrainingService,
    maxDogsPerBooking: 3,
    concurrentCapacityDogs: 1,
  }),
  3,
);
assert.equal(
  isPrivateTrainingSetupRequired({
    ...privateTrainingService,
    maxDogsPerBooking: 3,
  }),
  false,
);
assert.equal(
  isEligibleSendSlotService({
    ...privateTrainingService,
    trainingBookingMode: "SESSION_EVENT",
  }),
  false,
);
assert.equal(
  getEffectiveSendSlotBookingModel({
    ...privateTrainingService,
    trainingBookingMode: "SESSION_EVENT",
  }),
  "SESSION_EVENT",
);

const walkingService = {
  ...privateTrainingService,
  id: "walking-service",
  service: "WALKING",
  bookingModel: "APPOINTMENT",
  trainingBookingMode: null,
};

assert.equal(isEligibleSendSlotService(walkingService), true);

for (const service of ["GROOMING", "PET_TRANSPORT", "MOBILE_VET"]) {
  assert.equal(
    isEligibleSendSlotService({
      ...privateTrainingService,
      id: `${service.toLowerCase()}-service`,
      service,
      bookingModel: "APPOINTMENT",
      trainingBookingMode: null,
    }),
    false,
  );
}

assert.equal(
  isEligibleSendSlotService({
    ...privateTrainingService,
    id: "pet-sitting-service",
    service: "PET_SITTING",
    bookingModel: "BLOCK_CAPACITY",
    trainingBookingMode: null,
  }),
  false,
);

assert.equal(
  isEligibleSendSlotService({
    ...privateTrainingService,
    id: "daycare-service",
    service: "DAYCARE",
    bookingModel: "BLOCK_CAPACITY",
    trainingBookingMode: null,
  }),
  false,
);

const boardingService = {
  id: "boarding-service",
  service: "BOARDING",
  bookingModel: "DATE_RANGE_CAPACITY",
  isActive: true,
  maxDogsPerBooking: 4,
  concurrentCapacityDogs: 20,
};

assert.equal(isEligibleSendSlotService(boardingService), true);

assert.equal(
  isEligibleBoardingSendSlotService(
    boardingService,
    "DATE_RANGE_CAPACITY",
  ),
  true,
);
assert.equal(
  isEligibleBoardingSendSlotService(
    { ...boardingService, bookingModel: "APPOINTMENT" },
    "APPOINTMENT",
  ),
  false,
);
assert.equal(
  isEligibleBoardingSendSlotService(
    { ...boardingService, isActive: false },
    "DATE_RANGE_CAPACITY",
  ),
  false,
);

for (const concurrentCapacityDogs of [null, 0, -1]) {
  assert.equal(
    isEligibleBoardingSendSlotService(
      { ...boardingService, concurrentCapacityDogs },
      "DATE_RANGE_CAPACITY",
    ),
    false,
  );
}

assert.equal(getBoardingDogCountCeiling(boardingService), 4);
assert.equal(
  getBoardingDogCountCeiling({
    ...boardingService,
    maxDogsPerBooking: 30,
  }),
  20,
);
assert.equal(
  getBoardingDogCountCeiling({
    ...boardingService,
    maxDogsPerBooking: null,
  }),
  20,
);

assert.match(
  getBoardingDateValidationError("2099-01-10", "2099-01-10") || "",
  /at least one day/,
);
assert.match(
  getBoardingDateValidationError("2099-01-10", "2099-01-09") || "",
  /after arrival/,
);
assert.equal(
  getBoardingDateValidationError("2099-01-10", "2099-01-11"),
  null,
);

const payload = buildBoardingHoldCreatePayload({
  supplierServiceId: "boarding-service",
  arrivalDate: "2099-01-10",
  departureDate: "2099-01-12",
  requestedDogCount: 2,
});

assert.deepEqual(payload, {
  supplierServiceId: "boarding-service",
  arrivalDate: "2099-01-10",
  departureDate: "2099-01-12",
  requestedDogCount: 2,
});
assert.deepEqual(Object.keys(payload).sort(), [
  "arrivalDate",
  "departureDate",
  "requestedDogCount",
  "supplierServiceId",
]);

assert.equal(
  getBoardingHoldCreateError({
    response: {
      status: 409,
      data: { error: "Supplier can only handle 4 dogs on every night" },
    },
  }),
  "There isn’t enough Boarding capacity for the full selected stay.",
);
assert.equal(
  getBoardingHoldCreateError({
    response: {
      status: 409,
      data: { error: "Boarding is unavailable for the selected dates" },
    },
  }),
  "Boarding is unavailable for the full selected stay.",
);
assert.match(
  getBoardingHoldCreateError(new Error("Network Error")),
  /connect to DogLife/,
);
