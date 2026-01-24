import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import Navbar from '@/components/navbar';
import { 
  Users, 
  DogIcon, 
  Calendar, 
  TrendingUp, 
  Eye,
  MousePointer,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  PieChart,
  Activity,
  Star
} from 'lucide-react';

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  clickUrl?: string;
  altText?: string;
  placement: string;
  targetAudience?: string;
  priority: number;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  active: boolean;
}

interface SiteMetrics {
  totalUsers: number;
  totalOwners: number;
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
  completedBookings: number;
  recentSignups: number;
}

interface ServiceMetrics {
  serviceType: string;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  activeProviders: number;
}

export default function AdminDashboard() {
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const { toast } = useToast();

  // Fetch banners
  const { data: banners = [], isLoading: bannersLoading, error: bannersError } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const response = await fetch('/api/admin/banners');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setIsSetupMode(true);
        }
        throw new Error('Failed to fetch banners');
      }
      return response.json();
    },
    retry: false,
  });

  // Fetch site metrics
  const { data: siteMetrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['site-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/metrics');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setIsSetupMode(true);
        }
        throw new Error('Failed to fetch metrics');
      }
      return response.json();
    },
  });

  // Fetch service metrics
  const { data: serviceMetrics = [], isLoading: serviceMetricsLoading, error: serviceMetricsError } = useQuery({
    queryKey: ['service-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/service-metrics');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setIsSetupMode(true);
        }
        throw new Error('Failed to fetch service metrics');
      }
      return response.json();
    },
    retry: false,
  });

  // Admin setup mutation
  const setupAdminMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set up admin');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Admin Setup Complete",
        description: "Your account has been promoted to admin. Please refresh the page.",
      });
      setIsSetupMode(false);
      // Refresh the page to update user context
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Setup Error",
        description: error.message || "Failed to set up admin account",
        variant: "destructive",
      });
    },
  });

  // Create/Update banner mutation
  const bannerMutation = useMutation({
    mutationFn: async (bannerData: Partial<Banner>) => {
      const url = bannerData.id ? `/api/admin/banners/${bannerData.id}` : '/api/admin/banners';
      const method = bannerData.id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerData)
      });
      if (!response.ok) throw new Error('Failed to save banner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setSelectedBanner(null);
      setIsEditMode(false);
      toast({ title: 'Banner saved successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to save banner', variant: 'destructive' });
    },
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: async (bannerId: number) => {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete banner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast({ title: 'Banner deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete banner', variant: 'destructive' });
    },
  });

  const handleBannerSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const bannerData = {
      ...(selectedBanner?.id && { id: selectedBanner.id }),
      title: formData.get('title') as string,
      imageUrl: formData.get('imageUrl') as string,
      clickUrl: formData.get('clickUrl') as string,
      altText: formData.get('altText') as string,
      placement: formData.get('placement') as string,
      targetAudience: formData.get('targetAudience') as string,
      priority: parseInt(formData.get('priority') as string),
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      active: formData.get('active') === 'true',
    };

    bannerMutation.mutate(bannerData);
  };

  const openBannerForm = (banner?: Banner) => {
    setSelectedBanner(banner || null);
    setIsEditMode(true);
  };

  const calculateCTR = (banner: Banner) => {
    if (banner.impressions === 0) return '0.00';
    return ((banner.clicks / banner.impressions) * 100).toFixed(2);
  };

  // Show admin setup if needed
  if (isSetupMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Admin Setup Required</CardTitle>
                <p className="text-gray-600">
                  No admin account exists yet. Click below to promote your current account to admin status.
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setupAdminMutation.mutate()}
                  disabled={setupAdminMutation.isPending}
                  className="w-full"
                >
                  {setupAdminMutation.isPending ? "Setting up..." : "Become Admin"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage advertisements and monitor site performance</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="banners">Banner Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="services">Service Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {metricsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : siteMetrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-3xl font-bold text-gray-900">{siteMetrics.totalUsers}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Dog Owners</p>
                        <p className="text-3xl font-bold text-gray-900">{siteMetrics.totalOwners}</p>
                      </div>
                      <DogIcon className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Service Providers</p>
                        <p className="text-3xl font-bold text-gray-900">{siteMetrics.totalProviders}</p>
                      </div>
                      <Activity className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                        <p className="text-3xl font-bold text-gray-900">{siteMetrics.totalBookings}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                        <p className="text-3xl font-bold text-gray-900">R{siteMetrics.totalRevenue}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-emerald-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                        <p className="text-3xl font-bold text-gray-900">{siteMetrics.activeBookings}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-indigo-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completed Bookings</p>
                        <p className="text-3xl font-bold text-gray-900">{siteMetrics.completedBookings}</p>
                      </div>
                      <PieChart className="h-8 w-8 text-pink-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Recent Signups</p>
                        <p className="text-3xl font-bold text-gray-900">{siteMetrics.recentSignups}</p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <AlertDescription>Unable to load site metrics at this time.</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Banner Management Tab */}
          <TabsContent value="banners" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Advertisement Banners</h2>
              <Button onClick={() => openBannerForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Banner
              </Button>
            </div>

            {/* Banner Form */}
            {isEditMode && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedBanner ? 'Edit Banner' : 'Create New Banner'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBannerSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input 
                          id="title" 
                          name="title" 
                          defaultValue={selectedBanner?.title}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input 
                          id="imageUrl" 
                          name="imageUrl" 
                          type="url"
                          defaultValue={selectedBanner?.imageUrl}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="clickUrl">Click URL (Optional)</Label>
                        <Input 
                          id="clickUrl" 
                          name="clickUrl" 
                          type="url"
                          defaultValue={selectedBanner?.clickUrl}
                        />
                      </div>
                      <div>
                        <Label htmlFor="placement">Placement</Label>
                        <Select name="placement" defaultValue={selectedBanner?.placement}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select placement" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="header">Header (728x90)</SelectItem>
                            <SelectItem value="sidebar">Sidebar (300x250)</SelectItem>
                            <SelectItem value="content">Content (728x128)</SelectItem>
                            <SelectItem value="footer">Footer (728x90)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="targetAudience">Target Audience</Label>
                        <Select name="targetAudience" defaultValue={selectedBanner?.targetAudience}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="owners">Dog Owners</SelectItem>
                            <SelectItem value="providers">Service Providers</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority (1-10)</Label>
                        <Input 
                          id="priority" 
                          name="priority" 
                          type="number"
                          min="1"
                          max="10"
                          defaultValue={selectedBanner?.priority || 5}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input 
                          id="startDate" 
                          name="startDate" 
                          type="date"
                          defaultValue={selectedBanner?.startDate?.split('T')[0]}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input 
                          id="endDate" 
                          name="endDate" 
                          type="date"
                          defaultValue={selectedBanner?.endDate?.split('T')[0]}
                          required 
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="altText">Alt Text</Label>
                      <Textarea 
                        id="altText" 
                        name="altText" 
                        defaultValue={selectedBanner?.altText}
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="active" 
                        name="active" 
                        value="true"
                        defaultChecked={selectedBanner?.active !== false}
                      />
                      <Label htmlFor="active">Active</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsEditMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={bannerMutation.isPending}>
                        {bannerMutation.isPending ? 'Saving...' : 'Save Banner'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Banner List */}
            <div className="grid gap-6">
              {bannersLoading ? (
                <div className="text-center py-8">Loading banners...</div>
              ) : banners.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500">No banners found. Create your first banner to get started.</p>
                  </CardContent>
                </Card>
              ) : (
                banners.map((banner: Banner) => (
                  <Card key={banner.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-semibold">{banner.title}</h3>
                            <Badge variant={banner.active ? 'default' : 'secondary'}>
                              {banner.active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">{banner.placement}</Badge>
                            <Badge variant="outline">{banner.targetAudience}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Impressions</p>
                              <div className="flex items-center">
                                <Eye className="h-4 w-4 mr-1 text-blue-600" />
                                <span className="font-semibold">{banner.impressions}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Clicks</p>
                              <div className="flex items-center">
                                <MousePointer className="h-4 w-4 mr-1 text-green-600" />
                                <span className="font-semibold">{banner.clicks}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">CTR</p>
                              <span className="font-semibold">{calculateCTR(banner)}%</span>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Priority</p>
                              <span className="font-semibold">{banner.priority}</span>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600">
                            <p>Duration: {new Date(banner.startDate).toLocaleDateString()} - {new Date(banner.endDate).toLocaleDateString()}</p>
                            {banner.clickUrl && <p>Links to: {banner.clickUrl}</p>}
                          </div>
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBannerForm(banner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBannerMutation.mutate(banner.id)}
                            disabled={deleteBannerMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Site Analytics</h2>
            
            {metricsLoading ? (
              <div className="text-center py-8">Loading analytics...</div>
            ) : siteMetrics ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total Users</span>
                        <span className="font-semibold">{siteMetrics.totalUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Dog Owners</span>
                        <span className="font-semibold">{siteMetrics.totalOwners}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Service Providers</span>
                        <span className="font-semibold">{siteMetrics.totalProviders}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Recent Signups (30 days)</span>
                        <span className="font-semibold">{siteMetrics.recentSignups}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Booking Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total Bookings</span>
                        <span className="font-semibold">{siteMetrics.totalBookings}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Active Bookings</span>
                        <span className="font-semibold">{siteMetrics.activeBookings}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Completed Bookings</span>
                        <span className="font-semibold">{siteMetrics.completedBookings}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Completion Rate</span>
                        <span className="font-semibold">
                          {siteMetrics.totalBookings > 0 
                            ? Math.round((siteMetrics.completedBookings / siteMetrics.totalBookings) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <AlertDescription>Unable to load analytics data at this time.</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Service Performance Tab */}
          <TabsContent value="services" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Service Performance</h2>
            
            {serviceMetricsLoading ? (
              <div className="text-center py-8">Loading service metrics...</div>
            ) : serviceMetrics.length === 0 ? (
              <Alert>
                <AlertDescription>No service performance data available yet.</AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-6">
                {serviceMetrics.map((service: ServiceMetrics, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{service.serviceType}</span>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{service.averageRating.toFixed(1)}</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Bookings</p>
                          <p className="text-2xl font-bold">{service.totalBookings}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold">R{service.totalRevenue}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Active Providers</p>
                          <p className="text-2xl font-bold">{service.activeProviders}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Avg. per Booking</p>
                          <p className="text-2xl font-bold">
                            R{service.totalBookings > 0 
                              ? Math.round(service.totalRevenue / service.totalBookings)
                              : 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}