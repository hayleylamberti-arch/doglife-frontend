import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ArrowLeft, Heart, Search, Shield } from "lucide-react";

const faqItems = [
  {
    id: 1,
    question: "What do I get with my R300 annual membership?",
    answer: "With your membership, you get unlimited access to all service provider contact details, full booking capabilities, 24/7 customer support, booking protection with flexible cancellation, and exclusive member discounts. You can browse and book with any verified service provider on our platform.",
    category: "Membership"
  },
  {
    id: 2,
    question: "How do I book a service?",
    answer: "Simply search for the service you need, browse verified providers in your area, select your preferred provider, choose an available time slot, and confirm your booking. You'll receive instant confirmation and reminders via email and in-app notifications.",
    category: "Booking"
  },
  {
    id: 3,
    question: "What is the cancellation policy?",
    answer: "You can cancel your booking for free up to 48 hours before the scheduled service. Cancellations within 48 hours will incur a 50% cancellation fee to compensate the service provider for their time and preparation.",
    category: "Booking"
  },
  {
    id: 4,
    question: "How do I raise or escalate an issue?",
    answer: "Contact our customer support team through the app, email us at info@doglife.tech, or use our contact form. Members receive priority support with 24/7 availability. For urgent issues, call our emergency support line.",
    category: "Support"
  },
  {
    id: 5,
    question: "Are all service providers verified?",
    answer: "Yes, all service providers undergo comprehensive background checks including ID verification, business registration verification, and reference checks. Many also provide professional qualifications and certifications for their services.",
    category: "Safety"
  },
  {
    id: 6,
    question: "Can I browse providers without a membership?",
    answer: "Yes, you can browse up to 3 service providers per service category without a membership. However, contact details and booking functionality are only available to premium members.",
    category: "Membership"
  },
  {
    id: 7,
    question: "How do I add my dog's profile?",
    answer: "Go to your profile page and click on 'My Dogs' tab. Click 'Add Dog' and fill in your pet's details including name, breed, age, behavioral notes, medical history, and any special care requirements. This helps providers give the best care possible.",
    category: "Profile"
  },
  {
    id: 8,
    question: "What payment methods are accepted?",
    answer: "We accept all major credit cards, debit cards, and bank transfers. Payments are processed securely through our payment partners, and you'll only be charged after the service is completed successfully.",
    category: "Payment"
  },
  {
    id: 9,
    question: "How do I leave a review?",
    answer: "After your service is completed, you'll receive a notification to rate and review your experience. You can rate the provider from 1-5 stars and leave detailed feedback to help other dog owners make informed decisions.",
    category: "Reviews"
  },
  {
    id: 10,
    question: "What if I'm not satisfied with a service?",
    answer: "If you're not completely satisfied, contact our support team within 24 hours of the service completion. We'll investigate the issue and work with you and the provider to resolve it, including potential refunds or service credits.",
    category: "Support"
  },
  {
    id: 11,
    question: "Can I book recurring services?",
    answer: "Yes, many providers offer recurring services like daily dog walks or weekly grooming. You can discuss and arrange recurring bookings directly with your chosen provider through the platform.",
    category: "Booking"
  },
  {
    id: 12,
    question: "Is there an emergency service option?",
    answer: "Some providers offer emergency or same-day services for urgent situations. These may incur additional fees. Use the search filters to find providers who offer emergency services in your area.",
    category: "Emergency"
  }
];

const categories = ["All", "Membership", "Booking", "Safety", "Support", "Profile", "Payment", "Reviews", "Emergency"];

export default function FaqOwners() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredFaqs = selectedCategory === "All" 
    ? faqItems 
    : faqItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-doglife-primary mr-3" />
            <h1 className="text-4xl font-bold text-doglife-dark">Dog Owner FAQ</h1>
          </div>
          <p className="text-xl text-doglife-neutral max-w-2xl mx-auto">
            Everything you need to know about finding and booking dog services on DogLife
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/api/authlogin"}>
            <CardContent className="p-6 text-center">
              <Search className="h-8 w-8 text-doglife-primary mx-auto mb-3" />
              <h3 className="font-semibold text-doglife-dark mb-2">Find Services</h3>
              <p className="text-sm text-doglife-neutral">Browse verified providers in your area</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/api/auth/login"}>
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-doglife-accent mx-auto mb-3" />
              <h3 className="font-semibold text-doglife-dark mb-2">Get Membership</h3>
              <p className="text-sm text-doglife-neutral">Unlock full access for R300/year</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-doglife-secondary mx-auto mb-3" />
              <h3 className="font-semibold text-doglife-dark mb-2">Contact Support</h3>
              <p className="text-sm text-doglife-neutral">
                <a href="mailto:info@doglife.tech" className="text-doglife-primary hover:underline">
                  info@doglife.tech
                </a>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-doglife-dark mb-4">Browse by Category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-doglife-primary hover:bg-blue-700" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFaqs.map((item) => (
            <Card key={item.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <Button
                  variant="ghost"
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 h-auto"
                  onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                >
                  <div className="flex-1">
                    <span className="font-semibold text-doglife-dark">{item.question}</span>
                    <div className="text-xs text-doglife-primary mt-1">{item.category}</div>
                  </div>
                  {expandedFaq === item.id ? (
                    <ChevronUp className="h-5 w-5 text-doglife-neutral flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-doglife-neutral flex-shrink-0 ml-4" />
                  )}
                </Button>
                {expandedFaq === item.id && (
                  <div className="px-6 pb-4 text-doglife-neutral leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Still Have Questions */}
        <Card className="mt-12 bg-gradient-to-r from-blue-50 to-green-50 border-0">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-doglife-dark mb-4">Still Have Questions?</h2>
            <p className="text-doglife-neutral mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you get the most out of DogLife.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-doglife-primary hover:bg-blue-700">
                <a href="mailto:info@doglife.tech">Email Support</a>
              </Button>
              <Button asChild variant="outline">
                <Link href="/about">Contact Us</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
