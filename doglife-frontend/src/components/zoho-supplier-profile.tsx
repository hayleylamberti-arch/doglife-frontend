import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Building, User, MapPin, Phone, Mail, Star, Briefcase } from 'lucide-react';

interface ZohoSupplierData {
  id: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName?: string;
  businessType?: string;
  services?: string[];
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  description?: string;
  experience?: string;
  certifications?: string[];
  availability?: object;
  pricing?: object;
}

export function ZohoSupplierProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch supplier profile from Zoho
  const { data: supplierData, isLoading, error } = useQuery<ZohoSupplierData>({
    queryKey: ['/api/supplier/profile'],
    queryFn: async () => {
      const res = await apiRequest('/api/supplier/profile');
      return await res.json();
    },
  });

  // Update supplier profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: Partial<ZohoSupplierData>) => {
      const res = await apiRequest('/api/supplier/profile', {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      });
      return await res.json();
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier/profile'] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your supplier profile has been updated successfully in Zoho CRM.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update supplier profile.",
        variant: "destructive",
      });
    },
  });

  const [formData, setFormData] = useState<Partial<ZohoSupplierData>>({});

  React.useEffect(() => {
    if (supplierData && !isEditing) {
      setFormData(supplierData);
    }
  }, [supplierData, isEditing]);

  const handleInputChange = (field: keyof ZohoSupplierData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData(supplierData || {});
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading supplier profile from Zoho...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Profile</CardTitle>
          <CardDescription>
            Failed to load supplier profile from Zoho CRM. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/supplier/profile'] })}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Supplier Profile</h2>
          <p className="text-muted-foreground">
            {supplierData?.id ? 'Manage your profile synced with Zoho CRM' : 'Create your supplier profile in Zoho CRM'}
          </p>
        </div>
        
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            {supplierData?.id ? 'Edit Profile' : 'Create Profile'}
          </Button>
        )}
      </div>

      {supplierData?.id && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-700 font-medium">
              Connected to Zoho CRM (ID: {supplierData.id})
            </span>
          </div>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Business Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName || ''}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Input
                    id="businessType"
                    value={formData.businessType || ''}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    placeholder="e.g., Individual, LLC, Corporation"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your business and services..."
                />
              </div>

              <div>
                <Label htmlFor="services">Services Offered (comma-separated)</Label>
                <Input
                  id="services"
                  value={formData.services?.join(', ') || ''}
                  onChange={(e) => handleInputChange('services', e.target.value.split(',').map(s => s.trim()))}
                  placeholder="e.g., Dog Walking, Pet Sitting, Grooming"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  value={formData.province || ''}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode || ''}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Professional Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  value={formData.experience || ''}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  placeholder="e.g., 5"
                />
              </div>
              
              <div>
                <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                <Input
                  id="certifications"
                  value={formData.certifications?.join(', ') || ''}
                  onChange={(e) => handleInputChange('certifications', e.target.value.split(',').map(s => s.trim()))}
                  placeholder="e.g., Pet First Aid, Dog Training Certificate"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-4">
            <Button 
              type="submit" 
              disabled={updateProfileMutation.isPending}
              className="flex-1"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Profile Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="font-medium">{supplierData?.firstName} {supplierData?.lastName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="font-medium flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {supplierData?.email}
                </p>
              </div>
              {supplierData?.phone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="font-medium flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {supplierData.phone}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {(supplierData?.businessName || supplierData?.businessType || supplierData?.description) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Business Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplierData?.businessName && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Business Name</Label>
                    <p className="font-medium">{supplierData.businessName}</p>
                  </div>
                )}
                {supplierData?.businessType && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Business Type</Label>
                    <p className="font-medium">{supplierData.businessType}</p>
                  </div>
                )}
                {supplierData?.description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p>{supplierData.description}</p>
                  </div>
                )}
                {supplierData?.services && supplierData.services.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Services</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {supplierData.services.map((service, index) => (
                        <Badge key={index} variant="secondary">{service}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(supplierData?.address || supplierData?.city) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Location</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{supplierData?.address}</p>
                <p>{supplierData?.city}, {supplierData?.province} {supplierData?.postalCode}</p>
              </CardContent>
            </Card>
          )}

          {(supplierData?.experience || (supplierData?.certifications && supplierData.certifications.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>Professional Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplierData?.experience && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Experience</Label>
                    <p className="font-medium">{supplierData.experience} years</p>
                  </div>
                )}
                {supplierData?.certifications && supplierData.certifications.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Certifications</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {supplierData.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}