import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const mockServices = [
    { id: 1, name: "Happy Paws Grooming", description: "Professional dog grooming in Sandton." },
    { id: 2, name: "Midrand Dog Walkers", description: "Daily dog walking service for busy owners." },
    { id: 3, name: "Pretoria Puppy Training", description: "Positive reinforcement puppy training." },
  ];

  const filteredServices = mockServices.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-bold mb-6">
          Find Dog Services Near You
        </h1>

        <Card className="mb-8">
          <CardContent className="p-6 flex gap-4">
            <Input
              placeholder="Search for dog walkers, groomers, trainers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button>Search</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredServices.map(service => (
          <Card key={service.id} className="hover:shadow-lg transition">
  <CardContent className="p-6 space-y-3">

    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">{service.name}</h3>
      <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
        Verified
      </span>
    </div>

    <p className="text-sm text-gray-600">
      {service.description}
    </p>

    <div className="flex justify-between items-center pt-2">
      <span className="text-yellow-500">★★★★★</span>

      <Button size="sm">
        View Provider
      </Button>
    </div>

  </CardContent>
</Card>  
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No services found.
          </div>
        )}

      </div>
    </div>
  );
}