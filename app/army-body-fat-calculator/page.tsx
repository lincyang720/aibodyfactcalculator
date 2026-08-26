import type { Metadata } from "next";
import ArmyCalculator from "./ArmyCalculator";
import "../tool-pages.css";
import "./army.css";
import { buildPageMetadata } from "../site-metadata";

const canonical="https://aibodyfatcalculator.com/army-body-fat-calculator";

export const metadata:Metadata=buildPageMetadata({
  title:"Army Body Fat Calculator — 2026 WHtR Standard",
  description:"Free Army body fat calculator updated for Army Directive 2026-13. Calculate waist-to-height ratio and check the current 0.550 Army standard.",
  path:"/army-body-fat-calculator",
});

const faqs=[
  ["What is the current Army body composition standard?","Army Directive 2026-13 uses waist-to-height ratio as the sole body composition assessment. A recorded WHtR below 0.550 meets the standard."],
  ["Does the Army still use the neck and waist tape test?","No. In July 2026, the Army rescinded previous body-fat assessment methods and replaced them with waist-to-height ratio."],
  ["How do I calculate Army waist-to-height ratio?","Measure waist circumference at the navel and divide it by height using the same unit. The recorded result is truncated to three decimal places, not rounded."],
  ["Does an AFT score provide an exemption?","No. Under the July 2026 policy, all Soldiers must meet the WHtR standard regardless of Army Fitness Test score."],
] as const;

const faqSchema={"@context":"https://schema.org","@type":"FAQPage",mainEntity:faqs.map(([question,answer])=>({"@type":"Question",name:question,acceptedAnswer:{"@type":"Answer",text:answer}}))};
const appSchema={"@context":"https://schema.org","@type":"SoftwareApplication",name:"BodyLens Army Body Fat Calculator",alternateName:"Army Body Fat Calculator",applicationCategory:"HealthApplication",operatingSystem:"Web",url:canonical,brand:{"@type":"Brand",name:"BodyLens"},publisher:{"@id":"https://aibodyfatcalculator.com/#organization"},isAccessibleForFree:true,offers:{"@type":"Offer",price:"0",priceCurrency:"USD"}};
const breadcrumbSchema={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:"https://aibodyfatcalculator.com/"},{"@type":"ListItem",position:2,name:"Army Body Fat Calculator",item:canonical}]};

export default function ArmyBodyFatCalculatorPage(){return <div className="tool-page">
  <header className="tool-nav"><a href="/">BF · BodyLens</a><div><a href="/army-body-fat-calculator">Army</a><a href="/tdee-calculator">TDEE</a><a href="/bmi-calculator">BMI</a><a href="/body-fat-percentage-chart">Body Fat Chart</a></div></header>
  <main className="tool-main army-page">
    <div className="tool-eyebrow">UPDATED FOR ARMY DIRECTIVE 2026-13</div>
    <h1>Army Body Fat Calculator</h1>
    <p className="tool-lede">Check the current U.S. Army body composition standard using waist-to-height ratio (WHtR). The Army replaced its previous height/weight tables and tape-test body-fat formulas in July 2026.</p>
    <div className="policy-alert"><strong>Current rule:</strong> waist at the navel ÷ height. A recorded result below 0.550 passes; 0.550 or higher does not.</div>
    <ArmyCalculator/>
    <section className="content-block"><h2>How the 2026 Army calculation works</h2><ol><li>Measure your standing height.</li><li>Measure waist circumference at the navel using the same unit.</li><li>Divide waist by height.</li><li>Keep three decimal places by truncating additional digits. Do not round.</li></ol><div className="formula-box"><span>Army WHtR formula</span><strong>waist circumference ÷ height</strong><small>Example: 38 in ÷ 70 in = 0.542857… → recorded as 0.542 → meets the standard.</small></div></section>
    <section className="content-block"><h2>What changed from the old Army tape test?</h2><p>Search results and older calculators may still ask for sex, age, body weight, neck circumference, or hip circumference. Those inputs belonged to earlier Army body-fat estimation methods. Army Directive 2026-13 made WHtR the sole authorized body composition assessment and removed fitness-test exemptions.</p><div className="change-table"><div><b>Previous methods</b><span>Height/weight tables, circumference body-fat equations, supplemental assessments</span></div><div><b>Current method</b><span>One standard for all Soldiers: waist-to-height ratio below 0.550</span></div></div></section>
    <section className="content-block source-block"><h2>Official sources</h2><p>This calculator reflects the policy announced July 7, 2026. Always follow your unit&apos;s official measurement and confirmation process.</p><ul><li><a href="https://www.army.mil/article/293753" rel="noopener noreferrer">U.S. Army: Army modifies body composition program</a></li><li><a href="https://www.army.mil/tellyourformation/index.html" rel="noopener noreferrer">Army Directive 2026-13 policy summary</a></li><li><a href="https://www.armyresilience.army.mil/Army-Body-Composition-Program/FAQ/" rel="noopener noreferrer">Official Army Body Composition Program FAQ</a></li></ul></section>
    <section className="content-block army-faq"><h2>Frequently asked questions</h2>{faqs.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
    <p className="official-disclaimer">Independent educational tool. Not affiliated with or endorsed by the U.S. Army or Department of Defense. Only an official Army assessment determines compliance.</p>
    <a className="back-cta" href="/">Try the AI photo body-fat estimate →</a>
  </main>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqSchema)}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(appSchema)}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbSchema)}}/>
</div>}
