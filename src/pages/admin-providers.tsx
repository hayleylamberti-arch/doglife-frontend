import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, User, Building, Phone, Mail, MapPin, Star } from "lucide-react";

interface Provider {
  id: number;
  userId: string;
  businessName: string;
  description: string;
  providerType: string;
  suburb: string;
  businessAddress: string;
  businessPhone: string;
  servicesOffered: string[];
  coveredSuburbs: string[];
  qualifications: string[];
  isVerified: boolean;
  isBackgroundChecked: boolean;
  rating: string;
  totalReviews: number;
  maxDogCapacity: number;
  createdAt: string;
  updatedAt: string;
  // User details
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export default function AdminProviders() {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: providers = [], isLoading, refetch } = useQuery<Provider[]>({
    queryKey: ["/api/admin/providers"],
  });

  const filteredProviders = providers.filter(provider => 
    provider.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.suburb?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const verifiedProviders = filteredProviders.filter(p => p.isVerified);
  const unverifiedProviders = filteredProviders.filter(p => !p.isVerified);
  const backgroundCheckedProviders = filteredProviders.filter(p => p.isBackgroundChecked);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading providers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Provider Management</h1>
        <Button onClick={() => refetch()}>Refresh Data</Button>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <Label htmlFor="search">Search Providers:</Label>
        <Input
          id="search"
          placeholder="Search by name, email, business, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{providers.length}</div>
            <div className="text-sm text-gray-600">Total Providers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{verifiedProviders.length}</div>
            <div className="text-sm text-gray-600">Verified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{unverifiedProviders.length}</div>
            <div className="text-sm text-gray-600">Pending Verification</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{backgroundCheckedProviders.length}</div>
            <div className="text-sm text-gray-600">Background Checked</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Providers ({filteredProviders.length})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({verifiedProviders.length})</TabsTrigger>
          <TabsTrigger value="unverified">Unverified ({unverifiedProviders.length})</TabsTrigger>
          <TabsTrigger value="background-checked">Background Checked ({backgroundCheckedProviders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ProviderList providers={filteredProviders} onSelectProvider={setSelectedProvider} />
        </TabsContent>
        
        <TabsContent value="verified">
          <ProviderList providers={verifiedProviders} onSelectProvider={setSelectedProvider} />
        </TabsContent>
        
        <TabsContent value="unverified">
          <ProviderList providers={unverifiedProviders} onSelectProvider={setSelectedProvider} />
        </TabsContent>
        
        <TabsContent value="background-checked">
          <ProviderList providers={backgroundCheckedProviders} onSelectProvider={setSelectedProvider} />
        </TabsContent>
      </Tabs>

      {/* Provider Detail Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedProvider.businessName}</h2>
                <Button variant="outline" onClick={() => setSelectedProvider(null)}>
                  Close
                </Button>
              </div>
              
              <ProviderDetail provider={selectedProvider} onClose={() => setSelectedProvider(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderList({ 
  providers, 
  onSelectProvider 
}: { 
  providers: Provider[]; 
  onSelectProvider: (provider: Provider) => void;
}) {
  if (providers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">No providers found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {providers.map((provider) => (
        <Card key={provider.id} className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{provider.businessName}</CardTitle>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  {provider.providerType === 'business' ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  {provider.firstName} {provider.lastName}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {provider.isVerified && <Badge variant="default" className="text-xs"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>}
                {provider.isBackgroundChecked && <Badge variant="secondary" className="text-xs">Background Checked</Badge>}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0" onClick={() => onSelectProvider(provider)}>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{provider.email}</span>
              </div>
              
              {provider.businessPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{provider.businessPhone}</span>
                </div>
              )}
              
              {provider.suburb && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{provider.suburb}</span>
                </div>
              )}
              
              {provider.servicesOffered?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {provider.servicesOffered.slice(0, 3).map((service, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                  {provider.servicesOffered.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{provider.servicesOffered.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{provider.rating} ({provider.totalReviews} reviews)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProviderDetail({ provider, onClose }: { provider: Provider; onClose: () => void }) {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Business Name</Label>
              <Input value={provider.businessName || ''} readOnly />
            </div>
            <div>
              <Label>Provider Type</Label>
              <Input value={provider.providerType || ''} readOnly />
            </div>
            <div>
              <Label>First Name</Label>
              <Input value={provider.firstName || ''} readOnly />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={provider.lastName || ''} readOnly />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={provider.email || ''} readOnly />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input value={provider.phoneNumber || provider.businessPhone || ''} readOnly />
            </div>
          </div>
          
          <div>
            <Label>Description</Label>
            <Textarea value={provider.description || ''} readOnly />
          </div>
        </CardContent>
      </Card>

      {/* Location & Services */}
      <Card>
        <CardHeader>
          <CardTitle>Location & Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Primary Suburb</Label>
              <Input value={provider.suburb || ''} readOnly />
            </div>
            <div>
              <Label>Max Dog Capacity</Label>
              <Input value={provider.maxDogCapacity?.toString() || ''} readOnly />
            </div>
          </div>
          
          <div>
            <Label>Business Address</Label>
            <Textarea value={provider.businessAddress || ''} readOnly />
          </div>
          
          <div>
            <Label>Services Offered</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {provider.servicesOffered?.map((service, index) => (
                <Badge key={index} variant="outline">{service}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <Label>Covered Suburbs</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {provider.coveredSuburbs?.map((suburb, index) => (
                <Badge key={index} variant="secondary">{suburb}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <Label>Qualifications</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {provider.qualifications?.map((qual, index) => (
                <Badge key={index} variant="default">{qual}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status & Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {provider.isVerified ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={provider.isVerified ? 'text-green-600' : 'text-red-600'}>
                {provider.isVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {provider.isBackgroundChecked ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={provider.isBackgroundChecked ? 'text-green-600' : 'text-red-600'}>
                {provider.isBackgroundChecked ? 'Background Checked' : 'Background Check Pending'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span>{provider.rating} stars ({provider.totalReviews} reviews)</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Created At</Label>
              <Input value={new Date(provider.createdAt).toLocaleString()} readOnly />
            </div>
            <div>
              <Label>Updated At</Label>
              <Input value={new Date(provider.updatedAt).toLocaleString()} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}