import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Calendar, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeData {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  points: number;
  earnedAt?: string;
}

interface BadgeDisplayProps {
  badge: BadgeData;
  earned?: boolean;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
}

const rarityColors = {
  common: "bg-gray-100 border-gray-200 text-gray-700",
  rare: "bg-blue-100 border-blue-200 text-blue-700",
  epic: "bg-purple-100 border-purple-200 text-purple-700",
  legendary: "bg-yellow-100 border-yellow-200 text-yellow-700"
};

const categoryIcons = {
  milestone: Trophy,
  achievement: Star,
  loyalty: Calendar,
  activity: Award
};

export default function BadgeDisplay({ badge, earned = false, showProgress = false, size = "md" }: BadgeDisplayProps) {
  const IconComponent = categoryIcons[badge.category as keyof typeof categoryIcons] || Award;
  const sizeClasses = {
    sm: "w-16 h-16 text-2xl",
    md: "w-20 h-20 text-3xl",
    lg: "w-24 h-24 text-4xl"
  };

  return (
    <div className={cn(
      "relative group cursor-pointer transition-all duration-200 hover:scale-105",
      !earned && "opacity-50 grayscale"
    )}>
      <Card className={cn(
        "border-2 transition-all duration-200",
        earned ? rarityColors[badge.rarity as keyof typeof rarityColors] : "border-gray-200 bg-gray-50",
        "hover:shadow-md"
      )}>
        <CardHeader className="text-center pb-2">
          <div className={cn(
            "mx-auto flex items-center justify-center rounded-full border-2",
            sizeClasses[size],
            earned ? "border-current" : "border-gray-300"
          )}>
            <span className="text-center leading-none">{badge.icon}</span>
          </div>
        </CardHeader>
        <CardContent className="text-center pt-0">
          <CardTitle className="text-sm font-semibold mb-1">{badge.name}</CardTitle>
          <CardDescription className="text-xs px-2">
            {badge.description}
          </CardDescription>
          <div className="flex items-center justify-center mt-2 space-x-2">
            <IconComponent className="w-3 h-3" />
            <span className="text-xs font-medium">{badge.points} pts</span>
          </div>
          {earned && badge.earnedAt && (
            <Badge variant="secondary" className="mt-2 text-xs">
              Earned {new Date(badge.earnedAt).toLocaleDateString()}
            </Badge>
          )}
        </CardContent>
      </Card>
      
      {badge.rarity === 'legendary' && earned && (
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-300 animate-pulse"></div>
      )}
      {badge.rarity === 'epic' && earned && (
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
      )}
    </div>
  );
}

interface BadgeGridProps {
  badges: (BadgeData & { earnedAt?: string })[];
  earnedBadges?: BadgeData[];
  title?: string;
  emptyMessage?: string;
}

export function BadgeGrid({ badges, earnedBadges = [], title, emptyMessage }: BadgeGridProps) {
  const earnedBadgeIds = earnedBadges.map(b => b.id);
  
  if (badges.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-500">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{emptyMessage || "No badges available yet"}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {badges.map((badge) => (
          <BadgeDisplay
            key={badge.id}
            badge={badge}
            earned={earnedBadgeIds.includes(badge.id)}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}

interface UserStatsProps {
  stats?: {
    totalBookings: number;
    completedBookings: number;
    totalReviews: number;
    averageRating: string;
    badgePoints: number;
    level: number;
    streakDays: number;
    longestStreak: number;
  };
}

export function UserStatsDisplay({ stats }: UserStatsProps) {
  if (!stats) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            Loading user statistics...
          </div>
        </CardContent>
      </Card>
    );
  }
  const completionRate = stats.totalBookings > 0 ? 
    Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Your Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.completedBookings}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.badgePoints}</div>
            <div className="text-sm text-gray-600">Badge Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">Level {stats.level}</div>
            <div className="text-sm text-gray-600">Current Level</div>
          </div>
        </div>
        
        {stats.averageRating !== "0.00" && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Rating</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{parseFloat(stats.averageRating).toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}
        
        {stats.longestStreak > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Longest Streak</span>
              <span className="font-semibold">{stats.longestStreak} days</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}