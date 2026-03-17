export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  role: "OWNER" | "SUPPLIER";
  avatarUrl?: string | null;
  profileImageUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt?: Date | null;
  isRead?: boolean;
  createdAt: Date;
}

export interface OwnerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  suburb?: string | null;
  city?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface SupplierProfile {
  id: string;
  userId: string;
  businessName: string;
  description?: string | null;
  phone?: string | null;
  suburb?: string | null;
  city?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  verified?: boolean;
}

export interface Dog {
  id: string;
  ownerId: string;
  name: string;
  breed?: string | null;
  age?: number | null;
  weight?: number | null;
  notes?: string | null;
  imageUrl?: string | null;
}

export interface Booking {
  id: string;
  ownerId: string;
  supplierId: string;
  dogId: string;
  serviceId: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  scheduledDate: Date;
  notes?: string | null;
  totalPrice?: number | null;
  createdAt: Date;
}

export interface SupplierService {
  id: string;
  supplierId: string;
  serviceType: string;
  name: string;
  description?: string | null;
  price: number;
  duration?: number | null;
}

export type Supplier = {
  userId: string;
  businessName: string;
  suburb: string | null;
  websiteUrl: string | null;
  services?: string[];
};

export type SupplierPage = {
  total: number;
  limit: number;
  offset: number;
  items: Supplier[];
};
