export type Supplier = {
  userId: string;
  businessName: string;
  suburb: string | null;
  websiteUrl: string | null;
  serviceTypes?: string[];
};

export type SupplierPage = {
  total: number;
  limit: number;
  offset: number;
  items: Supplier[];
};