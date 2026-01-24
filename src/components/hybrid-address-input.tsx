import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Globe } from "lucide-react";

interface HybridAddressInputProps {
  value: string;
  onChange: (address: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// South African locations for fallback
const southAfricanLocations = [
  "Cape Town, Western Cape, South Africa",
  "Johannesburg, Gauteng, South Africa",
  "Durban, KwaZulu-Natal, South Africa",
  "Pretoria, Gauteng, South Africa",
  "Port Elizabeth, Eastern Cape, South Africa",
  "Bloemfontein, Free State, South Africa",
  "Sandton, Gauteng, South Africa",
  "Centurion, Gauteng, South Africa",
  "Stellenbosch, Western Cape, South Africa",
  "Paarl, Western Cape, South Africa",
  "Midrand, Gauteng, South Africa",
  "Roodepoort, Gauteng, South Africa",
  "Randburg, Gauteng, South Africa",
  "Somerset West, Western Cape, South Africa",
  "Bellville, Western Cape, South Africa",
  "Brackenfell, Western Cape, South Africa",
  "Rosebank, Gauteng, South Africa",
  "Green Point, Western Cape, South Africa",
  "Sea Point, Western Cape, South Africa",
  "Camps Bay, Western Cape, South Africa",
  "Claremont, Western Cape, South Africa",
  "Constantia, Western Cape, South Africa",
  "Newlands, Western Cape, South Africa",
  "Observatory, Western Cape, South Africa",
  "Woodstock, Western Cape, South Africa",
  "Salt River, Western Cape, South Africa",
  "Vredehoek, Western Cape, South Africa",
  "Gardens, Western Cape, South Africa",
  "Bo-Kaap, Western Cape, South Africa",
  "Waterfront, Western Cape, South Africa"
];

export function HybridAddressInput({ value, onChange, placeholder, className, disabled }: HybridAddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [inputValue, setInputValue] = useState(value);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [usingGoogleMaps, setUsingGoogleMaps] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Initialize Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      if ((window as any).google?.maps?.places) {
        setIsGoogleMapsLoaded(true);
        setUsingGoogleMaps(true);
        console.log('Google Maps API loaded successfully');
        return;
      }

      // Try to load Google Maps API
      try {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          setIsGoogleMapsLoaded(true);
          setUsingGoogleMaps(true);
          console.log('Google Maps API loaded successfully');
        };
        
        script.onerror = () => {
          console.warn('Failed to load Google Maps API, using local suggestions');
          setUsingGoogleMaps(false);
          setIsGoogleMapsLoaded(false);
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.warn('Error loading Google Maps API, using local suggestions');
        setUsingGoogleMaps(false);
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize Google Maps autocomplete when loaded
  useEffect(() => {
    if (!isGoogleMapsLoaded || !inputRef.current || !usingGoogleMaps) return;

    try {
      autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'za' },
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id']
      });

      const handlePlaceChanged = () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.formatted_address) {
          setInputValue(place.formatted_address);
          onChange(place.formatted_address, place);
          setShowSuggestions(false);
        }
      };

      autocompleteRef.current.addListener('place_changed', handlePlaceChanged);

      return () => {
        if (autocompleteRef.current && (window as any).google?.maps?.event) {
          (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (error) {
      console.warn('Google Maps autocomplete failed, falling back to local suggestions:', error);
      setUsingGoogleMaps(false);
      setIsGoogleMapsLoaded(false);
    }
  }, [isGoogleMapsLoaded, usingGoogleMaps, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    // Only show local suggestions if Google Maps is not available
    if (!usingGoogleMaps && newValue.length > 2) {
      const filtered = southAfricanLocations.filter(location =>
        location.toLowerCase().includes(newValue.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else if (!usingGoogleMaps) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={() => !usingGoogleMaps && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder || "Start typing your South African address..."}
        className={`pr-16 ${className}`}
        disabled={disabled}
      />
      <div className="absolute right-3 top-3 flex items-center space-x-1">
        {usingGoogleMaps ? (
          <Globe className="h-4 w-4 text-green-600" />
        ) : (
          <MapPin className="h-4 w-4 text-gray-400" />
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center">
                <MapPin className="h-3 w-3 text-gray-400 mr-2" />
                {suggestion}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs mt-1">
        {usingGoogleMaps ? (
          <span className="text-green-600 flex items-center">
            <Globe className="h-3 w-3 mr-1" />
            Enhanced location accuracy with Google Maps
          </span>
        ) : (
          <span className="text-blue-600 flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            South African location suggestions
          </span>
        )}
      </div>
    </div>
  );
}