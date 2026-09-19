"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";
type Method = "navy" | "bmi";
type Sex = "male" | "female";

// Band labels and boundaries are written to one decimal place so that every
// result falls into exactly one row, with no gap between consecutive bands.
// These strings must stay in sync with classifyBodyFat() below.
const MEN_RANGES = [
  ["Essential fat", "below 6%"],
  ["Athletes", "6.0–13.9%"],
  ["Fitness", "14.0–17.9%"],
  ["Average", "18.0–24.9%"],
  ["Obese", "25.0% and above"],
];

const WOMEN_RANGES = [
  ["Essential fat", "below 14%"],
  ["Athletes", "14.0–20.9%"],
  ["Fitness", "21.0–24.9%"],
  ["Average", "25.0–31.9%"],
  ["Obese", "32.0% and above"],
];

function toInches(value: number, unit: Unit): number {
  return unit === "us" ? value : value / 2.54;
}

function toKilos(value: number, unit: Unit): number {
  return unit === "us" ? value * 0.453592 : value;
}

function estimateBodyFat(args: {
  unit: Unit;
  method: Method;
  sex: Sex;
  age: number;
  weight: number;
  height: number;
  neck: number;
  waist: number;
  hip: number;
}): number | null {
  const { unit, method, sex, age, weight, height, neck, waist, hip } = args;

  if (method === "navy") {
    const h = toInches(height, unit);
    const n = toInches(neck, unit);
    const w = toInches(waist, unit);
    if (!Number.isFinite(h) || !Number.isFinite(n) || !Number.isFinite(w)) return null;
    if (h <= 0 || n <= 0 || w <= 0) return null;

    if (sex === "male") {
      if (w - n <= 0) return null;
      return 86.01 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
    }
    const hp = toInches(hip, unit);
    if (!Number.isFinite(hp) || hp <= 0) return null;
    if (w + hp - n <= 0) return null;
    return 163.205 * Math.log10(w + hp - n) - 97.684 * Math.log10(h) - 78.387;
  }

  const hM = unit === "us" ? height * 0.0254 : height / 100;
  const wKg = toKilos(weight, unit);
  if (!Number.isFinite(hM) || hM <= 0 || !Number.isFinite(wKg) || wKg <= 0) return null;
  if (!Number.isFinite(age) || age <= 0) return null;

  const bmi = wKg / (hM * hM);
  return 1.2 * bmi + 0.23 * age - (sex === "male" ? 16.2 : 5.4);
}

// Boundaries use the same numbers as the tables above: each band is
// [start, next start) so consecutive bands meet with no gap.
function classifyBodyFat(bf: number, sex: Sex): string {
  if (sex === "male") {
    if (bf < 6) return "Essential fat";
    if (bf < 14) return "Athletes";
    if (bf < 18) return "Fitness";
    if (bf < 25) return "Average";
    return "Obese";
  }
  if (bf < 14) return "Essential fat";
  if (bf < 21) return "Athletes";
  if (bf < 25) return "Fitness";
  if (bf < 32) return "Average";
  return "Obese";
}

export default function BodyFatCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("us");
  const [method, setMethod] = useState<Method>("navy");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(180);
  const [height, setHeight] = useState(70);
  const [neck, setNeck] = useState(15);
  const [waist, setWaist] = useState(34);
  const [hip, setHip] = useState(38);

  const bf = estimateBodyFat({ unit, method, sex, age, weight, height, neck, waist, hip });
  const valid = bf !== null && Number.isFinite(bf) && bf > 0 && bf < 80;
  // The number shown to the reader is rounded to one decimal, so the band is
  // chosen from the rounded value. Otherwise 13.96 would print as "14.0%" but
  // still be labelled Athletes while the table puts 14.0% in Fitness.
  const bfShown = valid ? Number((bf as number).toFixed(1)) : null;
  const totalKg = toKilos(weight, unit);
  const fatKg = valid ? (totalKg * (bf as number)) / 100 : null;
  const leanKg = valid ? totalKg - (fatKg as number) : null;

  function switchUnit(next: Unit) {
    if (next === unit) return;
    if (next === "metric") {
      setWeight(Math.round(weight * 0.453592));
      setHeight(Math.round(height * 2.54));
      setNeck(Math.round(neck * 2.54));
      setWaist(Math.round(waist * 2.54));
      setHip(Math.round(hip * 2.54));
    } else {
      setWeight(Math.round(weight / 0.453592));
      setHeight(Math.round(height / 2.54));
      setNeck(Math.round(neck / 2.54));
      setWaist(Math.round(waist / 2.54));
      setHip(Math.round(hip / 2.54));
    }
    setUnit(next);
  }

  const lengthUnit = unit === "us" ? "in" : "cm";
  const massUnit = unit === "us" ? "lb" : "kg";

  return (
    <div className="tool-page">
      <Nav />
      <main className="tool-main">
        <div className="tool-eyebrow">FREE BODY COMPOSITION TOOL</div>
        <h1>Body Fat Calculator</h1>
        <p className="tool-lede">
          Estimate your body fat percentage in your browser with the U.S. Navy circumference method or
          the BMI method. No photo, no upload, no login.
        </p>

        <div className="calc-layout">
          <div className="calc-card">
            <div className="field-grid">
              <Field label="Units">
                <select value={unit} onChange={(e) => switchUnit(e.target.value as Unit)}>
                  <option value="us">US (in / lb)</option>
                  <option value="metric">Metric (cm / kg)</option>
                </select>
              </Field>
              <Field label="Method">
                <select value={method} onChange={(e) => setMethod(e.target.value as Method)}>
                  <option value="navy">U.S. Navy</option>
                  <option value="bmi">BMI method</option>
                </select>
              </Field>
              <Field label="Sex">
                <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </Field>
              <Field label="Age">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(+e.target.value)}
                />
              </Field>
              <Field label={`Weight (${massUnit})`}>
                <input
                  type="number"
                  min={1}
                  value={weight}
                  onChange={(e) => setWeight(+e.target.value)}
                />
              </Field>
              <Field label={`Height (${lengthUnit})`}>
                <input
                  type="number"
                  min={1}
                  value={height}
                  onChange={(e) => setHeight(+e.target.value)}
                />
              </Field>
              {method === "navy" ? (
                <>
                  <Field label={`Neck (${lengthUnit})`}>
                    <input
                      type="number"
                      min={1}
                      value={neck}
                      onChange={(e) => setNeck(+e.target.value)}
                    />
                  </Field>
                  <Field label={`Waist (${lengthUnit})`}>
                    <input
                      type="number"
                      min={1}
                      value={waist}
                      onChange={(e) => setWaist(+e.target.value)}
                    />
                  </Field>
                  {sex === "female" ? (
                    <Field label={`Hip (${lengthUnit})`}>
                      <input
                        type="number"
                        min={1}
                        value={hip}
                        onChange={(e) => setHip(+e.target.value)}
                      />
                    </Field>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          <div className="answer-card">
            <span>YOUR BODY FAT</span>
            <div className="answer-number">
              {valid ? `${(bfShown as number).toFixed(1)}%` : "—"}
            </div>
            {valid ? (
              <>
                <p>
                  {classifyBodyFat(bfShown as number, sex)} range by the American Council on Exercise
                  categories.
                </p>
                <p>
                  Fat mass {(fatKg as number).toFixed(1)} kg ({((fatKg as number) * 2.20462).toFixed(1)}{" "}
                  lb) · Lean mass {(leanKg as number).toFixed(1)} kg (
                  {((leanKg as number) * 2.20462).toFixed(1)} lb)
                </p>
              </>
            ) : (
              <p>Enter your measurements to see an estimate.</p>
            )}
          </div>
        </div>

        <section className="content-block">
          <h2>How this calculator works</h2>
          <p>
            Two established methods are offered. Both are approximations built on population data, so
            treat the number as a range signal rather than an exact value.
          </p>
          <h3>U.S. Navy circumference method</h3>
          <p>
            Uses measured circumferences (neck and waist, plus hip for women) together with height. The
            equations were developed by Hodgdon and Beckett at the Naval Health Research Center in 1984
            and are documented in the U.S. Navy Physical Readiness Program. It is the more common
            at-home estimate because it needs only a tape measure.
          </p>
          <h3>BMI method</h3>
          <p>
            Derives body fat from BMI together with age and sex. It needs only height, weight, and age,
            but it is less precise because BMI does not separate muscle from fat. Use it as a quick
            cross-check rather than a primary figure.
          </p>
          <div className="formula-box">
            <span>BMI METHOD</span>
            <strong>1.20 × BMI + 0.23 × age − 16.2 (men) / − 5.4 (women)</strong>
          </div>
        </section>

        <section className="content-block">
          <h2>Body fat category ranges</h2>
          <p>
            Categories follow the American Council on Exercise (ACE) adult reference ranges. Your result
            is placed into the matching band.
          </p>
          <h3>Men</h3>
          <div className="chart-table">
            <div className="chart-row">
              <span>Category</span>
              <b>Body fat %</b>
              <span>Context</span>
            </div>
            {MEN_RANGES.map(([name, range]) => (
              <div className="chart-row" key={name}>
                <span>{name}</span>
                <b>{range}</b>
                <span>ACE reference</span>
              </div>
            ))}
          </div>
          <h3>Women</h3>
          <div className="chart-table">
            <div className="chart-row">
              <span>Category</span>
              <b>Body fat %</b>
              <span>Context</span>
            </div>
            {WOMEN_RANGES.map(([name, range]) => (
              <div className="chart-row" key={name}>
                <span>{name}</span>
                <b>{range}</b>
                <span>ACE reference</span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-block">
          <h2>How accurate is a body fat calculator?</h2>
          <p>
            Calculators give an estimate, not a measurement. The U.S. Navy and BMI methods are based on
            population averages, so results vary by person. Clinics use DEXA, hydrostatic weighing, or
            air-displacement plethysmography when a precise figure is needed.
          </p>
          <p>
            <b>Not medical advice.</b> This tool gives an estimate based on published formulas, not a
            clinical measurement. Body composition varies by individual. If you have health concerns,
            talk to a qualified healthcare professional. See our <a href="/disclaimer">disclaimer</a>.
          </p>
        </section>

        <section className="content-block">
          <h2>Related body composition tools</h2>
          <p>
            <a href="/">Estimate body fat from a photo</a>, calculate{" "}
            <a href="/ffmi-calculator">fat-free mass index</a>, work out{" "}
            <a href="/tdee-calculator">daily energy expenditure</a>, or review the{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a>.
          </p>
        </section>

        <a className="back-cta" href="/">
          Get a visual body-fat estimate →
        </a>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Nav() {
  return (
    <header className="tool-nav">
      <a href="/">BF · AI Body Fat Calculator</a>
      <div>
        <a href="/progress-tracker">Progress</a>
        <a href="/tdee-calculator">TDEE</a>
        <a href="/ffmi-calculator">FFMI</a>
        <a href="/body-fat-percentage-chart">Body Fat Chart</a>
      </div>
    </header>
  );
}
