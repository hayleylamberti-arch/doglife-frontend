import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import Navbar from "@/components/navbar";
import ServiceCard from "@/components/service-card";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Search, MapPin, Filter, Star, Clock, Shield, Award, Navigation, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { reverseGeocode } from "@/lib/api";

export default function SearchPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isProviderView = location.pathname === '/find-clients';
  const isProvider = user?.userType === 'provider';
  
  const [searchFilters, setSearchFilters] = useState({
    categoryId: "",
    suburb: "",
    priceMin: "",
    priceMax: "",
    verifiedOnly: false,
    sortBy: "rating",
    limit: 20,
    offset: 0,
    lat: "",
    lng: "",
    radius: "25",
  });

  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNearMeLoading, setIsNearMeLoading] = useState(false);
  const [locationAddress, setLocationAddress] = useState("");

  const { data: serviceCategories } = useQuery({
    queryKey: ["/api/service-categories"],
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["/api/services/search", searchFilters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      return fetch(`/api/services/search?${params}`).then(res => res.json());
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [key]: value === "all" ? "" : value,
      offset: 0, // Reset pagination when filters change
    }));
  };

  const clearFilters = () => {
    setSearchFilters({
      categoryId: "",
      suburb: "",
      priceMin: "",
      priceMax: "",
      verifiedOnly: false,
      sortBy: "rating",
      limit: 20,
      offset: 0,
      lat: "",
      lng: "",
      radius: "25",
    });
    setPriceRange([0, 1000]);
    setSearchTerm("");
    setLocationAddress("");
  };

  const handleNearMe = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsNearMeLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      
      const geoData = await reverseGeocode(latitude, longitude);
      if (geoData) {
        setLocationAddress(geoData.formattedAddress);
        setSearchFilters(prev => ({
          ...prev,
          lat: latitude.toString(),
          lng: longitude.toString(),
          suburb: geoData.suburb || geoData.city || "",
          offset: 0,
        }));
      } else {
        setSearchFilters(prev => ({
          ...prev,
          lat: latitude.toString(),
          lng: longitude.toString(),
          offset: 0,
        }));
      }
    } catch (error: any) {
      if (error.code === 1) {
        alert("Location access denied. Please enable location permissions.");
      } else {
        alert("Unable to get your location. Please enter address manually.");
      }
    } finally {
      setIsNearMeLoading(false);
    }
  }, []);

  // Update price filters when range changes
  useEffect(() => {
    setSearchFilters(prev => ({
      ...prev,
      priceMin: priceRange[0].toString(),
      priceMax: priceRange[1].toString(),
    }));
  }, [priceRange]);

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-doglife-dark mb-2">
            {isProviderView || isProvider ? "Find Clients" : "Find Dog Services"}
          </h1>
          <p className="text-doglife-neutral">
            {isProviderView || isProvider 
              ? "Connect with potential clients looking for your services" 
              : "Discover trusted service providers in your area"
            }
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-doglife-neutral" />
              <Input
                placeholder={isProviderView || isProvider 
                  ? "Search for clients, service types, or areas..." 
                  : "Search for services, providers, or areas..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 text-lg h-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters & Sort
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Service Category */}
              <div>
                <label className="block text-sm font-medium text-doglife-dark mb-2">Service Type</label>
                <Select value={searchFilters.categoryId} onValueChange={(value) => handleFilterChange("categoryId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All services</SelectItem>
                    {serviceCategories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-doglife-dark mb-2">Location</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <AddressAutocomplete
                      value={locationAddress}
                      onChange={(address, details) => {
                        setLocationAddress(address);
                        if (details) {
                          setSearchFilters(prev => ({
                            ...prev,
                            suburb: details.suburb || details.city || "",
                            lat: details.latitude?.toString() || "",
                            lng: details.longitude?.toString() || "",
                            offset: 0,
                          }));
                        }
                      }}
                      placeholder="Enter suburb or address"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleNearMe}
                    disabled={isNearMeLoading}
                    title="Use my current location"
                    className="flex-shrink-0"
                  >
                    {isNearMeLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {searchFilters.lat && searchFilters.lng && (
                  <div className="text-xs text-green-600 mt-1 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    Searching within {searchFilters.radius}km radius
                  </div>
                )}
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-doglife-dark mb-2">Sort By</label>
                <Select value={searchFilters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Verified Filter */}
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="verified"
                  checked={searchFilters.verifiedOnly}
                  onCheckedChange={(checked) => handleFilterChange("verifiedOnly", checked.toString())}
                />
                <label htmlFor="verified" className="flex items-center text-sm font-medium text-doglife-dark">
                  <Shield className="h-4 w-4 mr-1 text-green-600" />
                  Verified only
                </label>
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-doglife-dark mb-4">
                Price Range: R{priceRange[0]} - R{priceRange[1]}
              </label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={1000}
                min={0}
                step={10}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6">
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear All Filters
              </Button>
              <Badge variant="secondary" className="text-sm">
                {services?.length || 0} services found
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Active Filters */}
        {(searchFilters.categoryId || searchFilters.suburb || searchFilters.priceMin || searchFilters.priceMax) && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-doglife-neutral">Active filters:</span>
              <Button onClick={clearFilters} variant="ghost" size="sm" className="text-doglife-primary">
                Clear all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchFilters.categoryId && (
                <Badge variant="secondary" className="flex items-center">
                  Service: {serviceCategories?.find((c: any) => c.id.toString() === searchFilters.categoryId)?.name}
                </Badge>
              )}
              {searchFilters.suburb && (
                <Badge variant="secondary" className="flex items-center">
                  Location: {searchFilters.suburb}
                </Badge>
              )}
              {searchFilters.priceMin && (
                <Badge variant="secondary" className="flex items-center">
                  Min: R{searchFilters.priceMin}
                </Badge>
              )}
              {searchFilters.priceMax && (
                <Badge variant="secondary" className="flex items-center">
                  Max: R{searchFilters.priceMax}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-doglife-dark mb-4">
            {isLoading ? "Searching..." : isProviderView || isProvider 
              ? `${services?.length || 0} client opportunities found`
              : `${services?.length || 0} services found`
            }
          </h2>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: any) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-12 w-12 mx-auto mb-4 text-doglife-neutral opacity-50" />
              <h3 className="text-lg font-semibold text-doglife-dark mb-2">
                {isProviderView || isProvider ? "No client opportunities found" : "No services found"}
              </h3>
              <p className="text-doglife-neutral mb-4">
                {isProviderView || isProvider 
                  ? "Try adjusting your search criteria or explore different service types and areas"
                  : "Try adjusting your search criteria or explore different areas"
                }
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear filters and try again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Load More */}
        {services && services.length >= searchFilters.limit && (
          <div className="text-center mt-8">
            <Button
              onClick={() => setSearchFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
              variant="outline"
              size="lg"
            >
              Load More Services
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
