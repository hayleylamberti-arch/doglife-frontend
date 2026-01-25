import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Briefcase, Star, Shield, Clock, MapPin, Phone, Mail, ChevronDown, ChevronUp } from "lucide-react";
import logoImage from "@/assets/doglife-logo.jpeg";

const serviceCategories = [
  { id: 1, name: "Dog Walking", icon: "🚶", description: "Daily exercise and fresh air" },
  { id: 2, name: "Training", icon: "🎓", description: "Professional behaviour training" },
  { id: 3, name: "Grooming", icon: "✂️", description: "Professional grooming services" },
  { id: 4, name: "Boarding", icon: "🏠", description: "Safe overnight care" },
  { id: 5, name: "Pet Sitting", icon: "👥", description: "In-home pet care" },
  { id: 6, name: "Daycare", icon: "🎾", description: "Socialisation and play" },
  { id: 7, name: "Mobile Vets", icon: "🩺", description: "Veterinary house calls" },
  { id: 8, name: "Transport", icon: "🚗", description: "Safe pet transportation" },
];

const featuredProviders = [
  {
    id: 1,
    name: "Sarah's Dog Walking",
    location: "Sandton, Johannesburg",
    rating: 5.0,
    reviews: 127,
    description: "Experienced dog walker with 5+ years caring for dogs of all sizes. Available for daily walks and emergency care.",
    price: "From R150/walk",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
  },
  {
    id: 2,
    name: "Mike's Dog Training",
    location: "Cape Town, Western Cape",
    rating: 4.9,
    reviews: 89,
    description: "Certified canine behaviourist specialising in obedience training and behavioural issues. Gentle, effective methods.",
    price: "From R400/session",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
  },
  {
    id: 3,
    name: "Pawsome Grooming",
    location: "Pretoria, Gauteng",
    rating: 4.8,
    reviews: 156,
    description: "Full-service mobile grooming with a calm, stress-free approach. Nail trimming, baths, and styling services.",
    price: "From R300/groom",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
  },
];

const faqItems = [
  {
    id: 1,
    question: "What are the pricing options for dog owners?",
    answer: "We offer two options: Free Forever (R0) includes unlimited search, 2 bookings per month, and basic features. DogLife+ (R29/month or R299/year) includes unlimited bookings, save favorites, emergency contact map, verified provider filter, and exclusive tips & offers."
  },
  {
    id: 2,
    question: "What are the service provider plans?",
    answer: "We offer three tiers: Starter (Free) with basic listing features, Pro (R149/month or R1499/year) with higher placement and unlimited listings, and Pro+ Verified (R249/month or R2499/year) with priority placement, verified badge, and marketing tools."
  },
  {
    id: 3,
    question: "What is the cancellation policy?",
    answer: "You can cancel your booking for free up to 48 hours before the scheduled service. Cancellations within 48 hours will incur a 50% cancellation fee to compensate the service provider."
  },
  {
    id: 4,
    question: "How do I raise or escalate an issue?",
    answer: "Contact our customer support team through the app, email us at info@doglife.tech, or use our contact form. DogLife+ members and Pro+ Verified providers receive priority support."
  },
  {
    id: 5,
    question: "Are all service providers verified?",
    answer: "Yes, all service providers undergo background checks including ID verification and business registration verification. Many also provide qualifications and certifications for their services."
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleGetStarted = (userType: 'owner' | 'provider') => {
    navigate(`/auth?mode=register&type=${userType}`);
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src={logoImage} 
                alt="DogLife" 
                className="h-10 w-10 mr-2"
              />
              <span className="font-bold text-xl text-gray-900">DogLife</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-600 hover:text-blue-600 transition-colors">Services</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">How It Works</a>
              <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">About</Link>
              <a href="#faq" className="text-gray-600 hover:text-blue-600 transition-colors">FAQ</a>
              <Button variant="ghost" onClick={handleLogin} className="text-blue-600 hover:text-blue-700 font-medium">
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth?mode=register')} className="bg-blue-600 text-white hover:bg-blue-700">
                Get Started
              </Button>
            </div>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
          
          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
                <a href="#services" className="block px-3 py-2 text-gray-600 hover:text-blue-600">Services</a>
                <a href="#how-it-works" className="block px-3 py-2 text-gray-600 hover:text-blue-600">How It Works</a>
                <Link to="/about" className="block px-3 py-2 text-gray-600 hover:text-blue-600">About</Link>
                <a href="#faq" className="block px-3 py-2 text-gray-600 hover:text-blue-600">FAQ</a>
                <Button variant="ghost" onClick={handleLogin} className="block w-full text-left px-3 py-2 text-blue-600 font-medium">
                  Sign In
                </Button>
                <Button onClick={() => navigate('/auth?mode=register')} className="block w-full text-left px-3 py-2 bg-blue-600 text-white rounded-lg mt-2">
                  Get Started
                </Button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* New Pricing Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="font-semibold">🎉 Welcome to DogLife!</span>
            <span className="ml-2">Dog Owners: Start Free Forever or upgrade to DogLife+ | Service Providers: Plans from Free to R249/month</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-100 to-blue-50 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div className="mb-8 lg:mb-0">
              <h1 className="font-bold text-4xl lg:text-5xl text-gray-900 mb-6 leading-tight">
                Connect with Trusted Dog Services in 
                <span className="text-blue-600"> Gauteng</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Find reliable dog walkers, trainers, groomers, and more. Join dog owners and service providers building a trusted community.
              </p>
              
              {/* Pricing Highlight */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-blue-800 font-medium">Start Free Forever or upgrade to DogLife+ for just R29/month</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">Free: 2 bookings/month | DogLife+: Unlimited bookings and premium features</p>
                <p className="text-blue-600 text-xs mt-2 font-medium">💡 Membership covers booking fees only - you pay service providers directly for their services</p>
              </div>
              
              {/* User Type Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <Card className="border-2 border-transparent hover:border-blue-600 transition-all cursor-pointer hover-lift" onClick={() => handleGetStarted('owner')}>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-3">
                      <Heart className="h-6 w-6 text-yellow-500 mr-3" />
                      <h3 className="font-semibold text-gray-900">Dog Owner</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Find trusted services for your furry friend</p>
                    
                    {/* Pricing Options */}
                    <div className="space-y-2 mb-4 bg-blue-50 rounded-lg p-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-600 font-semibold">👛 Free Forever</span>
                        <span className="text-green-600 font-bold">R0</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-600 font-semibold">⭐ DogLife+</span>
                        <span className="text-blue-600 font-bold">R29/month</span>
                      </div>
                      <p className="text-xs text-blue-600 font-medium mt-2">💳 Booking fees only - service rates separate</p>
                    </div>
                    
                    <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                      Find Services
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-transparent hover:border-doglife-accent transition-all cursor-pointer hover-lift" onClick={() => handleGetStarted('provider')}>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-3">
                      <Briefcase className="h-6 w-6 text-doglife-accent mr-3" />
                      <h3 className="font-semibold text-doglife-dark">Service Provider</h3>
                    </div>
                    <p className="text-sm text-doglife-neutral mb-4">Offer your dog services to local owners</p>
                    
                    {/* Pricing Options */}
                    <div className="space-y-2 mb-4 bg-orange-50 rounded-lg p-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 font-semibold">🐾 Starter</span>
                        <span className="text-gray-600 font-bold">Free</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-orange-600 font-semibold">🐶 Pro</span>
                        <span className="text-orange-600 font-bold">R149/month</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-purple-600 font-semibold">🥇 Pro+ Verified</span>
                        <span className="text-purple-600 font-bold">R249/month</span>
                      </div>
                      <p className="text-xs text-orange-600 font-medium mt-2">💼 Platform fees - you set your service rates</p>
                    </div>
                    
                    <Button className="w-full bg-doglife-accent text-white hover:bg-green-700">
                      Start Offering
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex items-center space-x-6 text-sm text-doglife-neutral">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-doglife-accent mr-2" />
                  <span>Verified Providers</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-doglife-secondary mr-2" />
                  <span>Rated Services</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-doglife-primary mr-2" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
            
            <div className="lg:pl-8 flex flex-col items-center justify-center">
              {/* Large Logo Display */}
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-3xl shadow-2xl mb-6">
                <img 
                  src={logoImage} 
                  alt="DogLife - Connecting dog owners with trusted services" 
                  className="h-32 w-32 md:h-40 md:w-40 mx-auto"
                />
              </div>
              
              {/* Supporting Hero Image */}
              <img 
                src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
                alt="Happy dog owner with their golden retriever in a park" 
                className="rounded-2xl shadow-lg w-full h-auto max-w-md" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section id="services" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-bold text-3xl lg:text-4xl text-doglife-dark mb-4">
              All Your Dog's Needs, One Platform
            </h2>
            <p className="text-lg text-doglife-neutral max-w-2xl mx-auto">
              From daily walks to special care, find the perfect service provider for every occasion
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {serviceCategories.map((category) => (
              <Card key={category.id} className="bg-doglife-gray-50 hover:shadow-lg transition-shadow cursor-pointer group hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-doglife-dark mb-2">{category.name}</h3>
                  <p className="text-sm text-doglife-neutral">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-doglife-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-bold text-3xl lg:text-4xl text-doglife-dark mb-4">
              How DogLife Works
            </h2>
            <p className="text-lg text-doglife-neutral">Simple steps to connect with trusted dog service providers</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-doglife-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="font-semibold text-doglife-dark mb-3 text-xl">Search & Compare</h3>
              <p className="text-doglife-neutral mb-4">Browse verified service providers in your area, compare prices and read reviews.</p>
              <img 
                src="https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250" 
                alt="Mobile app interface showing service provider profiles" 
                className="rounded-lg shadow-md w-full h-auto" 
              />
            </div>
            
            <div className="text-center">
              <div className="bg-doglife-secondary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="font-semibold text-doglife-dark mb-3 text-xl">Book & Pay</h3>
              <p className="text-doglife-neutral mb-4">Select your preferred provider, choose a time slot, and securely book your service.</p>
              <img 
                src="https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250" 
                alt="Professional dog groomer working with a small dog" 
                className="rounded-lg shadow-md w-full h-auto" 
              />
            </div>
            
            <div className="text-center">
              <div className="bg-doglife-accent text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="font-semibold text-doglife-dark mb-3 text-xl">Enjoy & Review</h3>
              <p className="text-doglife-neutral mb-4">Relax while your dog enjoys quality care, then rate your experience.</p>
              <img 
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250" 
                alt="Happy golden retriever after grooming service" 
                className="rounded-lg shadow-md w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-bold text-3xl lg:text-4xl text-doglife-dark mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-doglife-neutral mb-2">
              Choose the perfect plan for your needs - start free and upgrade anytime
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-center">
                <span className="text-yellow-800 font-medium text-sm">
                  💡 Important: Membership fees cover platform booking costs only. You pay service providers directly for their actual services.
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Dog Owner Plans */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-200">
              <div className="text-center mb-6">
                <Heart className="h-12 w-12 text-doglife-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-doglife-dark mb-2">Dog Owners</h3>
                <p className="text-doglife-neutral">Find and book trusted services</p>
              </div>
              
              <div className="space-y-4">
                {/* Free Forever Plan */}
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-green-700">👛 Free Forever</span>
                    <span className="text-2xl font-bold text-green-700">R0</span>
                  </div>
                  <ul className="text-sm text-green-600 space-y-1">
                    <li>• Unlimited search & browse</li>
                    <li>• Up to 2 bookings per month</li>
                    <li>• Basic messaging</li>
                  </ul>
                  <p className="text-xs text-green-600 mt-2 font-medium">✓ No booking fees</p>
                </div>
                
                {/* DogLife+ Plan */}
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 relative">
                  <div className="absolute -top-2 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                    POPULAR
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-blue-700">⭐ DogLife+</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-700">R29</span>
                      <span className="text-sm text-blue-600">/month</span>
                    </div>
                  </div>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• Unlimited bookings</li>
                    <li>• Save favorite providers</li>
                    <li>• Emergency contacts</li>
                    <li>• Verified provider filter</li>
                    <li>• Exclusive tips & offers</li>
                  </ul>
                  <p className="text-xs text-blue-600 mt-2 font-medium">💳 R29/month covers booking fees only</p>
                </div>
              </div>
            </div>
            
            {/* Service Provider Plans */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-orange-200">
              <div className="text-center mb-6">
                <Briefcase className="h-12 w-12 text-doglife-accent mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-doglife-dark mb-2">Service Providers</h3>
                <p className="text-doglife-neutral">Grow your dog service business</p>
              </div>
              
              <div className="space-y-4">
                {/* Starter Plan */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">🐾 Starter</span>
                    <span className="text-2xl font-bold text-gray-700">Free</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Basic listing</li>
                    <li>• 1 service type</li>
                    <li>• 1 suburb coverage</li>
                  </ul>
                </div>
                
                {/* Pro Plan */}
                <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-orange-700">🐶 Pro</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-orange-700">R149</span>
                      <span className="text-sm text-orange-600">/month</span>
                    </div>
                  </div>
                  <ul className="text-sm text-orange-600 space-y-1">
                    <li>• Higher search placement</li>
                    <li>• Unlimited services</li>
                    <li>• Up to 5 suburbs</li>
                    <li>• Booking analytics</li>
                  </ul>
                </div>
                
                {/* Pro+ Verified Plan */}
                <div className="border border-purple-200 rounded-lg p-4 bg-purple-50 relative">
                  <div className="absolute -top-2 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                    VERIFIED
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-purple-700">🥇 Pro+ Verified</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-purple-700">R249</span>
                      <span className="text-sm text-purple-600">/month</span>
                    </div>
                  </div>
                  <ul className="text-sm text-purple-600 space-y-1">
                    <li>• Priority placement</li>
                    <li>• Verified badge</li>
                    <li>• Unlimited coverage</li>
                    <li>• Marketing tools</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button onClick={() => navigate('/auth?mode=register')} size="lg" className="bg-doglife-primary text-white hover:bg-blue-700 px-8 py-4 text-lg">
              Get Started Today
            </Button>
            <div className="text-center space-y-2 mt-4">
              <p className="text-sm text-doglife-neutral">
                All plans include our satisfaction guarantee and can be cancelled anytime
              </p>
              <p className="text-xs text-gray-600 bg-gray-50 rounded px-4 py-2 inline-block">
                Service provider rates are separate and paid directly to providers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-bold text-3xl lg:text-4xl text-doglife-dark mb-4">
              Top-Rated Service Providers
            </h2>
            <p className="text-lg text-doglife-neutral">Trusted by dog owners across South Africa</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProviders.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-start mb-4">
                    <img 
                      src={provider.image} 
                      alt={`Professional ${provider.name}`} 
                      className="w-16 h-16 rounded-full object-cover mr-4" 
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-doglife-dark">{provider.name}</h3>
                      <p className="text-sm text-doglife-neutral mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {provider.location}
                      </p>
                      <div className="flex items-center">
                        <div className="flex text-doglife-secondary text-sm mr-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm text-doglife-neutral">{provider.rating} ({provider.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-doglife-neutral text-sm mb-4">{provider.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-doglife-dark font-semibold">{provider.price}</span>
                    <Button className="bg-doglife-primary text-white hover:bg-blue-700">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button onClick={() => navigate('/auth?mode=register')} className="bg-doglife-primary text-white hover:bg-blue-700 px-8 py-3 font-medium">
              View All Providers
            </Button>
          </div>
        </div>
      </section>

      {/* Membership Benefits */}
      <section className="py-16 gradient-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-bold text-3xl lg:text-4xl mb-4">
              Choose Your DogLife Plan
            </h2>
            <p className="text-xl opacity-90">Dog Owners: Free Forever or DogLife+ from R29/month | Service Providers: Plans starting from Free</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1601758063890-1167f394febb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Happy dogs and owners at a dog park showing community" 
                className="rounded-xl shadow-2xl w-full h-auto" 
              />
            </div>
            
            <div>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-doglife-secondary rounded-full p-2 mr-4 mt-1">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Unlimited Provider Access</h3>
                    <p className="opacity-90">View contact details and book with any verified service provider</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-doglife-secondary rounded-full p-2 mr-4 mt-1">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">24/7 Customer Support</h3>
                    <p className="opacity-90">Get help whenever you need it with priority support</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-doglife-secondary rounded-full p-2 mr-4 mt-1">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Booking Protection</h3>
                    <p className="opacity-90">Flexible cancellation policy and service guarantees</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-doglife-secondary rounded-full p-2 mr-4 mt-1">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Exclusive Discounts</h3>
                    <p className="opacity-90">Member-only deals and seasonal promotions</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Button onClick={() => navigate('/auth?mode=register')} className="bg-doglife-secondary text-doglife-dark hover:bg-amber-600 px-8 py-3 font-semibold text-lg">
                  Get Started Today
                </Button>
                <p className="text-sm opacity-80 mt-2">Choose from flexible monthly or annual plans</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-16 bg-gradient-to-r from-doglife-primary to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center">
            {/* Content Column */}
            <div className="text-center max-w-2xl">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <h2 className="font-bold text-3xl lg:text-4xl mb-4">
                  Want DogLife in other areas?
                </h2>
                <p className="text-xl opacity-90 mb-6">
                  We're currently serving Gauteng areas. If you'd like 
                  DogLife to come to your suburb, join our waiting list and we'll notify you when we expand!
                </p>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <Link to="/prospect-enquiry" className="inline-block bg-doglife-secondary text-doglife-dark hover:bg-amber-500 px-8 py-3 font-semibold text-lg rounded-md">
                    Join Our Waiting List
                  </Link>
                </div>
                <p className="text-lg font-semibold mt-6 opacity-95">
                  🏢 <strong>Gauteng first. South Africa next.</strong>
                </p>
                <p className="text-sm opacity-80 mt-2">
                  Headquarters: Kyalami, Midrand
                </p>
              </div>
            </div>
            

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-bold text-3xl lg:text-4xl text-doglife-dark mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-doglife-neutral">Everything you need to know about DogLife</p>
          </div>
          
          <div className="space-y-4">
            {faqItems.map((item) => (
              <Card key={item.id} className="border border-gray-200">
                <CardContent className="p-0">
                  <Button
                    variant="ghost"
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 h-auto"
                    onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                  >
                    <span className="font-semibold text-doglife-dark">{item.question}</span>
                    {expandedFaq === item.id ? (
                      <ChevronUp className="h-5 w-5 text-doglife-neutral" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-doglife-neutral" />
                    )}
                  </Button>
                  {expandedFaq === item.id && (
                    <div className="px-6 pb-4 text-doglife-neutral">
                      {item.answer}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-doglife-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <Heart className="h-6 w-6 text-doglife-primary mr-2" />
                <span className="font-bold text-xl">DogLife</span>
              </div>
              <p className="text-gray-300 mb-4">
                Connecting dog owners with trusted service providers across South Africa. Your dog's happiness is our mission.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-doglife-primary transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-doglife-primary transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-doglife-primary transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Dog Owners</h3>
              <ul className="space-y-2">
                <li><Link to="/search" className="text-gray-300 hover:text-white transition-colors">Find Services</Link></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Membership</a></li>
                <li><Link to="/faq-owners" className="text-gray-300 hover:text-white transition-colors">FAQ for Owners</Link></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Safety Guidelines</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Providers</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Become a Provider</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Provider Dashboard</a></li>
                <li><Link to="/faq-providers" className="text-gray-300 hover:text-white transition-colors">FAQ for Providers</Link></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Verification Process</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Help Centre</a></li>
                <li><a href="/legal/terms.html" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/legal/privacy.html" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          {/* Contact Section */}
          <div className="border-t border-gray-700 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4 text-xl">Get in Touch</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-doglife-primary mr-3" />
                    <a href="mailto:info@doglife.tech" className="text-gray-300 hover:text-white transition-colors">info@doglife.tech</a>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-doglife-primary mr-3" />
                    <a href="tel:+27794917013" className="text-gray-300 hover:text-white transition-colors">+27 79 491 7013</a>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-doglife-primary mr-3 mt-1" />
                    <span className="text-gray-300">Gauteng first. South Africa next.</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-xl">Send us a Message</h3>
                <p className="text-gray-400">Contact us at info@doglife.tech</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; 2024 DogLife. All rights reserved. Made with ❤️ for South African dog lovers.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
