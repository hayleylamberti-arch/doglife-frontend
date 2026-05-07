import React from "react";

export type VerificationBadgeType =
  | "APPROVED_SUPPLIER"
  | "IDENTITY_VERIFIED"
  | "BACKGROUND_CHECK_VERIFIED"
  | "TRADING_DETAILS_VERIFIED"
  | "REGISTERED_BUSINESS_VERIFIED"
  | "PREMISES_VERIFIED"
  | "VEHICLE_VERIFIED"
  | "SERVICE_SETUP_VERIFIED";

type VerificationBadgeProps = {
  type: VerificationBadgeType;
  className?: string;
};

const badgeConfig: Record<
  VerificationBadgeType,
  {
    label: string;
    shortDescription: string;
  }
> = {
  APPROVED_SUPPLIER: {
    label: "Approved Supplier",
    shortDescription: "Approved to list on DogLife.",
  },
  IDENTITY_VERIFIED: {
    label: "Identity Verified",
    shortDescription: "Identity of the person behind the profile has been checked.",
  },
  BACKGROUND_CHECK_VERIFIED: {
    label: "Background Check Verified",
    shortDescription: "Background/criminal screening result has been reviewed.",
  },
  TRADING_DETAILS_VERIFIED: {
    label: "Trading Details Verified",
    shortDescription: "Trading details and traceability have been reviewed.",
  },
  REGISTERED_BUSINESS_VERIFIED: {
    label: "Registered Business Verified",
    shortDescription: "Formal business registration documents have been reviewed.",
  },
  PREMISES_VERIFIED: {
    label: "Premises Verified",
    shortDescription: "Care location or operating premises have been reviewed.",
  },
  VEHICLE_VERIFIED: {
    label: "Vehicle Verified",
    shortDescription: "Vehicle used for transport or mobile services has been reviewed.",
  },
  SERVICE_SETUP_VERIFIED: {
    label: "Service Setup Verified",
    shortDescription: "Service-specific setup and safety details have been reviewed.",
  },
};

export default function VerificationBadge({
  type,
  className = "",
}: VerificationBadgeProps) {
  const config = badgeConfig[type];

  return (
    <span
      title={config.shortDescription}
      className={`inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-800 ${className}`}
    >
      {config.label}
    </span>
  );
}