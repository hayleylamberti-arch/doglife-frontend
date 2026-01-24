import { z } from "zod";
import { ServiceType, SupplierUnit, DogSize } from "@prisma/client";

// Supplier signup form validation
export const SupplierSignupSchema = z.object({
  businessName: z.string().min(2, "Business name required"),
  contactName: z.string().min(2, "Contact name required"),
  phone: z.string().min(7, "Valid phone number required"),
  suburbId: z.string().min(1),
  operatingSuburbIds: z.array(z.string()).min(1),
  services: z.array(z.object({
    service: z.nativeEnum(ServiceType),
    unit: z.nativeEnum(SupplierUnit),
    baseRateRands: z.number().positive(),
  })),
  consent: z.boolean()
});

// Owner signup form validation
export const OwnerSignupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  suburbId: z.string().min(1),
  dog: z.object({
    name: z.string().min(1),
    breed: z.string().min(1),
    size: z.nativeEnum(DogSize)
  }),
  consent: z.boolean()
});
