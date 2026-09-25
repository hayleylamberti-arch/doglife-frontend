import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildBoardingHoldConversionPayload,
  calculateBoardingPriceEstimate,
  classifyHoldConversionError,
  formatBoardingHeldDate,
  getBoardingNightCount,
  getHoldDogSelectionLimit,
  getPetVisitPriceCents,
  getPrivateTrainingSessionPriceCents,
  getWalkingPriceCents,
  isBoardingHoldConfirmation,
  isBoardingKennelType,
} from "./booking-hold-confirmation.logic.ts";

assert.equal(
  isBoardingHoldConfirmation("BOARDING", "DATE_RANGE_CAPACITY"),
  true
);
assert.equal(
  isBoardingHoldConfirmation("BOARDING", "APPOINTMENT"),
  false
);
assert.equal(
  isBoardingHoldConfirmation("PET_SITTING", "DATE_RANGE_CAPACITY"),
  false
);
const holdWithEffectiveBoardingModel = {
  bookingModel: "DATE_RANGE_CAPACITY",
  service: { bookingModel: null },
};
const authoritativeBookingModel =
  holdWithEffectiveBoardingModel.bookingModel ??
  holdWithEffectiveBoardingModel.service.bookingModel;
assert.equal(
  isBoardingHoldConfirmation("BOARDING", authoritativeBookingModel),
  true
);

const oneNightStart = "2026-10-12T07:00:00.000Z";
const oneNightEnd = "2026-10-13T07:00:00.000Z";
assert.equal(getBoardingNightCount(oneNightStart, oneNightEnd), 1);
assert.equal(
  getBoardingNightCount(
    "2026-10-30T07:00:00.000Z",
    "2026-11-02T07:00:00.000Z"
  ),
  3
);

for (const selectedDogCount of [1, 2, 3]) {
  assert.equal(
    getPrivateTrainingSessionPriceCents({
      service: "TRAINING",
      bookingModel: "APPOINTMENT",
      baseRateCents: 60_000,
      selectedDogCount,
    }),
    60_000,
  );
}
assert.equal(
  getPrivateTrainingSessionPriceCents({
    service: "TRAINING",
    bookingModel: "SESSION_EVENT",
    baseRateCents: 60_000,
  }),
  null,
);
assert.equal(
  getPrivateTrainingSessionPriceCents({
    service: "TRAINING",
    bookingModel: "APPOINTMENT",
    baseRateCents: 60_000,
    selectedDogCount: 2,
  }),
  60_000,
);

assert.equal(
  getPetVisitPriceCents({
    service: "PET_SITTING",
    bookingModel: "BLOCK_CAPACITY",
    blockPriceCents: 20_000,
    selectedDogCount: 2,
    additionalDogEnabled: false,
  }),
  40_000,
);
assert.equal(
  getPetVisitPriceCents({
    service: "PET_SITTING",
    bookingModel: "BLOCK_CAPACITY",
    blockPriceCents: 20_000,
    selectedDogCount: 2,
    additionalDogEnabled: true,
    additionalDogPriceCents: 7_500,
  }),
  27_500,
);
for (const [pricing, expected] of [
  [{ additionalDogDiscountPct: 25 }, 35_000],
  [{ additionalDogPriceCents: 7_500, additionalDogDiscountPct: 25 }, 27_500],
  [{ additionalDogPriceCents: 0, additionalDogDiscountPct: 25 }, 20_000],
  [{ additionalDogPriceCents: 0 }, 20_000],
  [{}, 40_000],
] as const) {
  assert.equal(
    getPetVisitPriceCents({
      service: "PET_SITTING",
      bookingModel: "BLOCK_CAPACITY",
      blockPriceCents: 20_000,
      selectedDogCount: 2,
      additionalDogEnabled: true,
      ...pricing,
    }),
    expected,
  );
}
assert.equal(
  getPetVisitPriceCents({
    service: "PET_SITTING",
    bookingModel: "BLOCK_CAPACITY",
    selectedDogCount: 1,
  }),
  null,
);

assert.equal(
  getWalkingPriceCents({
    service: "WALKING",
    bookingModel: "APPOINTMENT",
    baseRateCents: 15_000,
    additionalDogEnabled: true,
    additionalDogPriceCents: 7_500,
    additionalDogDiscountPct: null,
    selectedDogCount: 2,
  }),
  22_500
);

assert.equal(
  getWalkingPriceCents({
    service: "WALKING",
    bookingModel: "APPOINTMENT",
    baseRateCents: 15_000,
    additionalDogEnabled: true,
    additionalDogPriceCents: 7_500,
    additionalDogDiscountPct: 10,
    selectedDogCount: 2,
  }),
  21_000
);

assert.equal(
  getWalkingPriceCents({
    service: "WALKING",
    bookingModel: "APPOINTMENT",
    baseRateCents: 15_000,
    additionalDogEnabled: false,
    additionalDogPriceCents: 7_500,
    selectedDogCount: 2,
  }),
  null
);
assert.match(formatBoardingHeldDate(oneNightStart), /12 October 2026/);
assert.equal(formatBoardingHeldDate(oneNightStart).includes("09:00"), false);

const boardingLimit = getHoldDogSelectionLimit({
  requestedDogCount: 2,
  maxDogsPerBooking: 4,
  concurrentCapacityDogs: 20,
  isBoarding: true,
  isWalking: false,
  additionalDogEnabled: true,
});
assert.equal(boardingLimit, 2);
assert.equal(
  getHoldDogSelectionLimit({
    requestedDogCount: 4,
    maxDogsPerBooking: 3,
    concurrentCapacityDogs: 2,
    isBoarding: true,
    isWalking: false,
  }),
  2
);
assert.equal(
  getHoldDogSelectionLimit({
    requestedDogCount: 3,
    maxDogsPerBooking: 3,
    concurrentCapacityDogs: 1,
    isBoarding: false,
    isWalking: false,
  }),
  3
);

assert.equal(isBoardingKennelType("SOCIAL"), true);
assert.equal(isBoardingKennelType("PRIVATE"), true);
assert.equal(isBoardingKennelType("SHARED"), false);

assert.deepEqual(
  calculateBoardingPriceEstimate({
    startAt: oneNightStart,
    endAt: oneNightEnd,
    selectedDogCount: 1,
    baseRateCents: 30_000,
    additionalDogEnabled: true,
    additionalDogPriceCents: 20_000,
    kennelType: "SOCIAL",
  }),
  { nights: 1, totalCents: 30_000 }
);
assert.equal(
  calculateBoardingPriceEstimate({
    startAt: oneNightStart,
    endAt: oneNightEnd,
    selectedDogCount: 3,
    baseRateCents: 30_000,
    additionalDogEnabled: true,
    additionalDogPriceCents: 20_000,
    kennelType: "SOCIAL",
  }).totalCents,
  70_000
);
assert.equal(
  calculateBoardingPriceEstimate({
    startAt: oneNightStart,
    endAt: oneNightEnd,
    selectedDogCount: 2,
    baseRateCents: 30_000,
    additionalDogEnabled: true,
    additionalDogPriceCents: 0,
    kennelType: "SOCIAL",
  }).totalCents,
  30_000
);
assert.equal(
  calculateBoardingPriceEstimate({
    startAt: oneNightStart,
    endAt: oneNightEnd,
    selectedDogCount: 2,
    baseRateCents: 30_000,
    additionalDogEnabled: false,
    additionalDogPriceCents: 20_000,
    kennelType: "SOCIAL",
  }).totalCents,
  60_000
);
assert.equal(
  calculateBoardingPriceEstimate({
    startAt: oneNightStart,
    endAt: oneNightEnd,
    selectedDogCount: 2,
    baseRateCents: 30_000,
    additionalDogEnabled: false,
    additionalDogPriceCents: 20_000,
    kennelType: "PRIVATE",
  }).totalCents,
  69_000
);

const payload = buildBoardingHoldConversionPayload({
  holdToken: "raw-token",
  dogIds: ["dog-1"],
  kennelType: "SOCIAL",
  healthSafetyAccepted: true,
  notes: "  Optional note  ",
});
assert.deepEqual(payload, {
  holdToken: "raw-token",
  dogIds: ["dog-1"],
  kennelType: "SOCIAL",
  healthSafetyAccepted: true,
  notes: "Optional note",
});
assert.deepEqual(Object.keys(payload).sort(), [
  "dogIds",
  "healthSafetyAccepted",
  "holdToken",
  "kennelType",
  "notes",
]);
assert.deepEqual(
  buildBoardingHoldConversionPayload({
    holdToken: "raw-token",
    dogIds: ["dog-1", "dog-2"],
    kennelType: "PRIVATE",
    healthSafetyAccepted: true,
  }),
  {
    holdToken: "raw-token",
    dogIds: ["dog-1", "dog-2"],
    kennelType: "PRIVATE",
    healthSafetyAccepted: true,
  }
);
assert.deepEqual(
  buildBoardingHoldConversionPayload({
    holdToken: "raw-token",
    dogIds: ["dog-1", "dog-1"],
    kennelType: "SOCIAL",
    healthSafetyAccepted: true,
  }).dogIds,
  ["dog-1", "dog-1"]
);
assert.throws(() =>
  buildBoardingHoldConversionPayload({
    holdToken: "raw-token",
    dogIds: [],
    kennelType: "SOCIAL",
    healthSafetyAccepted: true,
  })
);
assert.throws(() =>
  buildBoardingHoldConversionPayload({
    holdToken: "raw-token",
    dogIds: ["dog-1"],
    kennelType: "INVALID",
    healthSafetyAccepted: true,
  })
);
assert.throws(() =>
  buildBoardingHoldConversionPayload({
    holdToken: "raw-token",
    dogIds: ["dog-1"],
    kennelType: "SOCIAL",
    healthSafetyAccepted: false,
  })
);

assert.equal(classifyHoldConversionError(null), "NETWORK_RETRY");
assert.equal(classifyHoldConversionError(400), "CORRECTABLE");
assert.equal(classifyHoldConversionError(404), "TERMINAL_REFETCH");
assert.equal(classifyHoldConversionError(409), "TERMINAL_REFETCH");
assert.equal(classifyHoldConversionError(410), "TERMINAL_REFETCH");

const componentSource = readFileSync(
  new URL("./booking-hold-confirmation.tsx", import.meta.url),
  "utf8"
);
assert.match(componentSource, /if \(submitting\) return;/);
assert.match(componentSource, /current\.length >= selectionLimit/);
assert.match(componentSource, /await onConverted\(\);/);
assert.match(componentSource, /classifyHoldConversionError\(status\)/);
assert.match(componentSource, /formatBoardingHeldDate\(startAt\)/);
assert.match(componentSource, /formatBoardingHeldDate\(endAt\)/);
assert.match(
  componentSource,
  /isBoardingHoldConfirmation\(\s*serviceType,\s*bookingModel\s*\)/
);
assert.match(componentSource, /serviceType === "WALKING"/);
assert.match(componentSource, /serviceType === "GROOMING"/);
assert.match(componentSource, /serviceType === "PET_TRANSPORT"/);
assert.match(componentSource, /serviceType === "PET_SITTING"/);
assert.match(componentSource, /Current total: R/);
assert.match(componentSource, /Dog Walking/);
assert.match(componentSource, /walkingPriceCents/);
assert.match(componentSource, /Private Training session/);
assert.match(componentSource, /Price is rechecked when you confirm\./);
assert.doesNotMatch(componentSource, /localStorage|sessionStorage|document\.cookie/);

const holdPageSource = readFileSync(
  new URL("../pages/booking-hold.tsx", import.meta.url),
  "utf8"
);
assert.match(holdPageSource, /conversionTerminalError/);
assert.match(holdPageSource, /onConverted=\{handleConverted\}/);
