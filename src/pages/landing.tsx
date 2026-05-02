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

export default function Landing() {
  return (
    <div>
      <div className="bg-blue-50 border-b text-center py-2 text-sm text-blue-700">
        🐾 Now launching in Gauteng – Sandton, Fourways, Midrand, Pretoria & surrounding suburbs
      </div>

      <InstallBanner />

      <Hero />
      <Suburbs />
      <NeighbourhoodWaitlist />
      <ServiceCategories />
      <HowItWorks />
      <FeaturedProviders />
      <Pricing />
      <TrustSection />
      <FAQ />
    </div>
  );
}