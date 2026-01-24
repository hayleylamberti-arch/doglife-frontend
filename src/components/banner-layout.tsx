import { AdvertisingBanner } from './advertising-banner';
import { cn } from '@/lib/utils';

interface BannerLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showSidebar?: boolean;
  showContent?: boolean;
  showFooter?: boolean;
  className?: string;
}

export function BannerLayout({ 
  children, 
  showHeader = true,
  showSidebar = true, 
  showContent = true,
  showFooter = true,
  className 
}: BannerLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Header Banner - 728x90 Leaderboard */}
      {showHeader && <AdvertisingBanner placement="header" />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Banners - 300x250 Medium Rectangle */}
          {showSidebar && (
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-8 space-y-6">
                <AdvertisingBanner placement="sidebar" />
              </div>
            </aside>
          )}
          
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
            
            {/* Content Banner - 728x128 Banner */}
            {showContent && (
              <div className="mt-12 mb-8">
                <AdvertisingBanner placement="content" />
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* Footer Banner - 728x90 Leaderboard */}
      {showFooter && <AdvertisingBanner placement="footer" />}
    </div>
  );
}