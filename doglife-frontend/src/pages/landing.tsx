import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import NeighbourhoodWaitlist from "@/components/NeighbourhoodWaitlist";
import ServiceCategories from "@/components/ServiceCategories";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import FeaturedProviders from "@/components/FeaturedProviders";
import FAQ from "@/components/FAQ";

export default function Landing() {

  return (
    <div>

      <Navbar />

      <Hero />

      <NeighbourhoodWaitlist />

      <ServiceCategories />

      <HowItWorks />

      <Pricing />

      <FeaturedProviders />

      <FAQ />

    </div>
  );
}