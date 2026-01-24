import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Search, 
  Calendar, 
  Star, 
  User, 
  Heart,
  MapPin,
  Phone,
  Mail,
  Award,
  PawPrint,
  Smile,
  CheckCircle
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: string;
  action?: string;
  targetElement?: string;
  animation: 'sit' | 'wag' | 'play' | 'sleep' | 'excited' | 'happy';
  tips?: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DogLife! 🐕',
    description: 'Hi there! I\'m Buddy, your friendly guide.',
    content: 'I\'m here to show you around our amazing dog services platform. Together, we\'ll explore how to find the perfect care for your furry friend!',
    animation: 'excited',
    tips: ['Take your time - we\'ll go at your pace', 'You can skip or restart this tutorial anytime']
  },
  {
    id: 'profile-setup',
    title: 'Let\'s Set Up Your Profile',
    description: 'First things first - let\'s get you and your dog set up!',
    content: 'Your profile helps service providers understand your needs better. Add your dog\'s information, preferences, and any special requirements.',
    action: 'Go to Profile',
    targetElement: '[href="/profile"]',
    animation: 'sit',
    tips: ['Add a photo of your dog - providers love seeing who they\'ll be caring for!', 'Include any medical conditions or behavioral notes']
  },
  {
    id: 'search-services',
    title: 'Finding Amazing Services',
    description: 'Now let\'s find some great services for your pup!',
    content: 'Use our search to find dog walkers, trainers, groomers, and more in your area. Filter by location, price, and ratings to find the perfect match.',
    action: 'Explore Services',
    targetElement: '[href="/search"]',
    animation: 'play',
    tips: ['Check provider ratings and reviews', 'Look for providers with relevant certifications', 'Consider proximity to your location']
  },
  {
    id: 'booking-process',
    title: 'Booking Made Simple',
    description: 'Found someone perfect? Let\'s book them!',
    content: 'Our booking system makes it easy to schedule services. Choose your preferred time, add special instructions, and you\'re all set!',
    animation: 'wag',
    tips: ['Book in advance for popular time slots', 'Add any special instructions for your dog', 'Save favorite providers for quick rebooking']
  },
  {
    id: 'mood-tracking',
    title: 'Mood-Based Recommendations',
    description: 'Something special - mood tracking for better care!',
    content: 'Tell us how you and your dog are feeling today, and we\'ll suggest the perfect activities and services to match your mood.',
    action: 'Try Mood Dashboard',
    targetElement: '[href="/dashboard"]',
    animation: 'happy',
    tips: ['Different moods call for different activities', 'Track patterns to understand your dog better', 'Get personalized suggestions based on energy levels']
  },
  {
    id: 'community-features',
    title: 'Join Our Community',
    description: 'You\'re part of something bigger now!',
    content: 'Earn badges for using services, leave reviews to help other dog parents, and discover new providers in your area.',
    animation: 'excited',
    tips: ['Honest reviews help the community grow', 'Badges unlock special perks and discounts', 'Connect with other dog parents in your area']
  },
  {
    id: 'safety-first',
    title: 'Safety & Peace of Mind',
    description: 'Your dog\'s safety is our top priority.',
    content: 'All our providers are verified, background-checked, and reviewed by the community. You can book with confidence knowing your furry friend is in good hands.',
    animation: 'sit',
    tips: ['Check provider verification badges', 'Read recent reviews from other dog parents', 'Trust your instincts when choosing providers']
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'Welcome to the DogLife family!',
    content: 'You now know how to make the most of our platform. Your dog is going to love all the amazing experiences waiting for them!',
    animation: 'play',
    tips: ['Bookmark your favorite providers', 'Enable notifications for booking updates', 'Share DogLife with other dog parents!']
  }
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingTutorial({ isOpen, onClose, onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const skipTutorial = () => {
    onClose();
  };

  const goToAction = () => {
    if (step.action && step.targetElement) {
      onClose();
      // Small delay to allow dialog to close before navigation
      setTimeout(() => {
        const element = document.querySelector(step.targetElement!);
        if (element) {
          (element as HTMLElement).click();
        }
      }, 100);
    }
  };

  // Dog character animation component
  const DogCharacter = ({ animation }: { animation: string }) => {
    const getAnimationClass = () => {
      switch (animation) {
        case 'excited':
          return 'animate-bounce';
        case 'wag':
          return 'animate-pulse';
        case 'play':
          return 'animate-spin';
        case 'happy':
          return 'animate-bounce';
        case 'sit':
          return '';
        default:
          return 'animate-pulse';
      }
    };

    return (
      <div className="flex justify-center mb-6">
        <div className={`text-6xl ${getAnimationClass()} duration-1000`}>
          🐕
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-blue-500" />
              <DialogTitle>Getting Started Guide</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={skipTutorial}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
            <Progress value={progress} className="flex-1 h-2" />
            <span>{Math.round(progress)}%</span>
          </div>
        </DialogHeader>

        <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
          <Card className="border-none shadow-none">
            <CardHeader className="text-center pb-4">
              <DogCharacter animation={step.animation} />
              <CardTitle className="text-2xl mb-2">{step.title}</CardTitle>
              <DialogDescription className="text-lg">
                {step.description}
              </DialogDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-gray-700 leading-relaxed">
                {step.content}
              </div>

              {step.tips && step.tips.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Pro Tips:
                  </h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    {step.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 mt-1 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step.action && (
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-green-800 mb-3">Ready to try it out?</p>
                  <Button 
                    onClick={goToAction}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {step.action}
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={skipTutorial}>
                    Skip Tutorial
                  </Button>
                  
                  <Button 
                    onClick={nextStep}
                    className="flex items-center gap-2"
                  >
                    {currentStep === tutorialSteps.length - 1 ? (
                      <>
                        Complete
                        <CheckCircle className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage tutorial state
export function useOnboardingTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    // Check if user has completed tutorial
    const completed = localStorage.getItem('doglife-tutorial-completed');
    if (completed) {
      setHasCompleted(true);
    } else {
      // Auto-show tutorial for new users after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTutorial = () => {
    setIsOpen(true);
  };

  const closeTutorial = () => {
    setIsOpen(false);
  };

  const completeTutorial = () => {
    setIsOpen(false);
    setHasCompleted(true);
    localStorage.setItem('doglife-tutorial-completed', 'true');
  };

  const resetTutorial = () => {
    localStorage.removeItem('doglife-tutorial-completed');
    setHasCompleted(false);
    setIsOpen(true);
  };

  return {
    isOpen,
    hasCompleted,
    startTutorial,
    closeTutorial,
    completeTutorial,
    resetTutorial
  };
}