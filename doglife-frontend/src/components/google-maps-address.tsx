import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface GoogleMapsAddressProps {
  value: string;
  onChange: (address: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function GoogleMapsAddress({ value, onChange, placeholder, className, disabled }: GoogleMapsAddressProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    // Load Google Maps script if not already loaded
    const loadGoogleMaps = async () => {
      if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
        setIsLoaded(true);
        return;
      }

      // Create a global callback function
      (window as any).initGoogleMaps = () => {
        setIsLoaded(true);
      };

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      console.log("✅ Google Maps API key loaded:", !!apiKey);

      // --- TEMPORARY TEST for iPad ---
      if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
        alert("⚠️ Google Maps API key NOT loaded — autocomplete disabled");
        console.warn('⚠️ Google Maps API key not configured. Address autocomplete disabled.');
        return;
      } else {
        alert("✅ Google Maps API key loaded successfully!");
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.onerror = () => {
        console.error('Failed to load Google Maps API. Please check your API key and ensure Places API is enabled.');
      };
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    try {
      // Check if PlaceAutocompleteElement is available (new API)
      if ((window as any).google?.maps?.places?.PlaceAutocompleteElement) {
        console.log('Using new PlaceAutocompleteElement');
        const autocompleteElement = new (window as any).google.maps.places.PlaceAutocompleteElement({
          locationRestriction: { country: ['ZA'] },
          types: ['address']
        });
        
        // Replace the input with the autocomplete element
        if (inputRef.current.parentNode) {
          inputRef.current.parentNode.replaceChild(autocompleteElement, inputRef.current);
          autocompleteRef.current = autocompleteElement;
        }
        
        autocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
          const place = event.place;
          if (place && place.formattedAddress) {
            onChange(place.formattedAddress, place);
            setInputValue(place.formattedAddress);
          }
        });
      } 
      // Fallback to legacy API if available
      else if ((window as any).google?.maps?.places?.Autocomplete) {
        console.log('Using legacy Autocomplete');
        autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'ZA' },
          fields: ['address_components', 'formatted_address', 'geometry', 'name']
        });

        const handlePlaceSelect = () => {
          const place = autocompleteRef.current?.getPlace();
          if (place && place.formatted_address) {
            onChange(place.formatted_address, place);
            setInputValue(place.formatted_address);
          }
        };

        autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
      }

      return () => {
        if (autocompleteRef.current && (window as any).google?.maps?.event) {
          (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      console.warn('Places API initialization failed. The autocomplete will fall back to regular text input.');
    }
  }, [isLoaded, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder || "Start typing your South African address..."}
        className={`pr-10 ${className}`}
        disabled={disabled}
      />
      <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
          <span className="text-sm text-gray-500">Loading maps...</span>
        </div>
      )}
    </div>
  );
}