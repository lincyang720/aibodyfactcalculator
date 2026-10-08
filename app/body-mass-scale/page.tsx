"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "metric" | "us";

const LB = 2.20462;
const CM_PER_IN = 2.54;

// Day-to-day scatter of a single weigh-in, in kilograms. A placeholder until you measure your own.
const SIGMAS = [0.1, 0.2, 0.3, 0.5, 0.8, 1.0];

// How many consecutive weigh-ins you fold into one number.
const NS = [1, 3, 7, 14, 28];

// Display graduation, in kilograms.
const GRAD = [1, 0.5, 0.2, 0.1, 0.05];

// Smoothing constants for the moving-average comparison.
const ALPHAS = [0.1, 0.2, 0.3, 0.5];

// WHO adult BMI category lines.
const LINES = [18.5, 25, 30, 35, 40];

function bmiClass(b: number): string {
  if (b < 18.5) return "Underweight";
  if (b < 25) return "Normal";
  if (b < 30) return "Overweight";
  if (b < 35) return "Obese I";
  if (b < 40) return "Obese II";
  return "Obese III";
}

const f = (x: number, n = 2) => (Number.isFinite(x) ? x.toFixed(n) : "—");

// Standard error of the least-squares slope fitted to N daily readings (days 0..N-1).
// Sum of (t - tbar)^2 over consecutive integers is exactly N(N^2 - 1)/12.
function seSlope(sigma: number, n: number): number {
  if (n < 2) return Infinity;
  return sigma * Math.sqrt(12 / (n * (n * n - 1)));
}

// Smallest number of daily readings whose fitted slope separates a rate from zero at 95%.
function daysToDetect(sigma: number, ratePerWeek: number): number | null {
  if (ratePerWeek <= 0) return null;
  const perDay = ratePerWeek / 7;
  for (let n = 2; n <= 3000; n++) {
    if (1.96 * seSlope(sigma, n) <= perDay) return n;
  }
  return null;
}

export default function BodyMassScalePage() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [height, setHeight] = useState(175); // cm in metric, inches in US
  const [weight, setWeight] = useState(78); // kg in metric, lb in US
  const [bf, setBf] = useState(22); // body fat the scale reports
  const [sigmaIdx, setSigmaIdx] = useState(3); // 0.5 kg
  const [nIdx, setNIdx] = useState(2); // 7 readings
  const [gradIdx, setGradIdx] = useState(3); // 0.1 kg
  const [alphaIdx, setAlphaIdx] = useState(1); // 0.2
  const [days, setDays] = useState(28);
  const [rate, setRate] = useState(0.4); // kg/wk in metric, lb/wk in US

  const heightCm = unit === "us" ? height * CM_PER_IN : height;
  const weightKg = unit === "us" ? weight / LB : weight;
  const rateKg = unit === "us" ? rate / LB : rate;
  const wLabel = unit === "us" ? "lb" : "kg";
  const hLabel = unit === "us" ? "in" : "cm";

  const sigma = SIGMAS[sigmaIdx];
  const nAvg = NS[nIdx];
  const grad = GRAD[gradIdx];
  const alpha = ALPHAS[alphaIdx];

  const hm = heightCm / 100;
  const ok =
    heightCm > 120 &&
    heightCm < 230 &&
    weightKg > 30 &&
    weightKg < 250 &&
    bf > 2 &&
    bf < 65 &&
    days >= 2 &&
    days <= 2000 &&
    rateKg > 0;

  const bmi = weightKg / (hm * hm);
  const kgPerBmi = hm * hm;

  // ---- One reading vs a mean -------------------------------------------
  // The display rounds to the graduation, so the effective scatter is the two
  // sources added in quadrature.
  const sigmaEff = Math.sqrt(sigma * sigma + (grad * grad) / 12);
  const seOne = sigmaEff;
  const seMean = sigmaEff / Math.sqrt(nAvg);
  const bandOneBmi = (1.96 * seOne) / kgPerBmi;
  const bandMeanBmi = (1.96 * seMean) / kgPerBmi;
  const mdcMean = 1.96 * Math.SQRT2 * seMean; // change between two such means

  // ---- Nearest WHO category line ---------------------------------------
  let clearance = Infinity;
  let nearestLine = 0;
  for (const b of LINES) {
    const d = Math.abs(weightKg - b * kgPerBmi);
    if (d < clearance) {
      clearance = d;
      nearestLine = b;
    }
  }
  const lineSafe = clearance > 1.96 * seMean;

  // ---- The trend over N days -------------------------------------------
  const seDay = seSlope(sigmaEff, days);
  const minRateWk = 1.96 * seDay * 7;
  const needDays = daysToDetect(sigmaEff, rateKg);
  const detected = rateKg >= minRateWk;

  // Regression on every day vs comparing the first and last reading only.
  const ratio = Math.sqrt((days * days - 1) / (6 * days));
  const equivSpacing = Math.sqrt((days * (days * days - 1)) / 6);

  // Total change the entered rate produces across the window.
  const totalChange = (rateKg * days) / 7;
  const daysToSeeTotal = rateKg > 0 ? mdcMean / (rateKg / 7) : Infinity;

  // ---- What that change is worth in body-fat points ---------------------
  const bfIfFat = (100 * (1 - bf / 100) * totalChange) / weightKg;
  const bfIfLean = (-100 * (bf / 100) * totalChange) / weightKg;
  const bfWidth = (100 * totalChange) / weightKg; // exactly: independent of BF%

  // ---- Moving averages ---------------------------------------------------
  const nEquiv = (2 - alpha) / alpha;
  const lagEwma = (1 - alpha) / alpha;
  const sdEwma = Math.sqrt(alpha / (2 - alpha));

  // ---- Graduation penalty ------------------------------------------------
  const gradPenalty = sigmaEff / sigma - 1;
  const extraDays = Math.pow(sigmaEff / sigma, 2 / 3) - 1;

  function switchUnit(next: Unit) {
    if (next === unit) return;
    setHeight(next === "us" ? Math.round(heightCm / CM_PER_IN) : Math.round(heightCm));
    setWeight(next === "us" ? Math.round(weightKg * LB) : Math.round(weightKg));
    setRate(next === "us" ? +(rateKg * LB * 10).toFixed(1) / 10 : +(rateKg * 10).toFixed(1) / 10);
    setUnit(next);
  }

  function reset() {
    setBf(22);
    setSigmaIdx(3);
    setNIdx(2);
    setGradIdx(3);
    setAlphaIdx(1);
    setDays(28);
  }

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/body-fat-calculator">Body Fat %</a>
          <a href="/bmi-calculator">BMI</a>
          <a href="/scale-bmi">Smart Scales</a>
          <a href="/weight-loss-percentage-calculator">Weight Loss %</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">BODY MASS SCALE · THE SERIES, NOT THE READING</div>
        <h1>Body Mass Scale: The Number Is Noise, the Trend Is Data</h1>
        <p className="tool-lede">
          A body mass scale is the cheapest instrument in the house and the one you will actually use every
          day, which makes it the most valuable one — but only if you read it as a series. A single weigh-in
          carries a wobble of roughly half a kilogram that has nothing to do with fat, and a body mass index
          computed from that one reading inherits all of it. Fit a line through thirty of them instead and
          the same wobble collapses into a rate you can defend. This page computes that trade-off exactly:
          how wide one reading is, how many days a given rate needs before it is real, why using every day
          beats comparing the endpoints by a factor of &radic;(N/6), what the display graduation is actually
          worth, and how many body-fat points one kilogram on the dial can mean. Nothing here was measured
          on a device and no product is named or ranked; every figure is arithmetic performed on this page.
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
              <Field label={`Height (${hLabel})`}>
                <input type="number" min={1} value={height} onChange={(e) => setHeight(+e.target.value)} />
              </Field>
              <Field label={`Weight on the scale (${wLabel})`}>
                <input type="number" min={1} value={weight} onChange={(e) => setWeight(+e.target.value)} />
              </Field>
              <Field label="Body fat the scale reports (%)">
                <input type="number" min={3} max={60} value={bf} onChange={(e) => setBf(+e.target.value)} />
              </Field>
              <Field label={`Day-to-day scatter you see`}>
                <select value={sigmaIdx} onChange={(e) => setSigmaIdx(+e.target.value)}>
                  {SIGMAS.map((s, i) => (
                    <option value={i} key={s}>
                      &plusmn;{unit === "us" ? f(s * LB, 1) : s} {wLabel}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Readings you average">
                <select value={nIdx} onChange={(e) => setNIdx(+e.target.value)}>
                  {NS.map((v, i) => (
                    <option value={i} key={v}>
                      {v} day{v === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Display graduation">
                <select value={gradIdx} onChange={(e) => setGradIdx(+e.target.value)}>
                  {GRAD.map((g, i) => (
                    <option value={i} key={g}>
                      {unit === "us" ? (g >= 1 ? "2 lb" : g >= 0.5 ? "1 lb" : g >= 0.2 ? "0.5 lb" : g >= 0.1 ? "0.2 lb" : "0.1 lb") : g + " kg"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`Rate you think you are on (${wLabel}/week)`}>
                <input
                  type="number"
                  min={0.05}
                  step={0.05}
                  value={rate}
                  onChange={(e) => setRate(+e.target.value)}
                />
              </Field>
              <Field label="Days of daily data you have">
                <input type="number" min={2} value={days} onChange={(e) => setDays(+e.target.value)} />
              </Field>
              <Field label="Smoothing constant to compare">
                <select value={alphaIdx} onChange={(e) => setAlphaIdx(+e.target.value)}>
                  {ALPHAS.map((a, i) => (
                    <option value={i} key={a}>
                      alpha = {a}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <button className="calc-button" onClick={reset}>
              Reset to the worked example
            </button>
          </div>

          <div className="answer-card">
            <span>WHAT ONE READING IS WORTH, AND WHAT THE SERIES PROVES</span>
            <div className="answer-number">
              {ok ? f(bmi, 1) : "—"}
              <small>
                BMI{ok ? ` · ${bmiClass(bmi)}` : ""} &nbsp;·&nbsp; &plusmn;{f(bandOneBmi, 2)} today,
                &plusmn;{f(bandMeanBmi, 2)} on a {nAvg}-day mean
              </small>
            </div>
            {ok ? (
              <>
                <p>
                  One weigh-in is <b>&plusmn;{f(1.96 * seOne, 2)} {wLabel}</b> wide at 95%, which is{" "}
                  <b>&plusmn;{f(bandOneBmi, 2)} BMI points</b> at your height. Average{" "}
                  <b>{nAvg}</b> consecutive days and the same wobble shrinks to{" "}
                  <b>&plusmn;{f(1.96 * seMean, 2)} {wLabel}</b> — <b>&plusmn;{f(bandMeanBmi, 2)} BMI points</b>.
                  The nearest category line is BMI <b>{nearestLine}</b>, sitting{" "}
                  <b>{f(clearance, 2)} {wLabel}</b> away, so the noise on your mean{" "}
                  {lineSafe ? "cannot" : "can"} move you across it.
                </p>
                <p>
                  Fitting a line through <b>{days}</b> daily readings instead of comparing two of them gives
                  a slope whose standard error is <b>{f(seDay, 5)} {wLabel}/day</b>. The smallest weekly rate
                  that many days can call real is <b>{f(minRateWk, 3)} {wLabel}/week</b>. Your{" "}
                  <b>{f(rateKg, 2)} {wLabel}/week</b> {detected ? "clears that" : "does not clear that"} —{" "}
                  {detected
                    ? "the trend is visible in the data you have."
                    : `you need ${needDays === null ? "more days than this page will compute" : `${needDays} days`} of daily weighing before it separates from zero.`}{" "}
                  Using every day rather than the first and last makes the estimate{" "}
                  <b>{f(ratio, 2)}&times;</b> tighter — the same information as two readings{" "}
                  <b>{f(equivSpacing, 0)} days</b> apart.
                </p>
                <p>
                  A change is only real once it exceeds <b>{f(mdcMean, 2)} {wLabel}</b> on your {nAvg}-day
                  mean; at {f(rateKg, 2)} {wLabel}/week that takes <b>{f(daysToSeeTotal, 1)} days</b> of
                  genuine loss before the scale can confirm it. Over your {days}-day window the entered rate
                  amounts to <b>{f(totalChange, 2)} {wLabel}</b>, which is worth somewhere between{" "}
                  <b>{f(bfIfLean, 2)}</b> and <b>+{f(bfIfFat, 2)}</b> body-fat points depending on what the
                  mass was — a <b>{f(bfWidth, 2)}-point</b> spread the scale cannot resolve, and one that
                  does not depend on your body fat at all.
                </p>
                <p>
                  <b>The graduation.</b> A {unit === "us" ? f(grad * LB, 1) + " lb" : grad + " kg"} display
                  adds {f((grad * grad) / 12, 4)} to the variance of each reading, widening your effective
                  scatter from {sigma} to <b>{f(sigmaEff, 3)} {wLabel}</b> — <b>{f(gradPenalty * 100, 1)}%</b>{" "}
                  wider, which costs <b>{f(extraDays * 100, 1)}%</b> more days of data.{" "}
                  <b>The smoothing.</b> An exponentially weighted average at alpha = {alpha} behaves
                  identically to a plain <b>{f(nEquiv, 2)}-day</b> mean: both cut the scatter to{" "}
                  <b>{f(sdEwma, 3)}&sigma;</b> and both lag the truth by <b>{f(lagEwma, 2)} days</b>.
                </p>
              </>
            ) : (
              <p>
                Enter a height between 120 and 230 cm, a weight between 30 and 250 kg, a body fat reading
                between 3 and 60 percent, at least 2 days of data, and a weekly rate above zero.
              </p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>THE FIVE IDENTITIES THIS PAGE IS BUILT FROM</span>
          <strong>
            BMI = W &divide; H&sup2; &nbsp;&nbsp;and&nbsp;&nbsp; 1 BMI point = H&sup2; kilograms
            <br />
            SE(mean of n days) = &sigma; &divide; &radic;n &nbsp;&nbsp;and&nbsp;&nbsp; SE(slope over N days) =
            &sigma;&middot;&radic;(12 &divide; N(N&sup2; &minus; 1))
            <br />
            regression beats two readings by &radic;((N&sup2; &minus; 1) &divide; 6N) &nbsp;&asymp;&nbsp;
            &radic;(N &divide; 6)
            <br />
            EWMA with constant &alpha; &equiv; simple mean of (2 &minus; &alpha;) &divide; &alpha; days
            <br />
            &Delta;BF (points) = 100&middot;(1 &minus; BF)&middot;&Delta;W &divide; W &nbsp;if it was fat,
            &nbsp;&minus;100&middot;BF&middot;&Delta;W &divide; W &nbsp;if it was not
          </strong>
          <small>
            The first line is the definition of body mass index and its exact inverse. The second is the two
            standard errors that decide everything below: averaging shrinks noise by the square root of the
            count, and the slope of a line fitted to N equally spaced days has a standard error of
            &sigma; divided by the square root of the sum of squared deviations, which for consecutive
            integers is exactly N(N&sup2; &minus; 1)/12. The third is the ratio of that to the standard error
            of a two-point comparison, &radic;2&middot;&sigma;/N. The fourth is not an approximation — an
            exponentially weighted average and a simple moving average of (2 &minus; &alpha;)/&alpha; terms
            have both the same variance and the same mean age, which is why neither is faster than the
            other. The fifth is the derivative of the two-compartment identity taken two ways, and its
            width, 100&middot;&Delta;W/W, does not contain BF at all. Every table below is this page
            evaluating these five lines. No device was measured and nothing is quoted from a manufacturer.
          </small>
        </div>

        <section className="content-block">
          <h2>The short answer</h2>
          <p>
            A body mass scale measures one quantity — the force your body puts on a load cell, reported as
            mass — and everything else on the display is computed from that number plus a height you typed
            in once. Its single-reading accuracy matters far less than most buyers think, because the
            day-to-day variation in your own body is larger than the error in almost any load cell. What
            matters is whether you can see a <i>rate</i>, and that is a question about how many readings you
            have, not about how good the scale is.
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              <b>One reading is not a measurement, it is a sample.</b> At &plusmn;0.5 kg of daily scatter,
              a single weigh-in is &plusmn;0.98 kg wide at 95% confidence — about 1.3% of a 78 kg body, and
              &plusmn;0.32 BMI points at 1.75 m.
            </li>
            <li>
              <b>Seven days buys you a factor of 2.65.</b> The mean of seven readings is &plusmn;0.37 kg
              wide. That is the single cheapest improvement available to you, and it costs nothing but
              consistency.
            </li>
            <li>
              <b>A rate needs surprisingly few days if you use every reading.</b> At &plusmn;0.5 kg of
              scatter, a loss of 0.5 kg per week separates from zero in 14 days of daily weighing. The same
              conclusion drawn from two readings 14 days apart would take 21 days.
            </li>
            <li>
              <b>The display graduation is nearly irrelevant.</b> A 1 kg graduation costs you 10% more days
              of data than a 0.1 kg one. Rounding averages away at exactly the same rate as the noise does.
            </li>
            <li>
              <b>Mass is not fat.</b> One kilogram on the dial is worth anywhere from &minus;0.28 to +1.00
              body-fat points on a 78 kg body at 22% fat. The scale cannot tell you which, and the
              ambiguity is 1.28 points wide regardless of how lean you are.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>How wide is one weigh-in, and what a mean buys you</h2>
          <p>
            Take a body at 78 kg with a day-to-day scatter of &plusmn;0.5 kg — a figure you should replace
            with your own, measured by stepping on and off five times in one minute. The 95% interval on a
            single reading is &plusmn;1.96&sigma;. Every additional day you fold into the mean divides that
            by &radic;n, and the minimum change you can call real between two such means carries an extra
            &radic;2 because both ends are noisy.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Days averaged</span>
              <span>SE of the mean</span>
              <span>Smallest real change</span>
            </div>
            <div className="chart-row">
              <span>1 (single reading)</span>
              <span>&plusmn;0.500 kg</span>
              <span>1.386 kg</span>
            </div>
            <div className="chart-row">
              <span>3</span>
              <span>&plusmn;0.289 kg</span>
              <span>0.800 kg</span>
            </div>
            <div className="chart-row">
              <span>7</span>
              <span>&plusmn;0.189 kg</span>
              <span>0.524 kg</span>
            </div>
            <div className="chart-row">
              <span>14</span>
              <span>&plusmn;0.134 kg</span>
              <span>0.370 kg</span>
            </div>
            <div className="chart-row">
              <span>28</span>
              <span>&plusmn;0.095 kg</span>
              <span>0.262 kg</span>
            </div>
          </div>
          <p style={{ marginTop: 22 }}>
            Read the last column as a clock: at a true loss of 0.5 kg per week, a single reading needs{" "}
            <b>19.4 days</b> of real change before it can be called real, a 7-day mean needs <b>7.3 days</b>,
            and a 28-day mean needs <b>3.7 days</b>. This is the whole argument for daily weighing. Not
            because the readings are good — they are not — but because the error shrinks with the square
            root of how many you have while the signal grows linearly with time.
          </p>
          <p>
            The same numbers land differently on different frames, because a BMI point is H&sup2; kilograms
            and H&sup2; grows fast. At 1.55 m a BMI point is only 2.40 kg, so a &plusmn;0.98 kg reading is
            0.41 BMI points; at 1.90 m it takes 3.61 kg to move one point and the same reading is worth
            0.27. The table below is the single-reading 95% band in BMI points, alongside the width of the
            whole overweight band (BMI 25 to 30) at each height.
          </p>
          <div className="chart-table ffmi-chart-table">
            <div className="chart-row">
              <span>Height</span>
              <span>kg per BMI point</span>
              <span>Overweight band is</span>
            </div>
            <div className="chart-row">
              <span>1.55 m</span>
              <span>2.40 kg</span>
              <span>12.01 kg wide</span>
            </div>
            <div className="chart-row">
              <span>1.60 m</span>
              <span>2.56 kg</span>
              <span>12.80 kg wide</span>
            </div>
            <div className="chart-row">
              <span>1.65 m</span>
              <span>2.72 kg</span>
              <span>13.61 kg wide</span>
            </div>
            <div className="chart-row">
              <span>1.70 m</span>
              <span>2.89 kg</span>
              <span>14.45 kg wide</span>
            </div>
            <div className="chart-row">
              <span>1.75 m</span>
              <span>3.06 kg</span>
              <span>15.31 kg wide</span>
            </div>
            <div className="chart-row">
              <span>1.80 m</span>
              <span>3.24 kg</span>
              <span>16.20 kg wide</span>
            </div>
            <div className="chart-row">
              <span>1.85 m</span>
              <span>3.42 kg</span>
              <span>17.11 kg wide</span>
            </div>
            <div className="chart-row">
              <span>1.90 m</span>
              <span>3.61 kg</span>
              <span>18.05 kg wide</span>
            </div>
          </div>
          <p style={{ marginTop: 22 }}>
            A single reading&apos;s band is between 10.9% and 16.3% of the width of the overweight category
            depending on height — large enough to matter near a line, small enough to ignore in the middle
            of one. A 7-day mean&apos;s band is between 4.1% and 6.2% of it, which is why a weekly average
            is the right unit for deciding which category you are in, and a single reading is not.
          </p>
        </section>

        <section className="content-block">
          <h2>How many days before the trend is real</h2>
          <p>
            The rate is a slope, not a difference. Fit a straight line by least squares to N daily readings
            taken on consecutive days and the standard error of that slope is &sigma;&middot;&radic;(12 /
            N(N&sup2; &minus; 1)), because the sum of squared deviations of the integers 0 to N &minus; 1
            about their mean is exactly N(N&sup2; &minus; 1)/12. Note the N&sup1;&middot;&sup5; in the
            denominator: the error falls faster than &radic;N, because spreading the same number of readings
            over a longer window lengthens the lever arm as well as increasing the count. That is the single
            most useful fact about daily weighing.
          </p>
          <p>
            The table below is the number of consecutive daily weigh-ins needed before a rate of the given
            size separates from zero at 95% confidence, at five levels of daily scatter. All figures are in
            kilograms per week.
          </p>
          <div className="chart-table">
            <div className="chart-row-six">
              <span>Daily scatter</span>
              <span>0.1 kg/wk</span>
              <span>0.25 kg/wk</span>
              <span>0.5 kg/wk</span>
              <span>0.75 kg/wk</span>
              <span>1.0 kg/wk</span>
            </div>
            <div className="chart-row-six">
              <span>&plusmn;0.2 kg</span>
              <span>21 days</span>
              <span>12 days</span>
              <span>8 days</span>
              <span>6 days</span>
              <span>5 days</span>
            </div>
            <div className="chart-row-six">
              <span>&plusmn;0.3 kg</span>
              <span>28 days</span>
              <span>15 days</span>
              <span>10 days</span>
              <span>8 days</span>
              <span>6 days</span>
            </div>
            <div className="chart-row-six">
              <span>&plusmn;0.5 kg</span>
              <span>39 days</span>
              <span>21 days</span>
              <span>14 days</span>
              <span>11 days</span>
              <span>9 days</span>
            </div>
            <div className="chart-row-six">
              <span>&plusmn;0.8 kg</span>
              <span>53 days</span>
              <span>29 days</span>
              <span>18 days</span>
              <span>14 days</span>
              <span>12 days</span>
            </div>
            <div className="chart-row-six">
              <span>&plusmn;1.0 kg</span>
              <span>61 days</span>
              <span>34 days</span>
              <span>21 days</span>
              <span>16 days</span>
              <span>14 days</span>
            </div>
          </div>
          <p style={{ marginTop: 22 }}>
            Read it the other way round and you get the smallest rate a given stretch of data can see. At
            &plusmn;0.5 kg of scatter: 7 days resolves 1.296 kg/week, 14 days resolves 0.455, 21 days
            resolves 0.247, 28 days resolves 0.160, 56 days resolves 0.057 and 84 days resolves 0.031. The
            window does not have to be long — it has to be longer than the table says, and the table is
            driven almost entirely by your own scatter, which is the one number on this page you should
            measure rather than assume.
          </p>
          <p>
            There is a second reading of the same arithmetic that surprises people: the total change these
            thresholds represent <i>falls</i> as the window lengthens. Detecting 1.296 kg/week over 7 days
            means detecting 1.30 kg of total change; detecting 0.160 kg/week over 28 days means detecting
            0.64 kg. A longer window does not need a bigger result — it needs a smaller one, because the
            slope has more leverage.
          </p>
        </section>

        <section className="content-block">
          <h2>Why every day beats the two readings you would have compared</h2>
          <p>
            The natural way to use a body mass scale is to weigh once, wait a month, weigh again and divide.
            That estimate has a standard error of &radic;2&middot;&sigma;/N. The regression on all N daily
            readings has &sigma;&middot;&radic;(12 / N(N&sup2; &minus; 1)). Their ratio simplifies cleanly
            to &radic;((N&sup2; &minus; 1) / 6N), which is &radic;(N/6) to within a fraction of a percent
            once N is past a fortnight.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Days of daily data</span>
              <span>Regression is tighter by</span>
              <span>Equals two readings taken</span>
            </div>
            <div className="chart-row">
              <span>7</span>
              <span>1.07&times;</span>
              <span>7.5 days apart</span>
            </div>
            <div className="chart-row">
              <span>14</span>
              <span>1.52&times;</span>
              <span>21.3 days apart</span>
            </div>
            <div className="chart-row">
              <span>21</span>
              <span>1.87&times;</span>
              <span>39.2 days apart</span>
            </div>
            <div className="chart-row">
              <span>28</span>
              <span>2.16&times;</span>
              <span>60.4 days apart</span>
            </div>
            <div className="chart-row">
              <span>42</span>
              <span>2.65&times;</span>
              <span>111.1 days apart</span>
            </div>
            <div className="chart-row">
              <span>56</span>
              <span>3.06&times;</span>
              <span>171.1 days apart</span>
            </div>
            <div className="chart-row">
              <span>84</span>
              <span>3.74&times;</span>
              <span>314.3 days apart</span>
            </div>
          </div>
          <p style={{ marginTop: 22 }}>
            The third column is the practical version: <b>one month of daily weighing carries the same
            information as a single comparison spread over two months</b>, and three months of daily
            weighing carries as much as a comparison spread over nearly a year. The extra information does
            not come from the scale being better. It comes from the middle of the series, which the
            two-reading method throws away.
          </p>
          <p>
            Here is the same thing on a worked series. The 28 readings below were generated on this page
            from a stated model — a true loss of 0.400 kg per week from a start of 78.0 kg, with
            &plusmn;0.5 kg of independent daily scatter added. They are not measurements of anybody; they
            exist so the two methods can be compared on identical data. The last two columns are a 7-day
            simple moving average and an exponentially weighted average at &alpha; = 0.2.
          </p>
          <div className="chart-table">
            <div className="chart-row-quad">
              <span>Day</span>
              <span>Reading</span>
              <span>7-day mean</span>
              <span>EWMA</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 1</span>
              <span>77.9 kg</span>
              <span>77.90</span>
              <span>77.90</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 2</span>
              <span>78.2 kg</span>
              <span>78.05</span>
              <span>77.96</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 3</span>
              <span>77.8 kg</span>
              <span>77.97</span>
              <span>77.93</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 4</span>
              <span>77.7 kg</span>
              <span>77.90</span>
              <span>77.88</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 5</span>
              <span>77.3 kg</span>
              <span>77.78</span>
              <span>77.77</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 6</span>
              <span>77.6 kg</span>
              <span>77.75</span>
              <span>77.73</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 7</span>
              <span>78.2 kg</span>
              <span>77.81</span>
              <span>77.83</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 8</span>
              <span>77.8 kg</span>
              <span>77.80</span>
              <span>77.82</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 9</span>
              <span>78.1 kg</span>
              <span>77.79</span>
              <span>77.88</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 10</span>
              <span>77.6 kg</span>
              <span>77.76</span>
              <span>77.82</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 11</span>
              <span>77.6 kg</span>
              <span>77.74</span>
              <span>77.78</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 12</span>
              <span>77.5 kg</span>
              <span>77.77</span>
              <span>77.72</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 13</span>
              <span>76.5 kg</span>
              <span>77.61</span>
              <span>77.48</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 14</span>
              <span>77.7 kg</span>
              <span>77.54</span>
              <span>77.52</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 15</span>
              <span>77.5 kg</span>
              <span>77.50</span>
              <span>77.52</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 16</span>
              <span>77.4 kg</span>
              <span>77.40</span>
              <span>77.49</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 17</span>
              <span>76.2 kg</span>
              <span>77.20</span>
              <span>77.24</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 18</span>
              <span>76.2 kg</span>
              <span>77.00</span>
              <span>77.03</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 19</span>
              <span>76.5 kg</span>
              <span>76.86</span>
              <span>76.92</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 20</span>
              <span>76.7 kg</span>
              <span>76.89</span>
              <span>76.88</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 21</span>
              <span>77.0 kg</span>
              <span>76.79</span>
              <span>76.90</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 22</span>
              <span>76.8 kg</span>
              <span>76.69</span>
              <span>76.88</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 23</span>
              <span>77.0 kg</span>
              <span>76.63</span>
              <span>76.91</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 24</span>
              <span>76.4 kg</span>
              <span>76.66</span>
              <span>76.80</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 25</span>
              <span>76.8 kg</span>
              <span>76.74</span>
              <span>76.80</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 26</span>
              <span>76.8 kg</span>
              <span>76.79</span>
              <span>76.80</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 27</span>
              <span>76.2 kg</span>
              <span>76.71</span>
              <span>76.68</span>
            </div>
            <div className="chart-row-quad">
              <span>Day 28</span>
              <span>77.3 kg</span>
              <span>76.76</span>
              <span>76.81</span>
            </div>
          </div>
          <p style={{ marginTop: 22 }}>
            Now read it both ways. <b>Regression on all 28 days</b> gives &minus;0.394 kg/week with a
            standard error of 0.071 kg/week — a 95% interval of &minus;0.533 to &minus;0.256, comfortably
            clear of zero, and comfortably containing the true 0.400. The residual scatter it infers is
            0.432 kg, close to the 0.500 that was put in. <b>The first and last reading</b> give (77.3
            &minus; 77.9) / 27 &times; 7 = &minus;0.156 kg/week, with a standard error of 0.183 kg/week.
            That is not distinguishable from zero. Same scale, same 28 days, same body: one method says the
            loss is real and measured, the other says nothing happened. The difference is not luck — the
            endpoint pair happened to land on a high reading at the start and a high reading at the end, and
            a two-point estimate has no way to know that.
          </p>
        </section>

        <section className="content-block">
          <h2>An exponential average is not faster than a plain one</h2>
          <p>
            Most scale apps show a smoothed line, and the smoothing is usually an exponentially weighted
            moving average: today&apos;s smoothed value is &alpha; times today&apos;s reading plus (1 &minus;
            &alpha;) times yesterday&apos;s smoothed value. It feels like it should respond faster than a
            plain average of the last n days, because it never fully forgets anything. It does not.
          </p>
          <p>
            In steady state an EWMA with constant &alpha; has variance &sigma;&sup2;&middot;&alpha;/(2
            &minus; &alpha;), and the mean age of the data inside it — how far back, on average, the
            information it carries comes from — is (1 &minus; &alpha;)/&alpha; days. A simple mean of n
            consecutive days has variance &sigma;&sup2;/n and mean age (n &minus; 1)/2. Set the variances
            equal and n = (2 &minus; &alpha;)/&alpha;; substitute that into the mean age and you get ((2
            &minus; &alpha;)/&alpha; &minus; 1)/2 = (1 &minus; &alpha;)/&alpha;. Identical.
          </p>
          <div className="chart-table">
            <div className="chart-row-quad">
              <span>&alpha;</span>
              <span>Equal to a plain mean of</span>
              <span>Lag of both</span>
              <span>Scatter left</span>
            </div>
            <div className="chart-row-quad">
              <span>0.1</span>
              <span>19.00 days</span>
              <span>9.00 days</span>
              <span>0.229&sigma;</span>
            </div>
            <div className="chart-row-quad">
              <span>0.2</span>
              <span>9.00 days</span>
              <span>4.00 days</span>
              <span>0.333&sigma;</span>
            </div>
            <div className="chart-row-quad">
              <span>0.3</span>
              <span>5.67 days</span>
              <span>2.33 days</span>
              <span>0.420&sigma;</span>
            </div>
            <div className="chart-row-quad">
              <span>0.4</span>
              <span>4.00 days</span>
              <span>1.50 days</span>
              <span>0.500&sigma;</span>
            </div>
            <div className="chart-row-quad">
              <span>0.5</span>
              <span>3.00 days</span>
              <span>1.00 days</span>
              <span>0.577&sigma;</span>
            </div>
          </div>
          <p style={{ marginTop: 22 }}>
            For any smoothing you can choose, there is a plain average with exactly the same noise and
            exactly the same delay, and there is no way to get one without the other. If your app lets you
            set &alpha; = 0.2, it is showing you a 9-day average that lags four days behind; if you want it
            to catch up in two days, you have to accept 0.42&sigma; of scatter instead of 0.33&sigma;. The
            trade-off is fixed, and it is the same trade-off whichever algorithm draws the line.
          </p>
        </section>

        <section className="content-block">
          <h2>The display graduation is worth about ten percent</h2>
          <p>
            Scales are sold on resolution — 0.1 kg, 0.05 kg, "100 g precision". Rounding to a graduation of
            u contributes u&sup2;/12 to the variance of each reading, which is a standard error of
            u/&radic;12: 0.289 kg for a 1 kg display, 0.029 kg for a 0.1 kg one. The question is what that
            does to a trend, and the answer follows from the fact that the number of days needed scales as
            &sigma;&sup2;/&sup3;.
          </p>
          <div className="chart-table">
            <div className="chart-row-five">
              <span>Graduation</span>
              <span>Rounding SD</span>
              <span>Effective scatter</span>
              <span>Wider by</span>
              <span>Extra days needed</span>
            </div>
            <div className="chart-row-five">
              <span>1 kg</span>
              <span>0.289 kg</span>
              <span>0.577 kg</span>
              <span>15.5%</span>
              <span>10.1%</span>
            </div>
            <div className="chart-row-five">
              <span>0.5 kg</span>
              <span>0.144 kg</span>
              <span>0.520 kg</span>
              <span>4.1%</span>
              <span>2.7%</span>
            </div>
            <div className="chart-row-five">
              <span>0.2 kg</span>
              <span>0.058 kg</span>
              <span>0.503 kg</span>
              <span>0.7%</span>
              <span>0.4%</span>
            </div>
            <div className="chart-row-five">
              <span>0.1 kg</span>
              <span>0.029 kg</span>
              <span>0.501 kg</span>
              <span>0.2%</span>
              <span>0.1%</span>
            </div>
            <div className="chart-row-five">
              <span>0.05 kg</span>
              <span>0.014 kg</span>
              <span>0.500 kg</span>
              <span>0.0%</span>
              <span>0.0%</span>
            </div>
          </div>
          <p style={{ marginTop: 22 }}>
            All of this is computed at &plusmn;0.5 kg of bodily scatter, and that is the point: the
            graduation is being compared against a noise source that is larger than it. At a 0.1 kg display
            the rounding accounts for 0.33% of the variance of a reading; at a 1 kg display it accounts for
            25%, and even then the penalty on your trend is only 10% more days. Resolution matters for a
            single weigh-in and almost vanishes in a series, because rounding error averages away at
            exactly the same &radic;n rate as everything else.
          </p>
        </section>

        <section className="content-block">
          <h2>What one kilogram is worth in body-fat points</h2>
          <p>
            A body mass scale reports mass, and mass is not a compartment. If a change of &Delta;W is all
            fat, then fat mass rises by &Delta;W and the percentage becomes (F + &Delta;W)/(W + &Delta;W);
            differentiating at &Delta;W = 0 gives 100&middot;(1 &minus; BF)/W points per kilogram. If the
            same change is lean or water, fat mass is unchanged and the percentage becomes F/(W + &Delta;W),
            giving &minus;100&middot;BF/W. On a 78 kg body at 22% fat those are +1.00 and &minus;0.28
            points per kilogram — opposite in sign and 3.5&times; apart in size.
          </p>
          <div className="chart-table">
            <div className="chart-row-five">
              <span>Body weight</span>
              <span>If the kg was fat</span>
              <span>If it was not</span>
              <span>Ambiguity width</span>
              <span>Ratio</span>
            </div>
            <div className="chart-row-five">
              <span>50 kg</span>
              <span>+1.56 pts</span>
              <span>&minus;0.44 pts</span>
              <span>2.00 pts</span>
              <span>3.55&times;</span>
            </div>
            <div className="chart-row-five">
              <span>65 kg</span>
              <span>+1.20 pts</span>
              <span>&minus;0.34 pts</span>
              <span>1.54 pts</span>
              <span>3.55&times;</span>
            </div>
            <div className="chart-row-five">
              <span>80 kg</span>
              <span>+0.98 pts</span>
              <span>&minus;0.28 pts</span>
              <span>1.25 pts</span>
              <span>3.55&times;</span>
            </div>
            <div className="chart-row-five">
              <span>95 kg</span>
              <span>+0.82 pts</span>
              <span>&minus;0.23 pts</span>
              <span>1.05 pts</span>
              <span>3.55&times;</span>
            </div>
            <div className="chart-row-five">
              <span>110 kg</span>
              <span>+0.71 pts</span>
              <span>&minus;0.20 pts</span>
              <span>0.91 pts</span>
              <span>3.55&times;</span>
            </div>
          </div>
          <p style={{ marginTop: 22 }}>
            The interesting column is the fourth. The width of the ambiguity is 100&middot;&Delta;W/W &times;
            (1 &minus; BF) + 100&middot;&Delta;W/W &times; BF = 100&middot;&Delta;W/W exactly — the BF terms
            cancel, so <b>the uncertainty a mass change carries about your body fat does not depend on how
            much fat you have</b>. It depends only on the size of the change and your size. On the 78 kg
            body: 0.5 kg is 0.64 points of ambiguity, 1 kg is 1.28, 2 kg is 2.56, 3 kg is 3.85 and 5 kg is
            6.41. Compare that with the trend precision computed earlier — 28 days at &plusmn;0.5 kg of
            scatter resolves 0.160 kg/week, or 0.64 kg over the window, which is itself 0.82 points of
            ambiguity. The mass series and the body-fat question run out of resolution at about the same
            place, and no improvement in the scale can fix that, because the missing information is not in
            the weight.
          </p>
          <p>
            This is also why the body-fat number printed by a scale and the body-fat number implied by your
            weight can move in opposite directions without either being broken: they are answering different
            questions about the same kilogram. If you want the compartments rather than the total, the mass
            series is the wrong instrument, and{" "}
            <a href="/body-composition-calculator">the two-compartment identity</a> is the honest way to see
            what the total can and cannot be split into.
          </p>
        </section>

        <section className="content-block">
          <h2>How to run a body mass scale so the arithmetic above applies</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              <b>Measure your own &sigma; before trusting any table.</b> Step on and off five times in one
              minute, same spot, same posture. The spread of those five is the instrument&apos;s
              contribution; weigh once a day for a fortnight at a fixed time and take the spread of the
              7-day means to get the bodily part. Every number on this page scales as &sigma; or
              &sigma;&sup2;/&sup3;, so getting &sigma; wrong by a factor of two moves the required days by
              1.59&times;.
            </li>
            <li>
              <b>Fix the clock, not the clothing.</b> The model above assumes the daily deviations are
              independent with a constant spread. Anything that makes them drift together — a weekly
              pattern, a change in routine partway through — breaks the independence assumption, and the
              standard errors will be optimistic.
            </li>
            <li>
              <b>Never move the scale.</b> A level floor and the same spot remove a source of error that
              the model has no term for. If you must move it, treat the series as two series.
            </li>
            <li>
              <b>Do not chase the daily number.</b> At &plusmn;0.5 kg, a single reading is &plusmn;0.98 kg
              wide. A 0.3 kg jump between two mornings is not information, and no amount of staring at it
              will make it information.
            </li>
            <li>
              <b>Judge on the slope, and only after the table says you can.</b> At &plusmn;0.5 kg and a
              real rate of 0.5 kg/week, 14 days. Before that, a flat line means nothing.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Where this page&apos;s arithmetic stops being true</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              <b>No device was measured.</b> Nothing here is a claim about any scale&apos;s accuracy, and
              no product is named, ranked or reviewed. The scatter figures are placeholders for you to
              replace.
            </li>
            <li>
              <b>Independence is assumed, not established.</b> Every standard error on this page assumes
              successive daily deviations are independent draws with a constant spread. Real bodies have
              patterns — weekly, monthly, seasonal — and correlated errors shrink more slowly than
              &radic;n. If yours do, all the day-counts here are too optimistic.
            </li>
            <li>
              <b>A straight line is assumed.</b> The regression asks whether a constant rate fits. Real
              mass change is not linear — early losses are usually faster — and a curved series will show a
              slope that is a weighted average of the rates over the window, not the rate now.
            </li>
            <li>
              <b>The two-compartment conversion is a model.</b> Dividing mass into fat and fat-free is one
              level of a model that has more levels, and the &minus;100&middot;BF/W branch is the limit of
              "none of it was fat", which is not the same as "it was water".
            </li>
            <li>
              <b>WHO categories are screening bands, not diagnoses.</b> A BMI line crossed by a noisy mean
              is a reason to look closer, not a finding.
            </li>
            <li>
              <b>The worked series was generated here.</b> The 28 readings are drawn from a stated model
              with a stated seed so that two estimation methods could be compared on identical data. They
              are not measurements of any person.
            </li>
            <li>
              <b>None of this is medical advice.</b> It is arithmetic about what a series of numbers can
              support. See our <a href="/disclaimer">disclaimer</a>.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Questions people ask about body mass scales</h2>
          <div className="mini-faq">
            <details>
              <summary>Is a body mass scale accurate enough to be worth using every day?</summary>
              <p style={{ marginTop: 12 }}>
                The question practically answers itself once the numbers are separated. At &plusmn;0.5 kg of
                daily scatter a single reading is &plusmn;0.98 kg wide — useless for a daily decision and
                fine for a series. Seven days later the mean is &plusmn;0.37 kg wide and a month of daily
                readings resolves a rate of 0.160 kg/week. Accuracy in the sense of agreeing with a
                laboratory standard is a different question, and it is not the one that decides whether the
                instrument is useful.
              </p>
            </details>
            <details>
              <summary>Does a 0.1 kg display matter more than a 0.5 kg one?</summary>
              <p style={{ marginTop: 12 }}>
                Not for a trend. Rounding to 0.5 kg contributes 0.144 kg of standard error, which against
                &plusmn;0.5 kg of bodily scatter widens your effective noise by 4.1% and costs 2.7% more
                days of data. Even a 1 kg graduation — 0.289 kg of rounding error, 25% of the variance of a
                single reading — costs only 10.1% more days, because rounding averages away at the same
                &radic;n rate as the noise it is added to.
              </p>
            </details>
            <details>
              <summary>How many days of flat data before I am really plateaued?</summary>
              <p style={{ marginTop: 12 }}>
                Whatever the day-count table says for the rate you care about. At &plusmn;0.5 kg of scatter
                and a rate of 0.25 kg/week, 21 days of daily weighing — below that, "no change" and "change
                too small to see" look identical. The general rule is that the smallest rate N days can
                detect is 1.96&middot;&sigma;&middot;&radic;(12 / N(N&sup2; &minus; 1))&middot;7 per week,
                and a plateau is only a claim about a rate smaller than that. Our{" "}
                <a href="/weight-loss-percentage-calculator">weight loss percentage calculator</a> treats
                the same question from the weekly-average side.
              </p>
            </details>
            <details>
              <summary>Why does the scale drop two kilograms overnight?</summary>
              <p style={{ marginTop: 12 }}>
                This page does not model physiology and will not guess at a cause. What it can tell you is
                the size of the event: at &plusmn;0.5 kg of scatter, a 2 kg move between two single readings
                is larger than the 1.386 kg minimum detectable change, so it is not explainable by the
                noise alone — but a single reading is &plusmn;0.98 kg wide, so the <i>magnitude</i> of that
                2 kg is uncertain by about half of itself. Two 7-day means 2 kg apart is a much stronger
                statement than two mornings 2 kg apart.
              </p>
            </details>
            <details>
              <summary>Should I weigh once a week instead of every day?</summary>
              <p style={{ marginTop: 12 }}>
                Only if you would otherwise not weigh at all. Five weekly readings across 28 days resolve
                0.310 kg/week against the 0.160 kg/week that 28 daily readings resolve over the same span —
                so a fifth of the readings costs you 1.93&times; the precision, not five times. The loss is
                sub-proportional because spreading readings further apart lengthens the lever arm as well as
                thinning the count, and that partly pays for the missing days. Daily still wins, and it
                wins for free: the extra information costs you twenty seconds a morning and nothing else.
              </p>
            </details>
            <details>
              <summary>Can a body mass scale tell me my body fat percentage?</summary>
              <p style={{ marginTop: 12 }}>
                Not on its own. Mass is one number and body fat needs a second, independent one; the
                ambiguity in converting between them is 100&middot;&Delta;W/W points, which is 1.28 points
                per kilogram on a 78 kg body regardless of how lean you are. Scales that print a percentage
                are measuring an electrical property, not fat — see{" "}
                <a href="/scale-bmi">what a smart scale really measures</a> for that side of it, and{" "}
                <a href="/best-bmi-scale">what the spec sheet is worth</a> for the hardware side.
              </p>
            </details>
            <details>
              <summary>My scale and my doctor&apos;s scale disagreed by a kilogram. Which is right?</summary>
              <p style={{ marginTop: 12 }}>
                This page cannot say, because it measured neither. What it can say is that a constant
                offset cancels out of every rate and every change on this page — only the slope matters for
                a trend — and that a gain error does not. If you want to find out which kind yours has,{" "}
                <a href="/bmi-machine">five tests for the one you already own</a> separates them with
                computed thresholds.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related pages on this site</h2>
          <div className="related-grid">
            <a href="/scale-bmi">
              <span>SMART SCALES</span>
              <strong>What a smart scale really measures</strong>
              <i>→</i>
            </a>
            <a href="/best-bmi-scale">
              <span>SPEC SHEETS</span>
              <strong>What the printed numbers are worth</strong>
              <i>→</i>
            </a>
            <a href="/bmi-machine">
              <span>YOUR OWN UNIT</span>
              <strong>Five tests you can run at home</strong>
              <i>→</i>
            </a>
            <a href="/weight-loss-percentage-calculator">
              <span>LOSS TRACKING</span>
              <strong>Weight loss percentage and plateaus</strong>
              <i>→</i>
            </a>
            <a href="/body-composition-calculator">
              <span>COMPARTMENTS</span>
              <strong>Fat, lean, and four routes to one number</strong>
              <i>→</i>
            </a>
            <a href="/bmi-calculator">
              <span>BMI</span>
              <strong>The index itself, and its limits</strong>
              <i>→</i>
            </a>
          </div>
          <p style={{ marginTop: 34 }}>
            More on this site: <a href="/body-fat-calculator">body fat calculator</a> ·{" "}
            <a href="/fat-percentage-calculator">fat percentage across three methods</a> ·{" "}
            <a href="/best-way-to-measure-body-fat">best way to measure body fat</a> ·{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a>
          </p>
          <p>
            <b>Not medical advice.</b> Every figure on this page is arithmetic performed here on the BMI
            definition, on the standard errors of a mean and of a least-squares slope, and on a stated
            two-compartment model. No scale was measured and no product is ranked. See our{" "}
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
