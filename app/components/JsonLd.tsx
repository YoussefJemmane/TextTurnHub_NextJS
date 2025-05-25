export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TexTurn Hub",
    url: "https://text-turn-hub-next-js.vercel.app",
    logo: "https://texturnhub.com/images/logo.png",
    description:
      "TexTurn Hub connects textile waste providers with skilled artisans, promoting sustainable fashion and circular economy.",
    sameAs: [
      "https://twitter.com/texturnhub",
      "https://facebook.com/texturnhub",
      "https://linkedin.com/company/texturnhub",
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "Your Country",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@texturnhub.com",
    },
    offers: {
      "@type": "AggregateOffer",
      description:
        "Sustainable textile waste management solutions and artisan products",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
