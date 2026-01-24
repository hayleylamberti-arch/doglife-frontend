import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Navbar from "@/components/navbar";
import ProviderCard from "@/components/provider-card";
import { Search, MapPin, Filter, Star, Shield, Users, Award, Clock, AlertCircle } from "lucide-react";
import { HybridAddressInput } from "@/components/hybrid-address-input";
import { useAuth } from "@/hooks/use-auth";

export default function ProvidersDirectory() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Block access for providers - redirect to dashboard
  useEffect(() => {
    if (user?.userType === 'provider') {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const [filters, setFilters] = useState({
    suburb: "",
    serviceType: "",
    verified: undefined as boolean | undefined,
    sortBy: "rating",
    limit: 20,
    offset: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const { data: providersResponse, isLoading } = useQuery({
    queryKey: ["/api/public/suppliers", filters, searchTerm],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== false) {
          if (key === 'suburb') params.append('suburb', value.toString());
          if (key === 'service') params.append('service', value.toString());
          if (key === 'limit') params.append('limit', value.toString());
        }
      });
      if (searchTerm) params.append("search", searchTerm);
      return fetch(`/api/public/suppliers?${params}`).then(res => res.json());
    },
  });

  // Map Zoho supplier data to provider format for compatibility
  const providers = (providersResponse?.suppliers || []).map((supplier: any) => ({
    id: supplier.id || 'unknown',
    businessName: supplier.businessName || 'Unnamed Business',
    description: supplier.description || '',
    rating: supplier.rating?.toString() || '0',
    totalReviews: supplier.reviewCount || 0,
    coveredSuburbs: supplier.operatingSuburbs || [],
    isVerified: supplier.verified || false,
    user: {
      profileImageUrl: null,
      firstName: supplier.contactInfo?.firstName || 'Unknown',
      lastName: supplier.contactInfo?.lastName || 'Provider'
    },
    services: supplier.services?.map((serviceName: string, index: number) => {
      const rate = supplier.rates?.find((r: any) => r.service === serviceName);
      return {
        id: `${supplier.id}-${index}`,
        name: serviceName,
        description: `${serviceName} service`,
        price: rate?.price || 0,
        durationMinutes: 60,
        categoryName: serviceName.includes('Grooming') ? 'Grooming' : 
                     serviceName.includes('Boarding') ? 'Boarding' : 
                     serviceName.includes('Training') ? 'Training' : 'Other'
      };
    }) || []
  }));

  const { data: serviceCategories } = useQuery({
    queryKey: ["/api/service-categories"],
  });

  const handleFilterChange = (key: string, value: string | boolean) => {
    const processedValue = typeof value === "string" && value === "all" ? "" : value;
    setFilters(prev => ({
      ...prev,
      [key]: processedValue,
      offset: 0, // Reset pagination when filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      suburb: "",
      serviceType: "",
      verified: undefined,
      sortBy: "rating",
      limit: 20,
      offset: 0,
    });
    setSearchTerm("");
  };

  // Quick stats for the directory
  const totalProviders = providers?.length || 0;
  const verifiedProviders = providers?.filter((p: any) => p.isVerified).length || 0;
  const averageRating = providers?.length 
    ? (providers.reduce((sum: number, p: any) => sum + parseFloat(p.rating || 0), 0) / providers.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-doglife-dark mb-4">
            Service Provider Directory
          </h1>
          <p className="text-lg text-doglife-neutral max-w-2xl mx-auto">
            Connect with South Africa's most trusted dog service professionals
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-center">
                <Users className="h-6 w-6 text-doglife-primary mr-2" />
                <div>
                  <div className="text-2xl font-bold text-doglife-dark">{totalProviders}</div>
                  <div className="text-sm text-doglife-neutral">Total Providers</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600 mr-2" />
                <div>
                  <div className="text-2xl font-bold text-doglife-dark">{verifiedProviders}</div>
                  <div className="text-sm text-doglife-neutral">Verified</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-500 mr-2" />
                <div>
                  <div className="text-2xl font-bold text-doglife-dark">{averageRating}</div>
                  <div className="text-sm text-doglife-neutral">Avg Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-doglife-neutral" />
              <Input
                placeholder="Search providers by name, business, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 text-lg h-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-doglife-dark mb-2">Location</label>
                <HybridAddressInput
                  value={filters.suburb}
                  onChange={(address) => handleFilterChange("suburb", address)}
                  placeholder="Enter suburb or address"
                />
              </div>

              {/* Service Type Filter */}
              <div>
                <label className="block text-sm font-medium text-doglife-dark mb-2">Service Type</label>
                <Select value={filters.serviceType} onValueChange={(value) => handleFilterChange("serviceType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All services</SelectItem>
                    {serviceCategories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-doglife-dark mb-2">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="alphabetical">A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Verified Filter */}
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="verified-filter"
                  checked={filters.verified}
                  onCheckedChange={(checked) => handleFilterChange("verified", checked as boolean)}
                />
                <label htmlFor="verified-filter" className="flex items-center text-sm font-medium text-doglife-dark">
                  <Shield className="h-4 w-4 mr-1 text-green-600" />
                  Verified only
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6">
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear All Filters
              </Button>
              <Badge variant="secondary" className="text-sm">
                {totalProviders} providers found
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Provider Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : providers && providers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider: any) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
            
            {/* Load More Button */}
            {providers.length >= filters.limit && (
              <div className="text-center mt-8">
                <Button 
                  onClick={() => handleFilterChange("limit", filters.limit + 20)}
                  variant="outline"
                  size="lg"
                >
                  Load More Providers
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-doglife-neutral mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-doglife-dark mb-2">No providers found</h3>
              <p className="text-doglife-neutral mb-4">
                Try adjusting your search criteria or location
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Call to Action for Providers */}
        <Card className="mt-12 bg-gradient-to-r from-doglife-primary to-blue-600 text-white">
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Join Our Provider Network</h3>
            <p className="text-lg mb-6 opacity-90">
              Connect with dog owners across South Africa and grow your business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-doglife-primary"
                onClick={() => navigate("/profile")}
              >
                Become a Provider
              </Button>
              <div className="flex items-center text-sm opacity-75">
                <Clock className="h-4 w-4 mr-1" />
                Setup takes less than 5 minutes
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}