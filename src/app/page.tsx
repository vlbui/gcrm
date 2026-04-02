import {
  Navbar,
  HeroSection,
  TrustBar,
  AboutSection,
  IPMSection,
  ServicesSection,
  SolutionsSection,
  PricingSection,
  CertificatesSection,
  FAQSection,
  ContactSection,
  // MapSection,
  Footer,
  FloatingWidgets,
  ContactPopupProvider,
} from "@/components/landing";
import {
  fetchHeroServer,
  fetchServicesServer,
  fetchPricingServer,
  fetchFaqsServer,
  fetchCompanyInfoServer,
  fetchCertificatesServer,
} from "@/lib/api/cms.server";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function Home() {
  const [hero, services, pricing, faqs, companyInfo, certificates] =
    await Promise.all([
      fetchHeroServer(),
      fetchServicesServer(),
      fetchPricingServer(),
      fetchFaqsServer(),
      fetchCompanyInfoServer(),
      fetchCertificatesServer(),
    ]);

  return (
    <ContactPopupProvider>
      <Navbar />

      <HeroSection
        hero={
          hero
            ? {
                headline: hero.headline,
                sub_headline: hero.sub_headline,
                description: hero.description,
                cta_text: hero.cta_text,
                cta_link: hero.cta_link,
                cta2_text: hero.cta2_text,
                cta2_link: hero.cta2_link,
                badges: hero.badges,
                stats: hero.stats,
              }
            : undefined
        }
      />

      <TrustBar />

      <AboutSection companyInfo={companyInfo} />

      <IPMSection />

      <ServicesSection
        services={services.map((s) => ({
          icon: s.icon,
          title: s.title,
          description: s.description,
          features: s.features,
        }))}
      />

      <SolutionsSection />

      <PricingSection
        pricing={pricing.map((p) => ({
          icon: p.loai_goi === "Đơn lẻ" ? "🏠" : p.loai_goi === "Định kỳ" ? "🔄" : "🏢",
          title: p.title,
          subtitle: p.subtitle,
          features: p.features,
          is_popular: p.is_popular,
          ghi_chu: p.ghi_chu,
        }))}
      />

      <CertificatesSection
        certificates={certificates.map((c) => ({
          icon: c.icon,
          title: c.title,
          description: c.description,
        }))}
      />

      <FAQSection
        faqs={faqs.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />

      {/* <MapSection /> */}

      <Footer />

      <FloatingWidgets />
    </ContactPopupProvider>
  );
}
