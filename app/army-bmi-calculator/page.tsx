"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";
type Sex = "male" | "female";

const IN = 2.54;
const LB = 2.20462;

// ---- The Army standard this page checks against -----------------------------
// Same numbers the site uses on /army-body-fat-calculator: the current U.S. Army
// body composition assessment is waist-to-height ratio, the recorded value is
// truncated (not rounded) to three decimals, and the line is 0.550.
const ARMY_LINE = 0.55;

function truncateToThree(value: number): number {
  return Math.trunc(value * 1000) / 1000;
}

// ---- This page's own five-zone central storage scale ------------------------
// Compiled by this page so that waist circumference, waist-to-height ratio and
// waist-to-hip ratio can be read off one axis. Zone 4 begins exactly at the
// Army 0.550 line, which is the only reason the boundaries sit where they do.
// It is an indexing scale for self-tracking, not a clinical classification.
const ZONES: { z: number; lo: number; hi: number; label: string; note: string }[] = [
  { z: 1, lo: 0.0, hi: 0.45, label: "Low central storage", note: "Waist is small relative to height." },
  { z: 2, lo: 0.45, hi: 0.5, label: "Moderate", note: "The band most healthy adults land in." },
  { z: 3, lo: 0.5, hi: 0.55, label: "Elevated", note: "Still under the Army line, but not by much." },
  { z: 4, lo: 0.55, hi: 0.6, label: "High", note: "Starts exactly at the Army 0.550 standard." },
  { z: 5, lo: 0.6, hi: 99, label: "Very high", note: "Waist is large relative to height at any frame size." },
];

function zoneFor(whtr: number) {
  return ZONES.find((x) => whtr >= x.lo && whtr < x.hi) ?? ZONES[ZONES.length - 1];
}

// Body fat estimate from BMI, using the same equation the site runs on
// /body-fat-percentage-calculator: 1.20 x BMI + 0.23 x age - 16.2 (men) / -5.4 (women).
function bmiBodyFat(bmi: number, age: number, sex: Sex): number {
  return 1.2 * bmi + 0.23 * age - (sex === "male" ? 16.2 : 5.4);
}

function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight range";
  if (bmi < 25) return "Healthy weight range";
  if (bmi < 30) return "Overweight range";
  return "Obesity range";
}

const ZONE_ROWS: [string, string, string, string][] = [
  ["Zone 1", "Below 0.450", "Low central storage", "Waist is small relative to height."],
  ["Zone 2", "0.450 – 0.499", "Moderate", "The band most healthy adults land in."],
  ["Zone 3", "0.500 – 0.549", "Elevated", "Under the Army line, but with little margin."],
  ["Zone 4", "0.550 – 0.599", "High", "Begins exactly at the Army 0.550 standard."],
  ["Zone 5", "0.600 and above", "Very high", "Large relative to height at any frame size."],
];

const BOUNDARY_ROWS: [string, string, string, string, string][] = [
  ["150 cm", "67.5 cm", "75.0 cm", "82.5 cm", "90.0 cm"],
  ["155 cm", "69.8 cm", "77.5 cm", "85.3 cm", "93.0 cm"],
  ["160 cm", "72.0 cm", "80.0 cm", "88.0 cm", "96.0 cm"],
  ["165 cm", "74.3 cm", "82.5 cm", "90.8 cm", "99.0 cm"],
  ["170 cm", "76.5 cm", "85.0 cm", "93.5 cm", "102.0 cm"],
  ["175 cm", "78.8 cm", "87.5 cm", "96.3 cm", "105.0 cm"],
  ["180 cm", "81.0 cm", "90.0 cm", "99.0 cm", "108.0 cm"],
  ["185 cm", "83.3 cm", "92.5 cm", "101.8 cm", "111.0 cm"],
  ["190 cm", "85.5 cm", "95.0 cm", "104.5 cm", "114.0 cm"],
  ["195 cm", "87.8 cm", "97.5 cm", "107.3 cm", "117.0 cm"],
  ["200 cm", "90.0 cm", "100.0 cm", "110.0 cm", "120.0 cm"],
];

const BOUNDARY_ROWS_US: [string, string, string, string, string][] = [
  ["60 in", "27.0 in", "30.0 in", "33.0 in", "36.0 in"],
  ["64 in", "28.8 in", "32.0 in", "35.2 in", "38.4 in"],
  ["66 in", "29.7 in", "33.0 in", "36.3 in", "39.6 in"],
  ["68 in", "30.6 in", "34.0 in", "37.4 in", "40.8 in"],
  ["70 in", "31.5 in", "35.0 in", "38.5 in", "42.0 in"],
  ["72 in", "32.4 in", "36.0 in", "39.6 in", "43.2 in"],
  ["74 in", "33.3 in", "37.0 in", "40.7 in", "44.4 in"],
  ["76 in", "34.2 in", "38.0 in", "41.8 in", "45.6 in"],
];

const FIXED_WAIST_ROWS: [string, string, string][] = [
  ["150 cm", "0.633", "Zone 5 — very high"],
  ["155 cm", "0.613", "Zone 5 — very high"],
  ["160 cm", "0.594", "Zone 4 — high"],
  ["165 cm", "0.576", "Zone 4 — high"],
  ["170 cm", "0.559", "Zone 4 — high"],
  ["175 cm", "0.543", "Zone 3 — elevated"],
  ["180 cm", "0.528", "Zone 3 — elevated"],
  ["185 cm", "0.514", "Zone 3 — elevated"],
  ["190 cm", "0.500", "Zone 3 — elevated"],
  ["195 cm", "0.487", "Zone 2 — moderate"],
  ["200 cm", "0.475", "Zone 2 — moderate"],
];

const SWEEP_ROWS: [string, string, string][] = [
  ["70 cm", "0.393", "Zone 1"],
  ["75 cm", "0.421", "Zone 1"],
  ["80 cm", "0.449", "Zone 1"],
  ["85 cm", "0.478", "Zone 2"],
  ["90 cm", "0.506", "Zone 3"],
  ["95 cm", "0.534", "Zone 3"],
  ["100 cm", "0.562", "Zone 4"],
  ["105 cm", "0.590", "Zone 4"],
  ["110 cm", "0.618", "Zone 5"],
];

const CROSS_ROWS: [string, string, string, string, string][] = [
  ["A — both clear", "70 kg, BMI 22.1", "17.2%", "76 cm", "0.427 — Zone 1"],
  ["B — BMI misses it", "70 kg, BMI 22.1", "17.2%", "100 cm", "0.562 — Zone 4"],
  ["C — waist misses it", "95 kg, BMI 30.0", "26.7%", "92 cm", "0.517 — Zone 3"],
  ["D — both flag it", "95 kg, BMI 30.0", "26.7%", "105 cm", "0.590 — Zone 4"],
];

const WHR_GRID: [string, string, string, string][] = [
  ["75 cm waist", "0.833", "0.750", "0.682"],
  ["85 cm waist", "0.944", "0.850", "0.773"],
  ["95 cm waist", "1.056", "0.950", "0.864"],
  ["105 cm waist", "1.167", "1.050", "0.955"],
  ["115 cm waist", "1.278", "1.150", "1.045"],
];

const WHR_TARGETS: [string, string, string, string][] = [
  ["80 cm waist", "94.1 cm", "88.9 cm", "84.2 cm"],
  ["90 cm waist", "105.9 cm", "100.0 cm", "94.7 cm"],
  ["100 cm waist", "117.6 cm", "111.1 cm", "105.3 cm"],
  ["110 cm waist", "129.4 cm", "122.2 cm", "115.8 cm"],
];

const STEP_ROWS: [string, string, string][] = [
  ["150 cm", "7.5 cm", "0.0067"],
  ["160 cm", "8.0 cm", "0.0063"],
  ["170 cm", "8.5 cm", "0.0059"],
  ["180 cm", "9.0 cm", "0.0056"],
  ["190 cm", "9.5 cm", "0.0053"],
  ["200 cm", "10.0 cm", "0.0050"],
];

const ACTION_ROWS: [string, string, string][] = [
  ["155 cm", "0.658 — Zone 5", "0.568 — Zone 4"],
  ["160 cm", "0.637 — Zone 5", "0.550 — Zone 4"],
  ["170 cm", "0.600 — Zone 5", "0.518 — Zone 3"],
  ["178 cm", "0.573 — Zone 4", "0.494 — Zone 2"],
  ["185 cm", "0.551 — Zone 4", "0.476 — Zone 2"],
  ["195 cm", "0.523 — Zone 3", "0.451 — Zone 2"],
];

const HEIGHT_ROWS: [string, string, string, string][] = [
  ["165 cm", "68.1 kg", "81.7 kg", "90.8 cm"],
  ["178 cm", "79.2 kg", "95.1 kg", "97.9 cm"],
  ["190 cm", "90.3 kg", "108.3 kg", "104.5 cm"],
];

export default function ArmyBmiCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("us");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(70);
  const [weight, setWeight] = useState(176);
  const [waist, setWaist] = useState(34);
  const [hip, setHip] = useState(40);

  const heightCm = unit === "us" ? height * IN : height;
  const weightKg = unit === "us" ? weight / LB : weight;
  const waistCm = unit === "us" ? waist * IN : waist;
  const hipCm = unit === "us" ? hip * IN : hip;

  const valid =
    [heightCm, weightKg, waistCm, hipCm].every((v) => Number.isFinite(v) && v > 0) && heightCm > 50;

  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  const whtr = waistCm / heightCm;
  const recorded = truncateToThree(whtr);
  const whr = waistCm / hipCm;
  const zone = zoneFor(whtr);
  const armyWaist = heightCm * ARMY_LINE;
  const meetsArmy = recorded < ARMY_LINE;
  const bfFromBmi = bmiBodyFat(bmi, age, sex);

  const cmPerZone = heightCm * 0.05;
  const nextBoundary = zone.hi * heightCm;
  const cmToNextZone = nextBoundary - waistCm;
  const cmToArmyLine = waistCm - armyWaist;

  const lenLabel = unit === "us" ? "in" : "cm";
  const weightLabel = unit === "us" ? "lb" : "kg";

  function switchUnit(next: Unit) {
    if (next === unit) return;
    if (next === "metric") {
      setHeight(Math.round(height * IN));
      setWeight(Math.round(weight / LB));
      setWaist(Math.round(waist * IN));
      setHip(Math.round(hip * IN));
    } else {
      setHeight(Math.round(height / IN));
      setWeight(Math.round(weight * LB));
      setWaist(Math.round(waist / IN));
      setHip(Math.round(hip / IN));
    }
    setUnit(next);
  }

  function fmtLen(cm: number): string {
    return unit === "us" ? `${(cm / IN).toFixed(1)} in` : `${cm.toFixed(1)} cm`;
  }

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/army-body-fat-calculator">Army</a>
          <a href="/bmi-calculator">BMI</a>
          <a href="/navy-body-fat-calculator">Navy</a>
          <a href="/body-fat-percentage-chart">Chart</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">BMI · ARMY WAIST-TO-HEIGHT · CENTRAL FAT ZONES</div>
        <h1>Army BMI Calculator</h1>
        <p className="tool-lede">
          Enter your height, weight and waist. The calculator returns your BMI, checks whether your
          waist-to-height ratio clears the current Army 0.550 standard, and places your waist on a five-zone
          central fat storage scale compiled for this page. BMI tells you how much you carry; the waist tells
          you where it sits.
        </p>

        <div className="calc-layout">
          <div className="calc-card">
            <div className="field-grid">
              <Field label="Units">
                <select value={unit} onChange={(e) => switchUnit(e.target.value as Unit)}>
                  <option value="us">US (lb / in)</option>
                  <option value="metric">Metric (kg / cm)</option>
                </select>
              </Field>
              <Field label="Sex">
                <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </Field>
              <Field label="Age">
                <input type="number" min={14} max={90} value={age} onChange={(e) => setAge(+e.target.value)} />
              </Field>
              <Field label={`Height (${lenLabel})`}>
                <input type="number" min={1} value={height} onChange={(e) => setHeight(+e.target.value)} />
              </Field>
              <Field label={`Weight (${weightLabel})`}>
                <input type="number" min={1} value={weight} onChange={(e) => setWeight(+e.target.value)} />
              </Field>
              <Field label={`Waist at navel (${lenLabel})`}>
                <input type="number" min={1} value={waist} onChange={(e) => setWaist(+e.target.value)} />
              </Field>
              <Field label={`Hip at widest point (${lenLabel})`}>
                <input type="number" min={1} value={hip} onChange={(e) => setHip(+e.target.value)} />
              </Field>
              <Field label=" ">
                <div style={{ fontSize: 12, lineHeight: 1.6, color: "#5e685f", fontWeight: 600 }}>
                  Tape horizontal and snug, not compressing the skin. Measure at the navel, standing, after a
                  normal breath out.
                </div>
              </Field>
            </div>
          </div>

          <div className="answer-card">
            <span>YOUR BMI</span>
            <div className="answer-number">
              {valid ? bmi.toFixed(1) : "—"}
              <small> kg/m²</small>
            </div>
            {valid && (
              <>
                <p>
                  {bmiCategory(bmi)}. Estimated body fat from BMI, age and sex: <b>{bfFromBmi.toFixed(1)}%</b>.
                </p>
                <p>
                  Army waist-to-height: <b>{recorded.toFixed(3)}</b> —{" "}
                  <b>{meetsArmy ? "meets the 0.550 standard" : "does not meet the 0.550 standard"}</b>. At this
                  height the line is a waist under <b>{fmtLen(armyWaist)}</b>, which is{" "}
                  <b>{Math.abs(cmToArmyLine / (unit === "us" ? IN : 1)).toFixed(1)} {lenLabel}</b>{" "}
                  {cmToArmyLine > 0 ? "below" : "above"} your current waist.
                </p>
                <p>
                  Central storage zone: <b>Zone {zone.z} of 5 — {zone.label.toLowerCase()}</b>. Waist-to-hip
                  ratio <b>{whr.toFixed(3)}</b>. One zone is {fmtLen(cmPerZone)} of waist at your height; you
                  are {fmtLen(Math.abs(cmToNextZone))} from the next boundary.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="intent-panel">
          <span>THE SHORT ANSWER</span>
          <p>
            BMI is not the Army&apos;s current body composition standard — waist-to-height ratio is, at a
            recorded value below 0.550. If you searched for an Army BMI calculator, the number you actually
            need is your waist divided by your height, and the calculator above gives both. The zone scale is
            the part no standard gives you: it tells you how much of your mass sits around your middle, which
            BMI cannot see and the Army standard only reduces to a pass or fail.
          </p>
          <a href="/army-body-fat-calculator">See the full Army WHtR calculator →</a>
        </div>

        <section className="content-block">
          <h2>What BMI does and does not cover</h2>
          <p>
            BMI is weight divided by height squared. It is a ratio of total mass to frame size, and it is
            deliberately blind to what that mass is made of: bone, muscle, water, subcutaneous fat under the
            skin, and fat stored deeper inside the abdomen all count the same. That blind spot is not a
            rounding problem, it is structural.
          </p>
          <p>
            The arithmetic makes the point cleanly. At a fixed height, BMI is a function of body weight only,
            and waist-to-height ratio is a function of waist circumference only. Neither input appears in the
            other equation. Two people of identical height and identical weight can therefore sit at opposite
            ends of the central storage scale, with the same BMI and the same BMI-derived body fat estimate.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Height</span>
              <b>Weight at BMI 25</b>
              <span>Weight at BMI 30</span>
              <span>Waist at the Army 0.550 line</span>
            </div>
            {HEIGHT_ROWS.map(([a, b, c, d]) => (
              <div className="chart-row chart-row-wide" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
          <p>
            Read across any row and the two questions are independent. A 178 cm man at 79.2 kg has a BMI of
            25.0 regardless of whether his waist is 76 cm or 100 cm — and those two waists put him in Zone 1
            and Zone 4 respectively. This is why a service standard that cares about health risk and a
            service standard that cares about total mass do not reduce to the same number.
          </p>
        </section>

        <section className="content-block">
          <h2>The five-zone central storage scale</h2>
          <p>
            Everything below is built on one scale, compiled by this page, that indexes waist circumference
            against height. Zone 4 begins at exactly 0.550 so that the scale lines up with the Army standard
            rather than competing with it; the remaining boundaries are spaced in equal 0.05 steps of the
            ratio. It is a self-tracking index, not a diagnosis — a waist circumference cannot see inside the
            abdominal cavity, and the limits section below says so plainly.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Zone</span>
              <b>Waist-to-height ratio</b>
              <span>Label</span>
              <span>What it means</span>
            </div>
            {ZONE_ROWS.map(([a, b, c, d]) => (
              <div className="chart-row chart-row-wide" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-block">
          <h2>Computed: where the zone boundaries fall, by height</h2>
          <p>
            Waist at each boundary is simply the ratio times height. The middle column is the Army line, and
            it moves by 5.5 cm for every 10 cm of height — a tall person is allowed a much larger waist for
            the same standard.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Height</span>
              <b>Zone 1 → 2 (0.450)</b>
              <b>Zone 2 → 3 (0.500)</b>
              <b>Army line (0.550)</b>
              <b>Zone 4 → 5 (0.600)</b>
            </div>
            {BOUNDARY_ROWS.map(([a, b, c, d, e]) => (
              <div className="chart-row chart-row-five" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
                <span>{d}</span>
                <span>{e}</span>
              </div>
            ))}
          </div>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Height</span>
              <b>Zone 1 → 2 (0.450)</b>
              <b>Zone 2 → 3 (0.500)</b>
              <b>Army line (0.550)</b>
              <b>Zone 4 → 5 (0.600)</b>
            </div>
            {BOUNDARY_ROWS_US.map(([a, b, c, d, e]) => (
              <div className="chart-row chart-row-five" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
                <span>{d}</span>
                <span>{e}</span>
              </div>
            ))}
          </div>
          <p>
            The practical use of this table is as a target. If you are 170 cm and your waist is 100 cm, the
            Army line for you is 93.5 cm and the top of Zone 3 is 85.0 cm — so 6.5 cm of waist buys a pass and
            15 cm buys Zone 2. Those are concrete, checkable numbers, unlike a percentage.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: one waist measurement, five different answers</h2>
          <p>
            A waist circumference quoted on its own is height-blind. Here is a fixed 95 cm waist read against
            every height from 150 to 200 cm. The tape never moves; the classification does.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Height (waist fixed at 95 cm)</span>
              <b>Waist-to-height ratio</b>
              <span>Zone</span>
            </div>
            {FIXED_WAIST_ROWS.map(([a, b, c]) => (
              <div className="chart-row" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <p>
            The same 95 cm waist is Zone 5 at 150 cm and Zone 2 at 200 cm — a three-zone spread produced
            entirely by height. This is the strongest argument for using the ratio rather than the raw
            circumference, and it is also why the two waist action levels most often quoted in public-health
            guidance (102 cm for men, 88 cm for women) do not mean the same thing for everyone:
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Height</span>
              <b>A 102 cm waist reads as</b>
              <span>An 88 cm waist reads as</span>
            </div>
            {ACTION_ROWS.map(([a, b, c]) => (
              <div className="chart-row" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <p>
            At 155 cm, 102 cm of waist is Zone 5. At 195 cm the same circumference is Zone 3, and 88 cm is
            only Zone 2. A single fixed cut-off in centimetres is a different test depending on how tall the
            person being measured is.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: four people, two classifiers</h2>
          <p>
            Below are four profiles, all male, all 178 cm and 30 years old. A and B share a body weight; C and
            D share a different one. The body fat column comes from the BMI equation, which is why it is
            identical in each pair — and why it separates the wrong two people.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Profile</span>
              <b>Weight and BMI</b>
              <b>BMI-estimated body fat</b>
              <b>Waist</b>
              <b>Waist-to-height and zone</b>
            </div>
            {CROSS_ROWS.map(([a, b, c, d, e]) => (
              <div className="chart-row chart-row-five" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
                <span>{d}</span>
                <span>{e}</span>
              </div>
            ))}
          </div>
          <p>
            B is the profile worth staring at. A BMI of 22.1 is squarely in the healthy range and the BMI-based
            body fat estimate of 17.2% looks unremarkable, but a 100 cm waist on a 178 cm frame is a ratio of
            0.562 — past the Army line and into Zone 4. BMI screening cannot see that person at all. C is the
            mirror image: a BMI of 30.0 and an estimated 26.7% body fat, yet a waist of 92 cm keeps the ratio
            at 0.517 and out of Zone 4. Neither number is wrong; they are measuring different things.
          </p>
          <p>
            The female equivalent at 165 cm and age 30 runs the same way: 58 kg and a 68 cm waist is Zone 1,
            while the same 58 kg with a 92 cm waist is 0.558 and Zone 4, with the BMI-derived estimate sitting
            at 27.1% in both cases.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: how much the zone moves across a normal waist range</h2>
          <p>
            Holding height and weight fixed at 178 cm and 79.2 kg — a BMI of 25.0 — and sweeping the waist
            from 70 to 110 cm moves the classification across four zones without changing a single kilogram on
            the scale.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Waist (weight fixed at 79.2 kg)</span>
              <b>Waist-to-height ratio</b>
              <span>Zone</span>
            </div>
            {SWEEP_ROWS.map(([a, b, c]) => (
              <div className="chart-row" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <p>
            The entire spread from Zone 1 to Zone 5 is 40 cm of waist at this height, and the Army line sits at
            97.9 cm — 2.1 cm below the 100 cm row. That proximity is the reason the calculator reports your
            distance to the line in centimetres rather than just a pass or fail: a 2 cm measurement difference
            is the difference between the two outcomes for a lot of people.
          </p>
        </section>

        <section className="content-block">
          <h2>Waist-to-hip ratio: the second distribution number</h2>
          <p>
            Waist-to-height compares your middle to your frame. Waist-to-hip compares your middle to the rest
            of your lower body, which is a different question — it separates a large waist on a large frame
            from a large waist on a small one. Both are pure division, so the whole grid is arithmetic.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Waist</span>
              <b>Hip 90 cm</b>
              <span>Hip 100 cm</span>
              <span>Hip 110 cm</span>
            </div>
            {WHR_GRID.map(([a, b, c, d]) => (
              <div className="chart-row chart-row-wide" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
          <p>
            Read the 95 cm row: the same waist is 1.056 with a 90 cm hip, 0.950 with a 100 cm hip and 0.864
            with a 110 cm hip. This is why waist-to-hip and waist-to-height can disagree, and why a single
            circumference should never be read alone. Turned around, the hip circumference needed to reach a
            given ratio:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Waist</span>
              <b>Hip for 0.85</b>
              <span>Hip for 0.90</span>
              <span>Hip for 0.95</span>
            </div>
            {WHR_TARGETS.map(([a, b, c, d]) => (
              <div className="chart-row chart-row-wide" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
          <p>
            A 100 cm waist needs a 117.6 cm hip to read 0.85. Very few people have that shape, which is the
            practical reason waist-to-hip tends to flag the same bodies waist-to-height does, only with more
            sensitivity to hip size and none to height.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what a centimetre is worth</h2>
          <p>
            Because the ratio is waist divided by height, one centimetre of waist is worth 1 ÷ height of
            ratio, and one zone is worth 0.05 × height of waist. Both scale with height, so the same effort
            buys a shorter person more movement.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Height</span>
              <b>Centimetres of waist per zone</b>
              <span>Ratio change per centimetre</span>
            </div>
            {STEP_ROWS.map(([a, b, c]) => (
              <div className="chart-row" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <p>
            At 150 cm a zone is 7.5 cm of waist; at 200 cm it is 10.0 cm. For tracking purposes the useful
            takeaway is the second column: at 180 cm a single centimetre of waist moves the ratio by 0.0056,
            so a 1 cm change is real but small, and a 3 cm change is roughly a third of a zone. Measure to the
            nearest half centimetre and you can read genuine month-to-month movement; measure to the nearest
            inch and most of it disappears into rounding.
          </p>
        </section>

        <section className="content-block">
          <h2>What a waist measurement can and cannot tell you</h2>
          <p>
            Body fat sits in more than one place. Subcutaneous fat is the layer directly under the skin that
            you can pinch; deeper fat is stored inside the abdominal cavity around the organs. A tape measure
            around the waist captures both plus the abdominal muscles and the contents of the gut, and it
            cannot separate them. Neither can a consumer body fat scale: the impedance path between two feet
            passes through everything in between, so any &quot;visceral&quot; rating a scale displays is a
            score derived from the same single estimate, not a second measurement.
          </p>
          <p>
            What the tape does capture reliably is change over time in the same person, measured the same way.
            That is worth more than most people expect. A waist that drops 5 cm while body weight holds still
            is real information that a scale cannot give you, and it is the reason to track circumference
            alongside weight rather than instead of it.
          </p>
          <ul>
            <li>
              <b>Fixed time, fixed posture.</b> Measure standing, after breathing out normally, at the same
              point on the torso. Morning and evening differ; so does a large meal.
            </li>
            <li>
              <b>Take three readings and use the median.</b> A tape pulled at a slightly different angle
              easily shifts a centimetre, and per the sensitivity table that is a fifth of a zone at 180 cm.
            </li>
            <li>
              <b>Track monthly, not daily.</b> Day-to-day circumference is dominated by food and fluid, not
              by fat.
            </li>
            <li>
              <b>Record the ratio, not just the centimetres.</b> The ratio is height-adjusted and comparable
              between people, which the raw number is not.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Where this page&apos;s scale is weak</h2>
          <ul>
            <li>
              <b>The five zones are this page&apos;s construct.</b> The boundary at 0.550 matches the published
              Army standard; the other four are spaced in equal 0.05 steps because that is a clean indexing
              choice, not because anything biological happens at 0.450 or 0.600.
            </li>
            <li>
              <b>Waist circumference is a proxy, not a measurement of internal fat.</b> No imaging is
              involved, and two people with the same waist can carry very different amounts of deep abdominal
              fat. Imaging methods exist and are not comparable to a tape.
            </li>
            <li>
              <b>The BMI body fat equation carries its own error.</b> The estimate shown in the calculator is
              1.20 × BMI + 0.23 × age − 16.2 for men and − 5.4 for women, the same equation used elsewhere on
              this site. It has per-person error, and our{" "}
              <a href="/body-fat-percentage-calculator">body fat percentage calculator</a> puts an error bar on
              it.
            </li>
            <li>
              <b>The Army figures here are a computation, not an assessment.</b> Only an official measurement
              by trained personnel determines compliance. This page is independent and not affiliated with the
              U.S. Army or the Department of Defense.
            </li>
            <li>
              <b>Bodybuilders and very muscular people break BMI.</b> A high BMI from lean tissue does not
              carry the same implication as the same BMI from fat, and the waist reading is the cheap way to
              tell which one you are looking at.
            </li>
            <li>
              <b>Pregnancy, ascites and recent abdominal surgery all invalidate the tape.</b> The measurement
              assumes the circumference reflects tissue, not fluid or a changed anatomy.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Frequently asked questions</h2>
          <div className="mini-faq">
            <details open>
              <summary>Does the Army use BMI?</summary>
              <p>
                Not as its current body composition standard. The published standard is waist-to-height ratio
                below 0.550, recorded by truncating to three decimals. BMI remains the most searched term in
                this area, which is why this page computes both and shows you where they disagree.
              </p>
            </details>
            <details>
              <summary>What is the Army waist-to-height standard?</summary>
              <p>
                Waist circumference at the navel divided by height, in the same unit, with the result truncated
                — not rounded — to three decimal places. Below 0.550 meets the standard. At 178 cm that is a
                waist under 97.9 cm; at 190 cm it is under 104.5 cm.
              </p>
            </details>
            <details>
              <summary>Can you have a healthy BMI and still carry too much around the middle?</summary>
              <p>
                Yes, and the cross-classification table quantifies it: profile B is 178 cm, 70 kg, BMI 22.1, an
                estimated 17.2% body fat and a 100 cm waist — a ratio of 0.562, past the Army line and into
                Zone 4. BMI has no waist input, so it cannot see that person.
              </p>
            </details>
            <details>
              <summary>Is waist circumference enough on its own?</summary>
              <p>
                No. Ninety-five centimetres is Zone 5 at a height of 150 cm and Zone 2 at 200 cm. Always divide
                by height before interpreting the number.
              </p>
            </details>
            <details>
              <summary>What is a good waist-to-height ratio?</summary>
              <p>
                On this page&apos;s scale, below 0.450 is Zone 1 and 0.450 to 0.499 is Zone 2. The most commonly
                cited public-health guidance is to keep the ratio below 0.5, which on this scale is the top of
                Zone 2.
              </p>
            </details>
            <details>
              <summary>How many centimetres do I need to lose to change zone?</summary>
              <p>
                One zone is 0.05 times your height: 8.5 cm at 170 cm, 9.0 cm at 180 cm, 9.5 cm at 190 cm. The
                calculator reports your distance to the next boundary for your own height.
              </p>
            </details>
            <details>
              <summary>Does waist-to-hip ratio add anything?</summary>
              <p>
                It adds sensitivity to hip size and removes sensitivity to height. A 95 cm waist reads 1.056
                against a 90 cm hip and 0.864 against a 110 cm hip. Use it alongside the height ratio, not
                instead of it.
              </p>
            </details>
            <details>
              <summary>Can a smart scale measure visceral fat?</summary>
              <p>
                No. It estimates total body fat from impedance and then derives a rating. A tape measure at the
                waist is more honest, because it is a direct measurement rather than a second layer of
                assumption. See our <a href="/scale-bmi">BMI scale accuracy page</a>.
              </p>
            </details>
            <details>
              <summary>Why do my BMI and my waist zone disagree?</summary>
              <p>
                Because they are functions of different inputs. BMI is weight over height squared; the ratio is
                waist over height. At a fixed height, changing your waist moves one and not the other, which is
                exactly what the waist sweep table shows.
              </p>
            </details>
            <details>
              <summary>How often should I re-measure?</summary>
              <p>
                Monthly. At 180 cm one centimetre is 0.0056 of ratio, so weekly movement is mostly food, fluid
                and tape placement. Three readings per session, median, same time of day.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/army-body-fat-calculator">Army WHtR calculator</a> ·{" "}
            <a href="/bmi-calculator">BMI calculator</a> ·{" "}
            <a href="/navy-body-fat-calculator">Navy body fat calculator</a> ·{" "}
            <a href="/body-fat-percentage-calculator">body fat percentage with error bar</a> ·{" "}
            <a href="/scale-bmi">BMI scale accuracy</a> ·{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a> ·{" "}
            <a href="/weight-loss-percentage-calculator">weight loss percentage</a> ·{" "}
            <a href="/army-body-fat-standards-2026">Army standards 2026</a>
          </p>
          <p>
            <b>Not medical advice.</b> The zone scale on this page is a self-tracking index compiled by this
            site, not a clinical classification, and the Army figures here are a computation rather than an
            assessment. Speak to a qualified professional before making significant changes to your diet or
            training. See our <a href="/disclaimer">disclaimer</a>.
          </p>
        </section>

        <a className="back-cta" href="/">
          Get a visual body-fat estimate from a photo →
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
