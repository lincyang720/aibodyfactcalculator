type Section = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type Faq = {
  question: string;
  answer: string;
};

type Source = {
  label: string;
  href: string;
};

type GuidePageProps = {
  eyebrow: string;
  title: string;
  lede: string;
  canonical: string;
  sections: Section[];
  faqs: Faq[];
  sources?: Source[];
  related?: Source[];
};

const home = "https://aibodyfatcalculator.com/";

export function GuidePage({ eyebrow, title, lede, canonical, sections, faqs, sources = [], related = [] }: GuidePageProps) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: home },
      { "@type": "ListItem", position: 2, name: title, item: canonical },
    ],
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: lede,
    mainEntityOfPage: canonical,
    author: { "@type": "Organization", name: "AI Body Fat Calculator" },
    publisher: { "@id": "https://aibodyfatcalculator.com/#organization" },
    datePublished: "2026-08-30",
    dateModified: "2026-08-30",
  };

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div><a href="/ffmi-calculator">FFMI</a><a href="/army-body-fat-calculator">Army</a><a href="/body-fat-percentage-chart">Chart</a></div>
      </header>
      <main className="tool-main article-page">
        <div className="tool-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="tool-lede">{lede}</p>
        <div className="article-note"><strong>Important:</strong> These guides are educational fitness references. They are not medical advice, diagnostic tools, or official military determinations.</div>
        {sections.map((section) => (
          <section className="content-block article-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
          </section>
        ))}
        <section className="content-block ffmi-faq">
          <h2>FAQ</h2>
          {faqs.map((faq, index) => (
            <details key={faq.question} open={index === 0}>
              <summary>{faq.question}<span>+</span></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>
        {sources.length > 0 && <section className="content-block source-list">
          <h2>Sources</h2>
          <ul>{sources.map((source) => <li key={source.href}><a href={source.href} rel="noopener noreferrer">{source.label}</a></li>)}</ul>
        </section>}
        {related.length > 0 && <section className="content-block">
          <h2>Related tools and guides</h2>
          <div className="related-ffmi">{related.map((item) => <a key={item.href} href={item.href}><span>READ NEXT</span><strong>{item.label} →</strong></a>)}</div>
        </section>}
        <a className="back-cta" href="/">Try the AI body fat calculator</a>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  );
}
