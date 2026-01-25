import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Testing phase: Limited to Johannesburg and Sandton area suggestions
const southAfricanLocations = [
  "Johannesburg, Gauteng, South Africa",
  "Sandton, Gauteng, South Africa",
  "Rosebank, Gauteng, South Africa",
  "Fourways, Gauteng, South Africa",
  "Randburg, Gauteng, South Africa",
  "Bryanston, Gauteng, South Africa",
  "Hyde Park, Gauteng, South Africa",
  "Melrose, Gauteng, South Africa",
  "Morningside, Gauteng, South Africa",
  "Parkhurst, Gauteng, South Africa",
  "Northcliff, Gauteng, South Africa",
  "Craighall, Gauteng, South Africa",
  "Greenside, Gauteng, South Africa",
  "Emmarentia, Gauteng, South Africa",
  "Linden, Gauteng, South Africa",
  "Rivonia, Gauteng, South Africa",
  "Sunninghill, Gauteng, South Africa",
  "Woodmead, Gauteng, South Africa",
  "Paulshof, Gauteng, South Africa",
  "Lone Hill, Gauteng, South Africa",
  "Dainfern, Gauteng, South Africa",
  "Ferndale, Gauteng, South Africa",
  "Illovo, Gauteng, South Africa",
  "Benmore, Gauteng, South Africa",
  "Wendywood, Gauteng, South Africa",
  "Douglasdale, Gauteng, South Africa",
  "Gallo Manor, Gauteng, South Africa",
  "Hurlingham, Gauteng, South Africa",
  "Morningside Manor, Gauteng, South Africa",
  "Bryanston East, Gauteng, South Africa"
];

export function AddressInput({ value, onChange, placeholder, className, disabled }: AddressInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    // Filter suggestions based on input
    if (newValue.length > 2) {
      const filtered = southAfricanLocations.filter(location =>
        location.toLowerCase().includes(newValue.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
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
    // Delay hiding suggestions to allow clicking
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder || "Start typing your South African address..."}
        className={`pr-10 ${className}`}
        disabled={disabled}
      />
      <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
      
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
    </div>
  );
}