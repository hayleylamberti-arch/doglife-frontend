import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  clickUrl?: string;
  altText?: string;
  placement: string;
  targetAudience?: string;
}

interface AdvertisingBannerProps {
  placement: 'header' | 'sidebar' | 'content' | 'footer';
  className?: string;
}

export function AdvertisingBanner({ placement, className }: AdvertisingBannerProps) {
  const [visibleBanners, setVisibleBanners] = useState<Set<number>>(new Set());
  const [dismissedBanners, setDismissedBanners] = useState<Set<number>>(new Set());
  const { user } = useAuth();

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['banners', placement, user?.userType],
    queryFn: async () => {
      const userType = user?.userType === 'provider' ? 'providers' : 'owners';
      const response = await fetch(`/api/banners/${placement}?userType=${userType}`);
      if (!response.ok) throw new Error('Failed to fetch banners');
      const data = await response.json();
      return data as Banner[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Record impression when banner becomes visible
  useEffect(() => {
    banners.forEach(banner => {
      if (!visibleBanners.has(banner.id) && !dismissedBanners.has(banner.id)) {
        setVisibleBanners(prev => new Set([...Array.from(prev), banner.id]));
        recordImpression(banner.id);
      }
    });
  }, [banners, visibleBanners, dismissedBanners]);

  const recordImpression = async (bannerId: number) => {
    try {
      await fetch(`/api/banners/${bannerId}/impression`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to record banner impression:', error);
    }
  };

  const recordClick = async (bannerId: number) => {
    try {
      await fetch(`/api/banners/${bannerId}/click`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to record banner click:', error);
    }
  };

  const handleBannerClick = (banner: Banner) => {
    recordClick(banner.id);
    if (banner.clickUrl) {
      window.open(banner.clickUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const dismissBanner = (bannerId: number) => {
    setDismissedBanners(prev => new Set([...Array.from(prev), bannerId]));
  };

  const getPlacementStyles = () => {
    switch (placement) {
      case 'header':
        return 'w-full max-w-full h-16 md:h-20';
      case 'sidebar':
        return 'w-full max-w-xs h-48 md:h-64';
      case 'content':
        return 'w-full max-w-2xl h-24 md:h-32';
      case 'footer':
        return 'w-full max-w-full h-16 md:h-20';
      default:
        return 'w-full h-24';
    }
  };

  const getContainerStyles = () => {
    switch (placement) {
      case 'header':
        return 'flex justify-center bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200';
      case 'sidebar':
        return 'space-y-4';
      case 'content':
        return 'flex justify-center my-8';
      case 'footer':
        return 'flex justify-center bg-gray-50 border-t border-gray-200';
      default:
        return 'flex justify-center';
    }
  };

  if (isLoading) return null;

  const activeBanners = banners.filter(banner => !dismissedBanners.has(banner.id));
  
  if (activeBanners.length === 0) return null;

  return (
    <div className={cn(getContainerStyles(), className)}>
      {activeBanners.map((banner) => (
        <div
          key={banner.id}
          className={cn(
            'relative group overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-300',
            'bg-white border border-gray-200',
            getPlacementStyles()
          )}
        >
          {/* Dismiss button for sidebar and content placements */}
          {(placement === 'sidebar' || placement === 'content') && (
            <button
              onClick={() => dismissBanner(banner.id)}
              className="absolute top-2 right-2 z-10 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Dismiss advertisement"
            >
              <X className="h-3 w-3" />
            </button>
          )}

          {/* Banner content */}
          <div
            className={cn(
              'w-full h-full cursor-pointer overflow-hidden',
              banner.clickUrl && 'hover:scale-105 transition-transform duration-300'
            )}
            onClick={() => handleBannerClick(banner)}
          >
            <img
              src={banner.imageUrl}
              alt={banner.altText || banner.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Overlay with title for better accessibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-medium truncate">
                  {banner.title}
                </p>
              </div>
            </div>
          </div>

          {/* Click indicator */}
          {banner.clickUrl && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Click to learn more
            </div>
          )}
        </div>
      ))}
    </div>
  );
}