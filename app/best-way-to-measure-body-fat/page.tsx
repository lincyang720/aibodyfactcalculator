"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "metric" | "us";
type Sex = "male" | "female";

const LB = 2.20462;
const CM_PER_IN = 2.54;
const L10 = Math.log(10);

// How repeatable your tape work is, in centimetres of spread per circumference.
const TAPE_SLOP = [0.3, 0.5, 1.0, 1.5, 2.0];

// How repeatable your pinch is, in millimetres of spread per site.
const CAL_SLOP = [0.5, 1, 2, 3];

// Day-to-day spread in your scale weight, in kilograms.
const WT_SLOP = [0.1, 0.3, 0.5, 1.0];

// How far your stored height might be from the truth, in centimetres.
const HT_SLOP = [0, 0.5, 1, 2];

// The spread your own device shows you from day to day, in percentage points.
const DEV_SLOP = [0.5, 1, 1.5, 2.5, 3.5];

// Readings you take at each site and average.
const NS = [1, 2, 3, 5];

// The change you want to be able to call real, in percentage points.
const TARGETS = [0.5, 1, 2, 3];

// How fast you expect your body fat to actually move, in points per month.
const RATES = [0.25, 0.5, 1, 2];

// 1.96 * sqrt(2): two sessions, 95 percent, two-sided.
const Z = 1.96 * Math.SQRT2;

function navyBf(sex: Sex, waistCm: number, neckCm: number, hipCm: number, heightCm: number): number {
  const h = heightCm / CM_PER_IN;
  if (sex === "male") {
    return 86.01 * Math.log10((waistCm - neckCm) / CM_PER_IN) - 70.041 * Math.log10(h) + 36.76;
  }
  return (
    163.205 * Math.log10((waistCm + hipCm - neckCm) / CM_PER_IN) - 97.684 * Math.log10(h) - 78.387
  );
}

function jp3Bf(sex: Sex, sumMm: number, age: number): number {
  const d =
    sex === "male"
      ? 1.10938 - 0.0008267 * sumMm + 0.0000016 * sumMm * sumMm - 0.0002574 * age
      : 1.0994921 - 0.0009929 * sumMm + 0.0000023 * sumMm * sumMm - 0.0001392 * age;
  return 495 / d - 450;
}

function bmiBf(bmi: number, age: number, sex: Sex): number {
  return 1.2 * bmi + 0.23 * age - 10.8 * (sex === "male" ? 1 : 0) - 5.4;
}

// Points of body fat per centimetre of each circumference, per centimetre of height.
function navySens(sex: Sex, waistCm: number, neckCm: number, hipCm: number, heightCm: number) {
  const h = heightCm / CM_PER_IN;
  if (sex === "male") {
    const perIn = 86.01 / (L10 * ((waistCm - neckCm) / CM_PER_IN));
    return {
      waist: perIn / CM_PER_IN,
      neck: perIn / CM_PER_IN,
      hip: 0,
      height: 70.041 / (L10 * h) / CM_PER_IN,
    };
  }
  const perIn = 163.205 / (L10 * ((waistCm + hipCm - neckCm) / CM_PER_IN));
  return {
    waist: perIn / CM_PER_IN,
    neck: perIn / CM_PER_IN,
    hip: perIn / CM_PER_IN,
    height: 97.684 / (L10 * h) / CM_PER_IN,
  };
}

// Points of body fat per millimetre at one skinfold site.
function jp3Sens(sex: Sex, sumMm: number, age: number): number {
  const d =
    sex === "male"
      ? 1.10938 - 0.0008267 * sumMm + 0.0000016 * sumMm * sumMm - 0.0002574 * age
      : 1.0994921 - 0.0009929 * sumMm + 0.0000023 * sumMm * sumMm - 0.0001392 * age;
  const dD =
    sex === "male" ? -0.0008267 + 0.0000032 * sumMm : -0.0009929 + 0.0000046 * sumMm;
  return Math.abs((-495 / (d * d)) * dD);
}

const f = (x: number, n = 2) => (Number.isFinite(x) ? x.toFixed(n) : "—");

export default function BestWayPage() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(34);
  const [height, setHeight] = useState(175); // cm or in
  const [weight, setWeight] = useState(78); // kg or lb
  const [waist, setWaist] = useState(85);
  const [neck, setNeck] = useState(38);
  const [hip, setHip] = useState(95);
  const [sf1, setSf1] = useState(10);
  const [sf2, setSf2] = useState(18);
  const [sf3, setSf3] = useState(14);

  const [tapeIdx, setTapeIdx] = useState(1); // 0.5 cm
  const [calIdx, setCalIdx] = useState(1); // 1 mm
  const [wtIdx, setWtIdx] = useState(1); // 0.3 kg
  const [htIdx, setHtIdx] = useState(1); // 0.5 cm
  const [devIdx, setDevIdx] = useState(2); // 1.5 pts
  const [nIdx, setNIdx] = useState(0); // 1 reading
  const [targetIdx, setTargetIdx] = useState(1); // 1.0 pt
  const [rateIdx, setRateIdx] = useState(1); // 0.5 pt/month

  const heightCm = unit === "us" ? height * CM_PER_IN : height;
  const weightKg = unit === "us" ? weight / LB : weight;
  const c = (v: number) => (unit === "us" ? v / CM_PER_IN : v); // entered circumference -> cm
  const cmLabel = unit === "us" ? "in" : "cm";
  const wtLabel = unit === "us" ? "lb" : "kg";

  const waistCm = c(waist);
  const neckCm = c(neck);
  const hipCm = c(hip);

  const tapeSlopCm = unit === "us" ? TAPE_SLOP[tapeIdx] / CM_PER_IN : TAPE_SLOP[tapeIdx];
  const htSlopCm = unit === "us" ? HT_SLOP[htIdx] * CM_PER_IN : HT_SLOP[htIdx];
  const wtSlopKg = unit === "us" ? WT_SLOP[wtIdx] / LB : WT_SLOP[wtIdx];

  const calSlopMm = CAL_SLOP[calIdx];
  const devSigma = DEV_SLOP[devIdx];
  const n = NS[nIdx];
  const target = TARGETS[targetIdx];
  const rate = RATES[rateIdx];

  const male = sex === "male";
  const sum3 = sf1 + sf2 + sf3;

  const ok =
    heightCm > 120 &&
    heightCm < 230 &&
    weightKg > 30 &&
    weightKg < 250 &&
    age > 13 &&
    age < 90 &&
    waistCm > 40 &&
    waistCm < 200 &&
    neckCm > 20 &&
    neckCm < 70 &&
    waistCm - neckCm > 3 &&
    (!male ? hipCm > waistCm - 5 && hipCm < 220 : true) &&
    sf1 >= 2 &&
    sf1 <= 80 &&
    sf2 >= 2 &&
    sf2 <= 80 &&
    sf3 >= 2 &&
    sf3 <= 80;

  const bfNavy = ok ? navyBf(sex, waistCm, neckCm, hipCm, heightCm) : NaN;
  const bfJp3 = ok ? jp3Bf(sex, sum3, age) : NaN;
  const bmi = weightKg / (heightCm / 100) ** 2;
  const bfBmi = ok ? bmiBf(bmi, age, sex) : NaN;

  const sN = navySens(sex, waistCm, neckCm, hipCm, heightCm);
  const sCal = jp3Sens(sex, sum3, age);
  const sBmiPerKg = 1.2 / (heightCm / 100) ** 2;
  const sBmiPerCm = Math.abs((1.2 * (-2 * bmi / (heightCm / 100))) / 100);

  // Each method's repeat standard deviation, in percentage points.
  const partsTape: [string, number][] = male
    ? [
        ["waist", sN.waist * tapeSlopCm],
        ["neck", sN.neck * tapeSlopCm],
        ["height", sN.height * htSlopCm],
      ]
    : [
        ["waist", sN.waist * tapeSlopCm],
        ["hip", sN.hip * tapeSlopCm],
        ["neck", sN.neck * tapeSlopCm],
        ["height", sN.height * htSlopCm],
      ];
  const sigTape = Math.sqrt(partsTape.reduce((a, p) => a + p[1] ** 2, 0));
  const sigCal = Math.sqrt(3) * sCal * calSlopMm;
  const sigBmi = Math.sqrt((sBmiPerKg * wtSlopKg) ** 2 + (sBmiPerCm * htSlopCm) ** 2);

  const sig = (base: number) => base / Math.sqrt(n);
  const det = (base: number) => (Z * base) / Math.sqrt(n);
  const needFor = (base: number) => {
    const v = (Z * base / target) ** 2;
    return v <= 1 ? 1 : Math.ceil(v);
  };

  const methods = [
    { key: "tape", label: "tape", base: sigTape },
    { key: "caliper", label: "caliper", base: sigCal },
    { key: "device", label: "your device", base: devSigma },
  ];
  const ranked = [...methods].sort((a, b) => a.base - b.base);
  const best = ranked[0];
  const second = ranked[1];
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const margin = second.base > 0 ? ((second.base - best.base) / best.base) * 100 : 0;

  // The reverse budget: how much slop you are allowed at each input.
  const allowTape = target > 0 ? target / (sN.waist * Math.sqrt(male ? 2 : 3)) : Infinity;
  const allowCal = target > 0 ? target / (Math.sqrt(3) * sCal) : Infinity;
  const allowHeight = target > 0 ? target / sN.height : Infinity;

  // The break-even pinch: the slop at which the caliper would tie the tape.
  const breakEvenMm = sCal > 0 ? sigTape / (Math.sqrt(3) * sCal) : Infinity;
  // ... and the tape slop that would tie the caliper.
  const tapeToMatch = sN.waist > 0 ? sigCal / (sN.waist * Math.sqrt(male ? 2 : 3)) : Infinity;

  // Shares of the tape error, and what halving each one buys.
  const shares = partsTape.map(([k, v]) => ({
    name: k,
    share: (100 * v * v) / (sigTape * sigTape),
    gain:
      sigTape > 0
        ? (100 *
            (sigTape -
              Math.sqrt(partsTape.reduce((a, p) => a + (p[0] === k ? p[1] / 2 : p[1]) ** 2, 0)))) /
          sigTape
        : 0,
  }));

  const months = det(best.base) / rate;

  function switchUnit(next: Unit) {
    if (next === unit) return;
    setHeight(next === "us" ? Math.round(heightCm / CM_PER_IN) : Math.round(heightCm));
    setWeight(next === "us" ? Math.round(weightKg * LB) : Math.round(weightKg));
    setWaist(next === "us" ? +(waistCm / CM_PER_IN).toFixed(1) : Math.round(waistCm));
    setNeck(next === "us" ? +(neckCm / CM_PER_IN).toFixed(1) : Math.round(neckCm));
    setHip(next === "us" ? +(hipCm / CM_PER_IN).toFixed(1) : Math.round(hipCm));
    setUnit(next);
  }

  function typical() {
    setTapeIdx(1);
    setCalIdx(1);
    setWtIdx(1);
    setHtIdx(1);
    setDevIdx(2);
    setNIdx(0);
  }

  const sfNames = male
    ? ["Chest (mm)", "Abdomen (mm)", "Thigh (mm)"]
    : ["Triceps (mm)", "Suprailiac (mm)", "Thigh (mm)"];

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/body-fat-calculator">Body Fat %</a>
          <a href="/bmi-calculator">BMI</a>
          <a href="/fat-calculator">Error Budget</a>
          <a href="/body-fat-calculator-caliper">Caliper</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">BEST WAY TO MEASURE BODY FAT · REPEATABILITY ARITHMETIC</div>
        <h1>Best Way to Measure Body Fat: Pick the Method You Can Repeat</h1>
        <p className="tool-lede">
          Every home method turns a handful of measurements into one percentage, and every one of them is
          limited by the same thing: how closely you can repeat the measurements you take. This page turns
          each method into a single number — its repeat spread, in body fat points — and then asks the only
          question that decides anything: how small a change can it see? At the defaults below, a tape read
          to half a centimetre carries <b>0.57</b> points, a caliper read to one millimetre carries{" "}
          <b>0.52</b>, and a smart scale with 1.5 points of daily noise carries <b>4.16</b>. A caliper only
          beats a tape if you can repeat a pinch to within <b>1.09 mm</b>. Everything here is arithmetic
          this page performs on published equations. Nothing on it ranks a product, and nothing on it
          compares any of these methods against a laboratory reference.
        </p>

        <div className="calc-layout">
          <div className="calc-card">
            <div className="field-grid">
              <Field label="Sex">
                <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </Field>
              <Field label="Units">
                <select value={unit} onChange={(e) => switchUnit(e.target.value as Unit)}>
                  <option value="metric">Metric (kg / cm)</option>
                  <option value="us">US (lb / in)</option>
                </select>
              </Field>
              <Field label="Age">
                <input type="number" min={14} max={85} value={age} onChange={(e) => setAge(+e.target.value)} />
              </Field>
              <Field label={`Weight (${wtLabel})`}>
                <input type="number" min={1} value={weight} onChange={(e) => setWeight(+e.target.value)} />
              </Field>
              <Field label={`Height (${cmLabel})`}>
                <input type="number" min={1} value={height} onChange={(e) => setHeight(+e.target.value)} />
              </Field>
              <Field label={`Waist (${cmLabel})`}>
                <input type="number" min={1} value={waist} onChange={(e) => setWaist(+e.target.value)} />
              </Field>
              <Field label={`Neck (${cmLabel})`}>
                <input type="number" min={1} value={neck} onChange={(e) => setNeck(+e.target.value)} />
              </Field>
              {!male && (
                <Field label={`Hip (${cmLabel})`}>
                  <input type="number" min={1} value={hip} onChange={(e) => setHip(+e.target.value)} />
                </Field>
              )}
              <Field label={sfNames[0]}>
                <input type="number" min={2} max={80} value={sf1} onChange={(e) => setSf1(+e.target.value)} />
              </Field>
              <Field label={sfNames[1]}>
                <input type="number" min={2} max={80} value={sf2} onChange={(e) => setSf2(+e.target.value)} />
              </Field>
              <Field label={sfNames[2]}>
                <input type="number" min={2} max={80} value={sf3} onChange={(e) => setSf3(+e.target.value)} />
              </Field>
              <Field label="Your tape repeatability">
                <select value={tapeIdx} onChange={(e) => setTapeIdx(+e.target.value)}>
                  {TAPE_SLOP.map((v, i) => (
                    <option value={i} key={v}>
                      {unit === "us" ? f(v / CM_PER_IN, 2) : v} {cmLabel} — {i === 0 ? "excellent" : i === 1 ? "good" : i === 2 ? "typical" : i === 3 ? "loose" : "careless"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Your caliper repeatability">
                <select value={calIdx} onChange={(e) => setCalIdx(+e.target.value)}>
                  {CAL_SLOP.map((v, i) => (
                    <option value={i} key={v}>
                      {v} mm per site
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Your weight spread">
                <select value={wtIdx} onChange={(e) => setWtIdx(+e.target.value)}>
                  {WT_SLOP.map((v, i) => (
                    <option value={i} key={v}>
                      {unit === "us" ? f(v * LB, 1) : v} {wtLabel}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Height error">
                <select value={htIdx} onChange={(e) => setHtIdx(+e.target.value)}>
                  {HT_SLOP.map((v, i) => (
                    <option value={i} key={v}>
                      {unit === "us" ? f(v / CM_PER_IN, 2) : v} {cmLabel}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Your device's daily spread">
                <select value={devIdx} onChange={(e) => setDevIdx(+e.target.value)}>
                  {DEV_SLOP.map((v, i) => (
                    <option value={i} key={v}>
                      {v} pts
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Readings per site">
                <select value={nIdx} onChange={(e) => setNIdx(+e.target.value)}>
                  {NS.map((v, i) => (
                    <option value={i} key={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Change you want to see">
                <select value={targetIdx} onChange={(e) => setTargetIdx(+e.target.value)}>
                  {TARGETS.map((v, i) => (
                    <option value={i} key={v}>
                      {f(v, 2)} points
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Rate you expect">
                <select value={rateIdx} onChange={(e) => setRateIdx(+e.target.value)}>
                  {RATES.map((v, i) => (
                    <option value={i} key={v}>
                      {f(v, 2)} pts / month
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <button className="calc-button" onClick={typical}>
              Reset to typical home repeatability
            </button>
          </div>

          <div className="answer-card">
            <span>WHICH METHOD CAN SEE THE SMALLEST CHANGE, WITH YOUR NUMBERS</span>
            <div className="answer-number">
              {ok ? f(det(best.base)) : "—"}
              <small>
                points · the smallest change your most repeatable method can see
              </small>
            </div>
            {ok ? (
              <>
                <p>
                  <b>{cap(best.label)} wins</b>, at a repeat spread of <b>{f(sig(best.base))} points</b> versus{" "}
                  <b>{f(sig(second.base))}</b> for {second.label.toLowerCase()} — a margin of{" "}
                  <b>{f(margin, 1)}%</b>. That is close enough that one extra reading per site flips it: the
                  loser needs only <b>{Math.ceil((second.base / best.base) ** 2)}</b> readings to tie.{" "}
                  {best.key === "caliper" ? (
                    <>
                      For the tape to match that you would need every circumference repeatable to{" "}
                      <b>{f(tapeToMatch, 2)} {cmLabel}</b>; for the caliper to lose you would have to pinch
                      worse than <b>{f(breakEvenMm, 2)} mm</b> per site.{" "}
                    </>
                  ) : (
                    <>
                      A caliper would have to be repeatable to <b>{f(breakEvenMm, 2)} mm</b> per site to
                      match the tape you are doing now.{" "}
                    </>
                  )}
                </p>
                <p>
                  To resolve a <b>{f(target, 2)} point</b> change you are allowed{" "}
                  <b>{f(allowTape, 2)} {cmLabel}</b> of slop on every circumference and{" "}
                  <b>{f(allowCal, 2)} mm</b> on every pinch — and height may be off by{" "}
                  <b>{f(allowHeight, 1)} {cmLabel}</b> before it matters. At {n} reading
                  {n === 1 ? "" : "s"} per site you can see <b>{f(det(best.base))}</b> points today; reaching{" "}
                  {f(target, 2)} takes <b>{needFor(best.base)}</b> reading{needFor(best.base) === 1 ? "" : "s"}{" "}
                  per site with the {best.label.toLowerCase()}, <b>{needFor(second.base)}</b> with the{" "}
                  {second.label.toLowerCase()}, and <b>{needFor(devSigma)}</b> with your device.
                </p>
                <p>
                  At {f(rate, 2)} points a month, a real change takes <b>{f(months, 1)} months</b> before the{" "}
                  {best.label} can call it — and <b>{f(det(devSigma) / rate, 1)} months</b>{" "}
                  before your device can. Your tape estimate reads <b>{f(bfNavy, 1)}%</b>, the three-site
                  caliper reads <b>{f(bfJp3, 1)}%</b>, and the BMI equation predicts <b>{f(bfBmi, 1)}%</b>{" "}
                  for your weight, age and sex.
                </p>
                <p>
                  Where your tape error comes from:{" "}
                  {shares.map((s, i) => (
                    <span key={s.name}>
                      {i > 0 ? ", " : ""}
                      <b>{s.name} {f(s.share, 1)}%</b>
                    </span>
                  ))}
                  . Halving the biggest one buys <b>{f(Math.max(...shares.map((s) => s.gain)), 1)}%</b> of
                  your spread; halving the smallest buys{" "}
                  <b>{f(Math.min(...shares.map((s) => s.gain)), 1)}%</b>.
                </p>
              </>
            ) : (
              <p>
                Enter a height between 120 and 230 cm, a weight between 30 and 250 kg, a waist at least 3 cm
                larger than your neck, and three skinfolds between 2 and 80 mm.
              </p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>THE ONE IDENTITY EVERY NUMBER ON THIS PAGE COMES FROM</span>
          <strong>
            σ(BF) = √[ Σ ( ∂BF ÷ ∂x<sub>i</sub> × σ<sub>i</sub> )² ] &nbsp;&nbsp;→&nbsp;&nbsp; smallest
            visible change = 1.96 · √2 · σ(BF) ÷ √n
          </strong>
          <small>
            Each method is a published formula applied to a handful of inputs you measured by hand. Each
            input wobbles by some amount σ<sub>i</sub> from one attempt to the next, and the formula
            converts that wobble into body fat points through its own partial derivative ∂BF/∂x<sub>i</sub>.
            Independent wobbles add in quadrature, which is the square root of the sum of squares, not the
            sum. Comparing two sessions doubles the variance, hence the √2, and averaging <i>n</i> readings
            divides the spread by √<i>n</i>. Every table below is this page differentiating the U.S. Navy
            circumference equation, the Jackson-Pollock three-site equation with Siri, and the BMI
            prediction equation, then evaluating the result. Nothing here is copied, and nothing here is a
            claim about how close any of these methods are to a laboratory measurement.
          </small>
        </div>

        <section className="content-block">
          <h2>The short answer</h2>
          <p>
            There is no best method in the abstract. There is a best method for you, and it is decided by
            one number you can measure in ten minutes: how closely you repeat yourself. Everything else —
            the reputation of the method, the number of decimal places, the price of the instrument — is
            second order against that.
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              <b>Repeatability is the whole game for tracking.</b> A method with a fixed offset still tracks
              you perfectly; a method that jumps around by two points hides a two-point change. The tables
              below measure exactly that, and nothing else.
            </li>
            <li>
              <b>A caliper beats a tape only if you can pinch to about one millimetre.</b> At half a
              centimetre of tape slop the break-even is 1.09 mm per site for a man and 0.80 mm for a woman.
              Most people who buy a caliper never get there, and would have been better off with the tape.
            </li>
            <li>
              <b>The neck is half of a man&apos;s tape error.</b> Waist and neck carry 48.8 percent each of
              the variance at typical slop, and almost nobody practises the neck. Halving your neck slop
              buys 20.4 percent of your total spread, which is more than any equipment purchase would.
            </li>
            <li>
              <b>The answer flips with the body, not with the method.</b> The tape gets better as you get
              larger, because the Navy equation divides by your waist-minus-neck. On the eight computed
              bodies below the caliper wins on lean and average men, and the tape wins on every woman and
              on the largest man.
            </li>
          </ul>
          <p>
            If you want one instruction: take the method you already own, take two readings at every site
            every time, and write down the number. Two readings per site buys more than switching methods,
            at every slop level in the tables below.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what &ldquo;repeatable&rdquo; means in centimetres</h2>
          <p>
            This is the inversion most people never do. Instead of asking how much error a given slop
            produces, ask how much slop you are allowed if you want the answer to hold still to within a
            chosen number of points. Differentiating the Navy equation gives{" "}
            <b>37.35 ÷ (waist − neck)</b> points per centimetre for men and <b>70.88 ÷ (waist + hip −
            neck)</b> for women, so the allowance is simply the target divided by that.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Body</span>
              <b>Points per cm</b>
              <b>Allowed for ±0.5 pt</b>
              <b>Allowed for ±1.0 pt</b>
              <b>Allowed for ±2.0 pt</b>
              <b>Allowed for ±3.0 pt</b>
            </div>
            {[
              ["Man, waist − neck = 20 cm", "1.868", "0.19", "0.38", "0.76", "1.14"],
              ["Man, waist − neck = 35 cm", "1.067", "0.33", "0.66", "1.33", "1.99"],
              ["Man, waist − neck = 47 cm", "0.795", "0.44", "0.89", "1.78", "2.67"],
              ["Man, waist − neck = 60 cm", "0.623", "0.57", "1.14", "2.27", "3.41"],
              ["Woman, waist + hip − neck = 100 cm", "0.709", "0.41", "0.81", "1.63", "2.44"],
              ["Woman, waist + hip − neck = 130 cm", "0.545", "0.53", "1.06", "2.12", "3.18"],
              ["Woman, waist + hip − neck = 160 cm", "0.443", "0.65", "1.30", "2.61", "3.91"],
            ].map((row) => (
              <div className="chart-row chart-row-six" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <b>{row[2]}</b>
                <b>{row[3]}</b>
                <b>{row[4]}</b>
                <b>{row[5]}</b>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Two things fall out. The first is that the allowance is brutally small on a lean body: a man
            whose waist exceeds his neck by 20 cm has to place every circumference to within two
            millimetres to hold his estimate to half a point. The same tape work that is fine at 60 cm is
            hopeless at 20, which is why lean people conclude that these equations &ldquo;do not work on
            them&rdquo; — the equation is fine, the allowance has simply shrunk below what a hand can do.
          </p>
          <p>
            The second is that height barely matters here. The columns above already charge you for every
            circumference wobbling at once, which is why they are tighter than the single-input number.
            Height alone enters at 30.42 ÷ height for men and 42.42 ÷ height for women, so a one point
            allowance is 5.8 cm at 175 cm and 3.8 cm at 162 cm. You do not need a stadiometer; you need a
            tape you place the same way twice.
          </p>
          <p>
            The same inversion for the caliper. Jackson-Pollock three-site sums three folds, so three
            independent wobbles combine as √3, and the allowance per site is the target divided by √3 times
            the per-millimetre sensitivity:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Body</span>
              <b>Points per mm per site</b>
              <b>Allowed for ±0.5 pt</b>
              <b>Allowed for ±1.0 pt</b>
              <b>Allowed for ±2.0 pt</b>
            </div>
            {[
              ["Man, folds sum 30 mm", "0.312", "0.93 mm", "1.85 mm", "3.70 mm"],
              ["Man, folds sum 42 mm", "0.300", "0.96 mm", "1.92 mm", "3.85 mm"],
              ["Man, folds sum 60 mm", "0.281", "1.03 mm", "2.05 mm", "4.10 mm"],
              ["Man, folds sum 90 mm", "0.247", "1.17 mm", "2.34 mm", "4.68 mm"],
              ["Woman, folds sum 40 mm", "0.357", "0.81 mm", "1.62 mm", "3.23 mm"],
              ["Woman, folds sum 52 mm", "0.339", "0.85 mm", "1.70 mm", "3.41 mm"],
              ["Woman, folds sum 70 mm", "0.309", "0.93 mm", "1.87 mm", "3.74 mm"],
              ["Woman, folds sum 100 mm", "0.254", "1.14 mm", "2.27 mm", "4.54 mm"],
            ].map((row) => (
              <div className="chart-row chart-row-five" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <b>{row[2]}</b>
                <b>{row[3]}</b>
                <b>{row[4]}</b>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Note that the caliper allowance moves in the opposite direction from the tape: it gets{" "}
            <i>looser</i> as the folds get thicker, because the density curve flattens out. A tape punishes
            lean bodies, a caliper punishes lean pinches. That single difference is what makes the
            comparison below interesting instead of obvious.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: where your error actually comes from</h2>
          <p>
            Shares are computed as each input&apos;s squared contribution over the total variance, at half a
            centimetre of circumference slop, half a centimetre of height error and one millimetre per
            pinch. The right-hand column is what you gain by halving that one input&apos;s slop and changing
            nothing else.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Method and input</span>
              <b>Share of variance</b>
              <span>Input&apos;s own σ contribution</span>
              <span>Gain from halving it</span>
            </div>
            {[
              ["Tape, man — waist", "48.8%", "0.397 pts", "20.4%"],
              ["Tape, man — neck", "48.8%", "0.397 pts", "20.4%"],
              ["Tape, man — height", "2.3%", "0.087 pts", "0.9%"],
              ["Tape, woman — waist", "30.7%", "0.261 pts", "12.3%"],
              ["Tape, woman — hip", "30.7%", "0.261 pts", "12.3%"],
              ["Tape, woman — neck", "30.7%", "0.261 pts", "12.3%"],
              ["Tape, woman — height", "7.8%", "0.131 pts", "3.0%"],
              ["Caliper, man — each of three sites", "33.3%", "0.300 pts", "13.4%"],
              ["Caliper, woman — each of three sites", "33.3%", "0.339 pts", "13.4%"],
              ["BMI equation, man — weight", "31.2%", "0.118 pts", "12.5%"],
              ["BMI equation, man — height", "68.8%", "0.175 pts", "30.4%"],
              ["BMI equation, woman — weight", "35.9%", "0.137 pts", "14.5%"],
              ["BMI equation, woman — height", "64.1%", "0.183 pts", "28.0%"],
            ].map((row) => (
              <div className="chart-row chart-row-wide" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            The practical reading is uncomfortable. For a man, the neck — the measurement nobody rehearses
            — carries exactly as much of the error as the waist, and halving either one buys a fifth of the
            total spread. For a woman the tape error is spread evenly over three circumferences, so there is
            no single place to improve: each halving buys only 12.3 percent, and the honest fix is to take
            more readings rather than to try harder on one site.
          </p>
          <p>
            The BMI equation is the odd one out. Its two inputs are the easiest things you own to repeat, so
            its repeat spread is the smallest number on this page — 0.211 points for the reference man. That
            is not a recommendation. That equation never looks at your body at all; it is arithmetic on your
            weight, height, age and sex, and its repeatability is small precisely because it is measuring
            almost nothing. A number that is easy to repeat and impossible to be wrong about in the
            short term can still be wrong by a wide margin for you personally, and this page has no way to
            quantify that margin.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: the break-even — when does a caliper beat a tape</h2>
          <p>
            Set the two spreads equal and solve for the pinch. Because averaging divides both sides by the
            same √<i>n</i>, the break-even does not depend on how many readings you take — that is the
            useful part. At half a centimetre of height error:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Your tape repeatability</span>
              <b>Tape spread</b>
              <b>Caliper ties at</b>
              <b>Caliper must beat</b>
              <b>Winner at 1 mm</b>
              <b>Winner at 2 mm</b>
            </div>
            {[
              ["Man, 0.3 cm", "0.35 pts", "0.67 mm", "under 0.67 mm", "Tape", "Tape"],
              ["Man, 0.5 cm", "0.57 pts", "1.09 mm", "under 1.09 mm", "Caliper", "Tape"],
              ["Man, 1.0 cm", "1.13 pts", "2.17 mm", "under 2.17 mm", "Caliper", "Caliper"],
              ["Man, 1.5 cm", "1.69 pts", "3.25 mm", "under 3.25 mm", "Caliper", "Caliper"],
              ["Man, 2.0 cm", "2.25 pts", "4.33 mm", "under 4.33 mm", "Caliper", "Caliper"],
              ["Woman, 0.3 cm", "0.30 pts", "0.51 mm", "under 0.51 mm", "Tape", "Tape"],
              ["Woman, 0.5 cm", "0.47 pts", "0.80 mm", "under 0.80 mm", "Tape", "Tape"],
              ["Woman, 1.0 cm", "0.91 pts", "1.55 mm", "under 1.55 mm", "Caliper", "Tape"],
              ["Woman, 1.5 cm", "1.36 pts", "2.32 mm", "under 2.32 mm", "Caliper", "Caliper"],
              ["Woman, 2.0 cm", "1.81 pts", "3.08 mm", "under 3.08 mm", "Caliper", "Caliper"],
            ].map((row) => (
              <div className="chart-row chart-row-six" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <b>{row[2]}</b>
                <b>{row[3]}</b>
                <b>{row[4]}</b>
                <b>{row[5]}</b>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            A millimetre is a small distance. It is roughly the thickness of a credit card, and it is the
            entire margin by which a caliper at typical pinch quality beats a tape at typical tape quality
            for a man. Once your tape work is good — 0.3 cm — the caliper has to be repeatable to two
            thirds of a millimetre just to draw. For women the bar is tighter still, because the Navy
            equation&apos;s denominator is the sum of three circumferences and therefore large: the tape
            wins at every realistic pinch quality until your tape work degrades past about a centimetre.
          </p>
          <p>
            The same comparison run the other way gives the crossover in body size. Holding the slop at half
            a centimetre and one millimetre, and solving for the body where the two spreads are equal:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-quad">
              <span>Body</span>
              <b>Caliper spread</b>
              <b>Tape takes over at</b>
              <b>Which side of it you are on</b>
            </div>
            {[
              ["Man, folds sum 30 mm", "0.538 pts", "waist − neck above 49.7 cm", "Most men are below: caliper"],
              ["Man, folds sum 42 mm", "0.520 pts", "waist − neck above 51.6 cm", "Most men are below: caliper"],
              ["Man, folds sum 76 mm", "0.459 pts", "waist − neck above 58.6 cm", "Crosses in the middle"],
              ["Woman, folds sum 36 mm", "0.628 pts", "waist + hip − neck above 99.9 cm", "Nearly all women: tape"],
              ["Woman, folds sum 52 mm", "0.587 pts", "waist + hip − neck above 107.3 cm", "Nearly all women: tape"],
              ["Woman, folds sum 90 mm", "0.475 pts", "waist + hip − neck above 134.4 cm", "Crosses in the middle"],
            ].map((row) => (
              <div className="chart-row chart-row-quad" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <b>{row[2]}</b>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            That is the structural reason the two methods keep switching places in the profiles below, and
            it is not something you can read off the instrument. A tape is a better instrument on a large
            body and a worse one on a lean body, because the number it computes is a ratio of two
            circumferences that grow together. A caliper is the reverse.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what each method can see, and what it costs to see more</h2>
          <p>
            Two sessions, 95 percent confidence, two-sided: the smallest change you may call real is
            1.96·√2·σ, and averaging <i>n</i> readings at every site divides it by √<i>n</i>. At the
            reference man and woman, with half a centimetre of tape slop, one millimetre per pinch, 0.3 kg
            of weight spread, half a centimetre of height error and 1.5 points of device noise:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Method</span>
              <b>Spread</b>
              <b>Visible at 1 reading</b>
              <b>Visible at 3</b>
              <b>Readings for ±1 pt</b>
              <b>Readings for ±0.5 pt</b>
            </div>
            {[
              ["Man — tape", "0.569", "1.58 pts", "0.91 pts", "3", "10"],
              ["Man — caliper", "0.520", "1.44 pts", "0.83 pts", "3", "9"],
              ["Man — BMI equation", "0.211", "0.58 pts", "0.34 pts", "1", "2"],
              ["Man — smart scale at 1.5 pts", "1.500", "4.16 pts", "2.40 pts", "18", "70"],
              ["Woman — tape", "0.470", "1.30 pts", "0.75 pts", "2", "7"],
              ["Woman — caliper", "0.587", "1.63 pts", "0.94 pts", "3", "11"],
              ["Woman — BMI equation", "0.229", "0.63 pts", "0.37 pts", "1", "2"],
              ["Woman — smart scale at 1.5 pts", "1.500", "4.16 pts", "2.40 pts", "18", "70"],
            ].map((row) => (
              <div className="chart-row chart-row-six" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <b>{row[2]}</b>
                <b>{row[3]}</b>
                <b>{row[4]}</b>
                <b>{row[5]}</b>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            The first column is the one to read. A tape and a caliper sit within nine percent of each other
            on the reference man, and the fix for the loser is trivial: because both shrink as 1/√<i>n</i>,
            the loser needs only (0.569 ÷ 0.520)² = 1.2 — that is, two readings — to erase the gap entirely.
            Twenty seconds of extra work beats every equipment decision on this page.
          </p>
          <p>
            The device column is the one people misread. A smart scale contributes its noise on top of your
            body&apos;s own, and unlike a tape it gives you no way to inspect where the number came from. To
            make it resolve a single body fat point you would need eighteen readings per comparison, which
            at daily weighing is over five weeks of data on each side of the comparison. That is not an
            argument against owning one; it is an argument against reading its daily number as if it were a
            measurement.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: how long before a change is real</h2>
          <p>
            The same threshold read against time. If your body fat is genuinely moving at <i>r</i> points a
            month, you need <i>threshold ÷ r</i> months before a two-session comparison can see it. Reference
            man, at three rates and two readings-per-site settings:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>True rate</span>
              <b>Tape, 1 reading</b>
              <b>Tape, 3 readings</b>
              <b>Caliper, 1 reading</b>
              <b>Caliper, 3 readings</b>
              <b>Device, 1 reading</b>
            </div>
            {[
              ["0.25 pts / month", "6.3 months", "3.6 months", "5.8 months", "3.3 months", "16.6 months"],
              ["0.50 pts / month", "3.2 months", "1.8 months", "2.9 months", "1.7 months", "8.3 months"],
              ["1.00 pts / month", "1.6 months", "0.9 months", "1.4 months", "0.8 months", "4.2 months"],
            ].map((row) => (
              <div className="chart-row chart-row-six" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <b>{row[2]}</b>
                <b>{row[3]}</b>
                <b>{row[4]}</b>
                <b>{row[5]}</b>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Read the first row slowly. At a quarter of a point a month — a perfectly respectable rate — your
            tape cannot see anything you have done for more than half a year, and three readings per site
            cut that to three and a half months. Most people who conclude they have stalled have simply
            measured too soon, and no change of method would have helped them. The instrument was never the
            constraint; the calendar was.
          </p>
          <p>
            The corollary is that the useful measurement interval is not the one you feel like taking. It
            is the threshold divided by your expected rate, rounded up, and it is worth writing on the
            calendar rather than deciding week to week.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: eight bodies, the winner each time</h2>
          <p>
            Same slop assumptions throughout — half a centimetre per circumference, one millimetre per
            pinch, half a centimetre of height, 1.5 points of device noise, one reading per site. The
            winner is the smallest repeat spread.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Body</span>
              <b>Tape % / caliper %</b>
              <b>Spread, tape / caliper</b>
              <b>Winner, and what it can see</b>
            </div>
            {[
              ["Lean man, 28, 180 cm, 72 kg", "9.2 / 7.3", "0.68 / 0.55", "Caliper — 1.51 pts, versus 1.89 on the tape"],
              ["Average man, 34, 175 cm, 78 kg", "17.0 / 13.2", "0.57 / 0.52", "Caliper — 1.44 pts, versus 1.58 on the tape"],
              ["Very lean man, 25, 183 cm, 70 kg", "5.7 / 4.4", "0.74 / 0.56", "Caliper — 1.55 pts, versus 2.05 on the tape"],
              ["Larger man, 45, 178 cm, 100 kg", "26.8 / 24.0", "0.43 / 0.46", "Tape — 1.20 pts, versus 1.27 on the caliper"],
              ["Lean woman, 29, 165 cm, 58 kg", "19.6 / 15.8", "0.52 / 0.63", "Tape — 1.43 pts, versus 1.74 on the caliper"],
              ["Average woman, 34, 162 cm, 65 kg", "27.5 / 21.7", "0.47 / 0.59", "Tape — 1.30 pts, versus 1.63 on the caliper"],
              ["Very lean woman, 26, 168 cm, 55 kg", "16.5 / 12.3", "0.53 / 0.65", "Tape — 1.47 pts, versus 1.80 on the caliper"],
              ["Larger woman, 48, 160 cm, 85 kg", "42.1 / 34.3", "0.39 / 0.48", "Tape — 1.09 pts, versus 1.32 on the caliper"],
            ].map((row) => (
              <div className="chart-row chart-row-wide" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            The split is three to one by sex, and it is produced entirely by the two denominators: the
            Navy equation divides by a circumference difference or sum that is large on women, so women get
            more tape for the same slop, while the three-site equation is slightly more sensitive per
            millimetre on women. Notice also that the gap between the two methods is small everywhere —
            between 6 and 25 percent — which is the strongest argument on this page for spending your effort
            on repeats rather than on choosing.
          </p>
        </section>

        <section className="content-block">
          <h2>The decision rule: which method for which job</h2>
          <p>
            Every row below is answered by the arithmetic above rather than by preference. Where the honest
            answer is &ldquo;this page cannot tell you,&rdquo; it says so.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>What you need</span>
              <b>What the arithmetic selects</b>
              <span>The number that decides it</span>
              <span>What to ignore</span>
            </div>
            {[
              [
                "A number you can repeat every week",
                "Whichever of tape or caliper you can do at 0.5 cm or 1 mm",
                "Visible change 1.58 / 1.44 pts at one reading; 0.91 / 0.83 at three",
                "Which one is 'more accurate' in the abstract",
              ],
              [
                "To see a one-point change",
                "Either, with three readings per site",
                "Readings needed: 3 for tape, 3 for caliper, 18 for a 1.5-pt device",
                "Buying a better instrument",
              ],
              [
                "You are a woman, or carrying more mass",
                "The tape",
                "Tape wins in 4 of 4 female profiles and on the largest man",
                "The assumption that a caliper is always the upgrade",
              ],
              [
                "You are a lean man",
                "The caliper, if you can pinch to 1 mm",
                "Break-even is 1.09 mm at 0.5 cm of tape slop",
                "A caliper you cannot repeat",
              ],
              [
                "Cheapest possible monthly check",
                "The tape, twice per site, on a fixed schedule",
                "Two readings erase the tape/caliper gap entirely",
                "Anything that costs money",
              ],
              [
                "A number to compare against a chart or a standard",
                "None of these; the comparison is not supported",
                "This page quantifies repeatability only, not agreement with a reference",
                "Any claim that a home method is 'accurate to X%'",
              ],
              [
                "A clinical or official requirement",
                "The method the organisation specifies",
                "Not a home method, at any level of care",
                "Everything on this page",
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
        </section>

        <section className="content-block">
          <h2>Doing it: the steps that decide your number</h2>
          <p>
            The point of a protocol is not tidiness; every step below removes one of the σ terms in the
            equation at the top of this page. This is the short version — the{" "}
            <a href="/how-to-measure-body-fat-at-home">longer at-home guide</a> covers the same ground with
            more on each instrument.
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              <b>Mark the landmark once, with a washable pen, and measure to the mark every time.</b> Moving
              the landmark by a centimetre is indistinguishable from your body changing, and it is the one
              error that never averages away because it is systematic within a session.
            </li>
            <li>
              <b>Tape: waist at the level of the navel, neck just below the larynx, hip at the widest part
              of the seat — tape level all the way round, snug but not compressing.</b> Take the reading at
              the same point in the breath every time; if you hold a breath in, the circumference you
              measure is not the one you measured last month.
            </li>
            <li>
              <b>Caliper, men: a diagonal fold halfway between the nipple and the armpit crease; a vertical
              fold two centimetres beside the navel; a vertical fold halfway up the front of the thigh.</b>{" "}
              Women: a vertical fold at the back of the upper arm, halfway between shoulder and elbow; a
              diagonal fold just above the hip bone along the natural crease; the same thigh fold.
            </li>
            <li>
              <b>Lift skin and the fat under it, let the muscle drop away, and read at the same count every
              time.</b> The fold compresses while you hold it, so a reading taken at one second and a
              reading taken at four are different measurements of the same body.
            </li>
            <li>
              <b>Two readings at every site, every session, and rotate the sites so no site is measured
              twice in a row.</b> Per the table above this is the cheapest improvement available and it
              beats every equipment change on the page.
            </li>
            <li>
              <b>Fix the conditions: same time of day, same instrument, same person measuring, and not
              immediately after training, a sauna, a long flight or a salty meal.</b> Each of those changes
              the thing you are measuring rather than the measurement.
            </li>
            <li>
              <b>Measure on the schedule the arithmetic gives you, not when you feel like it.</b> Threshold
              divided by your expected rate: three months at half a point a month, one and a half at one
              point a month.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Where this page&apos;s arithmetic stops being true</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              <b>Everything here is repeatability, not accuracy.</b> The tables say how steadily a method
              reports <i>its own</i> number. They say nothing about how close that number is to your true
              body fat, and this page has no reference measurement to compare against, so it makes no claim
              of that kind anywhere.
            </li>
            <li>
              <b>The published equations carry their own error, which is not in any of these numbers.</b>{" "}
              The Navy, Jackson-Pollock and BMI equations were fitted on particular populations; how far
              they sit from you is a separate question this page cannot quantify. Every σ above is the part
              you add on top of that, not the total.
            </li>
            <li>
              <b>Averaging shrinks random wobble and nothing else.</b> A landmark you consistently place in
              the wrong spot, a tape that is stretched, or a caliper that is out of calibration produce the
              same wrong number every time, and the √<i>n</i> improvement does not touch them.
            </li>
            <li>
              <b>Your slop figures are estimates until you measure them.</b> The defaults are placeholders.
              To get the real ones: take three readings at each site in one session, twice in a week, and
              use the spread of those as σ. The calculator is only as good as the numbers you feed it.
            </li>
            <li>
              <b>Independence is assumed.</b> The quadrature sum treats each site&apos;s wobble as
              unrelated to the others. If one bad habit — pulling the tape too tight, say — affects every
              circumference in the same direction, the true spread is larger than what is shown here, not
              smaller.
            </li>
            <li>
              <b>The BMI equation row is not a recommendation.</b> It wins on repeatability because it
              contains almost no information about you. Small spread and small error are different things,
              and only the first is computed here.
            </li>
            <li>
              <b>The device row is your figure, not a measured one.</b> No device was tested for this page.
              The 1.5-point default is a placeholder for whatever your own scale does from day to day.
            </li>
            <li>
              None of this is medical advice. See the <a href="/disclaimer">disclaimer</a>.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Best way to measure body fat: questions</h2>
          <div className="mini-faq">
            <details>
              <summary>What is the best way to measure body fat at home?</summary>
              <p>
                The one you can repeat most closely, and for most people that is decided by their own hands
                rather than by the instrument. At half a centimetre of tape slop and one millimetre of pinch
                the two are within nine percent of each other on the reference man, and two readings per
                site erase the difference entirely. Pick one, mark your landmarks, take two readings at
                every site, and measure on a fixed schedule.
              </p>
            </details>
            <details>
              <summary>Is a caliper more accurate than a tape measure?</summary>
              <p>
                Not automatically. Per the break-even table, a caliper only beats a tape at half a
                centimetre of tape slop if you can repeat a pinch to 1.09 mm on a man and 0.80 mm on a
                woman. Below that quality the tape is the more repeatable instrument, and for most women
                the tape wins at every realistic pinch quality because the Navy equation&apos;s denominator
                is large.
              </p>
            </details>
            <details>
              <summary>How much does body fat have to change before I can be sure?</summary>
              <p>
                It depends on your own repeatability, which is what the calculator above is for. At the
                defaults: 1.58 points with a tape on one reading per site, 0.91 with three readings, and
                4.16 with a smart scale carrying 1.5 points of noise. If you want to resolve one point,
                three readings per site with the tape or caliper will do it; eighteen will do it with the
                device.
              </p>
            </details>
            <details>
              <summary>How often should I measure?</summary>
              <p>
                Not more often than the arithmetic justifies. A change is visible once it exceeds 1.96·√2·σ,
                so at a genuine half point a month you need about three months with a tape at one reading
                per site, or a little under two at three readings. Measuring weekly against a three-month
                threshold only produces noise.
              </p>
            </details>
            <details>
              <summary>Why do my tape and my caliper disagree by five points?</summary>
              <p>
                Two reasons, and this page can only speak to the second. The equations carry their own
                population-fitted error, which this page does not quantify. The repeatability part is
                computed above: a lean man&apos;s tape carries 0.74 points of spread at half a centimetre of
                slop, so some of a five-point gap will be measurement rather than method. Our{" "}
                <a href="/fat-percentage-calculator">three-method page</a> inverts the equations to show
                what disagreement looks like in centimetres and millimetres.
              </p>
            </details>
            <details>
              <summary>Should I buy a smart scale instead?</summary>
              <p>
                As a tracking device, understand what you are buying. A device contributing 1.5 points of
                spread can only resolve a 4.16-point change on single readings, and needs eighteen readings
                per comparison to resolve one point. It is convenient and it produces a daily number; that
                daily number is not a one-point measurement of anything. See our{" "}
                <a href="/best-bmi-scale">spec arithmetic page</a> for what the printed figures are worth.
              </p>
            </details>
            <details>
              <summary>My body fat went up but my weight went down. Is my tape wrong?</summary>
              <p>
                Not necessarily. A tape estimate can move while weight falls if the waist falls more slowly
                than the rest of the body, and the BMI equation moves in lockstep with weight while the tape
                does not see weight at all. Check whether the change exceeds your threshold — 1.58 points
                at the defaults — before concluding either way.
              </p>
            </details>
            <details>
              <summary>Does it matter who takes the measurements?</summary>
              <p>
                Yes, and it is one of the largest effects this page can point at without measuring it. Two
                people place landmarks differently and pull a tape to different tensions, which is a
                systematic difference between sessions rather than a random one, so averaging will not
                remove it. If you can, be measured by the same person every time.
              </p>
            </details>
            <details>
              <summary>Is DEXA or hydrostatic weighing better?</summary>
              <p>
                This page has no numbers on them and will not produce any, because it has not measured
                against them. What can be said from the arithmetic here is structural: any method you use
                only occasionally gives you one reading with no repeatability estimate, so you cannot
                separate a real change from that method&apos;s own spread. A method you can repeat weekly
                answers a different and often more useful question.
              </p>
            </details>
            <details>
              <summary>Which method should a woman use?</summary>
              <p>
                On the numbers above, the tape, in four out of four computed female profiles. The Navy
                equation divides by the sum of waist, hip and neck, so the same half centimetre of slop
                costs a woman less than it costs a man, and the caliper&apos;s per-millimetre sensitivity
                runs slightly higher for women as well. If your tape work is sloppier than about a
                centimetre, the caliper takes over.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/body-fat-calculator">body fat calculator</a> ·{" "}
            <a href="/fat-calculator">error budget for a single method</a> ·{" "}
            <a href="/body-fat-calculator-caliper">3-site versus 7-site skinfold</a> ·{" "}
            <a href="/measure-body-fat-percentage">the smallest change your tape can see</a> ·{" "}
            <a href="/how-to-measure-body-fat-at-home">how to measure body fat at home</a> ·{" "}
            <a href="/fat-percentage-calculator">three methods on one body</a> ·{" "}
            <a href="/navy-body-fat-calculator">Navy body fat calculator</a> ·{" "}
            <a href="/best-bmi-scale">what a scale&apos;s spec sheet is worth</a>
          </p>
          <p>
            <b>Not medical advice.</b> Every figure on this page is arithmetic this page performs by
            differentiating published equations and evaluating them on the numbers you enter. It measures
            repeatability only, not accuracy against any reference, and no instrument was tested for it. See
            our <a href="/disclaimer">disclaimer</a>.
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
