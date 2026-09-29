"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";
type Sex = "male" | "female";

const IN = 2.54;
const LB = 2.20462;

// Waist-to-height ratio boundaries used by this page's own central-storage bands.
// The 0.50 line is the widely used "waist less than half your height" rule.
const BANDS: { lo: number; name: string }[] = [
  { lo: 0, name: "Low central storage" },
  { lo: 0.45, name: "Borderline central storage" },
  { lo: 0.5, name: "Raised central storage" },
  { lo: 0.55, name: "High central storage" },
  { lo: 0.6, name: "Very high central storage" },
];

function bandOf(r: number): number {
  let i = 0;
  for (let k = 0; k < BANDS.length; k += 1) if (r >= BANDS[k].lo) i = k;
  return i;
}

// WHO waist action levels and waist-to-hip cut-offs as they are commonly reproduced.
const ACTION: Record<Sex, number> = { male: 102, female: 88 };
const WHR_LINE: Record<Sex, number> = { male: 0.9, female: 0.85 };

// Deurenberg et al. (1991): BF% = 1.20·BMI + 0.23·age − 10.8·sex − 5.4
function deurenberg(sex: Sex, bmi: number, age: number): number {
  return 1.2 * bmi + 0.23 * age - (sex === "male" ? 10.8 : 0) - 5.4;
}

function whoClass(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "Obese class I";
  if (bmi < 40) return "Obese class II";
  return "Obese class III";
}

// --- Self-computed tables ----------------------------------------------------
// Every figure below is arithmetic performed by this page on the ratios defined
// above. None of it is copied from anywhere.

// Waist circumference treated as a circle: area = w² / 4π, dA/dw = w / 2π.
const TABLE_GEO: [number, string, string, string, string][] = [
  [70, "389.9", "11.14", "2.86", "13.8"],
  [80, "509.3", "12.73", "2.50", "12.1"],
  [90, "644.6", "14.32", "2.22", "10.8"],
  [100, "795.8", "15.92", "2.00", "9.8"],
  [110, "962.9", "17.51", "1.82", "8.9"],
  [120, "1145.9", "19.10", "1.67", "8.2"],
  [130, "1344.9", "20.69", "1.54", "7.5"],
];

// The height at which a fixed centimetre action level means WHtR 0.50 and 0.55.
const TABLE_CROSSOVER: [string, string, string, string][] = [
  ["Men", "102 cm", "204.0 cm", "185.5 cm"],
  ["Women", "88 cm", "176.0 cm", "160.0 cm"],
];

// What the action level is worth in waist-to-height terms at each height.
const TABLE_ACTION: [number, string, string][] = [
  [150, "0.680", "0.587"],
  [160, "0.637", "0.550"],
  [170, "0.600", "0.518"],
  [180, "0.567", "0.489"],
  [190, "0.537", "0.463"],
  [200, "0.510", "0.440"],
];

// The hip circumference at which waist-to-hip and waist-to-height swap strictness:
// hip = 0.50 · height ÷ threshold. 0.5556 × height for men, 0.5882 × height for women.
const TABLE_HIP: [number, string, string][] = [
  [155, "86.1", "91.2"],
  [165, "91.7", "97.1"],
  [175, "97.2", "102.9"],
  [185, "102.8", "108.8"],
];

// How wide the disagreement band is, in centimetres of waist. It equals the
// threshold times the hip's distance from the crossover, and it does not depend on height.
const TABLE_WINDOW: [string, string, string][] = [
  ["2 cm", "1.8", "1.7"],
  ["5 cm", "4.5", "4.2"],
  ["10 cm", "9.0", "8.5"],
  ["15 cm", "13.5", "12.8"],
  ["20 cm", "18.0", "17.0"],
];

// Ten computed bodies. BMI comes from height and weight; the two waist ratios come
// from the circumferences. The disagreement column is the point of the table.
const TABLE_PROFILES: [string, string, string, string, string, string, string][] = [
  ["Man, 34 · 178 cm · 92 kg", "29.0 Overweight", "26.5%", "0.534", "0.950", "95 cm", "2 of 3 — height + hip"],
  ["Man, 52 · 170 cm · 78 kg", "27.0 Overweight", "28.1%", "0.541", "0.958", "92 cm", "2 of 3 — height + hip"],
  ["Man, 27 · 200 cm · 115 kg", "28.8 Overweight", "24.5%", "0.525", "0.955", "105 cm", "3 of 3 — all three"],
  ["Man, 24 · 198 cm · 96 kg", "24.5 Normal", "18.7%", "0.495", "0.980", "98 cm", "1 of 3 — hip only"],
  ["Man, 61 · 168 cm · 68 kg", "24.1 Normal", "26.7%", "0.512", "0.935", "86 cm", "2 of 3 — height + hip"],
  ["Woman, 41 · 162 cm · 72 kg", "27.4 Overweight", "37.0%", "0.519", "0.840", "84 cm", "1 of 3 — height only"],
  ["Woman, 55 · 165 cm · 74 kg", "27.2 Overweight", "39.9%", "0.485", "0.851", "80 cm", "1 of 3 — hip only"],
  ["Woman, 66 · 155 cm · 65 kg", "27.1 Overweight", "42.2%", "0.581", "0.938", "90 cm", "3 of 3 — all three"],
  ["Woman, 29 · 175 cm · 68 kg", "22.2 Normal", "27.9%", "0.423", "0.755", "74 cm", "0 of 3 — none"],
  ["Woman, 33 · 180 cm · 95 kg", "29.3 Overweight", "37.4%", "0.489", "0.786", "88 cm", "1 of 3 — action level only"],
];

// Sensitivity of each ratio to one centimetre.
const TABLE_SENS: [string, string, string, string, string][] = [
  ["80 / 95", "0.842", "0.0105", "−0.0089", "1.19"],
  ["90 / 100", "0.900", "0.0100", "−0.0090", "1.11"],
  ["100 / 100", "1.000", "0.0100", "−0.0100", "1.00"],
  ["100 / 110", "0.909", "0.0091", "−0.0083", "1.10"],
  ["110 / 110", "1.000", "0.0091", "−0.0091", "1.00"],
  ["120 / 120", "1.000", "0.0083", "−0.0083", "1.00"],
];

const TABLE_CM: [number, string][] = [
  [155, "1.55"],
  [165, "1.65"],
  [175, "1.75"],
  [185, "1.85"],
  [195, "1.95"],
];

export default function VisceralFatCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(45);
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(92);
  const [waist, setWaist] = useState(95);
  const [hip, setHip] = useState(100);

  const heightCm = unit === "us" ? height * IN : height;
  const weightKg = unit === "us" ? weight / LB : weight;
  const waistCm = unit === "us" ? waist * IN : waist;
  const hipCm = unit === "us" ? hip * IN : hip;

  const lengthLabel = unit === "us" ? "in" : "cm";
  const weightLabel = unit === "us" ? "lb" : "kg";

  const m = heightCm / 100;
  const valid =
    heightCm > 120 && heightCm < 230 && weightKg > 30 && waistCm > 45 && hipCm > 50 && waistCm < hipCm * 1.6 && age > 10 && age < 100;

  const whtr = waistCm / heightCm;
  const whr = waistCm / hipCm;
  const bmi = weightKg / (m * m);
  const bf = deurenberg(sex, bmi, age);

  const t = WHR_LINE[sex];
  const act = ACTION[sex];

  // The three proxies, each reduced to the waist at which it fires.
  const fireH = 0.5 * heightCm;
  const fireW = t * hipCm;
  const flags = [
    { name: "waist-to-height", on: valid && whtr >= 0.5 },
    { name: "waist-to-hip", on: valid && whr >= t },
    { name: "the action level", on: valid && waistCm >= act },
  ];
  const flagCount = flags.filter((f) => f.on).length;
  const flagNames = flags.filter((f) => f.on).map((f) => f.name);

  const band = bandOf(whtr);
  const cmToDrop = band > 0 ? waistCm - BANDS[band].lo * heightCm : NaN;
  const cmPer001 = heightCm / 100;

  // Height at which this waist would stop being flagged by waist-to-height.
  const heightToStop = waistCm / 0.5;

  // Hip circumference that would bring waist-to-hip exactly to the line.
  const hipToClear = waistCm / t;

  // How far apart the two ratio proxies are, expressed in centimetres of waist.
  const windowCm = Math.abs(fireH - fireW);
  const stricter = Math.abs(fireH - fireW) < 0.05 ? "they fire at the same waist" : fireH < fireW ? "waist-to-height" : "waist-to-hip";

  const area = (waistCm * waistCm) / (4 * Math.PI);
  const areaPerCm = waistCm / (2 * Math.PI);
  const pctPerCm = 200 / waistCm;

  const waistVsAct = waistCm - act;
  const wAtBandTop = band < BANDS.length - 1 ? BANDS[band + 1].lo * heightCm : NaN;

  function switchUnit(next: Unit) {
    if (next === unit) return;
    if (next === "us") {
      setHeight(Math.round(heightCm / IN));
      setWeight(Math.round(weightKg * LB));
      setWaist(Math.round((waistCm / IN) * 2) / 2);
      setHip(Math.round((hipCm / IN) * 2) / 2);
    } else {
      setHeight(Math.round(height * IN));
      setWeight(Math.round(weight / LB));
      setWaist(Math.round(waist * IN));
      setHip(Math.round(hip * IN));
    }
    setUnit(next);
  }

  return (
    <div className="tool-page">
      <nav className="tool-nav">
        <a href="/">AI Body Fat Calculator</a>
        <div>
          <a href="/body-fat-calculator">Body Fat</a>
          <a href="/bmi-calculator">BMI</a>
          <a href="/navy-body-fat-calculator">Navy</a>
          <a href="/ffmi-calculator">FFMI</a>
        </div>
      </nav>

      <main className="tool-main">
        <span className="tool-eyebrow">VISCERAL FAT · THREE PROXIES, ONE ANSWER</span>
        <h1>A tape measure cannot read visceral fat. It can still grade what sits behind it.</h1>
        <p className="tool-lede">
          Visceral fat sits inside the abdominal cavity, around the organs. Subcutaneous fat sits under
          the skin. A tape around your waist measures both at once and cannot tell them apart — so
          there is no honest way to turn a circumference into a visceral fat number. What a tape can do
          is grade central storage, and there are three standard ways to grade it. Enter your numbers
          and this page runs all three, tells you how many fire, and shows you exactly where they
          disagree.
        </p>

        <div className="calc-layout">
          <div className="calc-card">
            <div className="field-grid">
              <Field label="Units">
                <select value={unit} onChange={(e) => switchUnit(e.target.value as Unit)}>
                  <option value="metric">Metric (kg / cm)</option>
                  <option value="us">US (lb / in)</option>
                </select>
              </Field>
              <Field label="Sex">
                <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </Field>
              <Field label="Age">
                <input type="number" min={18} max={90} value={age} onChange={(e) => setAge(+e.target.value)} />
              </Field>
              <Field label={`Height (${lengthLabel})`}>
                <input type="number" min={1} value={height} onChange={(e) => setHeight(+e.target.value)} />
              </Field>
              <Field label={`Weight (${weightLabel})`}>
                <input type="number" min={1} value={weight} onChange={(e) => setWeight(+e.target.value)} />
              </Field>
              <Field label={`Waist (${lengthLabel})`}>
                <input type="number" min={1} step={0.5} value={waist} onChange={(e) => setWaist(+e.target.value)} />
              </Field>
              <Field label={`Hip (${lengthLabel})`}>
                <input type="number" min={1} step={0.5} value={hip} onChange={(e) => setHip(+e.target.value)} />
              </Field>
            </div>
            <p style={{ marginTop: 14, fontSize: 13, opacity: 0.75 }}>
              Waist at the narrowest point, or at the navel if there is no narrowing. Hip at the widest
              part of the buttocks. Measure standing, at the end of a normal breath out.
            </p>
          </div>

          <div className="answer-card">
            <span>WAIST-TO-HEIGHT RATIO · CENTRAL STORAGE BAND</span>
            <div className="answer-number">
              {valid ? whtr.toFixed(3) : "—"}
              <small>{valid ? BANDS[band].name : "enter height, waist and hip"}</small>
            </div>
            {valid ? (
              <>
                <p>
                  <b style={{ color: "#fff" }}>{flagCount} of 3 central-fat flags fired.</b>{" "}
                  {flagCount === 0
                    ? `None of the three — waist-to-height, waist-to-hip or the ${act} cm action level — puts you in the raised range.`
                    : `${flagNames.join(", ")} ${flagCount === 1 ? "has" : "have"} crossed.`}
                </p>
                <p>
                  Your waist is <b>{whtr.toFixed(3)}</b> of your height and <b>{whr.toFixed(3)}</b> of
                  your hip, against lines of 0.500 and {t.toFixed(2)}. The absolute {act} cm action
                  level sits{" "}
                  <b>
                    {Math.abs(waistVsAct).toFixed(1)} cm {waistVsAct >= 0 ? "below" : "above"}
                  </b>{" "}
                  your current waist.
                </p>
                <p>
                  Waist-to-height fires at a waist of <b>{fireH.toFixed(1)} cm</b> for someone your
                  height; waist-to-hip fires at <b>{fireW.toFixed(1)} cm</b> for someone with your hip.
                  The gap between them is <b>{windowCm.toFixed(1)} cm of waist</b>, and the stricter of
                  the two here is <b>{stricter}</b> — inside that gap, the two proxies give opposite
                  answers about the same body.
                </p>
                {band > 0 && Number.isFinite(cmToDrop) ? (
                  <p>
                    Dropping one band takes <b>{cmToDrop.toFixed(1)} cm</b> of waist. At your height one
                    hundredth of waist-to-height is worth {cmPer001.toFixed(2)} cm, so a single
                    centimetre is worth {(1 / cmPer001).toFixed(3)} of the ratio.
                  </p>
                ) : null}
                {Number.isFinite(wAtBandTop) ? (
                  <p>
                    The next band up starts at <b>{wAtBandTop.toFixed(1)} cm</b>, which is{" "}
                    {(wAtBandTop - waistCm).toFixed(1)} cm away.
                  </p>
                ) : null}
                <p>
                  To clear waist-to-hip at this waist you would need a hip of{" "}
                  <b>{hipToClear.toFixed(1)} cm</b> — {Math.abs(hipToClear - hipCm).toFixed(1)} cm{" "}
                  {hipToClear >= hipCm ? "more" : "less"} than you have. To stop being flagged by
                  waist-to-height without losing a centimetre you would have to be{" "}
                  <b>{heightToStop.toFixed(0)} cm</b> tall.
                </p>
                <p>
                  Read as a circle, a {waistCm.toFixed(0)} cm waist encloses{" "}
                  <b>{area.toFixed(0)} cm²</b>, and each centimetre changes that area by{" "}
                  <b>{areaPerCm.toFixed(1)} cm²</b> — {pctPerCm.toFixed(2)}% of the cross-section.
                </p>
                <p>
                  For context only: BMI is <b>{bmi.toFixed(1)}</b> ({whoClass(bmi)}), which implies a
                  body fat of roughly <b>{bf.toFixed(1)}%</b> on the Deurenberg equation. That is a
                  whole-body estimate from weight and height, not a reading of where your fat sits.
                </p>
              </>
            ) : (
              <p>Enter your height, weight, waist and hip to see the three verdicts.</p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>WHAT THIS PAGE COMPUTES</span>
          <strong>
            Waist-to-height = waist ÷ height · raised at 0.500
            <br />
            Waist-to-hip = waist ÷ hip · raised at 0.90 for men, 0.85 for women
            <br />
            Action level = 102 cm for men, 88 cm for women · cross-section area = waist² ÷ 4π
          </strong>
          <small>
            The three thresholds above are the World Health Organization waist and waist-to-hip values
            as they are commonly reproduced, and 0.500 is the widely used half-your-height rule. The
            five central-storage bands, every crossover height, the disagreement widths, the geometry
            table, the sensitivity table and the ten computed bodies are arithmetic this page performs
            on those numbers. None of it is copied from anywhere, and none of it is a clinical
            diagnosis. Nothing here measures visceral fat directly — no tape-based method can.
          </small>
        </div>

        <section className="content-block">
          <h2>Visceral fat is a compartment, and a tape measures a circumference</h2>
          <p>
            The fat under your skin and the fat packed around your organs are two different depots with
            different biology. They sit on either side of the abdominal wall. A tape measure wraps
            around all of it — skin, subcutaneous fat, muscle, the organs themselves and everything
            inside them — and returns one number in centimetres. There is no arithmetic that recovers
            the split from that number, because different bodies reach the same circumference by
            completely different routes.
          </p>
          <p>
            That is the honest starting point, and it is worth stating before any number: a visceral fat
            calculator built on a tape measure is grading central storage, not reading a depot. The
            grading is still useful, because central storage is what the waist-based thresholds were
            built to flag. But the word visceral belongs to imaging, not to a tape.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Method</span>
              <b>What it actually measures</b>
              <span>What it separates</span>
              <span>What it cannot tell you</span>
            </div>
            {[
              [
                "Waist circumference",
                "One girth at one landmark",
                "Nothing — skin, muscle, gut contents and both fat depots are inside the same number",
                "How much of the girth is fat, and which depot it is",
              ],
              [
                "Waist-to-height",
                "Girth scaled to frame size",
                "Tall bodies from short ones, which a bare centimetre threshold cannot do",
                "Which depot the fat sits in",
              ],
              [
                "Waist-to-hip",
                "Girth scaled to the pelvis",
                "Body shape, and it improves if the hips grow alongside the waist",
                "Absolute size — a small waist with small hips reads the same as a large one with large hips",
              ],
              [
                "Cross-sectional imaging",
                "Slices of the abdominal cavity",
                "The two depots, which is why it is the reference for visceral fat",
                "Nothing relevant — it is simply not available to a tape or a bathroom scale",
              ],
            ].map((row) => (
              <div className="chart-row chart-row-wide" key={row[0]}>
                <span>{row[0]}</span>
                <strong>{row[1]}</strong>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Everything below works within that limit. It is arithmetic on ratios, and it is honest about
            being arithmetic on ratios.
          </p>
        </section>

        <section className="content-block">
          <h2>Three flags, and ten bodies that do not agree on any of them</h2>
          <p>
            There are three standard ways to grade a waist: scale it to height, scale it to hip, or
            compare it against a fixed number of centimetres. Each one reduces to a single question —
            is your waist above some trigger value? The bodies below are computed, not surveyed. Every
            row has a height, a weight, a waist and a hip; BMI follows from the first two and the two
            ratios follow from the last two.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Body</span>
              <b>BMI</b>
              <span>Body fat</span>
              <span>WHtR / WHR</span>
              <span>Flags fired</span>
            </div>
            {TABLE_PROFILES.map(([who, bmiTxt, bfTxt, r1, r2, wTxt, verdict]) => (
              <div className="chart-row chart-row-five" key={who}>
                <span>{who}</span>
                <strong>{bmiTxt}</strong>
                <span>{bfTxt}</span>
                <span>
                  {r1} / {r2} · {wTxt}
                </span>
                <span>{verdict}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Read the two one-flag rows for men and women separately. The 198 cm man has a waist-to-hip
            of 0.980 and a waist-to-height of 0.495: hip says raised, height says fine, and both are
            correct about the same body. The 165 cm woman is the mirror image at 0.485 and 0.851. And
            the 180 cm woman fires only the absolute action level at exactly 88 cm, while both ratios
            clear her — the case where a fixed centimetre threshold flags a body that every scaled
            measure lets through.
          </p>
          <p>
            The 61-year-old man is the row worth dwelling on: BMI 24.1, squarely normal, body fat
            estimated at 26.7%, and two of the three waist flags fired. A scale that only knows weight
            and height sees nothing here.
          </p>
        </section>

        <section className="content-block">
          <h2>The algebra of the disagreement</h2>
          <p>
            Waist-to-height fires when the waist reaches half your height. Waist-to-hip fires when the
            waist reaches 0.90 of your hip for men, 0.85 for women. Put those side by side and the
            question of which proxy is stricter stops being about your waist at all:
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Height</span>
              <b>Hip where they swap — men</b>
              <span>Hip where they swap — women</span>
            </div>
            {TABLE_HIP.map(([h, menHip, womenHip]) => (
              <div className="chart-row" key={h}>
                <span>{h} cm</span>
                <strong>{menHip} cm</strong>
                <span>{womenHip} cm</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Those hips are simply 0.50 × height ÷ threshold, which works out to 0.5556 × height for
            men and 0.5882 × height for women. Above that hip, waist-to-height flags you first. Below
            it, waist-to-hip does. Your waist never enters the comparison — it cancels, because both
            ratios have it in the numerator.
          </p>
          <p>
            The width of the disagreement band is just as clean. It equals the threshold multiplied by
            however far your hip sits from the crossover, and it does not depend on height at all:
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Hip away from the crossover</span>
              <b>Disagreement band — men</b>
              <span>Disagreement band — women</span>
            </div>
            {TABLE_WINDOW.map(([d, menW, womenW]) => (
              <div className="chart-row" key={d}>
                <span>{d}</span>
                <strong>{menW} cm of waist</strong>
                <span>{womenW} cm of waist</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            A man whose hip is 10 cm off the crossover carries a 9.0 cm band of waist where the two
            proxies return opposite verdicts. Most people are within a few centimetres of the
            crossover, which is the practical reason the two ratios usually agree — not because they
            measure the same thing, but because most hips happen to sit near the swap point.
          </p>
        </section>

        <section className="content-block">
          <h2>A fixed number of centimetres means different things at different heights</h2>
          <p>
            The action levels are absolute: 102 cm for men, 88 cm for women. They do not know how tall
            you are, which means the same waistband is a different waist-to-height ratio on every body.
            Here is what those two numbers are worth across the ordinary height range — computed by
            simply dividing the threshold by height.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Height</span>
              <b>Men: 102 cm as waist-to-height</b>
              <span>Women: 88 cm as waist-to-height</span>
            </div>
            {TABLE_ACTION.map(([h, menR, womenR]) => (
              <div className="chart-row" key={h}>
                <span>{h} cm</span>
                <strong>{menR}</strong>
                <span>{womenR}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            One threshold, one number, and a spread from 0.680 down to 0.510 for men — from well inside
            the high band to barely over the 0.500 line. The height at which the fixed threshold stops
            being stricter than the ratio:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Sex</span>
              <b>Action level</b>
              <span>Height where it equals WHtR 0.50</span>
              <span>Height where it equals WHtR 0.55</span>
            </div>
            {TABLE_CROSSOVER.map(([s, a, h50, h55]) => (
              <div className="chart-row chart-row-wide" key={s}>
                <span>{s}</span>
                <strong>{a}</strong>
                <span>{h50}</span>
                <span>{h55}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            A man would have to be 204 cm tall before a 102 cm waist stops clearing the half-your-height
            rule, and 185.5 cm before it stops clearing 0.55. For women the equivalent heights are 176
            cm and 160 cm — well inside the normal range, which is why the 88 cm line and the ratio
            genuinely disagree for taller women. That is the 180 cm woman in the table above: flagged by
            the centimetre, cleared by both ratios.
          </p>
        </section>

        <section className="content-block">
          <h2>The geometry of a waist: why the same five centimetres is worth more on a small waist</h2>
          <p>
            Treat a waist as a circle and its area is w² ÷ 4π, so each extra centimetre adds w ÷ 2π
            square centimetres. The consequence is easy to miss: the same absolute change is a bigger
            proportional change on a smaller waist. Every row below is that pair of expressions
            evaluated at one circumference.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Waist</span>
              <b>Cross-section area</b>
              <span>Area per +1 cm</span>
              <span>% per 1 cm</span>
              <span>% per −5 cm</span>
            </div>
            {TABLE_GEO.map(([w, a, per, pct, pct5]) => (
              <div className="chart-row chart-row-five" key={w}>
                <span>{w} cm</span>
                <strong>{a} cm²</strong>
                <span>{per} cm²</span>
                <span>{pct}%</span>
                <span>{pct5}%</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Going from 130 cm to 70 cm is a 3.45-fold reduction in cross-sectional area, but the
            sensitivity runs the other way: one centimetre off a 70 cm waist removes 2.86% of the
            cross-section, while one centimetre off a 130 cm waist removes 1.54%. Five centimetres is
            13.8% of a small waist and 7.5% of a large one. Anyone tracking a waist over time is
            therefore comparing percentages that shrink as the waist shrinks — the same effort buys a
            smaller proportional return each time.
          </p>
        </section>

        <section className="content-block">
          <h2>What one centimetre does to each ratio</h2>
          <p>
            Waist-to-height is the easier one: since the ratio is waist ÷ height, one centimetre of
            waist is worth 1 ÷ (height in cm) of the ratio, so a hundredth of the ratio is worth
            height ÷ 100 centimetres.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Height</span>
              <b>Centimetres of waist per 0.01 of waist-to-height</b>
              <span>0.01 worth in ratio per 1 cm</span>
            </div>
            {TABLE_CM.map(([h, cm]) => (
              <div className="chart-row" key={h}>
                <span>{h} cm</span>
                <strong>{cm} cm</strong>
                <span>{(1 / (h / 100)).toFixed(4)}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            A tall person needs 1.95 cm of waist to move the ratio by a hundredth; a short person needs
            1.55 cm. That is the whole argument for scaling waist to height in one line.
          </p>
          <h3 style={{ marginTop: 34, fontSize: 22, letterSpacing: "-0.8px" }}>
            Waist-to-hip is more treacherous
          </h3>
          <p>
            Waist-to-hip moves 1 ÷ hip for each centimetre of waist and −waist ÷ hip² for each
            centimetre of hip. Put those side by side and the ratio of the two is hip ÷ waist — meaning
            a centimetre of hip very nearly cancels a centimetre of waist.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Waist / hip</span>
              <b>Ratio</b>
              <span>Per +1 cm waist</span>
              <span>Per +1 cm hip</span>
              <span>Hip cm that cancels 1 cm of waist</span>
            </div>
            {TABLE_SENS.map(([pair, r, perW, perH, cancel]) => (
              <div className="chart-row chart-row-five" key={pair}>
                <span>{pair} cm</span>
                <strong>{r}</strong>
                <span>{perW}</span>
                <span>{perH}</span>
                <span>{cancel}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            This is the real weakness of waist-to-hip: it is a ratio of two things that change
            together. A waist that grows 2 cm while the hip grows 2.2 cm produces a better
            waist-to-hip reading than before, on a body that objectively gained abdominal girth. Anyone
            using waist-to-hip to track progress should read the bare waist alongside it, or use
            waist-to-height, which has one input that never moves.
          </p>
        </section>

        <section className="content-block">
          <h2>Where this page&apos;s arithmetic stops being true</h2>
          <ul style={{ marginTop: 16 }}>
            <li>
              Nothing here measures visceral fat. A tape cannot separate the depot inside the
              abdominal cavity from the layer under the skin, and no amount of arithmetic on a
              circumference changes that. This page grades central storage.
            </li>
            <li>
              The five central-storage bands are this page&apos;s own construction. The 0.500 line is
              the widely used half-your-height rule; the 0.45, 0.55 and 0.60 boundaries were chosen to
              give evenly spaced bands around it. No organisation publishes this scale.
            </li>
            <li>
              The 102 cm and 88 cm action levels and the 0.90 and 0.85 waist-to-hip cut-offs are the
              World Health Organization values as commonly reproduced. They are screening thresholds,
              not diagnoses.
            </li>
            <li>
              The body fat column is the Deurenberg equation evaluated on BMI, age and sex. It is a
              population estimate, it is not independent of the BMI next to it, and it says nothing
              about where the fat sits — it is included only to show how differently a weight-based
              estimate and a waist-based one can read the same body.
            </li>
            <li>
              The circle geometry treats the waist as a perfect circle, which it is not. It is there to
              show how proportional change behaves with size, not to estimate any real cross-sectional
              area of tissue.
            </li>
            <li>
              A single waist reading carries ordinary measurement error. Anything within a centimetre or
              two of a boundary is inside that error, and the time of day, a meal and breath position
              all move it.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Questions this page gets asked</h2>
          <div className="mini-faq">
            <details>
              <summary>Can a tape measure or a smart scale tell me my visceral fat level?</summary>
              <p>
                No. Visceral fat sits inside the abdominal cavity and separating it from the
                subcutaneous layer under the skin requires cross-sectional imaging. A tape gives one
                circumference that contains both; a smart scale runs a current through the body and
                estimates total body fat, with no information about which depot it is in. What both can
                do is grade central storage, which is what the waist thresholds on this page do.
              </p>
            </details>
            <details>
              <summary>What waist-to-height ratio should I aim for?</summary>
              <p>
                The commonly quoted rule is to keep your waist below half your height, a ratio of 0.500.
                The calculator above shows the waist that corresponds to at your height, and how many
                centimetres sit between you and it.
              </p>
            </details>
            <details>
              <summary>Is waist-to-hip or waist-to-height better?</summary>
              <p>
                Waist-to-height, for tracking. It has one input that never changes, so it moves only
                when your waist does. Waist-to-hip can improve while your waist grows, if your hips
                grow slightly faster — roughly one centimetre of hip cancels one centimetre of waist.
                Use waist-to-hip as a shape check, not as a progress measure.
              </p>
            </details>
            <details>
              <summary>Why do the 102 cm and 88 cm thresholds disagree with the ratios?</summary>
              <p>
                Because they are absolute and the ratios are scaled. A 102 cm waist is 0.680 of height
                at 150 cm but 0.510 at 200 cm. For women the 88 cm line and the ratio genuinely
                diverge: above 176 cm the fixed centimetre threshold fires before the half-your-height
                rule does.
              </p>
            </details>
            <details>
              <summary>My BMI is normal but my waist flags. Is that possible?</summary>
              <p>
                Yes, and it is one of the more useful things a waist measure catches. In the table
                above, the 61-year-old man at 168 cm and 68 kg has a BMI of 24.1 — normal — with a
                waist-to-height of 0.512 and a waist-to-hip of 0.935, both flagged. BMI has no term for
                where the weight sits. See <a href="/obese-scale">why the two scales disagree</a>.
              </p>
            </details>
            <details>
              <summary>How do I measure my waist properly?</summary>
              <p>
                Standing, at the end of a normal breath out, tape level and snug but not pulling. Use
                the narrowest point if you have one, otherwise the navel. Measure at the same time of
                day each time you repeat it. The full landmark protocol, with the error each mistake
                costs, is on the <a href="/fat-calculator">fat calculator</a> page.
              </p>
            </details>
            <details>
              <summary>Does losing weight reduce visceral fat first?</summary>
              <p>
                This page cannot answer that — it would require imaging studies to support, and none
                are cited here. What can be said from the arithmetic: the waist shrinks in absolute
                centimetres, and each centimetre is a larger proportional change on a smaller waist, so
                the same rate of loss moves the ratios further as you go.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/body-fat-calculator">body fat calculator</a> ·{" "}
            <a href="/bmi-calculator">BMI calculator</a> ·{" "}
            <a href="/navy-body-fat-calculator">Navy body fat calculator</a> ·{" "}
            <a href="/army-bmi-calculator">waist-to-height zones</a> ·{" "}
            <a href="/obese-scale">obese scale: BMI vs body fat</a> ·{" "}
            <a href="/body-fat-index">body fat index vs BMI</a> ·{" "}
            <a href="/ffmi-calculator">FFMI calculator</a> ·{" "}
            <a href="/fat-calculator">measure body fat with an error budget</a> ·{" "}
            <a href="/measure-body-fat">ranges by age and sex</a> ·{" "}
            <a href="/body-fat-percentage-calculator">body fat with an error bar</a> ·{" "}
            <a href="/weight-loss-percentage-calculator">weight loss percentage</a> ·{" "}
            <a href="/body-recomposition-calculator">body recomposition</a>
          </p>
          <p>
            <b>Not medical advice.</b> Every number on this page is arithmetic performed on published
            thresholds and published equations, not a diagnosis and not a substitute for a clinical
            assessment. See our <a href="/disclaimer">disclaimer</a>.
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
