import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface GoogleMapsAutocompleteProps {
  value: string;
  onChange: (address: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function GoogleMapsAutocomplete({ value, onChange, placeholder, className, disabled, id }: GoogleMapsAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isApiAvailable, setIsApiAvailable] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      // Check if Google Maps is already loaded
      if ((window as any).google?.maps?.places) {
        setIsLoaded(true);
        setIsApiAvailable(true);
        return;
      }

      // Get API key from environment - ONLY use browser key from Replit Secrets
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;
      if (!apiKey || apiKey === 'undefined') {
        console.warn('GOOGLE_MAPS_BROWSER_KEY not configured - Maps functionality disabled');
        setIsApiAvailable(false);
        return;
      }
      console.log('Google Maps Browser API Key loaded successfully');

      try {
        // Create callback function
        (window as any).initGoogleMapsAutocomplete = () => {
          setIsLoaded(true);
          setIsApiAvailable(true);
        };

        // Load Google Maps script with Places library
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsAutocomplete&loading=async`;
        script.async = true;
        script.defer = true;
        
        script.onerror = () => {
          console.error('Failed to load Google Maps API');
          setIsApiAvailable(false);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('Error setting up Google Maps:', error);
        setIsApiAvailable(false);
      }
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !isApiAvailable) return;

    try {
      // Initialize autocomplete with new Places API
      autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'za' }, // South Africa
        fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id']
      });

      // Handle place selection
      const handlePlaceChanged = () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.formatted_address) {
          setInputValue(place.formatted_address);
          
          // Log place details to console for testing
          console.log('🏠 Google Maps Place Selected:', {
            formatted_address: place.formatted_address,
            name: place.name,
            place_id: place.place_id,
            geometry: place.geometry,
            address_components: place.address_components
          });
          
          onChange(place.formatted_address, place);
        }
      };

      autocompleteRef.current.addListener('place_changed', handlePlaceChanged);

      return () => {
        if (autocompleteRef.current && (window as any).google?.maps?.event) {
          (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      setIsApiAvailable(false);
    }
  }, [isLoaded, isApiAvailable, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder || "Start typing your South African address..."}
        className={`pr-10 ${className}`}
        disabled={disabled}
      />
      <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
      
      {!isApiAvailable && (
        <div className="text-xs text-orange-600 mt-1">
          Google Maps not available - using basic text input
        </div>
      )}
      
      {isApiAvailable && !isLoaded && (
        <div className="text-xs text-blue-600 mt-1">
          Loading Google Maps...
        </div>
      )}
    </div>
  );
}