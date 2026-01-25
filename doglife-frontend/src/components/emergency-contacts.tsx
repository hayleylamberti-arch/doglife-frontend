import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Clock, Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  address: string;
  serviceType: string;
  distance?: string;
  isOpen: boolean;
  hours: string;
};

export default function EmergencyContacts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    serviceType: "Vet",
    hours: "24/7"
  });

  // Default emergency contacts for Johannesburg area
  const defaultContacts: EmergencyContact[] = [
    {
      id: "1",
      name: "Johannesburg Emergency Vet",
      phone: "011-888-8888",
      address: "123 Emergency St, Johannesburg",
      serviceType: "Emergency Vet",
      distance: "2.5km",
      isOpen: true,
      hours: "24/7"
    },
    {
      id: "2", 
      name: "Sandton Animal Hospital",
      phone: "011-555-1234",
      address: "456 Sandton Drive, Sandton",
      serviceType: "Vet Hospital",
      distance: "3.2km",
      isOpen: true,
      hours: "07:00 - 19:00"
    },
    {
      id: "3",
      name: "24Hr Pet Emergency",
      phone: "011-999-2424",
      address: "789 Rosebank Ave, Rosebank",
      serviceType: "Emergency Care",
      distance: "4.1km",
      isOpen: true,
      hours: "24/7"
    }
  ];

  // Query for user's custom emergency contacts
  const { data: customContacts = [], isLoading } = useQuery({
    queryKey: ["/api/emergency-contacts"],
    queryFn: async () => {
      if (!user) return [];
      const response = await apiRequest("/api/emergency-contacts");
      if (response.status === 404) return [];
      return await response.json();
    },
    enabled: !!user
  });

  // All contacts (default + custom)
  const allContacts = [...defaultContacts, ...customContacts];

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contactData: Omit<EmergencyContact, 'id' | 'isOpen' | 'distance'>) => {
      const response = await apiRequest("/api/emergency-contacts", {
        method: "POST",
        body: JSON.stringify(contactData)
      });
      if (!response.ok) throw new Error("Failed to add contact");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      setShowAddDialog(false);
      resetForm();
      toast({
        title: "Emergency contact added",
        description: "Your custom emergency contact has been saved."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add emergency contact. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await apiRequest(`/api/emergency-contacts/${contactId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete contact");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      toast({
        title: "Contact deleted",
        description: "Emergency contact has been removed."
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      address: "",
      serviceType: "Vet",
      hours: "24/7"
    });
    setEditingContact(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addContactMutation.mutate(formData);
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleDirections = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  // Check if user has DogLife+ subscription
  const hasPremium = user?.subscriptionType === 'owner_plus';

  if (!hasPremium) {
    return (
      <Card className="border-orange-200">
        <CardHeader className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <CardTitle className="text-xl text-doglife-dark">Emergency Contacts</CardTitle>
          <CardDescription>
            Access emergency vet contacts and 24/7 pet services in your area
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2">DogLife+ Feature</h4>
            <p className="text-orange-700 text-sm mb-4">
              Get instant access to emergency vet contacts, 24/7 pet services, and save your own custom emergency contacts.
            </p>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => window.location.href = '/subscription'}
            >
              Upgrade to DogLife+ - R29/month
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 text-red-500 mr-2" />
                Emergency Contacts
              </CardTitle>
              <CardDescription>
                Quick access to emergency vets and 24/7 pet services in Johannesburg & Sandton
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {allContacts.map((contact) => (
              <Card key={contact.id} className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-doglife-dark">{contact.name}</h4>
                        <Badge variant={contact.isOpen ? "default" : "secondary"} className="text-xs">
                          {contact.isOpen ? "Open" : "Closed"}
                        </Badge>
                        {contact.serviceType && (
                          <Badge variant="outline" className="text-xs">
                            {contact.serviceType}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-doglife-neutral">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{contact.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{contact.address}</span>
                          {contact.distance && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {contact.distance}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{contact.hours}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button 
                        size="sm" 
                        onClick={() => handleCall(contact.phone)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDirections(contact.address)}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        Directions
                      </Button>
                      {!defaultContacts.find(dc => dc.id === contact.id) && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteContactMutation.mutate(contact.id)}
                          disabled={deleteContactMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
            <DialogDescription>
              Add a custom emergency contact for quick access during pet emergencies.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Contact Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., My Local Vet"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g., 011-123-4567"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="e.g., 123 Main St, Johannesburg"
              />
            </div>
            
            <div>
              <Label htmlFor="serviceType">Service Type</Label>
              <select 
                id="serviceType"
                value={formData.serviceType}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Vet">Veterinarian</option>
                <option value="Emergency Vet">Emergency Vet</option>
                <option value="Animal Hospital">Animal Hospital</option>
                <option value="Pet Emergency">Pet Emergency Service</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="hours">Operating Hours</Label>
              <Input
                id="hours"
                value={formData.hours}
                onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                placeholder="e.g., 24/7 or Mon-Fri 8:00-17:00"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addContactMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {addContactMutation.isPending ? "Adding..." : "Add Contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}