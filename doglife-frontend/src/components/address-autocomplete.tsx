import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Navigation, Globe } from "lucide-react";
import { api } from "@/lib/api";

interface AddressDetails {
  formattedAddress: string;
  suburb: string;
  city: string;
  province: string;
  latitude: number | null;
  longitude: number | null;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, details?: AddressDetails) => void;
  onDetailsChange?: (details: AddressDetails) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  showNearMe?: boolean;
}

const southAfricanLocations = [
  "Sandton, Gauteng",
  "Johannesburg, Gauteng",
  "Cape Town, Western Cape",
  "Durban, KwaZulu-Natal",
  "Pretoria, Gauteng",
  "Bryanston, Gauteng",
  "Fourways, Gauteng",
  "Rosebank, Gauteng",
  "Randburg, Gauteng",
  "Midrand, Gauteng",
  "Centurion, Gauteng",
  "Stellenbosch, Western Cape",
  "Umhlanga, KwaZulu-Natal",
  "Port Elizabeth, Eastern Cape",
  "Bloemfontein, Free State"
];

export function AddressAutocomplete({
  value,
  onChange,
  onDetailsChange,
  placeholder = "Start typing your address...",
  className,
  disabled,
  id,
  showNearMe = false
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [inputValue, setInputValue] = useState(value);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [isNearMeLoading, setIsNearMeLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      if ((window as any).google?.maps?.places) {
        setIsGoogleLoaded(true);
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn("VITE_GOOGLE_MAPS_API_KEY not configured");
        return;
      }

      try {
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          const checkLoaded = setInterval(() => {
            if ((window as any).google?.maps?.places) {
              setIsGoogleLoaded(true);
              clearInterval(checkLoaded);
            }
          }, 100);
          return;
        }

        (window as any).initGoogleMapsCallback = () => {
          setIsGoogleLoaded(true);
        };

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsCallback`;
        script.async = true;
        script.defer = true;
        script.onerror = () => console.error("Failed to load Google Maps API");
        document.head.appendChild(script);
      } catch (error) {
        console.error("Error setting up Google Maps:", error);
      }
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!isGoogleLoaded || !inputRef.current) return;

    try {
      autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "za" },
          fields: ["address_components", "formatted_address", "geometry", "place_id"]
        }
      );

      const handlePlaceChanged = async () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.formatted_address) {
          setInputValue(place.formatted_address);
          
          const details = extractAddressDetails(place);
          onChange(place.formatted_address, details);
          onDetailsChange?.(details);
          
          if (!details.latitude || !details.longitude) {
            await geocodeAddress(place.formatted_address);
          }
        }
      };

      autocompleteRef.current.addListener("place_changed", handlePlaceChanged);

      return () => {
        if (autocompleteRef.current && (window as any).google?.maps?.event) {
          (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (error) {
      console.error("Error initializing Google Places:", error);
    }
  }, [isGoogleLoaded, onChange, onDetailsChange]);

  const extractAddressDetails = (place: any): AddressDetails => {
    let suburb = "";
    let city = "";
    let province = "";
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (place.geometry?.location) {
      latitude = place.geometry.location.lat();
      longitude = place.geometry.location.lng();
    }

    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes("sublocality") || types.includes("sublocality_level_1")) {
          suburb = component.long_name;
        }
        if (types.includes("locality")) {
          city = component.long_name;
          if (!suburb) suburb = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          province = component.long_name;
        }
      }
    }

    return {
      formattedAddress: place.formatted_address || "",
      suburb,
      city,
      province,
      latitude,
      longitude
    };
  };

  const geocodeAddress = async (address: string) => {
    setIsGeocodingLoading(true);
    try {
      const response = await api.post("/api/geo/geocode", { address });
      if (response.data?.ok && response.data?.data) {
        const geoData = response.data.data;
        const details: AddressDetails = {
          formattedAddress: geoData.formattedAddress || address,
          suburb: geoData.suburb || "",
          city: geoData.city || "",
          province: geoData.province || "",
          latitude: geoData.latitude,
          longitude: geoData.longitude
        };
        onDetailsChange?.(details);
        return details;
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsGeocodingLoading(false);
    }
    return null;
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
      
      const response = await api.post("/api/geo/reverse-geocode", { latitude, longitude });
      if (response.data?.ok && response.data?.data) {
        const geoData = response.data.data;
        const address = geoData.formattedAddress || `${latitude}, ${longitude}`;
        setInputValue(address);
        
        const details: AddressDetails = {
          formattedAddress: address,
          suburb: geoData.suburb || "",
          city: geoData.city || "",
          province: geoData.province || "",
          latitude,
          longitude
        };
        
        onChange(address, details);
        onDetailsChange?.(details);
      }
    } catch (error: any) {
      if (error.code === 1) {
        alert("Location access denied. Please enable location permissions.");
      } else {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please enter address manually.");
      }
    } finally {
      setIsNearMeLoading(false);
    }
  }, [onChange, onDetailsChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (!isGoogleLoaded && newValue.length > 2) {
      const filtered = southAfricanLocations.filter(loc =>
        loc.toLowerCase().includes(newValue.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    onChange(suggestion);
    await geocodeAddress(suggestion + ", South Africa");
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            id={id}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={() => !isGoogleLoaded && suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder}
            className={`pr-10 ${className || ""}`}
            disabled={disabled || isGeocodingLoading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isGeocodingLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : isGoogleLoaded ? (
              <Globe className="h-4 w-4 text-green-600" />
            ) : (
              <MapPin className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
        
        {showNearMe && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNearMe}
            disabled={isNearMeLoading || disabled}
            title="Use my current location"
          >
            {isNearMeLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm flex items-center"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <MapPin className="h-3 w-3 text-gray-400 mr-2 flex-shrink-0" />
              {suggestion}
            </div>
          ))}
        </div>
      )}

      {isGoogleLoaded && (
        <div className="text-xs text-green-600 mt-1 flex items-center">
          <Globe className="h-3 w-3 mr-1" />
          Google Maps enabled
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;
