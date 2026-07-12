# DogLife UI Component Architecture

**Version:** 1.0  
**Status:** Active  
**Last Updated:** July 2026

---

# Purpose

This document defines how DogLife front-end pages should be structured as the application moves toward closed testing and public launch.

The objective is not to redesign the application.

The objective is to:

- make large files easier to maintain
- reduce duplicated code
- keep owner and supplier experiences consistent
- reduce the risk of regressions
- make future fixes faster
- preserve the current booking business logic
- support a reliable launch

---

# Launch-Focused Principle

Refactoring must not delay testing unnecessarily.

A refactor should only be completed when it:

- reduces immediate maintenance risk
- makes active testing easier
- removes duplicated behaviour
- improves consistency
- makes known launch issues easier to fix

Large architectural rewrites should be added to the roadmap rather than completed before the closed beta.

---

# Core Rules

## 1. Pages coordinate; components display

Page files should be responsible for:

- loading data
- managing page-level state
- organising page sections
- calling API mutations
- passing data and callbacks to components

Page files should not contain every visual element and formatting rule.

---

## 2. Components must have one clear responsibility

A component should represent one clear part of the interface.

Examples:

- booking card
- booking status badge
- journey details
- dog care details
- access instructions
- review form
- notification summary

A component should not become another full page hidden inside a component file.

---

## 3. No booking business logic changes during UI refactoring

UI refactoring must not change:

- booking statuses
- booking lifecycle rules
- API routes
- Prisma schema
- privacy rules
- notification triggers
- email triggers
- payment behaviour
- start or completion timing rules

Any required business logic change must be handled separately and tested independently.

---

## 4. Privacy rules remain enforced by the backend

The front end may control how information is displayed, but it must not be relied upon as the only privacy protection.

The backend remains responsible for withholding:

- owner surnames before confirmation
- supplier surnames where applicable
- exact owner addresses before confirmation
- exact transport addresses before confirmation
- phone numbers before the appropriate booking stage
- email addresses before the appropriate booking stage
- access instructions before the appropriate booking stage

The front end should only display fields returned by the sanitised API response.

---

## 5. Shared components must only be created when genuinely shared

Do not create a shared component merely because two components look vaguely similar.

A component should become shared when:

- both Owner and Supplier experiences use the same data shape
- the display behaviour is substantially the same
- the privacy rules are compatible
- sharing reduces meaningful duplication

Owner- and supplier-specific components may remain separate where their responsibilities differ.

---

# Recommended Front-End Structure

```text
src/
├── components/
│   ├── bookings/
│   │   ├── BookingStatusBadge.tsx
│   │   ├── BookingSection.tsx
│   │   ├── DogCareDetails.tsx
│   │   ├── TransportDetailsCard.tsx
│   │   ├── ServiceLocationCard.tsx
│   │   └── BookingDateSummary.tsx
│   │
│   ├── notifications/
│   │   └── DashboardNotificationList.tsx
│   │
│   └── reviews/
│       ├── OwnerReviewForm.tsx
│       └── SupplierReviewForm.tsx
│
├── pages/
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   └── components/
│   │       ├── OwnerBookingCard.tsx
│   │       ├── OwnerAccessInstructions.tsx
│   │       ├── OwnerBookingJourney.tsx
│   │       ├── OwnerProfilePrompt.tsx
│   │       ├── DogProfilePrompt.tsx
│   │       └── ServiceShortcuts.tsx
│   │
│   └── supplier/
│       └── dashboard/
│           ├── SupplierDashboardPage.tsx
│           └── components/
│               ├── SupplierBookingCard.tsx
│               ├── SupplierBookingJourney.tsx
│               └── SupplierOwnerReview.tsx
│
├── types/
│   └── booking.ts
│
└── utils/
    └── bookings/
        ├── bookingFormatting.ts
        ├── bookingNotes.ts
        └── bookingGrouping.ts