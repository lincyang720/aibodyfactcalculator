"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";
type Sex = "male" | "female";
type BfSource = "bmi" | "tape" | "own";

const IN = 2.54;
const LB = 2.20462;

// U.S. Navy circumference equations, inches. Same constants as the rest of this site.
function navyTape(sex: Sex, waistCm: number, neckCm: number, hipCm: number, heightCm: number): number {
  const h = heightCm / IN;
  if (sex === "male") {
    const a = (waistCm - neckCm) / IN;
    return 86.01 * Math.log10(a) - 70.041 * Math.log10(h) + 36.76;
  }
  const a = (waistCm + hipCm - neckCm) / IN;
  return 163.205 * Math.log10(a) - 97.684 * Math.log10(h) - 78.387;
}

// Deurenberg et al. (1991): BF% = 1.20·BMI + 0.23·age − 10.8·sex − 5.4
function deurenberg(sex: Sex, bmi: number, age: number): number {
  return 1.2 * bmi + 0.23 * age - (sex === "male" ? 10.8 : 0) - 5.4;
}

// Invert Deurenberg for BMI at a given body fat percentage.
function bmiAtBf(sex: Sex, bf: number, age: number): number {
  return (bf + (sex === "male" ? 10.8 : 0) + 5.4 - 0.23 * age) / 1.2;
}

// The obesity line on the body-fat scale, from the ACE category chart as it is
// commonly reproduced: men 25% and above, women 32% and above.
const FAT_LINE: Record<Sex, number> = { male: 25, female: 32 };

// WHO adult BMI classes.
function whoClass(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "Obese class I";
  if (bmi < 40) return "Obese class II";
  return "Obese class III";
}

// Drift of the body-fat obesity line in BMI units: the age term divided by the BMI
// coefficient, 0.1917 points per year, or 1.92 points per decade.
const AGE_DRIFT_PER_DECADE = (0.23 / 1.2) * 10;

// --- Self-computed tables ----------------------------------------------------
// Every figure below is arithmetic performed by this page on the two published
// equations above. None of it is copied from anywhere.

// Deurenberg evaluated at BMI = 30.
const TABLE_A: [number, string, string][] = [
  [20, "24.4", "35.2"],
  [30, "26.7", "37.5"],
  [40, "29.0", "39.8"],
  [50, "31.3", "42.1"],
  [60, "33.6", "44.4"],
  [70, "35.9", "46.7"],
  [80, "38.2", "49.0"],
];

// The BMI at which body fat crosses the obesity line, and how far that sits from 30.
const TABLE_B: [number, string, string, string, string][] = [
  [20, "30.50", "+0.50", "27.33", "−2.67"],
  [30, "28.58", "−1.42", "25.42", "−4.58"],
  [40, "26.67", "−3.33", "23.50", "−6.50"],
  [50, "24.75", "−5.25", "21.58", "−8.42"],
  [60, "22.83", "−7.17", "19.67", "−10.33"],
  [70, "20.92", "−9.08", "17.75", "−12.25"],
  [80, "19.00", "−11.00", "15.83", "−14.17"],
];

// Fat mass index = BMI × BF% / 100.
const TABLE_C: [string, string, string, string, string][] = [
  ["18.5", "3.70", "4.63", "5.55", "6.47"],
  ["22.0", "4.40", "5.50", "6.60", "7.70"],
  ["25.0", "5.00", "6.25", "7.50", "8.75"],
  ["30.0", "6.00", "7.50", "9.00", "10.50"],
  ["35.0", "7.00", "8.75", "10.50", "12.25"],
];

// Weight at each BMI class line, and the kilograms behind one BMI point.
const TABLE_D: [number, string, string, string][] = [
  [155, "2.40", "72.0", "84.0"],
  [160, "2.56", "76.7", "89.5"],
  [165, "2.72", "81.5", "95.2"],
  [170, "2.89", "86.6", "101.0"],
  [175, "3.06", "91.7", "107.0"],
  [180, "3.24", "97.0", "113.2"],
  [185, "3.42", "102.5", "119.6"],
  [190, "3.61", "108.1", "126.2"],
];

// Eight computed bodies. BMI comes from height and weight; body fat comes from the
// Navy circumference equation, which never sees weight — so the two verdicts are
// genuinely independent of each other.
const TABLE_E: [string, string, string, string, string][] = [
  ["Man, 22 · 180 cm · 98 kg", "30.2", "19.9%", "19.5 / 78.5 kg", "Obese by BMI only"],
  ["Man, 45 · 175 cm · 84 kg", "27.4", "26.7%", "22.5 / 61.5 kg", "Obese by body fat only"],
  ["Man, 55 · 170 cm · 92 kg", "31.8", "30.0%", "27.6 / 64.4 kg", "Both"],
  ["Man, 30 · 183 cm · 82 kg", "24.5", "13.2%", "10.8 / 71.2 kg", "Neither"],
  ["Woman, 35 · 165 cm · 88 kg", "32.3", "39.5%", "34.8 / 53.2 kg", "Both"],
  ["Woman, 25 · 168 cm · 62 kg", "22.0", "24.3%", "15.1 / 46.9 kg", "Neither"],
  ["Woman, 62 · 160 cm · 68 kg", "26.6", "37.3%", "25.3 / 42.7 kg", "Obese by body fat only"],
  ["Woman, 45 · 158 cm · 80 kg", "32.0", "38.7%", "31.0 / 49.0 kg", "Both"],
];

// How much one kilogram of body weight moves BMI, by height.
const TABLE_G: [number, string, string][] = [
  [155, "0.416", "0.832"],
  [165, "0.367", "0.735"],
  [170, "0.346", "0.692"],
  [178, "0.316", "0.631"],
  [185, "0.292", "0.584"],
];

export default function ObeseScalePage() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(45);
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(95);
  const [source, setSource] = useState<BfSource>("bmi");
  const [ownBf, setOwnBf] = useState(28);
  const [waist, setWaist] = useState(100);
  const [neck, setNeck] = useState(40);
  const [hip, setHip] = useState(102);

  const heightCm = unit === "us" ? height * IN : height;
  const weightKg = unit === "us" ? weight / LB : weight;
  const waistCm = unit === "us" ? waist * IN : waist;
  const neckCm = unit === "us" ? neck * IN : neck;
  const hipCm = unit === "us" ? hip * IN : hip;

  const lengthLabel = unit === "us" ? "in" : "cm";
  const weightLabel = unit === "us" ? "lb" : "kg";

  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  const valid = heightCm > 100 && weightKg > 25 && age > 5 && age < 100;

  const tapeValid =
    sex === "male" ? waistCm - neckCm > 5 && heightCm > 100 : waistCm + hipCm - neckCm > 30 && heightCm > 100;

  let bf = NaN;
  let bfLabel = "";
  if (valid) {
    if (source === "bmi") {
      bf = deurenberg(sex, bmi, age);
      bfLabel = "estimated from BMI";
    } else if (source === "tape") {
      if (tapeValid) {
        bf = navyTape(sex, waistCm, neckCm, hipCm, heightCm);
        bfLabel = "Navy tape equation";
      }
    } else {
      bf = ownBf;
      bfLabel = "your own number";
    }
  }

  const bfOk = Number.isFinite(bf) && bf > 2 && bf < 75;
  const line = FAT_LINE[sex];
  const fatObese = bfOk && bf >= line;
  const bmiObese = valid && bmi >= 30;

  const verdict = !valid || !bfOk
    ? "Enter a complete set of numbers"
    : bmiObese && fatObese
      ? "Obese on both scales"
      : bmiObese
        ? "Obese by BMI, not by body fat"
        : fatObese
          ? "Obese by body fat, not by BMI"
          : "Obese on neither scale";

  const fatKg = bfOk ? (weightKg * bf) / 100 : NaN;
  const leanKg = bfOk ? weightKg - fatKg : NaN;
  const fmi = bfOk ? fatKg / (m * m) : NaN;
  const ffmi = bfOk ? leanKg / (m * m) : NaN;

  // Weight at the top of each class, and the kilograms between here and there.
  const wAt30 = 29.95 * m * m;
  const wAt25 = 24.95 * m * m;
  const kgTo30 = weightKg - wAt30;
  const kgTo25 = weightKg - wAt25;

  // Fat-only loss that lands body fat exactly on the obesity line, lean mass held fixed.
  const wAtFatLine = bfOk ? leanKg / (1 - line / 100) : NaN;
  const kgFatToLine = bfOk && bf > line ? weightKg - wAtFatLine : NaN;
  const bmiAtFatLineTarget = bfOk ? wAtFatLine / (m * m) : NaN;

  // Where the body-fat obesity line sits in BMI units at this age, and its distance
  // from the BMI-30 line.
  const lineBmi = bmiAtBf(sex, line, age);
  const gapToBmiLine = 30 - lineBmi;

  const kgPerBmiPoint = m * m;
  const bmiPerKg = 1 / (m * m);

  function switchUnit(next: Unit) {
    if (next === unit) return;
    if (next === "us") {
      setHeight(Math.round(heightCm / IN));
      setWeight(Math.round(weightKg * LB));
      setWaist(Math.round((waistCm / IN) * 2) / 2);
      setNeck(Math.round((neckCm / IN) * 2) / 2);
      setHip(Math.round((hipCm / IN) * 2) / 2);
    } else {
      setHeight(Math.round(height * IN));
      setWeight(Math.round(weight / LB));
      setWaist(Math.round(waist * IN));
      setNeck(Math.round(neck * IN));
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
        <span className="tool-eyebrow">OBESE SCALE · TWO LINES, TWO ANSWERS</span>
        <h1>Your scale can only print one of two different words</h1>
        <p className="tool-lede">
          When a scale or a chart calls you obese, it is almost always applying one rule: BMI of 30 or
          higher. That rule never looks at how much of you is fat. This page runs the BMI line and the
          body-fat line side by side on the same body, splits your weight into fat mass and fat-free
          mass, and tells you how many kilograms sit between you and each line — plus where the two
          lines have drifted apart at your age.
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
              <Field label="Where your body fat comes from">
                <select value={source} onChange={(e) => setSource(e.target.value as BfSource)}>
                  <option value="bmi">Estimate it from BMI</option>
                  <option value="tape">Tape circumferences (Navy)</option>
                  <option value="own">I already have a number</option>
                </select>
              </Field>

              {source === "own" ? (
                <Field label="Your body fat (%)">
                  <input type="number" min={3} max={70} step={0.1} value={ownBf} onChange={(e) => setOwnBf(+e.target.value)} />
                </Field>
              ) : null}

              {source === "tape" ? (
                <>
                  <Field label={`Waist (${lengthLabel})`}>
                    <input type="number" min={1} step={0.5} value={waist} onChange={(e) => setWaist(+e.target.value)} />
                  </Field>
                  <Field label={`Neck (${lengthLabel})`}>
                    <input type="number" min={1} step={0.5} value={neck} onChange={(e) => setNeck(+e.target.value)} />
                  </Field>
                  {sex === "female" ? (
                    <Field label={`Hip (${lengthLabel})`}>
                      <input type="number" min={1} step={0.5} value={hip} onChange={(e) => setHip(+e.target.value)} />
                    </Field>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          <div className="answer-card">
            <span>BODY MASS INDEX · WHO CLASS</span>
            <div className="answer-number">
              {valid ? bmi.toFixed(1) : "—"}
              <small>{valid ? whoClass(bmi) : "enter height and weight"}</small>
            </div>
            {valid ? (
              <>
                <p>
                  <b style={{ color: "#fff" }}>{verdict}.</b>{" "}
                  {bfOk
                    ? `Body fat ${bf.toFixed(1)}% (${bfLabel}) against the ${line}% obesity line for ${
                        sex === "male" ? "men" : "women"
                      }, and BMI ${bmi.toFixed(1)} against the line at 30.`
                    : "Add a body fat number to compare the two scales."}
                </p>
                {bfOk ? (
                  <>
                    <p>
                      Your {weightKg.toFixed(1)} kg splits into <b>{fatKg.toFixed(1)} kg of fat</b> and{" "}
                      <b>{leanKg.toFixed(1)} kg of everything else</b> — a fat mass index of{" "}
                      <b>{fmi.toFixed(2)}</b> and a fat-free mass index of <b>{ffmi.toFixed(2)}</b>.
                    </p>
                    <p>
                      At {age}, the body-fat obesity line corresponds to a BMI of{" "}
                      <b>{lineBmi.toFixed(2)}</b>, which is{" "}
                      <b>{Math.abs(gapToBmiLine).toFixed(2)} points {gapToBmiLine >= 0 ? "below" : "above"}</b>{" "}
                      the BMI-30 line. The two scales disagree by that much before your own body is even
                      involved.
                    </p>
                    {bmiObese ? (
                      <p>
                        Leaving the BMI-obese class takes <b>{kgTo30.toFixed(1)} kg</b> — that is{" "}
                        {(kgTo30 / kgPerBmiPoint).toFixed(2)} BMI points at your height, where one point
                        costs {kgPerBmiPoint.toFixed(2)} kg. Reaching the top of the overweight band
                        instead takes <b>{kgTo25.toFixed(1)} kg</b>.
                      </p>
                    ) : (
                      <p>
                        The BMI-30 line is <b>{(wAt30 - weightKg).toFixed(1)} kg</b> above you at this
                        height; one BMI point costs {kgPerBmiPoint.toFixed(2)} kg here.
                      </p>
                    )}
                    {Number.isFinite(kgFatToLine) ? (
                      <p>
                        Closing the body-fat gap with fat alone — lean mass untouched — is{" "}
                        <b>{kgFatToLine.toFixed(1)} kg</b>, landing you at {wAtFatLine.toFixed(1)} kg and a
                        BMI of {bmiAtFatLineTarget.toFixed(1)}.
                      </p>
                    ) : null}
                    <p>
                      One kilogram of body weight moves your BMI by {bmiPerKg.toFixed(3)} points here, so a
                      two-kilogram morning swing is worth {(2 * bmiPerKg).toFixed(2)} BMI points — enough
                      to change the word on a scale without changing your body.
                    </p>
                  </>
                ) : null}
              </>
            ) : (
              <p>Enter your height, weight and age to see where the two lines fall.</p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>WHAT THIS PAGE COMPUTES</span>
          <strong>
            BMI = weight ÷ height² · obese at 30.0
            <br />
            Deurenberg (1991): BF% = 1.20·BMI + 0.23·age − 10.8·sex − 5.4
            <br />
            Fat mass index = BMI × BF% ÷ 100 · Fat-free mass index = BMI − FMI
          </strong>
          <small>
            The BMI classes are the World Health Organization adult categories and the body-fat obesity
            line is the obesity category of the ACE chart as it is commonly reproduced — 25% for men,
            32% for women. Everything else on this page — every threshold table, the age drift, the FMI
            grid, the cross-classification and every kilogram figure in the answer card — is arithmetic
            this page performs on those published numbers. None of it is copied from anywhere, and none
            of it is a clinical diagnosis.
          </small>
        </div>

        <section className="content-block">
          <h2>Two scales, two definitions, one word</h2>
          <p>
            The word obese gets used for two different measurements, and the mismatch is the reason so
            many people get a number they do not recognise. One definition is a ratio of weight to
            height. The other is a share of body mass. They are not the same quantity, they do not move
            together, and a device that reports one of them cannot report the other without guessing.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>What the scale measures</span>
              <b>The rule</b>
              <span>What it ignores</span>
              <span>What it cannot tell you</span>
            </div>
            {[
              [
                "Weight and height",
                "BMI of 30.0 or above is the obese class; 25.0 to 29.9 is overweight; 35.0 and 40.0 split the class into II and III",
                "Everything about what the weight is made of",
                "Whether the extra kilograms are fat, muscle, bone or water",
              ],
              [
                "Body fat share",
                "The obesity category begins at 25% for men and 32% for women on the commonly reproduced ACE chart",
                "How heavy you are in absolute terms",
                "How much fat you carry in total — only what share of you it is",
              ],
              [
                "Fat mass against height",
                "Fat mass index, fat kilograms divided by height squared, removes the height confusion entirely",
                "Muscle, so a heavy muscular body still looks large",
                "Nothing about health risk on its own — it has no agreed cut-off",
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
            The practical consequence is that a single body can be called obese by one rule and not by
            the other, and neither rule is lying. They are answering different questions. The rest of
            this page is about how far apart those answers actually sit.
          </p>
        </section>

        <section className="content-block">
          <h2>BMI 30 is not one body-fat number</h2>
          <p>
            Take the BMI-30 line and push it through the Deurenberg equation, which estimates body fat
            from BMI, age and sex. The line stops being a line: the body fat it corresponds to depends
            entirely on who is standing on the scale. Every figure below is that equation evaluated at
            BMI 30, computed here.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Age</span>
              <b>Body fat at BMI 30 — men</b>
              <span>Body fat at BMI 30 — women</span>
            </div>
            {TABLE_A.map(([a, menBf, womenBf]) => (
              <div className="chart-row" key={a}>
                <span>{a}</span>
                <strong>{menBf}%</strong>
                <span>{womenBf}%</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            A 20-year-old man at BMI 30 is estimated at 24.4% body fat; a 70-year-old man at the same
            BMI is estimated at 35.9%. That is 11.5 percentage points of difference produced by age
            alone, with the height-to-weight ratio held perfectly constant. The BMI line is fixed; the
            body it describes is not.
          </p>
          <h3 style={{ marginTop: 34, fontSize: 22, letterSpacing: "-0.8px" }}>
            Run it the other way: where the body-fat line sits in BMI units
          </h3>
          <p>
            Inverting the same equation answers a sharper question — at what BMI does body fat reach the
            obesity category at all? The answer moves by 0.1917 BMI points for every year of age, which
            is 1.92 points per decade, because the age term (0.23) is divided by the BMI coefficient
            (1.20).
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Age</span>
              <b>Men: BMI at 25%</b>
              <span>vs the 30 line</span>
              <b>Women: BMI at 32%</b>
              <span>vs the 30 line</span>
            </div>
            {TABLE_B.map(([a, menBmi, menDiff, womenBmi, womenDiff]) => (
              <div className="chart-row chart-row-five" key={a}>
                <span>{a}</span>
                <strong>{menBmi}</strong>
                <span>{menDiff}</span>
                <strong>{womenBmi}</strong>
                <span>{womenDiff}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Past about age {Math.round((37.4 - 30) / 0.23)} for women and age{" "}
            {Math.round((41.2 - 30) / 0.23)} for men, the body-fat obesity line sits at a BMI below 25 —
            inside what BMI calls normal. Two scales, same body, opposite words, and the disagreement
            grows by {AGE_DRIFT_PER_DECADE.toFixed(2)} BMI points every ten years of age.
          </p>
        </section>

        <section className="content-block">
          <h2>Body composition: what the number on the scale is made of</h2>
          <p>
            Body weight is the sum of fat mass and fat-free mass, and fat-free mass is itself a bundle
            of muscle, bone, organs and water. Two people of identical height and weight can differ by
            twenty kilograms of fat. This is the part a scale cannot see, and it is why the same weight
            can mean two entirely different bodies.
          </p>
          <p>
            The clean way to compare bodies of different sizes is to divide each component by height
            squared, exactly the way BMI divides total weight. Fat mass index and fat-free mass index
            fall out of numbers you already have: FMI is BMI multiplied by body fat share, and FFMI is
            whatever is left. The grid below is FMI computed across BMI and body fat percentage.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>BMI</span>
              <b>at 20% fat</b>
              <span>at 25% fat</span>
              <span>at 30% fat</span>
              <span>at 35% fat</span>
            </div>
            {TABLE_C.map(([b, c1, c2, c3, c4]) => (
              <div className="chart-row chart-row-five" key={b}>
                <span>{b}</span>
                <strong>{c1}</strong>
                <span>{c2}</span>
                <span>{c3}</span>
                <span>{c4}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Read the grid sideways and the problem with BMI becomes obvious: an FMI of 7.50 appears at
            BMI 30 with 25% body fat and again at BMI 25 with 30% body fat and again at BMI 22 with
            34% body fat. The same absolute fat load, three different BMI labels. BMI cannot separate
            those, because it never measures the split.
          </p>
          <p>
            That is also why a scale that estimates body fat from weight alone is not really measuring
            composition — it is re-labelling the number it already had. A genuinely independent reading
            has to come from something weight does not determine: circumferences, skinfolds, or an
            electrical signal through the body.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Piece of the weight</span>
              <b>What it is</b>
              <span>Where to go next on this site</span>
            </div>
            {[
              [
                "Fat mass",
                "Total kilograms of fat, the number a fat-loss phase actually targets",
                <a href="/navy-body-fat-calculator">Navy body fat calculator</a>,
              ],
              [
                "Fat-free mass",
                "Everything else: muscle, bone, organs, water. Protecting it is the hard part of losing weight",
                <a href="/ffmi-calculator">FFMI calculator</a>,
              ],
              [
                "Fat mass index",
                "Fat kilograms over height squared — fat load without the height confusion",
                <a href="/body-fat-index">Body fat index vs BMI</a>,
              ],
              [
                "Body fat percentage",
                "The share, not the amount. Two people can share a percentage and differ by ten kilograms of fat",
                <a href="/body-fat-percentage-calculator">Body fat with an error bar</a>,
              ],
              [
                "Change over time",
                "Percentage of starting weight lost, and whether a stall is real or noise",
                <a href="/weight-loss-percentage-calculator">Weight loss percentage</a>,
              ],
              [
                "Fat down, muscle up",
                "Losing fat and gaining lean at the same time, and the intake that makes it possible",
                <a href="/body-recomposition-calculator">Body recomposition</a>,
              ],
              [
                "Where the fat sits",
                "Waist and central storage, which BMI reads no better than it reads composition",
                <a href="/army-bmi-calculator">Waist-to-height zones</a>,
              ],
              [
                "What a smart scale reads",
                "Bioelectrical impedance, and why hydration moves it more than fat does",
                <a href="/scale-bmi">BMI and smart scales</a>,
              ],
            ].map((row) => (
              <div className="chart-row" key={String(row[0])}>
                <span>{row[0]}</span>
                <strong>{row[1]}</strong>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-block">
          <h2>Four ways to be called obese, and four ways not to be</h2>
          <p>
            The eight bodies below are computed, not surveyed. Each one has a height and a weight, which
            fixes BMI, and a set of circumferences, which the Navy equation turns into a body fat
            percentage. The Navy equation never sees body weight, so the two verdicts are genuinely
            independent — unlike a BMI-derived estimate, where the two answers are algebraically tied
            together.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Body</span>
              <b>BMI</b>
              <span>Body fat</span>
              <span>Fat / fat-free kg</span>
              <span>Verdict</span>
            </div>
            {TABLE_E.map(([who, b, bfPct, split, verdictText]) => (
              <div className="chart-row chart-row-five" key={who}>
                <span>{who}</span>
                <strong>{b}</strong>
                <span>{bfPct}</span>
                <span>{split}</span>
                <span>{verdictText}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            The first row is the case that makes people distrust BMI: 98 kg at 180 cm, BMI 30.2, and a
            waist-to-neck relationship that puts body fat at 19.9% — under the 25% line. The second row
            is the opposite and arguably the more dangerous one: BMI 27.4, technically only overweight,
            with body fat at 26.7%. A scale that only knows BMI never flags that body at all.
          </p>
        </section>

        <section className="content-block">
          <h2>How many kilograms the word costs</h2>
          <p>
            Because BMI divides by height squared, the kilograms behind one BMI point change with height.
            At 155 cm a point is 2.40 kg; at 190 cm it is 3.61 kg. That is why the same weight loss
            moves the scale&apos;s word further for a shorter person.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Height</span>
              <b>Kilograms per BMI point</b>
              <span>Weight at BMI 30</span>
              <span>Weight at BMI 35</span>
            </div>
            {TABLE_D.map(([h, per, w30, w35]) => (
              <div className="chart-row chart-row-wide" key={h}>
                <span>{h} cm</span>
                <strong>{per} kg</strong>
                <span>{w30} kg</span>
                <span>{w35} kg</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            And here is the part that makes single readings unreliable. One kilogram of body weight is
            worth this much BMI, depending on height:
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Height</span>
              <b>BMI points per 1 kg</b>
              <span>BMI points per 2 kg</span>
            </div>
            {TABLE_G.map(([h, one, two]) => (
              <div className="chart-row" key={h}>
                <span>{h} cm</span>
                <strong>{one}</strong>
                <span>{two}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Two kilograms of water is worth 0.58 to 0.83 BMI points depending on height. Anyone sitting
            within about one BMI point of a class boundary — roughly 2.4 to 3.6 kg — will cross it and
            cross back on ordinary daily fluctuation. That is not a change in the body; it is a change
            in the reading.
          </p>
        </section>

        <section className="content-block">
          <h2>Where this page&apos;s arithmetic stops being true</h2>
          <p>
            Everything here is arithmetic on two published equations, and it inherits their limits.
          </p>
          <ul style={{ marginTop: 16 }}>
            <li>
              When you choose the BMI-derived estimate, the two verdicts are not independent — the body
              fat number is computed from the BMI you just entered. The cross-classification only means
              something when body fat comes from an independent measurement.
            </li>
            <li>
              The Navy equation is a prediction equation developed on a specific population. It can be
              several points off for an individual body, and this page does not claim otherwise.
            </li>
            <li>
              The 25% and 32% body-fat lines are chart categories, not clinical diagnostic criteria. No
              organisation uses them to diagnose anything.
            </li>
            <li>
              The age drift of 0.1917 BMI points per year is a property of the Deurenberg equation, not
              a claim that what counts as obesity changes with age. It is an artefact of the model run
              honestly, and it is worth knowing that the model produces it.
            </li>
            <li>
              Fat mass index has no agreed cut-off anywhere. It is shown here because it separates fat
              load from height cleanly, not because anyone has defined where it becomes dangerous.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Questions this page gets asked</h2>
          <div className="mini-faq">
            <details>
              <summary>My scale says obese but I look lean. Is it broken?</summary>
              <p>
                Probably not. A scale that reports a category is almost always applying BMI, which
                cannot distinguish muscle from fat. The check is independent: measure waist and neck and
                run the Navy equation, or compare against{" "}
                <a href="/body-fat-percentage-chart">body fat percentage charts</a>. If both scales
                disagree strongly, the BMI one is the weaker claim.
              </p>
            </details>
            <details>
              <summary>What BMI counts as obese?</summary>
              <p>
                The World Health Organization adult categories put obesity at 30.0 and above, split into
                class I from 30.0 to 34.9, class II from 35.0 to 39.9 and class III at 40.0 and above.
                Overweight runs from 25.0 to 29.9 and normal from 18.5 to 24.9.
              </p>
            </details>
            <details>
              <summary>What body fat percentage counts as obese?</summary>
              <p>
                On the ACE chart as commonly reproduced, the obesity category starts at 25% for men and
                32% for women. Those are chart bands, not diagnostic thresholds — no clinical body uses
                them on their own.
              </p>
            </details>
            <details>
              <summary>How much weight do I need to lose to stop being classed as obese?</summary>
              <p>
                Whatever it takes to bring BMI under 30.0, which the calculator above works out for your
                height. At 170 cm that is 86.6 kg; at 180 cm it is 97.0 kg. Anything within about three
                kilograms of the line is inside normal daily water swing, so treat the boundary as a
                zone rather than a point.
              </p>
            </details>
            <details>
              <summary>Is BMI or body fat the better number?</summary>
              <p>
                They measure different things and neither is a health verdict. BMI is cheap, repeatable
                and blind to composition. Body fat is closer to the thing people mean by obese, but
                harder to measure well. Fat mass index is the cleanest of the three for comparing
                bodies of different heights, and it has no agreed cut-off — which is both its weakness
                and its honesty.
              </p>
            </details>
            <details>
              <summary>Why does the answer change when I change my age?</summary>
              <p>
                Because the body-fat estimate carries an age term of 0.23 percentage points per year.
                Weight and height do not change, so BMI stays put, but the body fat implied by that BMI
                moves — and with it the BMI at which body fat would cross the obesity line. That drift is
                1.92 BMI points per decade.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/body-fat-calculator">body fat calculator</a> ·{" "}
            <a href="/bmi-calculator">BMI calculator</a> ·{" "}
            <a href="/body-fat-index">body fat index vs BMI</a> ·{" "}
            <a href="/ffmi-calculator">FFMI calculator</a> ·{" "}
            <a href="/ffmi-vs-bmi">FFMI vs BMI</a> ·{" "}
            <a href="/navy-body-fat-calculator">Navy body fat calculator</a> ·{" "}
            <a href="/scale-bmi">BMI and smart scales</a> ·{" "}
            <a href="/measure-body-fat">measure body fat</a> ·{" "}
            <a href="/weight-loss-percentage-calculator">weight loss percentage</a> ·{" "}
            <a href="/body-recomposition-calculator">body recomposition</a> ·{" "}
            <a href="/army-bmi-calculator">waist-to-height zones</a> ·{" "}
            <a href="/body-fat-percentage-chart-men-women-age">charts by age and sex</a>
          </p>
          <p>
            <b>Not medical advice.</b> Every number on this page is arithmetic performed on published
            equations and published category boundaries, not a diagnosis and not a substitute for a
            clinical assessment. See our <a href="/disclaimer">disclaimer</a>.
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
