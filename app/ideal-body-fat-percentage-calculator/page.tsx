"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";
type Sex = "male" | "female";
type Source = "navy" | "own" | "bmi";

const IN = 2.54;
const LB = 2.20462;

// ---- Prediction equations ---------------------------------------------------
// U.S. Navy circumference equations, inches. Same constants used across this site.
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

// This page's age-and-sex band: the Deurenberg estimate evaluated at the two
// ends of the WHO "normal" BMI range, 18.5 and 24.9.
const BMI_LOW = 18.5;
const BMI_HIGH = 24.9;
const BAND_WIDTH = 1.2 * (BMI_HIGH - BMI_LOW); // 7.68 points

function bandFor(sex: Sex, age: number): [number, number] {
  return [deurenberg(sex, BMI_LOW, age), deurenberg(sex, BMI_HIGH, age)];
}

function n(x: number, d = 2): string {
  return Number.isFinite(x) ? x.toFixed(d) : "—";
}

export default function IdealBodyFatPercentageCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(45);
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(92);
  const [source, setSource] = useState<Source>("navy");
  const [waist, setWaist] = useState(102);
  const [neck, setNeck] = useState(40);
  const [hip, setHip] = useState(98);
  const [ownBf, setOwnBf] = useState(27);
  const [target, setTarget] = useState(24);

  const heightCm = unit === "us" ? height * IN : height;
  const weightKg = unit === "us" ? weight / LB : weight;
  const waistCm = unit === "us" ? waist * IN : waist;
  const neckCm = unit === "us" ? neck * IN : neck;
  const hipCm = unit === "us" ? hip * IN : hip;

  const lengthLabel = unit === "us" ? "in" : "cm";
  const weightLabel = unit === "us" ? "lb" : "kg";

  const bmi = heightCm > 100 ? weightKg / (heightCm / 100) ** 2 : NaN;
  const argCm = sex === "male" ? waistCm - neckCm : waistCm + hipCm - neckCm;

  const bodyOk = heightCm > 120 && heightCm < 230 && weightKg > 30 && weightKg < 250 && age > 12 && age < 95;
  const tapeOk = argCm > 5;
  const ownOk = ownBf > 2 && ownBf < 70;

  const bf =
    source === "navy"
      ? bodyOk && tapeOk
        ? navyTape(sex, waistCm, neckCm, hipCm, heightCm)
        : NaN
      : source === "own"
        ? ownOk
          ? ownBf
          : NaN
        : bodyOk
          ? deurenberg(sex, bmi, age)
          : NaN;

  const valid = Number.isFinite(bf) && bf > 2 && bf < 70 && bodyOk;
  const W = weightKg;
  const F = valid ? (bf / 100) * W : NaN;
  const L = valid ? W - F : NaN;
  const ffmi = valid ? L / (heightCm / 100) ** 2 : NaN;

  // --- the age-and-sex band --------------------------------------------------
  const band = bandFor(sex, age);
  const band10 = bandFor(sex, age + 10);
  const lo = band[0];
  const hi = band[1];
  const mid = (lo + hi) / 2;

  // --- the band expressed as a range of scale readings -----------------------
  // At fixed lean mass L, a body fat fraction t is read at weight L / (1 − t).
  const wAtLow = valid ? L / (1 - lo / 100) : NaN;
  const wAtHigh = valid ? L / (1 - hi / 100) : NaN;
  const windowWidth = valid ? wAtHigh - wAtLow : NaN;

  // --- verdict ---------------------------------------------------------------
  const verdict = !valid ? "none" : bf > hi ? "above" : bf < lo ? "below" : "inside";
  const edgeGap =
    verdict === "above" ? bf - hi : verdict === "below" ? lo - bf : Math.min(bf - lo, hi - bf);

  // --- kilograms to the target ----------------------------------------------
  // Exact inversion of BF = F ÷ W with lean mass held fixed.
  const tOk = valid && target > 2 && target < 70;
  const t = target / 100;
  const delta = tOk ? (W * (bf / 100 - t)) / (1 - t) : NaN;
  const endWeight = tOk ? W - delta : NaN;
  const deltaShare = tOk ? (delta / W) * 100 : NaN;
  const perPointAtTarget = tOk ? (0.01 * L) / (1 - t) ** 2 : NaN;
  const fatAtTarget = tOk ? (t * L) / (1 - t) : NaN;
  const shareOfRemaining = tOk ? 1 / (t * (1 - t)) : NaN;

  // --- the BMI frame's own ceiling ------------------------------------------
  // The body fat percentage at which this lean mass would sit at BMI 24.9.
  const ceiling = valid ? 100 * (1 - ffmi / BMI_HIGH) : NaN;
  const ceilingReachable = Number.isFinite(ceiling) && ceiling > 0;

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

  function toBandTop() {
    setTarget(Math.max(3, Math.round(hi * 10) / 10));
  }

  const show = valid;

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/body-fat-calculator">Body Fat %</a>
          <a href="/measure-body-fat">Age and Sex</a>
          <a href="/body-composition-calculator">Composition</a>
          <a href="/ffmi-calculator">FFMI</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">IDEAL BODY FAT PERCENTAGE CALCULATOR</div>
        <h1>Ideal Body Fat Percentage Calculator</h1>
        <p className="tool-lede">
          Enter your age, sex, height, weight and one body-fat reading and this page returns the ideal
          band for someone of your age and sex — then does the part most charts skip: it converts that
          band into kilograms of fat and into a range of scale readings. Because a percentage is a
          ratio, an ideal band is not one number you chase, it is a weight window you can stand
          anywhere inside. Everything runs in your browser; nothing is uploaded.
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
              <Field label="Body fat comes from">
                <select value={source} onChange={(e) => setSource(e.target.value as Source)}>
                  <option value="navy">Navy tape measurement</option>
                  <option value="own">I already know my %</option>
                  <option value="bmi">Estimate from BMI and age</option>
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
              <Field label={`Height (${lengthLabel})`}>
                <input type="number" min={1} value={height} onChange={(e) => setHeight(+e.target.value)} />
              </Field>
              <Field label={`Weight (${weightLabel})`}>
                <input type="number" min={1} value={weight} onChange={(e) => setWeight(+e.target.value)} />
              </Field>
              {source === "navy" ? (
                <>
                  <Field label={`Waist (${lengthLabel})`}>
                    <input
                      type="number"
                      min={1}
                      step={0.1}
                      value={waist}
                      onChange={(e) => setWaist(+e.target.value)}
                    />
                  </Field>
                  <Field label={`Neck (${lengthLabel})`}>
                    <input
                      type="number"
                      min={1}
                      step={0.1}
                      value={neck}
                      onChange={(e) => setNeck(+e.target.value)}
                    />
                  </Field>
                  {sex === "female" ? (
                    <Field label={`Hip (${lengthLabel})`}>
                      <input
                        type="number"
                        min={1}
                        step={0.1}
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
              ) : null}
              {source === "own" ? (
                <Field label="Your body fat %">
                  <input
                    type="number"
                    min={3}
                    max={65}
                    step={0.1}
                    value={ownBf}
                    onChange={(e) => setOwnBf(+e.target.value)}
                  />
                </Field>
              ) : null}
              <Field label="Target body fat %">
                <input
                  type="number"
                  min={3}
                  max={65}
                  step={0.1}
                  value={target}
                  onChange={(e) => setTarget(+e.target.value)}
                />
              </Field>
              {source === "bmi" ? (
                <Field label=" ">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#667067", lineHeight: 1.5 }}>
                    Estimated with the Deurenberg equation from BMI and age. That estimate is built from
                    the weight you just entered, so it is not an independent measurement.
                  </span>
                </Field>
              ) : null}
            </div>
            <button className="calc-button" onClick={toBandTop}>
              Set my target to the top of my ideal band
            </button>
          </div>

          <div className="answer-card">
            <span>IDEAL BAND FOR YOUR AGE AND SEX · IN POINTS, KILOGRAMS AND SCALE WEIGHT</span>
            <div className="answer-number">
              {show ? `${n(lo, 1)} – ${n(hi, 1)}` : "—"}
              <small>% ideal band</small>
            </div>
            {show ? (
              <>
                <p>
                  You are reading <b>{n(bf, 1)}%</b> —{" "}
                  {verdict === "above" ? (
                    <>
                      <b>{n(edgeGap, 1)} points above</b> the top of the band
                    </>
                  ) : verdict === "below" ? (
                    <>
                      <b>{n(edgeGap, 1)} points below</b> the bottom of the band
                    </>
                  ) : (
                    <>
                      <b>inside it</b>, {n(edgeGap, 1)} points from the nearer edge
                    </>
                  )}
                  . The band is {n(BAND_WIDTH, 2)} points wide at every age and moves up{" "}
                  {n(0.23 * 10, 2)} points per decade; at {age + 10} it will read {n(band10[0], 1)} –{" "}
                  {n(band10[1], 1)}%.
                </p>
                <p>
                  <b>Your band is a weight window.</b> Hold your {n(L, 1)} kg of lean mass fixed and the
                  band runs from <b>{n(wAtHigh, 1)} {weightLabel}</b> at the top edge to{" "}
                  <b>{n(wAtLow, 1)} {weightLabel}</b> at the lean edge — a{" "}
                  <b>{n(windowWidth, 1)} {weightLabel} range</b> you could weigh anywhere inside and still
                  be in your ideal band. That is the whole point of a band: the percentage is a ratio, so
                  the same ratio is reached at many different weights.
                </p>
                {tOk ? (
                  delta > 0.05 ? (
                    <p>
                      <b>To reach {n(target, 1)}%</b> by losing fat with lean held constant:{" "}
                      <b>{n(delta, 2)} kg</b> of fat, ending at <b>{n(endWeight, 1)} {weightLabel}</b>.
                      That is <b>{n(deltaShare, 1)}%</b> of the weight you carry now. At that body you
                      would hold {n(fatAtTarget, 2)} kg of fat, and every further point down would cost{" "}
                      <b>{n(perPointAtTarget, 2)} kg</b> — which is{" "}
                      <b>{n(shareOfRemaining, 1)}%</b> of the fat you have left at that point.
                    </p>
                  ) : (
                    <p>
                      <b>You are already at or beyond {n(target, 1)}%.</b> Reaching it would take{" "}
                      {n(-delta, 2)} kg of <i>added</i> fat at fixed lean, ending at{" "}
                      {n(endWeight, 1)} {weightLabel}. Each further point down from there costs{" "}
                      {n(perPointAtTarget, 2)} kg, or {n(shareOfRemaining, 1)}% of the fat mass you
                      would have left.
                    </p>
                  )
                ) : (
                  <p>Set a target between 3% and 65% and the kilograms to it appear here.</p>
                )}
                <p>
                  <b>What the BMI frame would ask of you.</b> Your lean mass alone is worth a BMI of{" "}
                  {n(ffmi, 2)}. To register a normal-range BMI of 24.9 you would have to sit at or under{" "}
                  <b>{ceilingReachable ? `${n(ceiling, 1)}%` : "no attainable percentage"}</b>
                  {ceilingReachable ? (
                    ceiling < lo ? (
                      <>
                        {" "}
                        — below the bottom of your age band, so no single body fat percentage satisfies
                        both frames. That is a verdict about BMI, not a target to chase.
                      </>
                    ) : (
                      <>
                        {" "}
                        — the age band is the tighter of the two for you.
                      </>
                    )
                  ) : (
                    <>
                      {" "}
                      — your lean mass alone already exceeds a normal BMI, so BMI cannot describe you as
                      normal at any body fat level.
                    </>
                  )}
                </p>
              </>
            ) : (
              <p>
                Enter your height and weight, then either the tape measurements, your own body fat
                reading, or let the BMI estimate fill it in. The waist–neck difference must be positive.
              </p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>THE TWO INVERSIONS EVERY TABLE ON THIS PAGE COMES FROM</span>
          <strong>
            W = F + L &nbsp;·&nbsp; BF = F ÷ W &nbsp;·&nbsp; at fixed lean: W(t) = L ÷ (1 − t)
            <br />
            kg of fat to reach t: Δ = W·(BF − t) ÷ (1 − t) &nbsp;·&nbsp; per point: 0.01·L ÷ (1 − t)²
            <br />
            share of remaining fat per point: 1 ÷ (t·(1 − t)) — independent of body size
          </strong>
          <small>
            L is lean mass, W is body weight, t is the target fraction. All three lines are exact
            inversions of BF = F ÷ W with lean mass held constant — no approximation, no fitted
            constant, no reference population. The age-and-sex band is this page&apos;s own
            construction: the Deurenberg et al. (1991) prediction equation, BF% = 1.20·BMI + 0.23·age −
            10.8·sex − 5.4, evaluated at the two ends of the WHO &quot;normal&quot; BMI range, 18.5 and
            24.9, which is why the band is 1.20 × 6.4 = 7.68 points wide at every age and rises 0.23
            points per year. Where an individual body fat reading is needed this page uses the U.S. Navy
            tape equation — the same one used everywhere on this site. Every table below is arithmetic
            this page performs on those equations. None of it is copied, and none of it is a claim about
            how accurate any equation is.
          </small>
        </div>

        <section className="content-block">
          <h2>The band, by age and sex</h2>
          <p>
            There is no single published number that everyone agrees is ideal, and this page does not
            pretend otherwise. What it can do is build one transparently from a published equation and a
            published BMI range, and then show you exactly what that band costs. Take the Deurenberg
            equation and ask: what body fat percentage does it predict for a person of this age and sex
            whose BMI sits anywhere in the WHO normal range of 18.5 to 24.9? The answer is a band, not a
            point, and it is 7.68 points wide at every age.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Age</span>
              <b>Men: lean edge</b>
              <b>Men: top edge</b>
              <b>Women: lean edge</b>
              <b>Women: top edge</b>
            </div>
            {[
              ["20", "10.60", "18.28", "21.40", "29.08"],
              ["30", "12.90", "20.58", "23.70", "31.38"],
              ["40", "15.20", "22.88", "26.00", "33.68"],
              ["50", "17.50", "25.18", "28.30", "35.98"],
              ["60", "19.80", "27.48", "30.60", "38.28"],
              ["70", "22.10", "29.78", "32.90", "40.58"],
            ].map((row) => (
              <div className="chart-row chart-row-five" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}%</b>
                <span>{row[2]}%</span>
                <span>{row[3]}%</span>
                <span>{row[4]}%</span>
              </div>
            ))}
          </div>
          <p>
            Two properties of this construction are worth naming, because they determine everything
            downstream. The width never changes — 7.68 points at twenty and at seventy — because the
            width comes only from the 6.4 BMI-unit span multiplied by the equation&apos;s 1.20 slope. And
            the whole band drifts by 0.23 points per year, or 2.30 points per decade, because that is the
            equation&apos;s age coefficient. The sex gap is a constant 10.80 points at every age. Those
            are properties of the equation, not observations about health, and the limits section at the
            bottom says so plainly.
          </p>
        </section>

        <section className="content-block">
          <h2>Your ideal band is a weight range, not a weight</h2>
          <p>
            This is the step most charts skip. Body fat percentage is a ratio, so a band of percentages
            maps onto a band of weights — and you get to choose where in it you stand. Hold lean mass
            fixed at L and a body fat fraction t is read at a weight of L ÷ (1 − t). Put the two edges of
            the band into that expression and the band becomes a weight window:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Band</span>
              <b>Weight at the lean edge</b>
              <b>Weight at the top edge</b>
              <b>Window width</b>
            </div>
            {[
              ["7.32 – 15.00%", "68.19 kg", "74.35 kg", "6.16 kg"],
              ["12.32 – 20.00%", "72.08 kg", "79.00 kg", "6.92 kg"],
              ["17.32 – 25.00%", "76.44 kg", "84.27 kg", "7.83 kg"],
              ["22.32 – 30.00%", "81.36 kg", "90.29 kg", "8.93 kg"],
              ["27.32 – 35.00%", "86.96 kg", "97.23 kg", "10.27 kg"],
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
            At 63.2 kg of lean mass — the lean mass of an 80 kg body reading 21%, the reference body used
            across this site. Every band in the table is 7.68 points wide, yet the weight windows range
            from 6.16 kg to 10.27 kg. A band of fixed width in percentage points is not a fixed width in
            kilograms: the same band positioned higher on the scale is worth more kilograms, because each
            percentage point is a larger slice of a heavier body. The exact width is L·(hi − lo) ÷ ((1 −
            hi)(1 − lo)).
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Lean mass</span>
              <b>Band 7.32 – 15.00%</b>
              <b>Band 17.32 – 25.00%</b>
              <b>Band 27.32 – 35.00%</b>
            </div>
            {[
              ["45.0 kg", "4.39 kg", "5.57 kg", "7.32 kg"],
              ["63.2 kg", "6.16 kg", "7.83 kg", "10.27 kg"],
              ["70.0 kg", "6.82 kg", "8.67 kg", "11.38 kg"],
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
            The window scales linearly with lean mass — double the lean mass and the window doubles —
            which is the one clean result in this section: a bigger frame buys a wider range of
            acceptable weights for the same percentage band.
          </p>
        </section>

        <section className="content-block">
          <h2>What one more point costs — two answers that move in opposite directions</h2>
          <p>
            Ask how much fat you must lose to drop one percentage point and you get an answer that
            surprises most people: the kilograms fall as you get leaner, while the share of your
            remaining fat that each point represents rises. Both come out of the same inversion. One
            point costs 0.01·L ÷ (1 − t)² kilograms, and as a fraction of the fat you have left it costs
            exactly 1 ÷ (t·(1 − t)) — a figure that does not depend on your size at all.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Target</span>
              <b>Weight there</b>
              <b>Fat mass there</b>
              <b>kg per point</b>
              <b>% of fat left</b>
            </div>
            {[
              ["8.0%", "68.70 kg", "5.50 kg", "0.74 kg", "13.6%"],
              ["10.0%", "70.22 kg", "7.02 kg", "0.77 kg", "11.1%"],
              ["12.0%", "71.82 kg", "8.62 kg", "0.81 kg", "9.5%"],
              ["14.0%", "73.49 kg", "10.29 kg", "0.84 kg", "8.3%"],
              ["16.0%", "75.24 kg", "12.04 kg", "0.89 kg", "7.4%"],
              ["18.0%", "77.07 kg", "13.87 kg", "0.93 kg", "6.8%"],
              ["20.0%", "79.00 kg", "15.80 kg", "0.98 kg", "6.2%"],
              ["22.0%", "81.03 kg", "17.83 kg", "1.03 kg", "5.8%"],
              ["24.0%", "83.16 kg", "19.96 kg", "1.08 kg", "5.5%"],
              ["26.0%", "85.41 kg", "22.21 kg", "1.14 kg", "5.2%"],
              ["28.0%", "87.78 kg", "24.58 kg", "1.20 kg", "5.0%"],
              ["30.0%", "90.29 kg", "27.09 kg", "1.27 kg", "4.8%"],
              ["32.0%", "92.94 kg", "29.74 kg", "1.35 kg", "4.6%"],
              ["34.0%", "95.76 kg", "32.56 kg", "1.43 kg", "4.5%"],
            ].map((row) => (
              <div className="chart-row chart-row-five" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
                <span>{row[4]}</span>
              </div>
            ))}
          </div>
          <p>
            At 63.2 kg of lean mass. Read the last two columns against each other. Going from 34% to 33%
            costs 1.43 kg of fat; going from 8% to 7% costs only 0.74 kg — the absolute price falls by
            half as you lean out, because the denominator you are dividing by keeps shrinking. But the
            same two moves take 4.5% and 13.6% of the fat you have left respectively. Each point becomes
            a larger bite out of a smaller store.
          </p>
          <p>
            The share column is worth memorising because it is size-free: at 10% one more point costs
            11.1% of your remaining fat, at 20% it costs 6.3%, at 30% it costs 4.8%, and at 40% it costs
            4.2%. A 60 kg woman and a 120 kg man pay the same <i>proportion</i> of their fat stores for
            the same one-point move, even though their kilogram bills differ by a factor of two.
          </p>
        </section>

        <section className="content-block">
          <h2>The same gap, priced by body weight and by target</h2>
          <p>
            Now invert the other way. If you are at 30% and want to reach a given target, the fat you
            must lose is exactly W·(0.30 − t) ÷ (1 − t): proportional to your body weight, with a penalty
            factor of 1 ÷ (1 − t) that grows as the target gets leaner. Two people with the same
            percentage gap never owe the same kilograms.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Body weight</span>
              <b>To 15%</b>
              <b>To 20%</b>
              <b>To 25%</b>
            </div>
            {[
              ["60 kg", "10.59 kg", "7.50 kg", "4.00 kg"],
              ["80 kg", "14.12 kg", "10.00 kg", "5.33 kg"],
              ["100 kg", "17.65 kg", "12.50 kg", "6.67 kg"],
              ["120 kg", "21.18 kg", "15.00 kg", "8.00 kg"],
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
            Starting from 30%. The columns are exactly proportional to body weight — 0.1765, 0.1250 and
            0.0667 of whatever you weigh — which is the whole formula in one line: the same fifteen-point
            gap costs a 60 kg person 10.59 kg and a 120 kg person 21.18 kg, precisely twice as much.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Body weight</span>
              <b>Per point at 10%</b>
              <b>Per point at 20%</b>
              <b>Per point at 30%</b>
            </div>
            {[
              ["60 kg", "0.67 kg", "0.75 kg", "0.86 kg"],
              ["80 kg", "0.89 kg", "1.00 kg", "1.14 kg"],
              ["100 kg", "1.11 kg", "1.25 kg", "1.43 kg"],
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
            The same pattern per single point, at three body weights and three levels of leanness. Note
            the direction: the per-point bill rises as you get <i>heavier</i> and rises as you get{" "}
            <i>less lean</i>, which is the opposite of the &quot;share of remaining fat&quot; column in
            the previous table. Both are true at once. They answer different questions — one asks how
            many kilograms, the other asks how big a bite out of what you have.
          </p>
        </section>

        <section className="content-block">
          <h2>Eight bodies, one band construction</h2>
          <p>
            Below are eight constructed bodies, each with tape measurements run through the Navy
            equation. The band is computed from each one&apos;s own age and sex; the kilograms are what
            the top edge of that band costs at that person&apos;s lean mass. The final column is the BMI
            frame&apos;s own verdict — the body fat level at which this person&apos;s lean mass would
            register a BMI of 24.9 — included so you can see how often the two frames simply disagree.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Body</span>
              <b>Body fat</b>
              <b>Ideal band</b>
              <b>kg to top edge</b>
              <b>Ending weight</b>
              <b>BMI-frame ceiling</b>
            </div>
            {[
              ["M 25 · 180 cm · 75 kg", "11.95%", "11.75 – 19.43", "inside", "—", "18.14%"],
              ["M 45 · 178 cm · 80 kg", "20.98%", "16.35 – 24.03", "inside", "—", "19.87%"],
              ["M 45 · 178 cm · 92 kg", "26.84%", "16.35 – 24.03", "3.40 kg", "88.60 kg", "14.68%"],
              ["M 55 · 175 cm · 95 kg", "29.12%", "18.65 – 26.33", "3.60 kg", "91.40 kg", "11.70%"],
              ["F 28 · 165 cm · 60 kg", "25.63%", "23.24 – 30.92", "inside", "—", "34.18%"],
              ["F 38 · 165 cm · 65 kg", "30.73%", "25.54 – 33.22", "inside", "—", "33.58%"],
              ["F 50 · 162 cm · 78 kg", "38.98%", "28.30 – 35.98", "3.65 kg", "74.35 kg", "27.16%"],
              ["F 65 · 160 cm · 70 kg", "36.79%", "31.75 – 39.43", "inside", "—", "30.59%"],
            ].map((row) => (
              <div className="chart-row chart-row-six" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}%</span>
                <span>{row[3]}</span>
                <span>{row[4]}</span>
                <span>{row[5]}</span>
              </div>
            ))}
          </div>
          <p>
            Two things stand out. First, three of the eight sit above the top of their age band, and in
            every one of those three the BMI-frame ceiling falls below the band&apos;s own bottom edge.
            The clearest case is the 95 kg man at 175 cm, whose ceiling is 11.70% against a band starting
            at 18.65%: no body fat percentage satisfies both frames at once. That is not a paradox about
            his body but a statement about BMI — his lean mass alone is worth a BMI of 21.99, so the
            normal range is nearly exhausted before any fat is counted. Second, the kilograms column is
            small even where the percentage gap looks large: 3.40 kg moves the 92 kg man from 26.84% to
            the top of his band, because at that weight a point is cheap.
          </p>
        </section>

        <section className="content-block">
          <h2>When the band moves and the body does not</h2>
          <p>
            One consequence of building the band from an equation with an age term is that the target
            moves under a body that never changes. Hold one body completely fixed — 92 kg at 26.84%, the
            same fat, the same lean — and price it against the band at five different ages:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Age</span>
              <b>Band</b>
              <b>Gap to top edge</b>
              <b>kg to close it</b>
              <b>Ending weight</b>
            </div>
            {[
              ["30", "12.90 – 20.58%", "6.26 pts", "7.25 kg", "84.75 kg"],
              ["40", "15.20 – 22.88%", "3.96 pts", "4.72 kg", "87.28 kg"],
              ["50", "17.50 – 25.18%", "1.66 pts", "2.04 kg", "89.96 kg"],
              ["60", "19.80 – 27.48%", "inside", "inside", "—"],
              ["70", "22.10 – 29.78%", "inside", "inside", "—"],
            ].map((row) => (
              <div className="chart-row chart-row-five" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
                <span>{row[4]}</span>
              </div>
            ))}
          </div>
          <p>
            Nothing about the body changed between rows — only the reference did. The kilograms shrink
            from 7.25 to nothing across four decades because the band rose 0.23 points a year to meet it.
            Read that as a warning rather than good news: an age-adjusted band is not a fixed standard,
            and a number that moves toward you on its own is not measuring anything about you. This page
            keeps the age term because the underlying equation has one, and flags it because the drift is
            an artefact of the model rather than a finding about ageing.
          </p>
        </section>

        <section className="content-block">
          <h2>How to use this without fooling yourself</h2>
          <ul>
            <li>
              <b>Treat the band as a window, not a bullseye.</b> At 63.2 kg of lean mass the reference
              band spans 7.83 kg of body weight. Anything inside it is the same answer; chasing the
              midpoint is chasing noise.
            </li>
            <li>
              <b>Price your gap in kilograms before you start.</b> The gap in points tells you nothing
              about the work. From 30%, fifteen points costs 10.59 kg at 60 kg and 21.18 kg at 120 kg —
              the identical percentage gap, twice the work.
            </li>
            <li>
              <b>Expect each point to get proportionally harder even as it gets absolutely cheaper.</b>{" "}
              One point at 10% takes 11.1% of your remaining fat; at 30% it takes 4.8%. The kilograms
              fall, the bite grows.
            </li>
            <li>
              <b>Check whether BMI is even describing you.</b> If the BMI-frame ceiling comes out below
              the bottom of your age band, BMI cannot call you normal at any body fat level. That is
              information about the index, and the honest response is to stop using it as a personal
              target.
            </li>
            <li>
              <b>Remember the band drifts.</b> It rises 2.30 points per decade by construction. Compare
              yourself to the band for your current age and do not read the drift as progress.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Where this page&apos;s arithmetic stops being true</h2>
          <p>
            Everything above is algebra performed on published prediction equations. The assumptions
            worth naming:
          </p>
          <ul>
            <li>
              <b>The band is this page&apos;s construction, not an official standard.</b> It is the
              Deurenberg equation evaluated across the WHO normal BMI range. It carries no clinical
              standing, no organisation endorses this particular combination, and it is not a diagnostic
              threshold. Other published charts disagree with it, sometimes by more than its own width.
            </li>
            <li>
              <b>The age drift is a property of the equation.</b> The 0.23 points per year is
              Deurenberg&apos;s age coefficient, fitted in a specific population. It is not evidence that
              a higher body fat percentage becomes healthier with age.
            </li>
            <li>
              <b>Lean mass held fixed is a modelling choice.</b> Every kilogram figure here assumes the
              lean compartment does not move. Real cuts lose some lean and real builds gain some fat. The{" "}
              <a href="/body-composition-calculator">body composition calculator</a> prices those mixed
              routes separately.
            </li>
            <li>
              <b>The individual reading comes from a prediction equation.</b> The Navy tape equation is a
              population fit with its own error, and a consumer scale adds more. The algebra on this page
              is exact; the percentage fed into it is not.
            </li>
            <li>
              <b>The BMI estimate is not independent.</b> Choose that source and body fat is derived from
              the same height and weight that determine your BMI, so the band and your reading will agree
              by construction.
            </li>
            <li>
              <b>Sensitivities are local.</b> Each per-point figure is evaluated at one body. Move
              several kilograms and it changes in the direction the grids show.
            </li>
            <li>
              <b>No health claim is being made.</b> Body fat percentage is a quantity, not a diagnosis.
              Where fat is stored and what it does are separate questions from how much of it there is.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Frequently asked questions</h2>
          <div className="mini-faq">
            <details open>
              <summary>What is an ideal body fat percentage?</summary>
              <p>
                There is no single agreed number — published ranges differ by who issues them and by
                whether they stratify by age. This page builds one transparently: the Deurenberg
                prediction equation evaluated across the WHO normal BMI range of 18.5 to 24.9, which
                produces a band 7.68 points wide that rises 2.30 points per decade. On that
                construction a 40-year-old man&apos;s band is 15.20 – 22.88% and a 40-year-old
                woman&apos;s is 26.00 – 33.68%.
              </p>
            </details>
            <details>
              <summary>How do I calculate my ideal body fat percentage?</summary>
              <p>
                Enter your age, sex, height, weight and one body fat reading at the top of this page. The
                calculator returns the band for your age and sex, tells you whether you are inside it,
                and converts it into kilograms of fat and into the range of scale readings that band
                corresponds to at your lean mass.
              </p>
            </details>
            <details>
              <summary>How much fat do I need to lose to reach my ideal percentage?</summary>
              <p>
                With lean mass held fixed, Δ = W·(BF − t) ÷ (1 − t). From 30% to 20% on an 80 kg body
                that is 10.00 kg; from 30% to 25% it is 5.33 kg. The figure is exactly proportional to
                your body weight, so the same percentage gap costs a 120 kg person twice what it costs a
                60 kg person.
              </p>
            </details>
            <details>
              <summary>Why is my ideal given as a range instead of one number?</summary>
              <p>
                Because a percentage is a ratio, and a ratio is satisfied by many different bodies. At
                63.2 kg of lean mass an 17.32 – 25.00% band corresponds to any weight between 76.44 kg
                and 84.27 kg — a 7.83 kg window. A single number would imply a precision that no
                measurement method available at home can deliver.
              </p>
            </details>
            <details>
              <summary>Does the ideal body fat percentage change with age?</summary>
              <p>
                On this page&apos;s construction, yes: the band rises 0.23 points per year, or 2.30
                points per decade, because that is the age coefficient in the Deurenberg equation. That
                is a property of the equation, not evidence that a higher percentage becomes healthier
                later in life. The width, 7.68 points, never changes.
              </p>
            </details>
            <details>
              <summary>Is a lower body fat percentage always better?</summary>
              <p>
                Nothing on this page supports that. The band has two edges for a reason, and the
                arithmetic shows the cost of going below the lean edge rising steeply: at 8% one further
                point takes 13.6% of the fat you have left, against 6.2% at 20%. This page computes
                quantities; it does not rank them as goals.
              </p>
            </details>
            <details>
              <summary>Why does BMI disagree with my body fat percentage?</summary>
              <p>
                Because BMI counts lean mass and fat mass identically. The BMI-frame ceiling on this page
                makes the disagreement concrete: it is the body fat level at which your lean mass alone
                would still register a BMI of 24.9. For a 95 kg man at 175 cm that ceiling is 11.70% —
                below the bottom of his age band — meaning BMI cannot classify him as normal at any
                attainable body fat level. Our <a href="/obese-scale">obese scale page</a> works through
                the same disagreement numerically.
              </p>
            </details>
            <details>
              <summary>Can I reach my ideal by gaining muscle instead of losing fat?</summary>
              <p>
                Arithmetically yes, and it is a different route with a different price. This page holds
                lean mass fixed and prices the fat route; the{" "}
                <a href="/body-composition-calculator">body composition calculator</a> compares that
                against gaining lean, swapping at constant weight, and a two-to-one recomposition, with
                the kilograms and ending weight of each.
              </p>
            </details>
            <details>
              <summary>How accurate is this calculator?</summary>
              <p>
                The algebra is exact. The body fat percentage entering it is not: it comes from a
                prediction equation or your own device, each with its own error, and that error
                propagates into every kilogram figure one-for-one. Treat the output as planning
                arithmetic, not as a measurement.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>The rest of this site&apos;s body fat tools</h2>
          <p>
            Each works on the same numbers from a different direction — pick the one matching the
            question you actually have.
          </p>
          <div className="related-grid">
            <a href="/body-fat-calculator">
              <span>START HERE</span>
              <strong>Body Fat Calculator</strong>
              <i>→</i>
            </a>
            <a href="/measure-body-fat">
              <span>AGE AND SEX</span>
              <strong>Measure Body Fat</strong>
              <i>→</i>
            </a>
            <a href="/body-composition-calculator">
              <span>FAT VERSUS LEAN</span>
              <strong>Body Composition Calculator</strong>
              <i>→</i>
            </a>
            <a href="/weight-loss-percentage-calculator">
              <span>PROGRESS</span>
              <strong>Weight Loss Percentage Calculator</strong>
              <i>→</i>
            </a>
            <a href="/body-fat-percentage-chart-men-women-age">
              <span>PUBLISHED CHARTS</span>
              <strong>Body Fat Percentage Chart by Age</strong>
              <i>→</i>
            </a>
            <a href="/ffmi-calculator">
              <span>LEAN MASS</span>
              <strong>FFMI Calculator</strong>
              <i>→</i>
            </a>
          </div>
          <p>
            <b>Not medical advice.</b> Every figure on this page is arithmetic this page performs on the
            Deurenberg and Navy prediction equations and on the identity W = F + L. The algebra is exact;
            the measurements you feed it are not. See our <a href="/disclaimer">disclaimer</a>.
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
