"use client";

import { useMemo, useState } from "react";

type Unit = "imperial" | "metric";

function truncateToThree(value:number) {
  return Math.trunc(value * 1000) / 1000;
}

export default function ArmyCalculator() {
  const [unit,setUnit]=useState<Unit>("imperial");
  const [feet,setFeet]=useState(5);
  const [inches,setInches]=useState(10);
  const [waistInches,setWaistInches]=useState(34);
  const [heightCm,setHeightCm]=useState(178);
  const [waistCm,setWaistCm]=useState(86);

  const result=useMemo(()=>{
    const height=unit==="imperial" ? feet*12+inches : heightCm;
    const waist=unit==="imperial" ? waistInches : waistCm;
    if(!Number.isFinite(height)||!Number.isFinite(waist)||height<=0||waist<=0) return null;
    const recorded=truncateToThree(waist/height);
    return {recorded,passes:recorded<0.55,maxWaist:height*0.55};
  },[unit,feet,inches,waistInches,heightCm,waistCm]);

  return <div className="calc-layout army-calc-layout">
    <div className="calc-card">
      <div className="unit-toggle" aria-label="Measurement unit">
        <button type="button" className={unit==="imperial"?"active":""} onClick={()=>setUnit("imperial")}>US units</button>
        <button type="button" className={unit==="metric"?"active":""} onClick={()=>setUnit("metric")}>Metric</button>
      </div>
      {unit==="imperial" ? <div className="field-grid army-fields">
        <Field label="Height — feet"><input min="4" max="8" step="1" type="number" value={feet} onChange={e=>setFeet(Number(e.target.value))}/></Field>
        <Field label="Height — inches"><input min="0" max="11.5" step="0.5" type="number" value={inches} onChange={e=>setInches(Number(e.target.value))}/></Field>
        <Field label="Waist at navel — inches"><input min="15" max="90" step="0.1" type="number" value={waistInches} onChange={e=>setWaistInches(Number(e.target.value))}/></Field>
      </div> : <div className="field-grid">
        <Field label="Height — centimeters"><input min="120" max="250" step="0.1" type="number" value={heightCm} onChange={e=>setHeightCm(Number(e.target.value))}/></Field>
        <Field label="Waist at navel — centimeters"><input min="40" max="230" step="0.1" type="number" value={waistCm} onChange={e=>setWaistCm(Number(e.target.value))}/></Field>
      </div>}
      <div className="measurement-note"><strong>Measure at the navel.</strong> Keep the tape horizontal and snug without compressing the skin. Official Army assessments use trained measurement teams.</div>
    </div>
    <div className={`answer-card army-answer ${result?.passes?"passes":"fails"}`}>
      <span>RECORDED WAIST-TO-HEIGHT RATIO</span>
      <div className="answer-number">{result ? result.recorded.toFixed(3) : "—"}</div>
      {result && <>
        <div className="status-pill">{result.passes ? "MEETS CURRENT ARMY STANDARD" : "DOES NOT MEET CURRENT STANDARD"}</div>
        <p>The July 2026 standard requires a recorded WHtR below 0.550. The Army truncates after three decimal places rather than rounding.</p>
        <p className="result-detail">To remain below 0.550 at this height, waist circumference must be under <strong>{unit==="imperial"?`${result.maxWaist.toFixed(1)} in`:`${result.maxWaist.toFixed(1)} cm`}</strong>.</p>
      </>}
    </div>
  </div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}) {
  return <label className="field"><span>{label}</span>{children}</label>;
}
