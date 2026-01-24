import { Link } from "react-router-dom";
import Navbar from "@/components/navbar";
import ContactForm from "@/components/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, MapPin, Phone, Mail, Users, Shield, Star, Clock } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-doglife-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Heart className="h-12 w-12 text-doglife-primary mr-4" />
            <h1 className="text-5xl font-bold text-doglife-dark">About DogLife</h1>
          </div>
          <p className="text-xl text-doglife-neutral max-w-3xl mx-auto leading-relaxed">
            Connecting dog owners with trusted service providers across South Africa. 
            Your dog's happiness and well-being is our mission.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <img 
              src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Happy dog owners with their pets at a park" 
              className="rounded-2xl shadow-xl w-full h-auto mb-8" 
            />
          </div>
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-doglife-dark mb-4">Our Mission</h2>
              <p className="text-doglife-neutral leading-relaxed">
                At DogLife, we believe every dog deserves the best care possible. Our platform connects loving pet owners 
                with verified, professional service providers across South Africa, making it easier than ever to find 
                trusted care for your furry family members.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-doglife-dark mb-4">Our Vision</h2>
              <p className="text-doglife-neutral leading-relaxed">
                To create the most trusted and comprehensive pet services network in South Africa, where every dog 
                receives professional, loving care, and every service provider can build a successful business 
                serving the pets they love.
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose DogLife */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-doglife-dark text-center mb-12">Why Choose DogLife?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-doglife-accent mx-auto mb-4" />
                <h3 className="font-semibold text-doglife-dark mb-2">Verified Providers</h3>
                <p className="text-sm text-doglife-neutral">
                  All service providers undergo comprehensive background checks and verification
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Star className="h-12 w-12 text-doglife-secondary mx-auto mb-4" />
                <h3 className="font-semibold text-doglife-dark mb-2">Rated Services</h3>
                <p className="text-sm text-doglife-neutral">
                  Real reviews from pet owners help you make informed decisions
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Clock className="h-12 w-12 text-doglife-primary mx-auto mb-4" />
                <h3 className="font-semibent text-doglife-dark mb-2">24/7 Support</h3>
                <p className="text-sm text-doglife-neutral">
                  Round-the-clock customer support for peace of mind
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Heart className="h-12 w-12 text-doglife-primary mx-auto mb-4" />
                <h3 className="font-semibold text-doglife-dark mb-2">Trusted Community</h3>
                <p className="text-sm text-doglife-neutral">
                  Join thousands of satisfied pet owners and providers
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Our Services */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-doglife-dark text-center mb-12">Services We Offer</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Dog Walking", icon: "🚶" },
              { name: "Training", icon: "🎓" },
              { name: "Grooming", icon: "✂️" },
              { name: "Boarding", icon: "🏠" },
              { name: "Pet Sitting", icon: "👥" },
              { name: "Daycare", icon: "🎾" },
              { name: "Mobile Vets", icon: "🩺" },
              { name: "Transport", icon: "🚗" },
            ].map((service, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="text-3xl mb-2">{service.icon}</div>
                  <h3 className="font-medium text-doglife-dark">{service.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Coverage Areas */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="flex items-center text-center justify-center">
              <MapPin className="h-6 w-6 mr-2" />
              Service Coverage Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-doglife-dark mb-4">Currently Serving Gauteng</h3>
              <p className="text-doglife-neutral mb-6">
                DogLife is currently focused on providing exceptional service in Gauteng, 
                with plans to expand to more provinces across South Africa.
              </p>
              <div className="max-w-lg mx-auto">
                <div className="text-center bg-doglife-gray-100 rounded-lg p-6">
                  <h4 className="font-semibold text-doglife-dark mb-3 text-lg">Gauteng Province</h4>
                  <p className="text-doglife-neutral mb-4">
                    <strong>Primary Areas:</strong> Johannesburg, Sandton, Fourways, Rosebank, Bryanston, Hyde Park, Randburg
                  </p>
                  <p className="text-doglife-neutral mb-4">
                    <strong>Additional Coverage:</strong> Morningside, Parkhurst, Rivonia, Sunninghill, Woodmead, Craighall, Emmarentia, Linden, Northcliff, and more
                  </p>
                  <p className="text-sm text-doglife-accent font-medium">
                    30+ suburbs currently served in the Johannesburg and Sandton areas
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-doglife-dark mb-8">Get in Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Mail className="h-6 w-6 text-doglife-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-doglife-dark mb-1">Email Us</h3>
                  <p className="text-doglife-neutral">
                    <a href="mailto:info@doglife.tech" className="text-doglife-primary hover:underline">
                      info@doglife.tech
                    </a>
                  </p>
                  <p className="text-sm text-doglife-neutral">
                    We respond to all inquiries within 24 hours
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Phone className="h-6 w-6 text-doglife-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-doglife-dark mb-1">Call Us</h3>
                  <p className="text-doglife-neutral">+27 (0) 11 123 4567</p>
                  <p className="text-sm text-doglife-neutral">
                    Monday - Friday: 8:00 AM - 6:00 PM (SAST)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <MapPin className="h-6 w-6 text-doglife-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-doglife-dark mb-1">Our Headquarters</h3>
                  <p className="text-doglife-neutral">
                    Kyalami, Midrand, South Africa<br />
                    Gauteng first. South Africa next
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Users className="h-6 w-6 text-doglife-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-doglife-dark mb-1">Community</h3>
                  <p className="text-doglife-neutral">
                    Join our growing community of dog lovers on social media for tips, 
                    updates, and adorable pet photos!
                  </p>
                  <div className="flex space-x-4 mt-2">
                    <a href="#" className="text-doglife-primary hover:text-blue-700 transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    </a>
                    <a href="#" className="text-doglife-primary hover:text-blue-700 transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                      </svg>
                    </a>
                    <a href="#" className="text-doglife-primary hover:text-blue-700 transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-doglife-dark mb-8">Send us a Message</h2>
            <Card>
              <CardContent className="p-6">
                <ContactForm />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-doglife-dark mb-4">
              Ready to Give Your Dog the Best Care?
            </h2>
            <p className="text-xl text-doglife-neutral mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied pet owners and service providers who trust DogLife 
              for all their dog care needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-doglife-primary hover:bg-blue-700 px-8 py-3 text-lg">
                <a href="/api/auth/login">Find Services</a>
              </Button>
              <Button variant="outline" className="px-8 py-3 text-lg">
                <a href="/api/auth/login">Become a Provider</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
