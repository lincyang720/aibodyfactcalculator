import { SITE_ORIGIN } from "./site-metadata";

export type LongTailPage = {
  slug: string;
  eyebrow: string;
  title: string;
  lede: string;
  promise: string;
  steps: Array<{ title: string; body: string }>;
  useCases: string[];
  faq: Array<[string, string]>;
  related: Array<{ href: string; label: string; note: string }>;
};

export function buildLongTailSchema(page: LongTailPage) {
  const url = `${SITE_ORIGIN}/${page.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.lede,
      url,
      isPartOf: { "@type": "WebSite", name: "BodyLens", url: SITE_ORIGIN },
      about: ["body fat estimate", "physique progress", "fitness photos"],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ];
}

export function LongTailLanding({ page }: { page: LongTailPage }) {
  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · BodyLens</a>
        <div>
          <a href="/progress-tracker">Progress</a>
          <a href="/body-fat-calculator-from-photo">Photo Estimate</a>
          <a href="/bulk-or-cut-calculator-from-photo">Bulk or Cut</a>
          <a href="/body-fat-percentage-chart">Chart</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">{page.eyebrow}</div>
        <h1>{page.title}</h1>
        <p className="tool-lede">{page.lede}</p>
        <div className="intent-panel">
          <span>BEST FOR</span>
          <p>{page.promise}</p>
          <a href="/#analyzer">Upload a photo and get a free estimate →</a>
        </div>
        <section className="content-block">
          <h2>How to use this page</h2>
          <div className="guide-grid">
            {page.steps.map((step, index) => (
              <article key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="content-block">
          <h2>Common searches this helps with</h2>
          <ul className="keyword-list">
            {page.useCases.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <section className="content-block">
          <h2>Quick answers</h2>
          <div className="mini-faq">
            {page.faq.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="content-block">
          <h2>Next tools</h2>
          <div className="related-grid">
            {page.related.map((item) => (
              <a href={item.href} key={item.href}>
                <span>{item.note}</span>
                <strong>{item.label}</strong>
                <i>→</i>
              </a>
            ))}
          </div>
        </section>
        <a className="back-cta" href="/#analyzer">Try the AI body fat calculator →</a>
      </main>
      {buildLongTailSchema(page).map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </div>
  );
}
