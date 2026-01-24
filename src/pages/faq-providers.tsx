import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ArrowLeft, Briefcase, Star } from "lucide-react";

const faqItems = [
  {
    id: 1,
    question: "How much does it cost to become a service provider?",
    answer: "Individual providers with one service pay R300 annually. Businesses or providers offering multiple services pay R450 annually. This includes full access to our platform, customer management tools, calendar system, and marketing support.",
    category: "Pricing"
  },
  {
    id: 2,
    question: "What is the verification process?",
    answer: "All providers must submit ID/passport verification, business registration (if applicable), professional qualifications, and undergo background checks. We also verify your insurance and may conduct reference checks. The process typically takes 3-5 business days.",
    category: "Verification"
  },
  {
    id: 3,
    question: "How do I set my availability and pricing?",
    answer: "Use our calendar system to set your available time slots, block out unavailable times, and include travel buffers between appointments. You can set different rates for different services and offer special pricing for regular customers.",
    category: "Setup"
  },
  {
    id: 4,
    question: "How do I receive payments?",
    answer: "Payments are processed automatically after service completion and transferred to your linked bank account within 2-3 business days. DogLife handles all payment processing, invoicing, and tax documentation for you.",
    category: "Payment"
  },
  {
    id: 5,
    question: "What happens if a customer cancels?",
    answer: "Free cancellations more than 48 hours in advance won't affect you. Cancellations within 48 hours result in a 50% cancellation fee paid to you for your reserved time. You can also set your own cancellation policies for regular clients.",
    category: "Cancellation"
  },
  {
    id: 6,
    question: "How do I manage multiple service areas?",
    answer: "You can specify multiple suburbs you serve and set different travel fees for each area. Our system will show you bookings by location and help you optimize your routes for maximum efficiency.",
    category: "Setup"
  },
  {
    id: 7,
    question: "Can I offer emergency or same-day services?",
    answer: "Yes, you can enable emergency booking options and set premium rates for urgent services. Customers searching for immediate assistance will see providers who offer emergency services first.",
    category: "Services"
  },
  {
    id: 8,
    question: "How do customer reviews work?",
    answer: "After each completed service, customers can rate you 1-5 stars and leave detailed feedback. These reviews build your reputation and help you attract more customers. You can also rate customers to build your own reference system.",
    category: "Reviews"
  },
  {
    id: 9,
    question: "What support do I get as a provider?",
    answer: "All providers get access to our business dashboard, customer management tools, automated scheduling, payment processing, marketing support, and 24/7 technical support. Premium providers also get priority listing and promotional opportunities.",
    category: "Support"
  },
  {
    id: 10,
    question: "How do I handle difficult customers or disputes?",
    answer: "Contact our provider support team immediately for any issues. We mediate disputes, provide conflict resolution, and can remove problematic customers from the platform. Your safety and professional reputation are our priorities.",
    category: "Support"
  },
  {
    id: 11,
    question: "Can I offer services as a team or business?",
    answer: "Yes, businesses can have multiple team members under one account. You can manage different calendars for each team member, set individual skills and pricing, and coordinate schedules through our business dashboard.",
    category: "Business"
  },
  {
    id: 12,
    question: "What marketing support do you provide?",
    answer: "We provide professional profile optimization, SEO support to help customers find you, promotional features for top-rated providers, social media marketing tips, and seasonal promotional campaigns to boost your bookings.",
    category: "Marketing"
  },
  {
    id: 13,
    question: "How do I handle special needs or medical requirements?",
    answer: "Customer profiles include detailed pet information including medical history and special needs. Always review this information before accepting bookings and don't hesitate to contact customers for clarification on care requirements.",
    category: "Services"
  },
  {
    id: 14,
    question: "What insurance do I need?",
    answer: "We recommend professional liability insurance and public liability insurance. Some service categories may require specific insurance coverage. We can connect you with insurance providers who specialize in pet service businesses.",
    category: "Insurance"
  },
  {
    id: 15,
    question: "How do I build my customer base?",
    answer: "Focus on excellent service delivery, encourage satisfied customers to leave reviews, maintain consistent availability, respond quickly to booking requests, and use our promotional tools. Top-rated providers get priority placement in search results.",
    category: "Growth"
  }
];

const categories = ["All", "Pricing", "Verification", "Setup", "Payment", "Cancellation", "Services", "Reviews", "Support", "Business", "Marketing", "Insurance", "Growth"];

export default function FaqProviders() {
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
            <Briefcase className="h-8 w-8 text-doglife-accent mr-3" />
            <h1 className="text-4xl font-bold text-doglife-dark">Service Provider FAQ</h1>
          </div>
          <p className="text-xl text-doglife-neutral max-w-2xl mx-auto">
            Everything you need to know about offering your dog services on DogLife
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/api/auth/login"}>
            <CardContent className="p-6 text-center">
              <Briefcase className="h-8 w-8 text-doglife-accent mx-auto mb-3" />
              <h3 className="font-semibold text-doglife-dark mb-2">Become a Provider</h3>
              <p className="text-sm text-doglife-neutral">Start offering your services today</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/api/auth/login"}>
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 text-doglife-secondary mx-auto mb-3" />
              <h3 className="font-semibold text-doglife-dark mb-2">Provider Dashboard</h3>
              <p className="text-sm text-doglife-neutral">Manage your services and bookings</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="h-8 w-8 mx-auto mb-3 bg-doglife-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <h3 className="font-semibold text-doglife-dark mb-2">Pricing Info</h3>
              <p className="text-sm text-doglife-neutral">R300/year individual • R450/year business</p>
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
                className={selectedCategory === category ? "bg-doglife-accent hover:bg-green-700" : ""}
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
                    <div className="text-xs text-doglife-accent mt-1">{item.category}</div>
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

        {/* Provider Benefits */}
        <Card className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 border-0">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-doglife-dark mb-6 text-center">Why Choose DogLife?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-doglife-dark">For Providers</h3>
                <ul className="space-y-2 text-doglife-neutral">
                  <li>• Reach thousands of dog owners</li>
                  <li>• Automated booking and payment processing</li>
                  <li>• Professional business tools and analytics</li>
                  <li>• Marketing and promotional support</li>
                  <li>• 24/7 technical and business support</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-doglife-dark">Growing Network</h3>
                <ul className="space-y-2 text-doglife-neutral">
                  <li>• Verified customers with premium memberships</li>
                  <li>• Secure payment processing and protection</li>
                  <li>• Review system builds your reputation</li>
                  <li>• Flexible scheduling and pricing control</li>
                  <li>• Part of South Africa's largest pet services network</li>
                </ul>
              </div>
            </div>
            <div className="text-center mt-8">
              <Button className="bg-doglife-accent hover:bg-green-700 mr-4">
                <a href="/api/auth/login">Start Providing Services</a>
              </Button>
              <Button asChild variant="outline">
                <a href="mailto:info@doglife.tech">Contact Provider Support</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
