"use client";

import { useMemo, useState } from "react";
import "../tool-pages.css";

const categories = [
  ["Below 18.5", "Underweight"],
  ["18.5–24.9", "Healthy range"],
  ["25.0–29.9", "Overweight"],
  ["30.0 or higher", "Obesity range"],
];

export default function BmiPage() {
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(178);
  const bmi = useMemo(() => weight / ((height / 100) ** 2), [weight, height]);
  const level = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy range" : bmi < 30 ? "Overweight" : "Obesity range";

  return <div className="tool-page"><Nav/><main className="tool-main">
    <div className="tool-eyebrow">FREE HEALTH SCREENING TOOL</div>
    <h1>BMI Calculator</h1>
    <p className="tool-lede">Calculate adult body mass index from height and weight, then understand what the result can—and cannot—tell you about body composition.</p>
    <div className="calc-layout"><div className="calc-card"><div className="field-grid">
      <Field label="Weight (kg)"><input type="number" min="25" max="350" value={weight} onChange={e=>setWeight(+e.target.value)}/></Field>
      <Field label="Height (cm)"><input type="number" min="100" max="250" value={height} onChange={e=>setHeight(+e.target.value)}/></Field>
    </div></div><div className="answer-card"><span>YOUR BMI</span><div className="answer-number">{Number.isFinite(bmi) ? bmi.toFixed(1) : "—"}</div><p>{level}. BMI is a population-level screening measure and does not distinguish muscle mass from body fat.</p></div></div>

    <section className="content-block"><h2>How BMI is calculated</h2><p>BMI divides weight in kilograms by height in meters squared. For example, a person who weighs 75 kg and is 1.78 m tall has a BMI of 75 ÷ 1.78² = 23.7.</p><div className="formula-box"><span>BMI FORMULA</span><strong>weight (kg) ÷ height² (m)</strong></div></section>
    <section className="content-block"><h2>Adult BMI categories</h2><div className="chart-table"><div className="chart-row"><span>BMI</span><b>Category</b><b>Use</b></div>{categories.map(([range,category])=><div className="chart-row" key={range}><span>{range}</span><b>{category}</b><span>Screening context</span></div>)}</div><p>Categories are screening references, not diagnoses. Age, pregnancy, ethnicity, muscle mass, and individual health history can change how a clinician interprets the same result.</p></section>
    <section className="content-block"><h2>When BMI can be misleading</h2><p>BMI cannot tell whether weight comes from fat, muscle, bone, or fluid. Strength athletes may have a high BMI with relatively low body fat, while someone can have a BMI in the standard range and still carry more abdominal fat than expected.</p><p>Use waist measurements, consistent progress photos, performance, and a qualified professional&apos;s assessment when you need more context than height and weight provide.</p></section>
    <section className="content-block"><h2>Related body composition tools</h2><p><a href="/">Estimate body fat from a photo</a>, calculate <a href="/ffmi-calculator">fat-free mass index</a>, or review the <a href="/body-fat-percentage-chart">body fat percentage chart</a>.</p></section>
    <a className="back-cta" href="/">Get a visual body-fat estimate →</a>
  </main></div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}
function Nav(){return <header className="tool-nav"><a href="/">BF · BodyLens</a><div><a href="/progress-tracker">Progress</a><a href="/tdee-calculator">TDEE</a><a href="/ffmi-calculator">FFMI</a><a href="/body-fat-percentage-chart">Body Fat Chart</a></div></header>}
