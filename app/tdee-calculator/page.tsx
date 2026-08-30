"use client";

import { useMemo, useState } from "react";
import "../tool-pages.css";

const activities = [
  [1.2, "Sedentary", "Mostly seated, little planned exercise"],
  [1.375, "Lightly active", "Light exercise about 1–3 days/week"],
  [1.55, "Moderately active", "Moderate exercise about 3–5 days/week"],
  [1.725, "Very active", "Hard exercise about 6–7 days/week"],
] as const;

export default function TdeePage(){
  const [sex,setSex]=useState("male"),[age,setAge]=useState(30),[weight,setWeight]=useState(75),[height,setHeight]=useState(178),[activity,setActivity]=useState(1.55);
  const bmr=useMemo(()=>Math.round((10*weight)+(6.25*height)-(5*age)+(sex==="male"?5:-161)),[sex,age,weight,height]);
  const tdee=useMemo(()=>Math.round(bmr*activity),[bmr,activity]);
  return <div className="tool-page"><Nav/><main className="tool-main">
    <div className="tool-eyebrow">FREE DAILY ENERGY TOOL</div><h1>TDEE Calculator</h1><p className="tool-lede">Estimate total daily energy expenditure using the Mifflin–St Jeor equation, then calibrate the estimate against your real two-week weight trend.</p>
    <div className="calc-layout"><div className="calc-card"><div className="field-grid">
      <Field label="Sex used by equation"><select value={sex} onChange={e=>setSex(e.target.value)}><option value="male">Male</option><option value="female">Female</option></select></Field>
      <Field label="Age"><input type="number" min="18" max="100" value={age} onChange={e=>setAge(+e.target.value)}/></Field>
      <Field label="Weight (kg)"><input type="number" min="25" max="350" value={weight} onChange={e=>setWeight(+e.target.value)}/></Field>
      <Field label="Height (cm)"><input type="number" min="100" max="250" value={height} onChange={e=>setHeight(+e.target.value)}/></Field>
      <Field label="Activity"><select value={activity} onChange={e=>setActivity(+e.target.value)}>{activities.map(([factor,label])=><option value={factor} key={factor}>{label}</option>)}</select></Field>
    </div></div><div className="answer-card"><span>ESTIMATED DAILY BURN</span><div className="answer-number">{tdee.toLocaleString()} <small>kcal/day</small></div><p>Estimated resting needs: {bmr.toLocaleString()} kcal/day. For gradual fat loss, a cautious starting point is near {Math.max(1200,tdee-400).toLocaleString()} kcal, followed by real-world calibration.</p></div></div>

    <section className="content-block"><h2>What TDEE means</h2><p>Total Daily Energy Expenditure combines estimated resting metabolic needs with movement, work, daily activity, and exercise. The calculator first estimates basal metabolic rate, then applies an activity multiplier.</p><div className="formula-box"><span>MIFFLIN–ST JEOR</span><strong>BMR × activity factor = estimated TDEE</strong></div></section>
    <section className="content-block"><h2>Activity factors</h2><div className="chart-table"><div className="chart-row"><span>Level</span><b>Factor</b><b>General description</b></div>{activities.map(([factor,label,description])=><div className="chart-row" key={factor}><span>{label}</span><b>{factor}</b><span>{description}</span></div>)}</div><p>Activity categories are broad. Step count, job demands, training volume, body size, and individual metabolism can make the same label inaccurate for two different people.</p></section>
    <section className="content-block"><h2>How to calibrate your result</h2><ol><li>Choose a consistent daily intake near the estimate.</li><li>Track morning body weight under similar conditions for at least two weeks.</li><li>Compare weekly averages, not single weigh-ins.</li><li>Adjust gradually if the trend differs from your goal.</li></ol><p>Do not treat the output as a prescription. Pregnancy, adolescence, eating-disorder recovery, medical conditions, and some medications require individual professional guidance.</p></section>
    <section className="content-block"><h2>Connect energy needs to body composition</h2><p>Use the <a href="/">photo body-fat estimate</a> as a directional baseline, calculate <a href="/ffmi-calculator">FFMI</a>, and follow changes with the <a href="/progress-tracker">physique progress tracker</a>.</p></section>
    <a className="back-cta" href="/">Analyze body fat from a photo →</a>
  </main></div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}
function Nav(){return <header className="tool-nav"><a href="/">BF · AI Body Fat Calculator</a><div><a href="/progress-tracker">Progress</a><a href="/tdee-calculator">TDEE</a><a href="/bmi-calculator">BMI</a><a href="/psmf-calculator">PSMF</a></div></header>}
