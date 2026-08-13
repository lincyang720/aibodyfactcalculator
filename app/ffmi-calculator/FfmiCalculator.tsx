"use client";

import { useEffect, useMemo, useState } from "react";

type Unit="metric"|"imperial";

const scale=[
  {max:17,label:"Below average",tone:"gray"},
  {max:19,label:"Average",tone:"blue"},
  {max:21,label:"Above average",tone:"green"},
  {max:24,label:"Excellent",tone:"deep-green"},
  {max:26,label:"Superior",tone:"gold"},
  {max:28,label:"Very high",tone:"orange"},
  {max:Infinity,label:"Extremely high",tone:"red"},
] as const;

export default function FfmiCalculator(){
  const [unit,setUnit]=useState<Unit>("metric");
  const [heightCm,setHeightCm]=useState(178);
  const [weightKg,setWeightKg]=useState(79);
  const [feet,setFeet]=useState(5);
  const [inches,setInches]=useState(10);
  const [pounds,setPounds]=useState(175);
  const [bodyFat,setBodyFat]=useState(15);

  useEffect(()=>{
    const value=Number(new URLSearchParams(window.location.search).get("bodyFat"));
    if(Number.isFinite(value)&&value>=2&&value<=70){
      const update=window.setTimeout(()=>setBodyFat(value),0);
      return ()=>window.clearTimeout(update);
    }
  },[]);

  const result=useMemo(()=>{
    const heightM=unit==="metric"?heightCm/100:(feet*12+inches)*0.0254;
    const weight=unit==="metric"?weightKg:pounds*0.45359237;
    if(!Number.isFinite(heightM)||!Number.isFinite(weight)||!Number.isFinite(bodyFat)||heightM<=0||weight<=0||bodyFat<0||bodyFat>=100) return null;
    const fatMassKg=weight*(bodyFat/100);
    const leanMassKg=weight-fatMassKg;
    const ffmi=leanMassKg/(heightM**2);
    const normalized=ffmi+6.3*(1.8-heightM);
    const category=scale.find(item=>normalized<item.max)??scale[scale.length-1];
    return {ffmi,normalized,leanMassKg,fatMassKg,category,pointer:Math.max(1,Math.min(99,((normalized-14)/16)*100))};
  },[unit,heightCm,weightKg,feet,inches,pounds,bodyFat]);

  return <>
    <div className="calc-layout ffmi-calc-layout">
      <div className="calc-card">
        <div className="unit-toggle" aria-label="Measurement unit"><button type="button" className={unit==="metric"?"active":""} onClick={()=>setUnit("metric")}>Metric</button><button type="button" className={unit==="imperial"?"active":""} onClick={()=>setUnit("imperial")}>US units</button></div>
        {unit==="metric"?<div className="slider-fields"><SliderField label="Height" value={heightCm} min={120} max={220} step={1} unit="cm" onChange={setHeightCm}/><SliderField label="Weight" value={weightKg} min={30} max={160} step={0.5} unit="kg" onChange={setWeightKg}/><SliderField label="Body fat" value={bodyFat} min={2} max={70} step={0.5} unit="%" onChange={setBodyFat}/></div>:<div className="slider-fields"><div className="imperial-height"><SliderField label="Height — feet" value={feet} min={3} max={8} step={1} unit="ft" onChange={setFeet}/><SliderField label="Height — inches" value={inches} min={0} max={11.5} step={0.5} unit="in" onChange={setInches}/></div><SliderField label="Weight" value={pounds} min={65} max={350} step={1} unit="lb" onChange={setPounds}/><SliderField label="Body fat" value={bodyFat} min={2} max={70} step={0.5} unit="%" onChange={setBodyFat}/></div>}
        <a className="photo-estimate-link" href="/#analyzer"><strong>Don&apos;t know your body-fat percentage?</strong><span>Use our AI Body Fat Calculator from a photo →</span></a>
      </div>
      <div className="answer-card ffmi-answer">
        <span>YOUR FFMI</span><div className="answer-number">{result?result.ffmi.toFixed(1):"—"}</div>
        {result&&<><div className={`ffmi-category ${result.category.tone}`}>{result.category.label}</div><div className="ffmi-results"><div><span>Fat-free mass</span><strong>{formatMass(result.leanMassKg,unit)}</strong></div><div><span>Body fat</span><strong>{formatMass(result.fatMassKg,unit)} · {bodyFat.toFixed(1)}%</strong></div><div><span>FFMI</span><strong>{result.ffmi.toFixed(2)}</strong></div><div><span>Normalized FFMI</span><strong>{result.normalized.toFixed(2)}</strong></div></div></>}
        <p>FFMI is an estimate, not a diagnosis or proof of performance-enhancing drug use. Accuracy depends on the body-fat value entered.</p>
      </div>
    </div>
    {result&&<section className="ffmi-gauge" aria-label="Normalized FFMI scale"><div className="gauge-heading"><div><span>NORMALIZED FFMI</span><strong>{result.normalized.toFixed(1)} · {result.category.label}</strong></div><small>Height-adjusted to 1.80 m</small></div><div className="gauge-track"><i style={{left:`${result.pointer}%`}}/><div className="gray"/><div className="blue"/><div className="green"/><div className="deep-green"/><div className="gold"/><div className="orange"/><div className="red"/></div><div className="gauge-ticks"><span>14</span><span>17</span><span>19</span><span>21</span><span>24</span><span>26</span><span>28</span><span>30+</span></div>{result.normalized>=26&&<p className="high-ffmi-note"><strong>Research context:</strong> This value is above the frequently cited 25–26 reference from a preliminary 1995 study of male athletes. It is not evidence of drug use; genetics, measurement error, sex, sport and body composition method all matter.</p>}</section>}
  </>;
}

function SliderField({label,value,min,max,step,unit,onChange}:{label:string;value:number;min:number;max:number;step:number;unit:string;onChange:(value:number)=>void}){return <label className="slider-field"><span>{label}<b><input aria-label={`${label} value`} type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>{unit}</b></span><input aria-label={`${label} slider`} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/><small><i>{min}</i><i>{max}</i></small></label>}
function formatMass(kg:number,unit:Unit){return unit==="metric"?`${kg.toFixed(1)} kg`:`${(kg/0.45359237).toFixed(1)} lb`}
