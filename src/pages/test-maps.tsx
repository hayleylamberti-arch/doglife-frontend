import { useState } from "react";
import { HybridAddressInput } from "@/components/hybrid-address-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TestMaps() {
  const [address, setAddress] = useState("");
  const [placeDetails, setPlaceDetails] = useState<any>(null);

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Address Input Test</CardTitle>
          <Badge variant="default">
            Hybrid Google Maps + Local Suggestions
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <HybridAddressInput
              value={address}
              onChange={(newAddress, details) => {
                setAddress(newAddress);
                setPlaceDetails(details);
              }}
              placeholder="Start typing a South African address..."
            />
            <div className="text-sm text-gray-600">
              Selected: {address || "None"}
            </div>
            {placeDetails && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Place ID: {placeDetails.place_id}<br/>
                {placeDetails.geometry && (
                  <>
                    Lat: {placeDetails.geometry.location?.lat()}<br/>
                    Lng: {placeDetails.geometry.location?.lng()}
                  </>
                )}
              </div>
            )}
            <div className="text-xs text-gray-500">
              This component tries Google Maps first, then falls back to local South African location suggestions if needed.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}