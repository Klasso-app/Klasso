import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Roles from "../components/landing/Roles";
import MultiSchool from "../components/landing/MultiSchool";
import CtaBanner from "../components/landing/CtaBanner";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <Hero />
      <Features />
      <Roles />
      <MultiSchool />
      <CtaBanner />
      <Footer />
    </div>
  );
}
