// src/types/enums.ts

export enum UserRole {
  OWNER = "OWNER",
  SUPPLIER = "SUPPLIER",
  ADMIN = "ADMIN",
}

export enum ServiceType {
  BOARDING = "BOARDING",
  GROOMING = "GROOMING",
  DAYCARE = "DAYCARE",
  WALKING = "WALKING",
  TRAINING = "TRAINING",
  PET_SITTING = "PET_SITTING",
  PET_TRANSPORT = "PET_TRANSPORT",
  MOBILE_VET = "MOBILE_VET",
}

export enum SupplierUnit {
  PER_WALK = "PER_WALK",
  PER_SESSION = "PER_SESSION",
  PER_DAY = "PER_DAY",
  PER_NIGHT = "PER_NIGHT",
  PER_VISIT = "PER_VISIT",
  PER_TRIP = "PER_TRIP",
}

export enum DogSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
  XL = "XL",
}

export enum ProvinceCode {
  GP = "GP",
  WC = "WC",
  KZN = "KZN",
  NW = "NW",
  FS = "FS",
  EC = "EC",
  NC = "NC",
  MP = "MP",
  LP = "LP",
}