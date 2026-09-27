"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";
type Sex = "male" | "female";
type Method = "tape" | "caliper";

const IN = 2.54;
const LB = 2.20462;
const LN10 = Math.log(10);

// ---- Prediction equations ---------------------------------------------------
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

function navyArg(sex: Sex, waistCm: number, neckCm: number, hipCm: number): number {
  return sex === "male" ? (waistCm - neckCm) / IN : (waistCm + hipCm - neckCm) / IN;
}

// Exact partial derivative dBF/dcircumference, per centimetre.
function tapePerCm(sex: Sex, a: number): number {
  const k = sex === "male" ? 86.01 : 163.205;
  return k / (LN10 * a) / IN;
}

// Deurenberg et al. (1991): BF% = 1.20·BMI + 0.23·age − 10.8·sex − 5.4
function deurenberg(sex: Sex, bmi: number, age: number): number {
  return 1.2 * bmi + 0.23 * age - (sex === "male" ? 10.8 : 0) - 5.4;
}

// The age-and-sex corridor: the Deurenberg estimate evaluated at the two ends of
// the WHO "normal" BMI range, 18.5 and 24.9.
const BMI_LOW = 18.5;
const BMI_HIGH = 24.9;
const CORRIDOR_WIDTH = 1.2 * (BMI_HIGH - BMI_LOW); // 7.68 points

function corridor(sex: Sex, age: number): [number, number] {
  return [deurenberg(sex, BMI_LOW, age), deurenberg(sex, BMI_HIGH, age)];
}

// Jackson-Pollock 3-site body density plus the Siri conversion.
function jp3(sex: Sex, sum: number, age: number): { bd: number; bf: number } {
  const bd =
    sex === "male"
      ? 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age
      : 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age;
  return { bd, bf: 495 / bd - 450 };
}

function caliperPerMm(sex: Sex, sum: number, age: number): number {
  const { bd } = jp3(sex, sum, age);
  const dbd = sex === "male" ? -0.0008267 + 2 * 0.0000016 * sum : -0.0009929 + 2 * 0.0000023 * sum;
  return -(495 / (bd * bd)) * dbd;
}

const TAPE_SLIPS: [number, string][] = [
  [0.5, "0.5 cm — careful, tape checked twice"],
  [1, "1 cm — normal self-measurement"],
  [2, "2 cm — rushed, or tape riding up"],
  [3, "3 cm — over clothing or wrong landmark"],
];

const CALIPER_SLIPS: [number, string][] = [
  [0.5, "0.5 mm — trained assessor, repeatable pinch"],
  [1, "1 mm — careful self-measurement"],
  [2, "2 mm — typical first attempt"],
  [3, "3 mm — grabbing muscle, or cheap calipers"],
];

const READINGS: [number, string][] = [
  [1, "1 reading per site"],
  [2, "2 readings, averaged"],
  [3, "3 readings, averaged"],
  [5, "5 readings, averaged"],
];

export default function MeasureBodyFatPage() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(45);
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(80);
  const [method, setMethod] = useState<Method>("tape");
  const [waist, setWaist] = useState(92);
  const [neck, setNeck] = useState(39);
  const [hip, setHip] = useState(98);
  const [siteA, setSiteA] = useState(16);
  const [siteB, setSiteB] = useState(26);
  const [siteC, setSiteC] = useState(20);
  const [slip, setSlip] = useState(1);
  const [readings, setReadings] = useState(3);

  const heightCm = unit === "us" ? height * IN : height;
  const weightKg = unit === "us" ? weight / LB : weight;
  const waistCm = unit === "us" ? waist * IN : waist;
  const neckCm = unit === "us" ? neck * IN : neck;
  const hipCm = unit === "us" ? hip * IN : hip;

  const lengthLabel = unit === "us" ? "in" : "cm";
  const weightLabel = unit === "us" ? "lb" : "kg";

  // --- measured estimate -----------------------------------------------------
  const arg = navyArg(sex, waistCm, neckCm, hipCm);
  const tapeValid = arg > 1 && heightCm > 50;
  const bfTape = tapeValid ? navyTape(sex, waistCm, neckCm, hipCm, heightCm) : NaN;
  const dWaist = tapeValid ? tapePerCm(sex, arg) : NaN;

  const sum = siteA + siteB + siteC;
  const caliperValid = sum > 6 && sum < 300 && age > 5 && age < 100;
  const jp = caliperValid ? jp3(sex, sum, age) : { bd: NaN, bf: NaN };
  const dMm = caliperValid ? caliperPerMm(sex, sum, age) : NaN;

  const active = method === "tape" ? tapeValid : caliperValid;
  const bf = method === "tape" ? bfTape : jp.bf;

  const siteCount = method === "tape" ? (sex === "male" ? 2 : 3) : 3;
  const perUnit = method === "tape" ? dWaist : dMm;
  const sigma = Number.isFinite(perUnit) ? (perUnit * slip * Math.sqrt(siteCount)) / Math.sqrt(readings) : NaN;

  // --- the corridor ----------------------------------------------------------
  const [cLow, cHigh] = corridor(sex, age);
  const bmi = heightCm > 50 && weightKg > 20 ? weightKg / (heightCm / 100) ** 2 : NaN;
  const bfFromBmi = Number.isFinite(bmi) ? deurenberg(sex, bmi, age) : NaN;

  const gap = Number.isFinite(bf) ? (bf > cHigh ? bf - cHigh : bf < cLow ? bf - cLow : 0) : NaN;
  const position = Number.isFinite(bf) ? (bf > cHigh ? "above" : bf < cLow ? "below" : "inside") : "—";

  // Fat mass needed to reach the nearest edge, holding lean mass constant.
  const fatKg = Number.isFinite(bf) ? weightKg * (bf / 100) : NaN;
  const leanKg = Number.isFinite(bf) ? weightKg - fatKg : NaN;
  const kgToEdge = Number.isFinite(gap) && gap > 0 ? (gap * weightKg) / 100 : NaN;

  // Is the gap bigger than the measurement noise?
  const zGap = Number.isFinite(gap) && gap > 0 && sigma > 0 ? gap / sigma : NaN;

  // Inversion: at what ages would this same number sit inside the corridor?
  const kOff = sex === "male" ? 16.2 : 5.4;
  const ageFrom = Number.isFinite(bf) ? (bf - 1.2 * BMI_HIGH + kOff) / 0.23 : NaN;
  const ageTo = Number.isFinite(bf) ? (bf - 1.2 * BMI_LOW + kOff) / 0.23 : NaN;

  function switchUnit(next: Unit) {
    if (next === unit) return;
    if (next === "metric") {
      setHeight(Math.round(height * IN));
      setWeight(Math.round(weight / LB));
      setWaist(Math.round(waist * IN * 10) / 10);
      setNeck(Math.round(neck * IN * 10) / 10);
      setHip(Math.round(hip * IN * 10) / 10);
    } else {
      setHeight(Math.round(height / IN));
      setWeight(Math.round(weight * LB));
      setWaist(Math.round((waist / IN) * 10) / 10);
      setNeck(Math.round((neck / IN) * 10) / 10);
      setHip(Math.round((hip / IN) * 10) / 10);
    }
    setUnit(next);
  }

  const slipOptions = method === "tape" ? TAPE_SLIPS : CALIPER_SLIPS;
  const slipUnit = method === "tape" ? "cm" : "mm";

  const caliperLabels: [string, string, string] =
    sex === "male"
      ? ["Chest skinfold (mm)", "Abdomen skinfold (mm)", "Thigh skinfold (mm)"]
      : ["Triceps skinfold (mm)", "Suprailiac skinfold (mm)", "Thigh skinfold (mm)"];

  const methodName = method === "tape" ? "NAVY TAPE METHOD" : "JACKSON-POLLOCK 3-SITE METHOD";

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/body-fat-calculator">Body Fat %</a>
          <a href="/navy-body-fat-calculator">Navy</a>
          <a href="/fat-calculator">Fat Calculator</a>
          <a href="/body-fat-percentage-chart">Chart</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">MEASURE BODY FAT</div>
        <h1>Measure Body Fat</h1>
        <p className="tool-lede">
          Take three circumferences with a tape, or three skinfolds with a caliper, and this page turns them
          into a body fat percentage — then answers the question most calculators stop short of: where does
          that number sit for someone of your age and sex? Everything runs in your browser; nothing is
          uploaded.
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
              <Field label="How you measure">
                <select
                  value={method}
                  onChange={(e) => {
                    setMethod(e.target.value as Method);
                    setSlip(e.target.value === "tape" ? 1 : 2);
                  }}
                >
                  <option value="tape">Tape circumferences</option>
                  <option value="caliper">Skinfold caliper</option>
                </select>
              </Field>

              {method === "tape" ? (
                <>
                  <Field label={`Waist (${lengthLabel})`}>
                    <input
                      type="number"
                      min={1}
                      step={0.5}
                      value={waist}
                      onChange={(e) => setWaist(+e.target.value)}
                    />
                  </Field>
                  <Field label={`Neck (${lengthLabel})`}>
                    <input
                      type="number"
                      min={1}
                      step={0.5}
                      value={neck}
                      onChange={(e) => setNeck(+e.target.value)}
                    />
                  </Field>
                  {sex === "female" ? (
                    <Field label={`Hip (${lengthLabel})`}>
                      <input
                        type="number"
                        min={1}
                        step={0.5}
                        value={hip}
                        onChange={(e) => setHip(+e.target.value)}
                      />
                    </Field>
                  ) : (
                    <Field label=" ">
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#667067", lineHeight: 1.5 }}>
                        Men: waist at the navel, neck just below the larynx. No hip measurement is used.
                      </span>
                    </Field>
                  )}
                </>
              ) : (
                <>
                  <Field label={caliperLabels[0]}>
                    <input type="number" min={1} step={1} value={siteA} onChange={(e) => setSiteA(+e.target.value)} />
                  </Field>
                  <Field label={caliperLabels[1]}>
                    <input type="number" min={1} step={1} value={siteB} onChange={(e) => setSiteB(+e.target.value)} />
                  </Field>
                  <Field label={caliperLabels[2]}>
                    <input type="number" min={1} step={1} value={siteC} onChange={(e) => setSiteC(+e.target.value)} />
                  </Field>
                </>
              )}

              <Field label="How sloppy is each measurement?">
                <select value={slip} onChange={(e) => setSlip(+e.target.value)}>
                  {slipOptions.map(([v, label]) => (
                    <option value={v} key={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Readings per site">
                <select value={readings} onChange={(e) => setReadings(+e.target.value)}>
                  {READINGS.map(([v, label]) => (
                    <option value={v} key={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="answer-card">
            <span>{methodName}</span>
            <div className="answer-number">
              {active && Number.isFinite(bf) ? bf.toFixed(1) : "—"}
              <small>% body fat</small>
            </div>
            {active && Number.isFinite(bf) ? (
              <>
                <p>
                  The corridor for a <b>{age}</b>-year-old {sex === "male" ? "man" : "woman"} — the range
                  implied by a normal BMI at that age — runs <b>{cLow.toFixed(1)}–{cHigh.toFixed(1)}%</b>.
                  You are{" "}
                  {position === "inside" ? (
                    <>
                      <b>inside it</b>, {((bf - cLow) / CORRIDOR_WIDTH * 100).toFixed(0)}% of the way up from
                      the floor.
                    </>
                  ) : (
                    <>
                      <b>{gap.toFixed(1)} points {position} the corridor</b>
                    </>
                  )}
                  .
                </p>
                {position !== "inside" && Number.isFinite(kgToEdge) ? (
                  <p>
                    Closing that gap is <b>{kgToEdge.toFixed(1)} kg</b> of fat at your current{" "}
                    {weightKg.toFixed(0)} kg, if lean mass held still. At {slip} {slipUnit} of slip per site
                    with {readings} reading{readings > 1 ? "s" : ""} averaged, your measurement noise is{" "}
                    <b>±{sigma.toFixed(2)} points</b>, so that gap is{" "}
                    <b>{zGap.toFixed(1)} noise-widths</b> wide —{" "}
                    {zGap > 1.96 ? "bigger than this method can explain away" : "small enough that it may just be noise"}
                    .
                  </p>
                ) : (
                  <p>
                    At {slip} {slipUnit} of slip per site with {readings} reading{readings > 1 ? "s" : ""}{" "}
                    averaged, the measurement error alone is <b>±{sigma.toFixed(2)} percentage points</b>.
                    Fat mass <b>{fatKg.toFixed(1)} kg</b>, lean mass <b>{leanKg.toFixed(1)} kg</b>.
                  </p>
                )}
                {Number.isFinite(bfFromBmi) ? (
                  <p>
                    Your height and weight imply <b>{bfFromBmi.toFixed(1)}%</b> by the BMI-based equation —{" "}
                    <b>{Math.abs(bf - bfFromBmi).toFixed(1)} points</b>{" "}
                    {bf > bfFromBmi ? "above" : "below"} what the{" "}
                    {method === "tape" ? "tape" : "caliper"} says. Two different equations, two different
                    answers; neither is a referee.
                  </p>
                ) : null}
                {Number.isFinite(ageFrom) && Number.isFinite(ageTo) ? (
                  <p>
                    Hold this number for life and it would sit inside the corridor{" "}
                    <b>
                      from about age {Math.max(0, ageFrom).toFixed(0)} to age {ageTo.toFixed(0)}
                    </b>
                    . The corridor climbs 2.3 points per decade while you stay where you are.
                  </p>
                ) : null}
              </>
            ) : (
              <p>
                Enter a complete set of measurements. For the tape method the waist must be larger than the
                neck; for the caliper method the three skinfolds should add up to roughly 10–250 mm.
              </p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>WHAT THIS PAGE COMPUTES</span>
          <strong>
            Navy (men): BF% = 86.010·log₁₀(waist − neck) − 70.041·log₁₀(height) + 36.76
            <br />
            Deurenberg (1991): BF% = 1.20·BMI + 0.23·age − 10.8·sex − 5.4
            <br />
            Corridor = that second equation evaluated at BMI 18.5 and BMI 24.9
          </strong>
          <small>
            The first equation turns your tape or caliper readings into a number. The second builds the
            age-and-sex corridor it is compared against. Both are published equations, not inventions of this
            page — but the corridor itself, every crossover age, every fat-mass figure and every noise-width
            below is arithmetic this page performs on them, and none of it is copied from anywhere. The
            corridor is <b>this site&apos;s construction</b>: it is not an official standard, not a clinical
            cut-off, and not published by any organisation.
          </small>
        </div>

        <section className="content-block">
          <h2>Measuring body fat: the two home methods that work</h2>
          <p>
            You cannot measure body fat directly at home. What you can do is take a small number of body
            measurements and run them through a prediction equation, and there are only two routes worth the
            effort without a laboratory: <b>circumferences with a tape</b> and <b>skinfolds with a
            caliper</b>. Both are cheap, both are repeatable, and both carry an error of roughly one
            percentage point in untrained hands — which is why the second half of this page matters more
            than the first.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Method</span>
              <b>What you measure</b>
              <span>Where</span>
              <span>Cost of a typical slip</span>
            </div>
            {[
              [
                "Tape circumferences",
                "Waist and neck for men; waist, hip and neck for women — plus height",
                "Waist at the navel for men, at the narrowest point for women; neck just below the larynx; hip at the fullest part",
                "0.70 points per cm for men, 0.49 for women at the worked profiles below",
              ],
              [
                "Skinfold caliper",
                "Three folds in millimetres, plus age",
                "Men: chest, abdomen, thigh. Women: triceps, suprailiac, thigh",
                "About 0.28 points per mm for men, 0.31 for women at the worked profiles",
              ],
            ].map((row) => (
              <div className="chart-row chart-row-wide" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <p>
            The full landmark-by-landmark protocol — including the mistakes that shift the answer by two
            points — lives on our <a href="/fat-calculator">fat calculator</a> and{" "}
            <a href="/how-to-measure-body-fat-at-home">how to measure body fat at home</a> pages. What
            follows here is the part no reference chart gives you: what to do with the number once you have
            it.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: the age-and-sex corridor</h2>
          <p>
            Almost every body fat chart you will find is <b>age-blind</b>. It gives one set of ranges for men
            and one for women and stops there, which means a 25-year-old and a 70-year-old are being judged
            against the same line. This page builds a corridor instead: take the Deurenberg equation,
            evaluate it at the two ends of the World Health Organization&apos;s normal BMI range (18.5 and
            24.9), and you get the span of body fat percentages consistent with a normal BMI at that age and
            sex.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Age</span>
              <b>Men — corridor</b>
              <span>Women — corridor</span>
            </div>
            {[
              ["25", "11.8 – 19.4%", "22.6 – 30.2%"],
              ["35", "14.1 – 21.7%", "24.9 – 32.5%"],
              ["45", "16.4 – 24.0%", "27.2 – 34.8%"],
              ["55", "18.7 – 26.3%", "29.5 – 37.1%"],
              ["65", "21.0 – 28.6%", "31.8 – 39.4%"],
              ["75", "23.3 – 30.9%", "34.1 – 41.7%"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p>
            Three properties of this table are exact, not approximate, and they follow directly from the
            equation&apos;s shape. First, the corridor is <b>7.68 points wide at every age</b> for both
            sexes: 1.20 × (24.9 − 18.5) = 7.68, and neither age nor sex appears in that calculation. Second,
            it climbs <b>2.30 points per decade</b> — 0.23 per year, the equation&apos;s own age
            coefficient — at a constant rate with no acceleration. Third, the gap between the women&apos;s
            and men&apos;s corridor is <b>exactly 10.80 points at every age</b>, because the sex term is a
            constant −10.8 and everything else cancels.
          </p>
          <p>
            That third property is worth dwelling on, because it is the cleanest statement of the sex
            difference available: in this equation, being female adds 10.8 points of body fat at{" "}
            <i>every</i> age and <i>every</i> BMI, no more and no less. The equation has no room for the sex
            difference to narrow or widen with age, which is a modelling simplification rather than a fact
            about bodies.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: where the age-blind chart and the corridor disagree</h2>
          <p>
            Set the corridor next to the widely circulated American Council on Exercise category chart —
            Essential 2–5% / Athlete 6–13% / Fitness 14–17% / Acceptable 18–24% / Obese 25%+ for men, and
            10–13 / 14–20 / 21–24 / 25–31 / 32+ for women — and the two frames come apart as you age. Here
            is the men&apos;s comparison.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Age</span>
              <b>ACE &ldquo;fitness&rdquo; band</b>
              <span>Normal-BMI corridor</span>
              <span>What a normal-weight man reads as</span>
            </div>
            {[
              ["25", "14 – 17%", "11.8 – 19.4%", "Athlete at the lean end, Acceptable at the top"],
              ["45", "14 – 17%", "16.4 – 24.0%", "Fitness or Acceptable — the band no longer reaches Fitness floor"],
              ["65", "14 – 17%", "21.0 – 28.6%", "Acceptable at best, Obese at the top"],
            ].map((row) => (
              <div className="chart-row chart-row-wide" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <p>
            The women&apos;s version is starker. A 45-year-old woman with a completely normal BMI of 24.9
            computes to 34.8% body fat, which the age-blind chart calls <b>obese</b>. She is not obese by
            any BMI criterion — she is at the top of a normal weight range, and two different frameworks
            disagree about her entirely.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Age</span>
              <b>ACE &ldquo;fitness&rdquo; band</b>
              <span>Normal-BMI corridor</span>
              <span>What a normal-weight woman reads as</span>
            </div>
            {[
              ["25", "21 – 24%", "22.6 – 30.2%", "Fitness at the lean end, Acceptable for most of it"],
              ["45", "21 – 24%", "27.2 – 34.8%", "Acceptable at best, Obese for the upper half"],
              ["65", "21 – 24%", "31.8 – 39.4%", "Obese across almost the whole corridor"],
            ].map((row) => (
              <div className="chart-row chart-row-wide" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <p>
            Invert the calculation and you get the exact ages at which the two frameworks cross. These are
            solved algebraically from the equation, not read off a chart:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Who</span>
              <b>Line crossed</b>
              <span>Age</span>
              <span>Meaning</span>
            </div>
            {[
              [
                "Man at BMI 24.9",
                "Hits the 25% obese line",
                "49.2",
                "From his late forties, a man at the top of normal weight reads obese on an age-blind chart",
              ],
              [
                "Man at BMI 18.5",
                "Hits the 18% acceptable floor",
                "52.2",
                "From his early fifties, even the leanest normal-weight man cannot read as fitness",
              ],
              [
                "Man at BMI 18.5",
                "Hits the 25% obese line",
                "82.6",
                "Only past eighty does the whole normal-BMI corridor sit above the obese line",
              ],
              [
                "Woman at BMI 24.9",
                "Hits the 32% obese line",
                "32.7",
                "From her early thirties, a woman at the top of normal weight reads obese on an age-blind chart",
              ],
              [
                "Woman at BMI 18.5",
                "Hits the 25% acceptable floor",
                "35.7",
                "From her mid-thirties, even the leanest normal-weight woman cannot read as fitness",
              ],
              [
                "Woman at BMI 18.5",
                "Hits the 32% obese line",
                "66.1",
                "From her mid-sixties, the entire normal-BMI corridor sits above the obese line",
              ],
            ].map((row) => (
              <div className="chart-row chart-row-wide" key={row[0] + row[1] + row[2]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <p>
            Read that table honestly and it indicts both frameworks rather than either one. An age-blind
            chart that classifies a normal-weight 65-year-old woman as obese is not describing her body; it
            is describing a population she was never sampled from. But a corridor built on a BMI equation
            inherits every weakness of BMI, and the Deurenberg equation is known to behave differently
            outside the population it was fitted on. The useful conclusion is narrow and defensible:{" "}
            <b>compare yourself to an age-specific band, and treat every fixed cut-off with suspicion.</b>
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what happens if you never change</h2>
          <p>
            Because the corridor rises 2.3 points per decade and your body does not have to follow it, the
            same body fat percentage means different things at different ages. Here are two men holding
            their numbers constant from thirty to seventy.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Age</span>
              <b>Men&apos;s corridor</b>
              <span>Holding 21.0%</span>
              <span>Holding 15.0%</span>
            </div>
            {[
              ["30", "12.9 – 20.6%", "+0.42 above the ceiling", "inside"],
              ["40", "15.2 – 22.9%", "inside", "−0.20 below the floor"],
              ["50", "17.5 – 25.2%", "inside", "−2.50 below the floor"],
              ["60", "19.8 – 27.5%", "inside", "−4.80 below the floor"],
              ["70", "22.1 – 29.8%", "−1.10 below the floor", "−7.10 below the floor"],
            ].map((row) => (
              <div className="chart-row chart-row-wide" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <p>
            The man at 21.0% starts marginally above the corridor, spends three decades comfortably inside
            it, and falls out of the bottom by seventy without losing a gram. The man at 15.0% — an
            impressive number at thirty — is out of the corridor by forty. Neither of them changed; the
            reference moved.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Age</span>
              <b>Women&apos;s corridor</b>
              <span>Holding 30.0%</span>
              <span>Holding 26.0%</span>
            </div>
            {[
              ["30", "23.7 – 31.4%", "inside", "inside"],
              ["40", "26.0 – 33.7%", "inside", "inside"],
              ["50", "28.3 – 36.0%", "inside", "−2.30 below the floor"],
              ["60", "30.6 – 38.3%", "−0.60 below the floor", "−4.60 below the floor"],
              ["70", "32.9 – 40.6%", "−2.90 below the floor", "−6.90 below the floor"],
            ].map((row) => (
              <div className="chart-row chart-row-wide" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <p>
            The geometry behind all of this is simple enough to state in one line: the corridor is 7.68
            points wide and drifts 2.30 points per decade, so holding your body fat perfectly constant walks
            you from the ceiling to the floor in <b>3.34 decades</b> — about 33 years. A man at the top of
            his corridor at 25 falls out of the bottom at 58.4 if he never changes anything.
          </p>
          <p>
            Note the direction this cuts. Falling <i>below</i> the corridor as you age is not automatically
            a problem — it means you are leaner than a normal-BMI person of your age typically is, which is
            usually the result of carrying more muscle than average. The corridor is a description of a
            reference population, not a target to stay inside.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: the same question asked backwards</h2>
          <p>
            Instead of asking whether your number fits your age, ask which ages your number fits. Solving
            the corridor for age gives a window: below the lower age the corridor is still beneath you,
            above the upper age it has climbed past you.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Number held</span>
              <b>Inside the corridor from age</b>
              <span>Until age</span>
            </div>
            {[
              ["Man at 15.0%", "5.7", "39.1"],
              ["Man at 21.4%", "33.6", "67.0"],
              ["Woman at 26.0%", "6.6", "40.0"],
              ["Woman at 30.0%", "24.0", "57.4"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p>
            Every window is 33.4 years wide — the same 3.34 decades as before, because the corridor&apos;s
            width and drift are both constants. The windows differ only in where they sit. This is the most
            useful way to read a single body fat measurement: not &ldquo;am I good or bad&rdquo; but
            &ldquo;this is the age range my number is typical for.&rdquo;
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: how much fat that actually is</h2>
          <p>
            Percentage points are abstract. Converting them to kilograms is arithmetic: at body weight W,
            one percentage point of body fat is W ÷ 100 kilograms, provided lean mass holds still. Which
            means the cost of moving through the corridor scales with how much you weigh.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Body weight</span>
              <b>Kg of fat per percentage point</b>
              <span>Kg to cross the whole 7.68-point corridor</span>
            </div>
            {[
              ["60 kg", "0.60 kg", "4.61 kg"],
              ["70 kg", "0.70 kg", "5.38 kg"],
              ["80 kg", "0.80 kg", "6.14 kg"],
              ["90 kg", "0.90 kg", "6.91 kg"],
              ["100 kg", "1.00 kg", "7.68 kg"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p>
            Two worked cases make this concrete. An 80 kg man at 21.0% who wants to reach the floor of the
            45-year-old corridor (16.35%) needs <b>3.72 kg</b> of fat lost with lean mass intact. A 65 kg
            woman at 30.0% reaching for the 45-year-old floor (27.15%) needs <b>1.85 kg</b>. Both are
            ordinary amounts of fat — a few months of work, not a transformation — which is a useful piece
            of perspective next to the two-to-three-point measurement noise described below.
          </p>
          <p>
            The lean-mass caveat is doing real work in that arithmetic, though. If you lose 4 kg and 1 kg of
            it is lean, the percentage moves less than the table predicts, and at a body fat percentage of
            around 20 the difference is worth roughly half a point. Our{" "}
            <a href="/body-recomposition-calculator">body recomposition calculator</a> models the fat and
            lean split explicitly if you want that level of detail.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: is your measurement precise enough to place you?</h2>
          <p>
            Knowing whether you are inside or outside a band is only meaningful if your measurement error is
            smaller than the distance to the edge. Here is that comparison, using the two worked profiles —
            a 178 cm, 80 kg man with a 92 cm waist and 39 cm neck, and a 165 cm, 65 kg woman with a 78 cm
            waist, 98 cm hip and 32 cm neck — with three readings averaged per site.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Method</span>
              <b>Noise on one session</b>
              <span>Smallest change you can detect</span>
              <span>How much of the corridor that resolves</span>
            </div>
            {[
              ["Tape — male profile, 1 cm slip", "±0.58 points", "1.60 points", "4.8 separate positions"],
              ["Tape — female profile, 1 cm slip", "±0.49 points", "1.36 points", "5.6 separate positions"],
              ["Caliper — male profile, 2 mm slip", "±0.56 points", "1.55 points", "5.0 separate positions"],
              ["Caliper — female profile, 2 mm slip", "±0.62 points", "1.71 points", "4.5 separate positions"],
            ].map((row) => (
              <div className="chart-row chart-row-wide" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <p>
            The good news: the 7.68-point corridor is between 4.5 and 5.6 noise-widths wide, so deciding
            whether you are inside it or outside it is a decision a tape measure can actually make. The bad
            news is what happens with narrower bands. The ACE &ldquo;fitness&rdquo; band is four points wide
            — 14–17% for men, 21–24% for women — which resolves to only <b>2.5 to 2.9 separate
            positions</b>. You can tell whether you are below it, in it, or above it, and not much more.
          </p>
          <p>
            And any single fixed cut-off is worse than a band, because there is no width to absorb error at
            all. Standing one point above the 25% line with a ±0.58 point measurement is not a finding; it
            is a coin toss. This is the practical argument for thinking in corridors rather than thresholds:
            a band gives your measurement error somewhere to live.
          </p>
        </section>

        <section className="content-block">
          <h2>How to run this at home</h2>
          <ul>
            <li>
              <b>Measure the same way every time, and write down the raw numbers.</b> The corridor question
              is answered by your measurements being consistent, not by being right.
            </li>
            <li>
              <b>Three readings per site, averaged.</b> It cuts the noise by roughly 40% and costs two
              minutes. Going to five buys another 22% and is rarely worth it.
            </li>
            <li>
              <b>Same time of day, same state.</b> Morning, after the bathroom, before food and training.
              This removes the largest single source of within-person variation that has nothing to do with
              fat.
            </li>
            <li>
              <b>Re-measure monthly at the most often.</b> The detectable-change numbers above put the
              smallest trustworthy difference at 1.4 to 1.7 points, and a month of genuine fat loss is often
              under one point.
            </li>
            <li>
              <b>Track the waist in centimetres alongside the percentage.</b> It carries no prediction
              error at all, and it moves in the direction you care about.
            </li>
            <li>
              <b>Update the corridor when you have a birthday, not every session.</b> It climbs 2.3 points
              per decade, so it takes years to matter and a year to notice.
            </li>
            <li>
              <b>Cross-check against an independent method occasionally.</b> A{" "}
              <a href="/body-fat-calculator-from-photo">photo-based estimate</a> or a{" "}
              <a href="/body-fat-percentage-chart">reference chart</a> will not settle the truth, but a
              method that disagrees with everything else is a method you are using wrong.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Where this is weak</h2>
          <ul>
            <li>
              <b>The corridor is this page&apos;s construction, not a standard.</b> It is one published
              equation evaluated at two published BMI cut-offs. No organisation endorses it, and it should
              not be used as a clinical threshold.
            </li>
            <li>
              <b>It inherits every weakness of BMI.</b> BMI cannot distinguish muscle from fat, so a
              muscular person&apos;s BMI-derived corridor sits too high for them. The corridor is built on a
              normal-BMI population and describes that population, not you.
            </li>
            <li>
              <b>The age coefficient is a single constant.</b> The equation applies +0.23 points per year
              uniformly from 18 to 90. Real body composition change with age is not uniform, and this
              equation has no way to represent that.
            </li>
            <li>
              <b>The sex difference is fixed at 10.80 points.</b> That is a property of the equation&apos;s
              structure, not a measured fact that holds across all ages and body types.
            </li>
            <li>
              <b>None of the error figures include the equations&apos; own error.</b> The ± bands cover
              measurement error only. How far these equations sit from a laboratory reference method for
              your body is a separate and usually larger problem that this page does not compute.
            </li>
            <li>
              <b>The slip size you select is a guess about yourself.</b> Every noise figure is conditional
              on it. If you are worse than you think, every confidence statement above is optimistic.
            </li>
            <li>
              <b>Nothing here is a health assessment.</b> A body fat percentage is one number with a wide
              error band, and a corridor is a description of a reference population. Neither is a diagnosis.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Frequently asked questions</h2>
          <div className="mini-faq">
            <details open>
              <summary>How do I measure body fat at home?</summary>
              <p>
                Use a tape to take waist and neck circumferences — plus hip for women — and run them through
                the Navy equation, or measure three skinfolds with a caliper and use the Jackson–Pollock
                3-site equation. Both are described in the protocol tables above, and both carry about a
                percentage point of error in untrained hands.
              </p>
            </details>
            <details>
              <summary>What body fat percentage should I aim for?</summary>
              <p>
                The corridor above is one defensible answer: for a 45-year-old man it runs 16.4–24.0%, for a
                45-year-old woman 27.2–34.8%. It is this page&apos;s own construction from the Deurenberg
                equation and the WHO normal BMI range, not an official target, and it describes a
                normal-BMI reference population rather than an optimum.
              </p>
            </details>
            <details>
              <summary>Why does the target change with age?</summary>
              <p>
                In this construction it changes because the Deurenberg equation carries a +0.23
                percentage-point-per-year age term, which is 2.30 points per decade. The mechanism usually
                proposed is age-related loss of lean mass raising the fat fraction at stable weight, but
                this page only computes the arithmetic — it does not verify the mechanism.
              </p>
            </details>
            <details>
              <summary>Why is the women&apos;s range so much higher than the men&apos;s?</summary>
              <p>
                In this equation the difference is exactly 10.80 points at every age and BMI, because the
                sex term is a fixed constant. Essential fat requirements differ between the sexes, which is
                the usual explanation offered; the equation itself simply asserts the constant.
              </p>
            </details>
            <details>
              <summary>Is a body fat chart or a BMI-based corridor right?</summary>
              <p>
                Neither, in any absolute sense — they disagree systematically and the crossover table above
                gives the exact ages. A fixed chart classifies a normal-weight 65-year-old woman as obese,
                which is plainly wrong; a BMI-based corridor inherits BMI&apos;s inability to see muscle. Use
                the corridor for tracking against your own age and sex, and distrust any single cut-off.
              </p>
            </details>
            <details>
              <summary>How accurate is a home body fat measurement?</summary>
              <p>
                The measurement part is computable: around ±0.5 to ±0.6 points with three readings averaged
                per site, rising to ±1.5 to ±3.0 for a rushed job. The larger part — how far the equation
                sits from a laboratory reference for your body — is not computable from your inputs and this
                page does not claim it.
              </p>
            </details>
            <details>
              <summary>Can I tell whether I am in the &ldquo;fitness&rdquo; band?</summary>
              <p>
                Only roughly. That band is four points wide and a careful home measurement resolves about
                2.5 to 2.9 positions inside it, so you can say below, inside or above — and no finer. Any
                claim that you are at exactly 16% rather than 17% is beyond what a tape or caliper can
                support.
              </p>
            </details>
            <details>
              <summary>How many kilograms is one percentage point of body fat?</summary>
              <p>
                Your body weight divided by 100, assuming lean mass holds still: 0.80 kg per point at 80 kg,
                0.65 kg at 65 kg. Crossing the full 7.68-point corridor costs 4.61 kg at 60 kg body weight
                and 7.68 kg at 100 kg.
              </p>
            </details>
            <details>
              <summary>How often should I re-measure?</summary>
              <p>
                Monthly at the most. The smallest change a careful home method can resolve is 1.4 to 1.7
                percentage points, and a month of real fat loss is frequently smaller than that. Quarterly
                is the honest interval for most people.
              </p>
            </details>
            <details>
              <summary>Why do two calculators give me different numbers?</summary>
              <p>
                Different equations, and sometimes different landmark definitions for the same equation. On
                this page you can see it directly: the comparison line in the answer card shows the gap
                between your tape or caliper result and the BMI-based estimate of the same body, which is
                frequently two to three points.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/fat-calculator">fat calculator with an error budget</a> ·{" "}
            <a href="/body-fat-calculator">body fat calculator</a> ·{" "}
            <a href="/navy-body-fat-calculator">Navy body fat calculator</a> ·{" "}
            <a href="/how-to-measure-body-fat-at-home">how to measure body fat at home</a> ·{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a> ·{" "}
            <a href="/body-fat-percentage-calculator">body fat with a cross-method error bar</a> ·{" "}
            <a href="/scale-bmi">BMI and smart scales</a>
          </p>
          <p>
            <b>Not medical advice.</b> The corridor on this page is this site&apos;s own construction from a
            published equation and two published BMI cut-offs; it is not an official standard. All error
            figures cover measurement error only and are conditional on the slip size you selected. See our{" "}
            <a href="/disclaimer">disclaimer</a>.
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
