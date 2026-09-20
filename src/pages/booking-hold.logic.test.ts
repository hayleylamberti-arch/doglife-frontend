import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  formatJohannesburgDate,
  getBoardingPublicSummaryRows,
  getPublicHoldServiceLabel,
  isBoardingDateRangeHold,
} from "./booking-hold.logic.ts";

assert.equal(
  isBoardingDateRangeHold("BOARDING", "DATE_RANGE_CAPACITY"),
  true
);
assert.equal(
  isBoardingDateRangeHold("BOARDING", "APPOINTMENT"),
  false
);
assert.equal(
  getPublicHoldServiceLabel(
    "BOARDING",
    "DATE_RANGE_CAPACITY"
  ),
  "Boarding"
);
assert.equal(
  getPublicHoldServiceLabel(
    "PET_SITTING",
    "BLOCK_CAPACITY"
  ),
  "Pet Visit"
);
assert.equal(
  getPublicHoldServiceLabel("WALKING", "APPOINTMENT"),
  "Dog walking"
);

const rows = getBoardingPublicSummaryRows({
  startAt: "2026-10-12T07:00:00.000Z",
  endAt: "2026-10-15T07:00:00.000Z",
  requestedDogCount: 2,
});

assert.deepEqual(
  rows.map((row) => row.label),
  ["Arrival", "Departure", "Dogs"]
);
assert.match(rows[0].value, /12 October 2026/);
assert.match(rows[1].value, /15 October 2026/);
assert.equal(rows[2].value, "Up to 2 dogs");
assert.equal(rows.some((row) => row.label === "Held appointment"), false);
assert.equal(rows.some((row) => row.value.includes("09:00")), false);

const publicHoldPageSource = readFileSync(
  new URL("./booking-hold.tsx", import.meta.url),
  "utf8"
);
assert.match(
  publicHoldPageSource,
  /hold\.bookingModel \?\? hold\.service\?\.bookingModel/
);
assert.match(
  publicHoldPageSource,
  /bookingModel=\{bookingModel\}/
);

const holdWithEffectiveBoardingModel = {
  bookingModel: "DATE_RANGE_CAPACITY",
  service: {
    service: "BOARDING",
    bookingModel: null,
  },
};
const authoritativeBookingModel =
  holdWithEffectiveBoardingModel.bookingModel ??
  holdWithEffectiveBoardingModel.service.bookingModel;
assert.equal(
  isBoardingDateRangeHold(
    holdWithEffectiveBoardingModel.service.service,
    authoritativeBookingModel
  ),
  true
);

// The same instant is still 12 October in Johannesburg, even when it is
// 11 October in UTC. This guards against browser-local date assumptions.
assert.match(
  formatJohannesburgDate("2026-10-11T22:30:00.000Z"),
  /12 October 2026/
);
