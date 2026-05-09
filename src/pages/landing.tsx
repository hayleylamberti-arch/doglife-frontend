import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import NeighbourhoodWaitlist from "../components/NeighbourhoodWaitlist";
import ServiceCategories from "../components/ServiceCategories";
import HowItWorks from "../components/HowItWorks";
import Pricing from "../components/Pricing";
import FeaturedProviders from "../components/FeaturedProviders";
import FAQ from "../components/FAQ";
import TrustSection from "../components/TrustSection";
import Suburbs from "../components/Suburbs";
import InstallBanner from "../components/InstallBanner";
import TrustStrip from "@/components/TrustStrip";

export default function Landing() {
  return (
    <div>
      <div className="border-b bg-blue-50 py-2 text-center text-sm text-blue-700">
        🐾 Now launching in Gauteng – Sandton, Fourways, Midrand, Pretoria &
        surrounding suburbs
      </div>

      <InstallBanner />

      <Hero />
      <TrustStrip />
      <Suburbs />
      <NeighbourhoodWaitlist />
      <ServiceCategories />
      <HowItWorks />
      <FeaturedProviders />
      <Pricing />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            How DogLife verifies suppliers
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-gray-600">
            Learn what our trust badges mean, how supplier checks work, and how
            DogLife helps owners book with more confidence.
          </p>
          <div className="mt-5">
            <Link
              to="/trust-and-safety"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              Learn about Trust & Safety
            </Link>
          </div>
        </div>
      </section>

      <TrustSection />
      <FAQ />
    </div>
  );
}