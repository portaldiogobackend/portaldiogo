import React from 'react';
import { AboutSecondSection } from '../components/features/AboutSecondSection';
import { AboutSection } from '../components/features/AboutSection';
import { BlogSection } from '../components/features/BlogSection';
import { BrandSection } from '../components/features/BrandSection';
import { CertificateSection } from '../components/features/CertificateSection';
import { FeaturesSection } from '../components/features/FeaturesSection';
import { HeroSection } from '../components/features/HeroSection';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';

export const Home: React.FC = () => {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <BrandSection />
      <FeaturesSection />
      <AboutSection />
      <AboutSecondSection />
      <BlogSection />
      <CertificateSection />
      <Footer />
    </main>
  );
};
