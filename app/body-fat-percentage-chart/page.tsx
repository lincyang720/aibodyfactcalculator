import type { Metadata } from "next";
import "../tool-pages.css";
import { buildPageMetadata } from "../site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Body Fat Percentage Chart for Men and Women | AI Body Fat Calculator",
  description: "Compare common body fat percentage ranges for men and women, see visual guide links, and learn how to use body fat charts for progress tracking.",
  path: "/body-fat-percentage-chart",
});

const rows = [
  ["Essential fat", "2-5%", "10-13%", "Very low body fat needed for basic physiology; not a normal lifestyle goal."],
  ["Athletes", "6-13%", "14-20%", "Lean, performance-focused ranges often seen in trained athletes."],
  ["Fitness", "14-17%", "21-24%", "Lean and sustainable for many active people, depending on sport and lifestyle."],
  ["Average", "18-24%", "25-31%", "Common adult ranges; health context depends on waist, labs, activity, and history."],
  ["Higher range", "25%+", "32%+", "May deserve closer attention when paired with rising waist size or health markers."],
];

const faqs = [
  ["What is a healthy body fat percentage?", "There is no single healthy body fat percentage for everyone. Sex, age, waist size, training status, health markers, and medical history all matter. Use the chart as context, not a diagnosis."],
  ["What body fat percentage shows abs?", "Many men start seeing clearer abs in the low-to-mid teens, while women usually require a different and higher reference range. Muscle development, fat distribution, lighting, and posture all affect visibility."],
  ["Why do body fat charts disagree?", "Charts often use different source populations, category names, and measurement assumptions. The bigger issue is usually the measurement method: photos, smart scales, calipers, tape formulas, and DEXA can all produce different numbers."],
  ["Should I use pictures or a chart?", "Use both. A chart gives category context, while pictures help you compare visual changes. For progress, repeat photos and measurements under the same conditions."],
] as const;

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://aibodyfatcalculator.com/" },
    { "@type": "ListItem", position: 2, name: "Body Fat Percentage Chart", item: "https://aibodyfatcalculator.com/body-fat-percentage-chart" },
  ],
};

export default function Chart() {
  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div><a href="/body-fat-percentage-chart">Chart</a><a href="/male-body-fat-percentage-pictures">Men</a><a href="/female-body-fat-percentage-pictures">Women</a><a href="/body-fat-percentage-chart-men-women-age">By Age</a></div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">BODY FAT CHART HUB</div>
        <h1>Body Fat Percentage Chart</h1>
        <p className="tool-lede">Use this body fat percentage chart as the central reference for men, women, visual pictures, age context, and photo-based estimates. The goal is better interpretation, not false precision.</p>

        <nav className="topic-nav" aria-label="Body fat chart guides">
          <a href="/male-body-fat-percentage-pictures"><span>MEN</span><strong>Male body fat pictures</strong></a>
          <a href="/female-body-fat-percentage-pictures"><span>WOMEN</span><strong>Female body fat pictures</strong></a>
          <a href="/body-fat-percentage-chart-men-women-age"><span>AGE</span><strong>Chart by age</strong></a>
          <a href="/body-fat-estimate-pictures"><span>VISUALS</span><strong>Estimate pictures</strong></a>
        </nav>

        <div className="chart-table bodyfat-hub-table">
          <div className="chart-row chart-row-wide"><span>CATEGORY</span><b>MEN</b><b>WOMEN</b><strong>HOW TO READ IT</strong></div>
          {rows.map((row) => <div className="chart-row chart-row-wide" key={row[0]}><span>{row[0]}</span><b>{row[1]}</b><b>{row[2]}</b><strong>{row[3]}</strong></div>)}
        </div>

        <section className="content-block">
          <h2>How to use this chart</h2>
          <p>Track changes under similar conditions and focus on trends. Hydration, lighting, pose, clothing, measurement method, age, and individual physiology all influence body-composition readings.</p>
          <p>The categories overlap with athletic and health goals but do not define health, fitness, or appearance for an individual. Sex-specific ranges are broad population references and do not replace professional assessment.</p>
          <p>If you are comparing photos, use the same camera height, distance, lighting, posture, and time of day. A body fat chart is most useful when it turns a messy visual impression into a repeatable range.</p>
        </section>

        <section className="content-block">
          <h2>Men vs women body fat percentage chart</h2>
          <p>Women generally require higher essential fat than men, so the same category name does not mean the same percentage range. For example, a lean athletic range for women often overlaps with what would be considered average or higher for men.</p>
          <p>That difference is why mixed charts can mislead people. Use the men and women columns separately, then use the picture guides if you want visual context for how a range may look on different bodies.</p>
        </section>

        <section className="content-block">
          <h2>Why estimates from different methods disagree</h2>
          <p>Photo analysis, skinfolds, bioelectrical impedance, circumference equations, DXA, and multi-compartment laboratory methods estimate body composition in different ways. A result can shift when the method, device, operator, hydration status, or testing protocol changes.</p>
          <p>For progress tracking, keep the method and conditions as consistent as possible. Treat a small short-term movement cautiously and look for a repeated trend across several check-ins.</p>
          <p>To turn your own tape measurements into a number, run them through the <a href="/body-fat-calculator">body fat calculator</a>, which applies the U.S. Navy circumference equations and the BMI method side by side.</p>
        </section>

        <section className="content-block ffmi-faq">
          <h2>Body Fat Chart FAQ</h2>
          {faqs.map(([q, a], index) => <details key={q} open={index === 0}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}
        </section>

        <section className="content-block">
          <h2>Next body fat guides</h2>
          <div className="related-ffmi">
            <a href="/body-fat-percentage-chart-men-women-age"><span>AGE CONTEXT</span><strong>Body Fat Chart by Age →</strong></a>
            <a href="/how-to-measure-body-fat-at-home"><span>MEASUREMENT</span><strong>How to Measure Body Fat at Home →</strong></a>
            <a href="/body-fat-calculator-from-photo"><span>PHOTO TOOL</span><strong>Body Fat Calculator From Photo →</strong></a>
          </div>
        </section>
        <a className="back-cta" href="/">Try the AI body fat calculator →</a>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  );
}
