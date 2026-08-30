"use client";

import { useMemo, useState } from "react";
import "../tool-pages.css";

export default function PsmfPage(){
  const [weight,setWeight]=useState(75),[fat,setFat]=useState(20);
  const lean=useMemo(()=>weight*(1-fat/100),[weight,fat]);
  const protein=Math.round(lean*2.2);
  return <div className="tool-page"><Nav/><main className="tool-main">
    <div className="tool-eyebrow">ADVANCED DIET PLANNING ESTIMATE</div><h1>PSMF Calculator</h1><p className="tool-lede">Estimate lean body mass and a simple protein planning target for a protein-sparing modified fast. PSMF is an aggressive clinical-style protocol, not a routine everyday diet.</p>
    <div className="calc-layout"><div className="calc-card"><div className="field-grid">
      <Field label="Weight (kg)"><input type="number" min="35" max="350" value={weight} onChange={e=>setWeight(+e.target.value)}/></Field>
      <Field label="Body fat (%)"><input type="number" min="3" max="65" value={fat} onChange={e=>setFat(+e.target.value)}/></Field>
    </div></div><div className="answer-card"><span>PROTEIN PLANNING ESTIMATE</span><div className="answer-number">{protein} <small>grams/day</small></div><p>Estimated lean mass: {lean.toFixed(1)} kg. This output uses 2.2 g per kg of estimated lean mass and is not an individualized prescription.</p></div></div>

    <section className="content-block"><h2>How this estimate works</h2><p>The calculator estimates fat-free mass from body weight and body-fat percentage, then multiplies estimated lean mass by 2.2 grams. Errors in the body-fat input flow directly into the protein result.</p><div className="formula-box"><span>PLANNING FORMULA</span><strong>weight × (1 − body fat %) × 2.2 g</strong></div></section>
    <section className="content-block"><h2>Important safety limitations</h2><p>PSMF can involve severe energy restriction and should be designed and monitored by a qualified clinician. It can be inappropriate during pregnancy or breastfeeding, adolescence, eating-disorder recovery, or with kidney, liver, gallbladder, metabolic, cardiovascular, or other medical conditions.</p><p>Medication needs can also change during rapid weight loss. Do not start a PSMF or change medication based on this calculator.</p></section>
    <section className="content-block"><h2>Why the result is only a starting estimate</h2><p>Protein needs depend on training, age, medical history, current energy intake, body composition, and the protocol used by a supervising professional. Visual body-fat estimates also have individual error, so avoid treating the displayed number as exact.</p></section>
    <section className="content-block"><h2>Use a less aggressive planning tool</h2><p>For ordinary calorie planning, start with the <a href="/tdee-calculator">TDEE calculator</a>. For body composition context, use the <a href="/ffmi-calculator">FFMI calculator</a> or create a directional baseline with the <a href="/">photo analyzer</a>.</p></section>
    <a className="back-cta" href="/">Estimate body fat from a photo →</a>
  </main></div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}
function Nav(){return <header className="tool-nav"><a href="/">BF · AI Body Fat Calculator</a><div><a href="/progress-tracker">Progress</a><a href="/tdee-calculator">TDEE</a><a href="/bmi-calculator">BMI</a><a href="/psmf-calculator">PSMF</a></div></header>}
