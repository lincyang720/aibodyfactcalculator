"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "metric" | "us";
type Sex = "male" | "female";

const LB = 2.20462;
const CM_PER_IN = 2.54;

// The two reference masses used by the absolute two-point test, in kilograms.
const M1 = 5;
const M2 = 20;

// Reading-to-reading scatter of a single weigh-in, in kilograms.
const SIGMAS = [0.1, 0.2, 0.3, 0.5, 1.0];

// How many weigh-ins you average into a single reading.
const NS = [1, 3, 7, 14];

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

export default function BmiMachinePage() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(34);
  const [height, setHeight] = useState(175); // cm in metric, inches in US
  const [weight, setWeight] = useState(78); // kg in metric, lb in US
  const [bfScale, setBfScale] = useState(22); // body fat the machine reports

  // Test 1: step on holding a known mass.
  const [massA, setMassA] = useState(20);
  const [readA, setReadA] = useState(98.4);

  // Test 2: weigh two known masses on their own.
  const [read1, setRead1] = useState(5.15);
  const [read2, setRead2] = useState(20.45);

  // Test 3: step on the same way in four corners of the room.
  const [cornerHi, setCornerHi] = useState(78.4);
  const [cornerLo, setCornerLo] = useState(77.6);

  // Test 4: repeatability.
  const [sigmaIdx, setSigmaIdx] = useState(2); // 0.3 kg
  const [nIdx, setNIdx] = useState(1); // 3 readings

  // Test 5: drift of one reference mass over time.
  const [driftKg, setDriftKg] = useState(0.2);
  const [driftDays, setDriftDays] = useState(180);

  const heightCm = unit === "us" ? height * CM_PER_IN : height;
  const weightKg = unit === "us" ? weight / LB : weight;
  const massKg = unit === "us" ? massA / LB : massA;
  const readAKg = unit === "us" ? readA / LB : readA;
  const read1Kg = unit === "us" ? read1 / LB : read1;
  const read2Kg = unit === "us" ? read2 / LB : read2;
  const hiKg = unit === "us" ? cornerHi / LB : cornerHi;
  const loKg = unit === "us" ? cornerLo / LB : cornerLo;
  const driftKgMetric = unit === "us" ? driftKg / LB : driftKg;
  const wLabel = unit === "us" ? "lb" : "kg";
  const hLabel = unit === "us" ? "in" : "cm";

  const sigma = SIGMAS[sigmaIdx];
  const n = NS[nIdx];

  const hm = heightCm / 100;
  const ok =
    heightCm > 120 &&
    heightCm < 230 &&
    weightKg > 30 &&
    weightKg < 250 &&
    age > 13 &&
    age < 90 &&
    bfScale > 2 &&
    bfScale < 65 &&
    massKg > 0.5 &&
    massKg < 120 &&
    driftDays > 0;

  const bmi = weightKg / (hm * hm);

  // ---- Test 1: the add-mass test sees slope only -------------------------
  const kA = (readAKg - weightKg) / massKg;
  const gainPct = (kA - 1) * 100;
  const errGainKg = (kA - 1) * weightKg;

  // ---- Test 2: two known masses give slope and intercept -----------------
  const kB = (read2Kg - read1Kg) / (M2 - M1);
  const bB = read1Kg - kB * M1;
  const errTotalKg = kB * weightKg + bB - weightKg;
  const gainPartKg = (kB - 1) * weightKg;
  const offsetPartKg = bB;

  // Error expressed in the units the machine reports.
  const errBmi = errTotalKg / (hm * hm);
  const errGainBmi = errGainKg / (hm * hm);
  const offsetBmi = offsetPartKg / (hm * hm);

  // Distance to the nearest WHO category line, in kilograms.
  let clearance = Infinity;
  let nearestLine = 0;
  for (const b of LINES) {
    const d = Math.abs(weightKg - b * hm * hm);
    if (d < clearance) {
      clearance = d;
      nearestLine = b;
    }
  }

  // ---- Test 3: placement -------------------------------------------------
  const spread = Math.abs(hiKg - loKg);
  const spreadBmi = spread / (hm * hm);
  const bandKg = 5 * hm * hm; // width of the overweight band, BMI 25 to 30
  const bandPct = (spread / bandKg) * 100;
  const riskKg = Math.abs(errTotalKg) + spread;
  const safe = clearance > riskKg;

  // ---- Test 4: repeatability --------------------------------------------
  const se = sigma / Math.sqrt(n);
  const mdc = 1.96 * Math.SQRT2 * se;
  const mdcBmi = mdc / (hm * hm);
  const nForHalf = Math.ceil(((1.96 * Math.SQRT2 * sigma) / 0.5) ** 2);
  const nForFifth = Math.ceil(((1.96 * Math.SQRT2 * sigma) / 0.2) ** 2);
  const daysToSee = mdc / (0.5 / 7); // at half a kilogram per week

  // ---- Can the test itself resolve the error it reports? -----------------
  const testSe = 1.96 * Math.SQRT2 * (sigma / Math.sqrt(n)) * (weightKg / massKg);
  const minGainPct = ((1.96 * Math.SQRT2 * (sigma / Math.sqrt(n))) / massKg) * 100;
  const resolvable = Math.abs(errGainKg) > testSe;

  // ---- Test 5: drift ------------------------------------------------------
  const driftPerDay = driftKgMetric / driftDays;
  const daysPerBmi = driftPerDay > 0 ? (hm * hm) / driftPerDay : Infinity;
  const yearsPerBmi = daysPerBmi / 365;
  const daysToCross = driftPerDay > 0 ? clearance / driftPerDay : Infinity;

  // ---- The shared sensor: one weight feeds both numbers -------------------
  const perKgBmi = 1 / (hm * hm);
  const perKgBf = (100 * (1 - bfScale / 100)) / weightKg;
  const perCmBmi = (2 * bmi * 0.01) / hm;
  const perCmBf = (100 * (1 - bfScale / 100) * 2 * 0.01) / hm;

  function switchUnit(next: Unit) {
    if (next === unit) return;
    setHeight(next === "us" ? Math.round(heightCm / CM_PER_IN) : Math.round(heightCm));
    setWeight(next === "us" ? Math.round(weightKg * LB) : Math.round(weightKg));
    setMassA(next === "us" ? Math.round(massKg * LB) : Math.round(massKg));
    setReadA(next === "us" ? Math.round(readAKg * LB) : Math.round(readAKg));
    setRead1(next === "us" ? Math.round(read1Kg * LB) : Math.round(read1Kg));
    setRead2(next === "us" ? Math.round(read2Kg * LB) : Math.round(read2Kg));
    setCornerHi(next === "us" ? Math.round(hiKg * LB) : Math.round(hiKg));
    setCornerLo(next === "us" ? Math.round(loKg * LB) : Math.round(loKg));
    setDriftKg(next === "us" ? +(driftKgMetric * LB).toFixed(2) : +driftKgMetric.toFixed(2));
    setUnit(next);
  }

  function reset() {
    setSex("male");
    setAge(34);
    setBfScale(22);
    setMassA(20);
    setReadA(98.4);
    setRead1(5.15);
    setRead2(20.45);
    setCornerHi(78.4);
    setCornerLo(77.6);
    setSigmaIdx(2);
    setNIdx(1);
    setDriftKg(0.2);
    setDriftDays(180);
  }

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/body-fat-calculator">Body Fat %</a>
          <a href="/bmi-calculator">BMI</a>
          <a href="/scale-bmi">Smart Scales</a>
          <a href="/measure-body-fat-percentage">Measure</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">BMI MACHINE · FIVE HOME TESTS</div>
        <h1>BMI Machine: Five Tests for the One You Already Own</h1>
        <p className="tool-lede">
          A BMI machine measures exactly one physical quantity: your weight. It divides that by a height you
          typed in once, and everything else on the display is computed from the same two numbers. So there
          are only two ways it can be wrong about your weight — a <b>gain</b> error, which multiplies with
          how heavy you are, and an <b>offset</b> error, which is the same for everybody — and a home test
          can see the first one only with difficulty and the second one not at all. Below are five tests
          you can run in ten minutes, with the pass and fail thresholds computed rather than guessed. Every
          number on this page is arithmetic performed here; no device was measured and no product is
          named, ranked or reviewed.
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
              <Field label={`Height stored in the machine (${hLabel})`}>
                <input type="number" min={1} value={height} onChange={(e) => setHeight(+e.target.value)} />
              </Field>
              <Field label={`Your weight reading (${wLabel})`}>
                <input type="number" min={1} value={weight} onChange={(e) => setWeight(+e.target.value)} />
              </Field>
              <Field label="Body fat the machine reports (%)">
                <input type="number" min={3} max={60} value={bfScale} onChange={(e) => setBfScale(+e.target.value)} />
              </Field>
              <Field label={`Known mass you add (${wLabel})`}>
                <input type="number" min={1} value={massA} onChange={(e) => setMassA(+e.target.value)} />
              </Field>
              <Field label={`Reading holding it (${wLabel})`}>
                <input type="number" min={1} value={readA} onChange={(e) => setReadA(+e.target.value)} />
              </Field>
              <Field label={`Reading for ${unit === "us" ? "11 lb" : "5 kg"} alone (${wLabel})`}>
                <input type="number" min={0} step={0.01} value={read1} onChange={(e) => setRead1(+e.target.value)} />
              </Field>
              <Field label={`Reading for ${unit === "us" ? "44 lb" : "20 kg"} alone (${wLabel})`}>
                <input type="number" min={0} step={0.01} value={read2} onChange={(e) => setRead2(+e.target.value)} />
              </Field>
              <Field label={`Corner test, high (${wLabel})`}>
                <input type="number" min={1} value={cornerHi} onChange={(e) => setCornerHi(+e.target.value)} />
              </Field>
              <Field label={`Corner test, low (${wLabel})`}>
                <input type="number" min={1} value={cornerLo} onChange={(e) => setCornerLo(+e.target.value)} />
              </Field>
              <Field label="Reading-to-reading scatter">
                <select value={sigmaIdx} onChange={(e) => setSigmaIdx(+e.target.value)}>
                  {SIGMAS.map((s, i) => (
                    <option value={i} key={s}>
                      &plusmn;{s} {wLabel}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Readings you average">
                <select value={nIdx} onChange={(e) => setNIdx(+e.target.value)}>
                  {NS.map((v, i) => (
                    <option value={i} key={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`Reference mass drifted (${wLabel})`}>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={driftKg}
                  onChange={(e) => setDriftKg(+e.target.value)}
                />
              </Field>
              <Field label="Over how many days">
                <input type="number" min={1} value={driftDays} onChange={(e) => setDriftDays(+e.target.value)} />
              </Field>
            </div>
            <button className="calc-button" onClick={reset}>
              Reset to the worked example
            </button>
          </div>

          <div className="answer-card">
            <span>WHAT YOUR MACHINE IS OFF BY, AT YOUR WEIGHT</span>
            <div className="answer-number">
              {ok ? (errTotalKg >= 0 ? "+" : "−") + f(Math.abs(errTotalKg), 2) : "—"}
              <small>
                {wLabel} · {ok ? f(errBmi, 2) + " BMI points" : ""}
              </small>
            </div>
            {ok ? (
              <>
                <p>
                  The two reference masses give a slope of <b>{f(kB, 4)}</b> and an intercept of{" "}
                  <b>{f(offsetPartKg, 2)} {wLabel}</b>. At your weight that splits into{" "}
                  <b>{f(gainPartKg, 2)} {wLabel}</b> of gain error — a <b>{f((kB - 1) * 100, 2)}%</b> slope
                  error that scales with how heavy you are — and <b>{f(offsetPartKg, 2)} {wLabel}</b> of
                  offset, which is the same for every person who steps on it. Your BMI{" "}
                  <b>{f(bmi, 1)}</b> ({bmiClass(bmi)}) is really{" "}
                  <b>{f(bmi - errBmi, 2)}–{f(bmi, 2)}</b> once the machine error is taken out.
                </p>
                <p>
                  The nearest category line is BMI <b>{nearestLine}</b>, which sits{" "}
                  <b>{f(clearance, 2)} {wLabel}</b> away. Machine error plus placement spread is{" "}
                  <b>{f(riskKg, 2)} {wLabel}</b>, so your category is{" "}
                  <b>{safe ? "safe" : "at risk"}</b> —{" "}
                  {safe
                    ? "the error cannot move you across the line."
                    : "the error is wide enough to flip which category you land in."}
                </p>
                <p>
                  <b>Can the test see that?</b> The add-mass test says{" "}
                  <b>{f(gainPct, 2)}%</b> gain, or <b>{f(errGainKg, 2)} {wLabel}</b> at your weight, but its
                  own noise is <b>&plusmn;{f(testSe, 2)} {wLabel}</b>.{" "}
                  {resolvable
                    ? "The error is bigger than the noise, so it is real enough to act on."
                    : "The error is smaller than the test's own noise, so you cannot conclude anything from it — use a heavier reference mass or average more readings."}{" "}
                  At {n} reading{n === 1 ? "" : "s"} per weigh-in the smallest gain error this test can
                  detect is <b>{f(minGainPct, 2)}%</b>. Remember that the add-mass test is blind to the
                  offset: a machine that reads half a kilogram high on everything passes it perfectly.
                </p>
                <p>
                  <b>Placement.</b> A <b>{f(spread, 2)} {wLabel}</b> corner-to-corner spread is{" "}
                  <b>{f(spreadBmi, 3)} BMI points</b>, or <b>{f(bandPct, 1)}%</b> of the whole overweight
                  band ({f(bandKg, 2)} {wLabel} wide at your height).{" "}
                  <b>Repeatability.</b> At &plusmn;{sigma} {wLabel} and {n} reading
                  {n === 1 ? "" : "s"}, the smallest change you can call real is{" "}
                  <b>{f(mdc, 2)} {wLabel}</b> ({f(mdcBmi, 3)} BMI points); at half a kilogram a week that
                  takes <b>{f(daysToSee, 1)} days</b> of real loss before the machine can see it. You would
                  need <b>{nForHalf}</b> readings to resolve 0.5 {wLabel} and <b>{nForFifth}</b> to resolve
                  0.2 {wLabel}.
                </p>
                <p>
                  <b>Drift.</b> At <b>{f(driftKgMetric, 2)} {wLabel}</b> over {driftDays} days the sensor
                  is moving <b>{f(driftPerDay, 5)} {wLabel}/day</b>, which is one BMI point every{" "}
                  <b>{f(yearsPerBmi, 1)} years</b> and would take <b>{f(daysToCross / 365, 1)} years</b> to
                  carry you across the nearest category line on its own.
                </p>
                <p>
                  <b>One sensor, two numbers.</b> Every {wLabel} of weight error moves BMI by{" "}
                  <b>{f(perKgBmi, 3)}</b> and the body fat reading by <b>{f(perKgBf, 2)} points</b>; every{" "}
                  {hLabel} of height error moves BMI by <b>{f(perCmBmi, 3)}</b> and body fat by{" "}
                  <b>{f(perCmBf, 2)} points</b>. The two displayed numbers are not independent checks on
                  each other — they share the same measurement, so they fail together.
                </p>
              </>
            ) : (
              <p>
                Enter a height between 120 and 230 cm, a weight between 30 and 250 kg, an age between 14 and
                85, a body fat reading between 3 and 60 percent, and a reference mass above half a kilogram.
              </p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>THE FOUR IDENTITIES EVERY TEST ON THIS PAGE RESTS ON</span>
          <strong>
            Reading = k &middot; true + b &nbsp;&nbsp;→&nbsp;&nbsp; error at weight W = (k − 1)&middot;W + b
            <br />
            ΔBMI = ΔW ÷ H² &nbsp;&nbsp;and&nbsp;&nbsp; ΔBMI = 2&middot;BMI&middot;(ΔH ÷ H)
            <br />
            ΔBF (points) = 100&middot;(1 − BF)&middot;(relative error in fat-free mass)
          </strong>
          <small>
            The first line is the whole machine: a straight line with a slope and an intercept. A slope error
            is a percentage, so it grows with the person standing on it; an intercept error is a constant, so
            a big and a small person pay the same. The second line is exact calculus on the BMI definition —
            weight error divides by height squared, height error is doubled because height is squared and sits
            in the denominator. The third line is the structural fact behind every body fat number the display
            prints: fat-free mass is a measured quantity divided by an assumed constant, so a relative error
            anywhere in that chain moves the reported body fat in proportion to your remaining lean fraction.
            Every table below is this page evaluating those identities. None of it is copied from anywhere,
            and none of it involves measuring a device.
          </small>
        </div>

        <section className="content-block">
          <h2>The short answer</h2>
          <p>
            You cannot calibrate a bathroom machine against a laboratory standard at home, and this page will
            not pretend otherwise. What you can do is find out whether yours behaves like a straight line,
            whether that line has the right slope, where in the room it agrees with itself, how much it
            disagrees with itself from minute to minute, and whether it is slowly moving. Those five answers
            decide what the display is worth.
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              <b>There are only two ways the weight can be wrong.</b> A gain error is a percentage and scales
              with you — a 2 percent slope error is 1.56 kg at 78 kg and 0.98 kg at 49 kg. An offset is
              fixed — 0.05 kg is 0.05 kg whether you weigh 45 or 120 kg.
            </li>
            <li>
              <b>The easy home test is blind to half the problem.</b> Stepping on holding a known weight
              measures the slope only. A machine that reads two kilograms high on everything passes it
              perfectly, which is why the two-mass test exists.
            </li>
            <li>
              <b>The test is noisier than the error it is looking for.</b> With a 20 kg reference mass,
              0.3 kg of reading scatter and three weigh-ins averaged into each reading, the smallest gain
              error you can detect is 2.4 percent — nearly five times the 0.5 percent error that already
              costs 0.39 kg at 78 kg.
            </li>
            <li>
              <b>Where the machine stands matters more than people think.</b> At 1.70 m the overweight band
              is 14.45 kg wide, so a 2 kg corner-to-corner spread eats 13.8 percent of an entire category.
            </li>
            <li>
              <b>Drift is slow, and that is good news.</b> Even a sensor creeping 0.5 kg a year needs 5.8
              years at 1.70 m to move your BMI by one point. Re-test once a year, not once a month.
            </li>
          </ul>
          <p>
            If you only run one test, run the corner test. It takes ninety seconds, it needs no reference
            mass, and a spread above half a kilogram means every other number on this page is being measured
            on a moving target.
          </p>
        </section>

        <section className="content-block">
          <h2>What the machine measures and what it merely computes</h2>
          <p>
            The table below maps each field a typical body composition scale can display to the inputs it
            actually depends on. Only the first row is measured. Everything below it is arithmetic performed
            on that one measurement plus whatever you typed in at setup. This matters because the errors
            inherit: a fault in row one appears in every row beneath it, and no amount of extra decimal
            places further down can remove it.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Displayed field</span>
              <span>Comes from</span>
              <span>Main error source</span>
              <span>What it inherits</span>
            </div>
            <div className="chart-row chart-row-wide">
              <b>Weight</b>
              <span>four load cells</span>
              <span>gain, offset, placement, drift</span>
              <strong>Nothing. This is the only measurement in the building.</strong>
            </div>
            <div className="chart-row chart-row-wide">
              <b>BMI</b>
              <span>weight ÷ height²</span>
              <span>the height you typed once</span>
              <strong>All of the weight error, divided by height squared.</strong>
            </div>
            <div className="chart-row chart-row-wide">
              <b>BMI category</b>
              <span>the BMI number, cut at fixed lines</span>
              <span>same, amplified near a line</span>
              <strong>Everything above, plus the risk of landing on the wrong side of a boundary.</strong>
            </div>
            <div className="chart-row chart-row-wide">
              <b>Body fat %</b>
              <span>impedance → water → fat-free mass</span>
              <span>hydration, electrode contact, the assumed constants</span>
              <strong>The weight error again, plus a much larger model error on top.</strong>
            </div>
            <div className="chart-row chart-row-wide">
              <b>Fat mass / lean mass</b>
              <span>weight × body fat %</span>
              <span>both of the above, multiplied</span>
              <strong>Weight error and body fat error together, in the same direction.</strong>
            </div>
            <div className="chart-row chart-row-wide">
              <b>Water %, muscle %, bone mass</b>
              <span>the same fat-free mass, split by assumed ratios</span>
              <span>the assumed ratios</span>
              <strong>Every error above, now wearing a different label.</strong>
            </div>
            <div className="chart-row chart-row-wide">
              <b>Visceral rating, metabolic age</b>
              <span>the estimated body fat, with more assumptions</span>
              <span>the extra assumptions</span>
              <strong>Everything, at the end of the longest chain on the device.</strong>
            </div>
          </div>
          <p>
            The practical consequence: if the weight is wrong, every other row is wrong, and they are wrong
            in a correlated way. Two numbers that agree with each other on the same machine is not evidence
            that either is right.
          </p>
        </section>

        <section className="content-block">
          <h2>Test 1 — the add-mass test, which sees the slope</h2>
          <p>
            Weigh yourself, then weigh yourself holding something whose mass you know: a dumbbell, a case of
            water, a bag of flour with the weight printed on it. The reading should rise by exactly that
            mass. The ratio of what the machine saw to what you added is the slope, k = (reading with the
            mass − reading without) ÷ mass, and a slope of 1.0200 means the machine over-reads by 2 percent.
          </p>
          <p>
            Because a percentage of a bigger number is a bigger number, the same slope error costs a heavy
            person more kilograms than a light one. The table below is (k − 1) × weight, computed at five
            body weights and five slope errors.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Your weight</span>
              <b>+0.1%</b>
              <b>+0.25%</b>
              <b>+0.5%</b>
              <b>+1%</b>
              <b>+2%</b>
            </div>
            <div className="chart-row chart-row-six">
              <span>50 kg</span>
              <span>0.05 kg</span>
              <span>0.13 kg</span>
              <span>0.25 kg</span>
              <span>0.50 kg</span>
              <span>1.00 kg</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>65 kg</span>
              <span>0.07 kg</span>
              <span>0.16 kg</span>
              <span>0.33 kg</span>
              <span>0.65 kg</span>
              <span>1.30 kg</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>80 kg</span>
              <span>0.08 kg</span>
              <span>0.20 kg</span>
              <span>0.40 kg</span>
              <span>0.80 kg</span>
              <span>1.60 kg</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>95 kg</span>
              <span>0.10 kg</span>
              <span>0.24 kg</span>
              <span>0.48 kg</span>
              <span>0.95 kg</span>
              <span>1.90 kg</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>110 kg</span>
              <span>0.11 kg</span>
              <span>0.28 kg</span>
              <span>0.55 kg</span>
              <span>1.10 kg</span>
              <span>2.20 kg</span>
            </div>
          </div>
          <p>
            Divide by height squared to get the same error in the units the machine reports. At 1.70 m, where
            one BMI point is 2.89 kg, the identical table reads:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Your weight</span>
              <b>+0.1%</b>
              <b>+0.25%</b>
              <b>+0.5%</b>
              <b>+1%</b>
              <b>+2%</b>
            </div>
            <div className="chart-row chart-row-six">
              <span>50 kg</span>
              <span>0.017</span>
              <span>0.043</span>
              <span>0.087</span>
              <span>0.173</span>
              <span>0.346</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>65 kg</span>
              <span>0.022</span>
              <span>0.056</span>
              <span>0.112</span>
              <span>0.225</span>
              <span>0.450</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>80 kg</span>
              <span>0.028</span>
              <span>0.069</span>
              <span>0.138</span>
              <span>0.277</span>
              <span>0.554</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>95 kg</span>
              <span>0.033</span>
              <span>0.082</span>
              <span>0.164</span>
              <span>0.329</span>
              <span>0.657</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>110 kg</span>
              <span>0.038</span>
              <span>0.095</span>
              <span>0.190</span>
              <span>0.381</span>
              <span>0.761</span>
            </div>
          </div>
          <p>
            Note what is <i>not</i> in this test: any constant. If the machine reads 1.5 kg high on
            everything, the difference between two readings is still exactly right, and the test reports a
            perfect slope of 1.0000. That is the blind spot this test has, and it is why it cannot stand
            alone.
          </p>
        </section>

        <section className="content-block">
          <h2>Test 2 — two known masses, which sees the slope and the offset</h2>
          <p>
            Put one known mass on the machine and read it, then a second, larger one. Two points fix a
            straight line completely: the slope comes from the difference of the two readings, and the
            intercept — the amount the machine reports when nothing is on it — falls out of either point.
            Once you have both, you can predict the machine&apos;s error at any body weight as
            (k − 1) × W + b.
          </p>
          <p>
            The offset is the more interesting of the two, because it does not scale with the person. It is
            the same number of kilograms for a 45 kg teenager and a 120 kg adult, which means it is worth
            more BMI points to the shorter and lighter one. The table is b ÷ height², in BMI points.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Height</span>
              <b>+0.1 kg</b>
              <b>+0.2 kg</b>
              <b>+0.5 kg</b>
              <b>+1.0 kg</b>
              <b>+2.0 kg</b>
            </div>
            <div className="chart-row chart-row-six">
              <span>150 cm</span>
              <span>0.044</span>
              <span>0.089</span>
              <span>0.222</span>
              <span>0.444</span>
              <span>0.889</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>160 cm</span>
              <span>0.039</span>
              <span>0.078</span>
              <span>0.195</span>
              <span>0.391</span>
              <span>0.781</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>170 cm</span>
              <span>0.035</span>
              <span>0.069</span>
              <span>0.173</span>
              <span>0.346</span>
              <span>0.692</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>180 cm</span>
              <span>0.031</span>
              <span>0.062</span>
              <span>0.154</span>
              <span>0.309</span>
              <span>0.617</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>190 cm</span>
              <span>0.028</span>
              <span>0.055</span>
              <span>0.139</span>
              <span>0.277</span>
              <span>0.554</span>
            </div>
          </div>
          <p>
            The conversion factor behind that table is worth memorising, because it turns every kilogram on
            this page into something you can compare against a category boundary.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-quad">
              <span>Height</span>
              <b>kg per BMI point</b>
              <b>lb per BMI point</b>
              <b>BMI points per kg</b>
            </div>
            <div className="chart-row chart-row-quad">
              <span>150 cm</span>
              <span>2.25</span>
              <span>4.96</span>
              <span>0.444</span>
            </div>
            <div className="chart-row chart-row-quad">
              <span>160 cm</span>
              <span>2.56</span>
              <span>5.64</span>
              <span>0.391</span>
            </div>
            <div className="chart-row chart-row-quad">
              <span>170 cm</span>
              <span>2.89</span>
              <span>6.37</span>
              <span>0.346</span>
            </div>
            <div className="chart-row chart-row-quad">
              <span>180 cm</span>
              <span>3.24</span>
              <span>7.14</span>
              <span>0.309</span>
            </div>
            <div className="chart-row chart-row-quad">
              <span>190 cm</span>
              <span>3.61</span>
              <span>7.96</span>
              <span>0.277</span>
            </div>
          </div>
          <p>
            A worked example, the one the calculator is loaded with: the machine reads 5.15 kg for a 5 kg
            mass and 20.45 kg for a 20 kg mass. The slope is 15.30 ÷ 15 = 1.0200 and the intercept is
            5.15 − 1.0200 × 5 = 0.05 kg. At 78 kg that is 1.56 kg of gain error plus 0.05 kg of offset, so
            1.61 kg — 0.53 BMI points at 1.75 m, against a 1.44 kg gap to the BMI 25 line. The gain error
            alone is already enough to move the category.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: how big an error your test can actually see</h2>
          <p>
            This is the part that decides whether the tests above are worth doing, and the answer is less
            encouraging than the tests themselves. Both tests work out a slope from the <i>difference</i> of
            two readings, and each reading carries the machine&apos;s own scatter. The difference of two
            readings has that scatter multiplied by the square root of two, and dividing by the reference
            mass turns it into a slope.
          </p>
          <p>
            So there is a floor: a gain error smaller than 1.96 × √2 × (scatter ÷ √readings) ÷ mass is
            invisible. The table below is that floor in percent, computed for a single reading at each point
            and five reference masses.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Scatter</span>
              <b>5 kg mass</b>
              <b>10 kg mass</b>
              <b>20 kg mass</b>
              <b>40 kg mass</b>
              <b>60 kg mass</b>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;0.05 kg</span>
              <span>2.77%</span>
              <span>1.39%</span>
              <span>0.69%</span>
              <span>0.35%</span>
              <span>0.23%</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;0.1 kg</span>
              <span>5.54%</span>
              <span>2.77%</span>
              <span>1.39%</span>
              <span>0.69%</span>
              <span>0.46%</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;0.2 kg</span>
              <span>11.09%</span>
              <span>5.54%</span>
              <span>2.77%</span>
              <span>1.39%</span>
              <span>0.92%</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;0.5 kg</span>
              <span>27.72%</span>
              <span>13.86%</span>
              <span>6.93%</span>
              <span>3.47%</span>
              <span>2.31%</span>
            </div>
          </div>
          <p>
            Read that against the first table. A 0.5 percent slope error costs a 78 kg person 0.39 kg, which
            is the kind of error that matters at the edge of a category. With a 20 kg dumbbell and 0.1 kg of
            scatter, the smallest error you can detect is 1.39 percent — nearly three times too coarse. The
            error you care about and the error you can see are different sizes, and the fix is a heavier
            reference mass, not a better scale.
          </p>
          <p>
            The second consequence is that the test&apos;s own uncertainty is amplified by how far your body
            weight sits from the reference mass. The inferred error is (k − 1) × your weight, so the noise
            in k gets multiplied by your weight and divided by the mass. The table is the resulting
            uncertainty in kilograms, per 0.1 kg of reading scatter, at one reading each.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Your weight</span>
              <b>5 kg mass</b>
              <b>10 kg mass</b>
              <b>20 kg mass</b>
              <b>40 kg mass</b>
              <b>60 kg mass</b>
            </div>
            <div className="chart-row chart-row-six">
              <span>50 kg</span>
              <span>1.41 kg</span>
              <span>0.71 kg</span>
              <span>0.35 kg</span>
              <span>0.18 kg</span>
              <span>0.12 kg</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>65 kg</span>
              <span>1.84 kg</span>
              <span>0.92 kg</span>
              <span>0.46 kg</span>
              <span>0.23 kg</span>
              <span>0.15 kg</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>80 kg</span>
              <span>2.26 kg</span>
              <span>1.13 kg</span>
              <span>0.57 kg</span>
              <span>0.28 kg</span>
              <span>0.19 kg</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>95 kg</span>
              <span>2.69 kg</span>
              <span>1.34 kg</span>
              <span>0.67 kg</span>
              <span>0.34 kg</span>
              <span>0.22 kg</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>110 kg</span>
              <span>3.11 kg</span>
              <span>1.56 kg</span>
              <span>0.78 kg</span>
              <span>0.39 kg</span>
              <span>0.26 kg</span>
            </div>
          </div>
          <p>
            A third problem appears if you run the two-mass test with small weights and then apply the
            resulting line at body weight. That is an extrapolation, and extrapolation amplifies noise. With
            the line built from 5 kg and 5 + s kg, the reading noise at the two calibration points is
            re-combined with weights (1 − t) and t, where t = (your weight − 5) ÷ s. The amplification
            factor is the square root of the sum of those squared weights:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Your weight</span>
              <b>s = 5 kg</b>
              <b>s = 10 kg</b>
              <b>s = 15 kg</b>
              <b>s = 20 kg</b>
              <b>s = 40 kg</b>
            </div>
            <div className="chart-row chart-row-six">
              <span>50 kg</span>
              <span>12.04&times;</span>
              <span>5.70&times;</span>
              <span>3.61&times;</span>
              <span>2.57&times;</span>
              <span>1.13&times;</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>65 kg</span>
              <span>16.28&times;</span>
              <span>7.81&times;</span>
              <span>5.00&times;</span>
              <span>3.61&times;</span>
              <span>1.58&times;</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>80 kg</span>
              <span>20.52&times;</span>
              <span>9.92&times;</span>
              <span>6.40&times;</span>
              <span>4.65&times;</span>
              <span>2.07&times;</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>95 kg</span>
              <span>24.76&times;</span>
              <span>12.04&times;</span>
              <span>7.81&times;</span>
              <span>5.70&times;</span>
              <span>2.57&times;</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>110 kg</span>
              <span>29.00&times;</span>
              <span>14.16&times;</span>
              <span>9.22&times;</span>
              <span>6.75&times;</span>
              <span>3.09&times;</span>
            </div>
          </div>
          <p>
            Calibrating with a 5 kg and a 10 kg weight and then applying the line at 80 kg multiplies the
            reading noise by 20.5. That is not a test, it is an amplifier. The add-mass test avoids this
            entirely, because it measures the slope right where you stand — which is the strongest argument
            for owning one heavy reference mass rather than a set of light ones.
          </p>
        </section>

        <section className="content-block">
          <h2>Test 3 — placement: move the machine, not yourself</h2>
          <p>
            Four load cells share your weight, and how they share it depends on where your feet are and what
            is under the device. Put the machine on a hard, level floor, weigh yourself four times in the
            same spot, then move it to a different spot and repeat. The corner-to-corner spread is the
            placement error, and unlike the reading scatter it does not shrink when you average, because it
            is a fixed property of that spot.
          </p>
          <p>
            To judge a spread, compare it with the width of a category. The overweight band, BMI 25 to 30,
            is five BMI points wide, which is 5 × height² kilograms. The table is the spread as a percentage
            of that band.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Height</span>
              <b>0.1 kg</b>
              <b>0.2 kg</b>
              <b>0.5 kg</b>
              <b>1.0 kg</b>
              <b>2.0 kg</b>
            </div>
            <div className="chart-row chart-row-six">
              <span>150 cm (band 11.25 kg)</span>
              <span>0.9%</span>
              <span>1.8%</span>
              <span>4.4%</span>
              <span>8.9%</span>
              <span>17.8%</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>160 cm (band 12.80 kg)</span>
              <span>0.8%</span>
              <span>1.6%</span>
              <span>3.9%</span>
              <span>7.8%</span>
              <span>15.6%</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>170 cm (band 14.45 kg)</span>
              <span>0.7%</span>
              <span>1.4%</span>
              <span>3.5%</span>
              <span>6.9%</span>
              <span>13.8%</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>180 cm (band 16.20 kg)</span>
              <span>0.6%</span>
              <span>1.2%</span>
              <span>3.1%</span>
              <span>6.2%</span>
              <span>12.3%</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>190 cm (band 18.05 kg)</span>
              <span>0.6%</span>
              <span>1.1%</span>
              <span>2.8%</span>
              <span>5.5%</span>
              <span>11.1%</span>
            </div>
          </div>
          <p>
            A working rule that follows from the table: a spread above half a kilogram is worth chasing,
            because at 1.70 m it is 3.5 percent of a whole category and it will not average away. Carpet,
            tiles with a grout line under one foot, and a machine stored leaning against a wall are the
            usual causes. Fix the spot once and leave the machine there.
          </p>
        </section>

        <section className="content-block">
          <h2>Test 4 — repeatability: how much of a change is real</h2>
          <p>
            Step off, step on, repeat. The scatter you get is the machine&apos;s short-term noise, and it
            sets the smallest change you are allowed to believe. Comparing two weigh-ins means comparing two
            noisy numbers, so the threshold is 1.96 × √2 × (scatter ÷ √readings) — the √2 because there are
            two readings in the comparison, and the √readings because averaging shrinks random scatter.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Scatter</span>
              <b>1 reading</b>
              <b>3 readings</b>
              <b>7 readings</b>
              <b>14 readings</b>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;0.1 kg</span>
              <span>0.28 kg</span>
              <span>0.16 kg</span>
              <span>0.10 kg</span>
              <span>0.07 kg</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;0.2 kg</span>
              <span>0.55 kg</span>
              <span>0.32 kg</span>
              <span>0.21 kg</span>
              <span>0.15 kg</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;0.3 kg</span>
              <span>0.83 kg</span>
              <span>0.48 kg</span>
              <span>0.31 kg</span>
              <span>0.22 kg</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;0.5 kg</span>
              <span>1.39 kg</span>
              <span>0.80 kg</span>
              <span>0.52 kg</span>
              <span>0.37 kg</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;1.0 kg</span>
              <span>2.77 kg</span>
              <span>1.60 kg</span>
              <span>1.05 kg</span>
              <span>0.74 kg</span>
            </div>
          </div>
          <p>
            Turned into time: if you are genuinely losing half a kilogram a week, how long until the loss is
            bigger than what the machine can resolve?
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Scatter</span>
              <b>1 reading</b>
              <b>3 readings</b>
              <b>7 readings</b>
              <b>14 readings</b>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;0.1 kg</span>
              <span>3.9 days</span>
              <span>2.2 days</span>
              <span>1.5 days</span>
              <span>1.0 days</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;0.2 kg</span>
              <span>7.8 days</span>
              <span>4.5 days</span>
              <span>2.9 days</span>
              <span>2.1 days</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;0.3 kg</span>
              <span>11.6 days</span>
              <span>6.7 days</span>
              <span>4.4 days</span>
              <span>3.1 days</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;0.5 kg</span>
              <span>19.4 days</span>
              <span>11.2 days</span>
              <span>7.3 days</span>
              <span>5.2 days</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>&plusmn;1.0 kg</span>
              <span>38.8 days</span>
              <span>22.4 days</span>
              <span>14.7 days</span>
              <span>10.4 days</span>
            </div>
          </div>
          <p>
            With typical scatter and a single reading, you need roughly eleven days of real progress before
            the machine is entitled to say anything. Three readings a day cuts that to about a week. This is
            the whole argument for averaging: not that it makes the number more accurate, but that it lets
            you hear a real signal sooner.
          </p>
        </section>

        <section className="content-block">
          <h2>Test 5 — drift: is the machine slowly moving</h2>
          <p>
            Keep one known mass and weigh it every few months, writing the reading down. A change in that
            reading is the sensor moving, not you. Drift is expressed in kilograms per year and converted
            into the units that matter by dividing it into the kilograms that make one BMI point.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Height</span>
              <b>0.1 kg/yr</b>
              <b>0.2 kg/yr</b>
              <b>0.5 kg/yr</b>
              <b>1.0 kg/yr</b>
              <b>2.0 kg/yr</b>
            </div>
            <div className="chart-row chart-row-six">
              <span>150 cm</span>
              <span>22.5 yr</span>
              <span>11.2 yr</span>
              <span>4.5 yr</span>
              <span>2.2 yr</span>
              <span>1.1 yr</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>160 cm</span>
              <span>25.6 yr</span>
              <span>12.8 yr</span>
              <span>5.1 yr</span>
              <span>2.6 yr</span>
              <span>1.3 yr</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>170 cm</span>
              <span>28.9 yr</span>
              <span>14.4 yr</span>
              <span>5.8 yr</span>
              <span>2.9 yr</span>
              <span>1.4 yr</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>180 cm</span>
              <span>32.4 yr</span>
              <span>16.2 yr</span>
              <span>6.5 yr</span>
              <span>3.2 yr</span>
              <span>1.6 yr</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>190 cm</span>
              <span>36.1 yr</span>
              <span>18.0 yr</span>
              <span>7.2 yr</span>
              <span>3.6 yr</span>
              <span>1.8 yr</span>
            </div>
          </div>
          <p>
            Two conclusions. First, drift is slow relative to everything else on this page: even a full
            kilogram a year takes nearly three years at 1.70 m to move your BMI by a single point, so an
            annual check is plenty. Second, the units matter — the same drift rate is worth 60 percent more
            time to a tall person, because a BMI point is more kilograms for them.
          </p>
        </section>

        <section className="content-block">
          <h2>One sensor, two numbers: why BMI and body fat fail together</h2>
          <p>
            The most common way people use a body composition scale is as a cross-check: if the BMI and the
            body fat roughly agree, the reading must be right. They cannot disagree in the way you would
            hope, because both are computed from the same weight.
          </p>
          <p>
            Differentiate both. BMI = W ÷ H², so a weight error of one kilogram moves BMI by 1 ÷ H².
            Body fat = 1 − fat-free mass ÷ W, and the fat-free mass comes from impedance, not from the
            scale — so if the weight is wrong and the impedance estimate is held fixed, the reported body fat
            moves by 100 × (1 − BF) ÷ W points per kilogram. The ratio of the two is 100 × (1 − BF) ÷ BMI,
            which depends only on how big and how lean you are:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>BMI</span>
              <b>at 10% fat</b>
              <b>at 20% fat</b>
              <b>at 30% fat</b>
              <b>at 40% fat</b>
            </div>
            <div className="chart-row chart-row-six">
              <span>20</span>
              <span>4.50</span>
              <span>4.00</span>
              <span>3.50</span>
              <span>3.00</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>25</span>
              <span>3.60</span>
              <span>3.20</span>
              <span>2.80</span>
              <span>2.40</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>30</span>
              <span>3.00</span>
              <span>2.67</span>
              <span>2.33</span>
              <span>2.00</span>
            </div>
            <div className="chart-row chart-row-six">
              <span>35</span>
              <span>2.57</span>
              <span>2.29</span>
              <span>2.00</span>
              <span>1.71</span>
            </div>
          </div>
          <p>
            Those are body fat points per BMI point, and they are all positive: the two numbers move in the
            same direction, always. At the calculator&apos;s default body — BMI 25.47, 22 percent — one BMI
            point is worth 3.06 body fat points, and a single kilogram of weight error moves BMI by 0.33 and
            body fat by 1.00 point.
          </p>
          <p>
            The height you typed in behaves the same way, only harder. It enters BMI squared, so
            ΔBMI = 2 × BMI × (ΔH ÷ H). It also enters the impedance chain, because the device estimates body
            water as proportional to height squared — so the same one centimetre error hits the body fat
            number through the fat-free mass as well:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-quad">
              <span>Height</span>
              <b>BMI points per cm</b>
              <b>Body fat points per cm</b>
              <b>Ratio</b>
            </div>
            <div className="chart-row chart-row-quad">
              <span>150 cm</span>
              <span>0.340</span>
              <span>1.040</span>
              <span>3.06&times;</span>
            </div>
            <div className="chart-row chart-row-quad">
              <span>160 cm</span>
              <span>0.318</span>
              <span>0.975</span>
              <span>3.06&times;</span>
            </div>
            <div className="chart-row chart-row-quad">
              <span>170 cm</span>
              <span>0.300</span>
              <span>0.918</span>
              <span>3.06&times;</span>
            </div>
            <div className="chart-row chart-row-quad">
              <span>180 cm</span>
              <span>0.283</span>
              <span>0.867</span>
              <span>3.06&times;</span>
            </div>
            <div className="chart-row chart-row-quad">
              <span>190 cm</span>
              <span>0.268</span>
              <span>0.821</span>
              <span>3.06&times;</span>
            </div>
          </div>
          <p>
            The ratio is constant at 3.06 because it is the same 100 × (1 − BF) ÷ BMI as before — the height
            error is simply routed through both chains at once. One centimetre of wrong height costs a 175 cm
            person 0.29 BMI points and 0.89 body fat points, and no amount of averaging will fix either,
            because it is the same wrong number every morning.
          </p>
        </section>

        <section className="content-block">
          <h2>The five tests, in order</h2>
          <p>
            Run them in this sequence, because each one decides whether the next is worth doing.
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              <b>1. Placement (2 minutes, no equipment).</b> Weigh yourself four times in one spot, move the
              machine, repeat. Keep the spread under 0.5 kg. If it is over, fix the floor before anything
              else — every later test inherits this.
            </li>
            <li>
              <b>2. Repeatability (2 minutes, no equipment).</b> Ten step-off, step-on cycles. Note the
              scatter and use the table to set your own threshold for what counts as a change.
            </li>
            <li>
              <b>3. Add-mass (1 minute, one heavy object).</b> Slope only. Use the heaviest single mass you
              can hold safely — the detection floor falls in direct proportion to it.
            </li>
            <li>
              <b>4. Two masses (2 minutes, two known masses).</b> Slope and offset. Keep the two masses as
              far apart as your objects allow, and remember that applying the result at your body weight is
              an extrapolation if both are small.
            </li>
            <li>
              <b>5. Drift (ongoing).</b> Weigh one reference mass once a year and write the number down.
              Anything under about half a kilogram a year is slower than the other errors on this page.
            </li>
          </ul>
          <p>
            What none of these tests can do is tell you whether the body fat number is right. That number
            depends on impedance, on electrode contact, on your hydration, and on constants the manufacturer
            chose, and there is no household object that checks any of it. Treat it as a trend with a noise
            band, never as a measurement of your tissues.
          </p>
        </section>

        <section className="content-block">
          <h2>Frequently asked questions</h2>
          <div className="mini-faq">
            <details>
              <summary>Is a BMI machine accurate?</summary>
              <p>
                For weight and BMI, usually yes within the limits above: the largest error is typically the
                height you typed in, and one centimetre of it is worth 0.29 BMI points at 175 cm. For body
                fat, the machine is not measuring fat at all — it is measuring how your tissues conduct a
                small current and converting that through assumed constants. This page deliberately gives no
                accuracy figure for that conversion, because it has not measured any device against a
                reference method and a number quoted without a measurement would be invented.
              </p>
            </details>
            <details>
              <summary>What should I use as a known mass?</summary>
              <p>
                Anything with the mass printed on it and no ambiguity about the unit: a dumbbell, a kettlebell,
                a case of bottled water, a bag of rice or flour. Heavier is better — the smallest slope error
                your test can detect is inversely proportional to the mass, so a 20 kg object sees four times
                further than a 5 kg one. Avoid anything whose printed figure is a volume, and check whether
                the package is quoting net or gross.
              </p>
            </details>
            <details>
              <summary>My two tests disagree. Which one is right?</summary>
              <p>
                Probably neither, and that is informative. The add-mass test measures the slope where you
                actually stand, with its noise amplified by your weight divided by the mass. The two-mass
                test measures the slope between 5 and 20 kg and then extrapolates, which amplifies the noise
                further the smaller those masses are. If the difference between the two slopes is larger than
                the uncertainties in the tables above, the most likely explanation is that the machine is not
                a straight line across its range — which is itself a reason not to trust a single correction
                factor.
              </p>
            </details>
            <details>
              <summary>Does it matter where I put the scale?</summary>
              <p>
                Yes, and it is the cheapest error to fix. Four load cells share your weight, and a soft or
                uneven surface changes how they share it. A 2 kg corner-to-corner spread is 13.8 percent of
                the entire overweight band at 1.70 m, and unlike scatter it does not shrink when you average,
                because it is fixed to that spot. Hard, level floor, same spot every time.
              </p>
            </details>
            <details>
              <summary>Why does my body fat jump around when my weight barely moves?</summary>
              <p>
                Because the two numbers come from different places. BMI is arithmetic on the weight and your
                stored height, so it is as stable as the load cells. Body fat comes from impedance, which
                moves with hydration, skin temperature, foot contact and time of day. Our{" "}
                <a href="/scale-bmi">smart scale page</a> prices the hydration part directly, and the
                repeatability tables on this page tell you how much of any jump is noise.
              </p>
            </details>
            <details>
              <summary>Can a BMI machine measure visceral fat?</summary>
              <p>
                No. Visceral fat sits inside the abdominal cavity and a current passed through your feet
                cannot separate it from the fat under your skin. Any visceral rating on the display is the
                estimated body fat number with more assumptions stacked on top. A tape measure at your waist
                is more honest, and our <a href="/visceral-fat-calculator">visceral fat page</a> computes
                exactly what a waist measurement can and cannot support.
              </p>
            </details>
            <details>
              <summary>Should I replace my scale if the tests fail?</summary>
              <p>
                Only after the cheap fixes. Most failures on this page are placement, a height typed in from
                memory, or a reference mass that is too light to see anything — none of which need a new
                device. If the corner spread stays above half a kilogram on a hard floor and the slope is
                still off with a heavy reference mass, the sensor is the problem. What buying a more
                expensive one does to the body fat number is a separate question, priced on our{" "}
                <a href="/best-bmi-scale">best BMI scale page</a>.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Where this page&apos;s arithmetic stops being true</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              <b>No device was measured.</b> Every number here is this page evaluating the identities at the
              top on values you supply. Nothing is a test result, no product is named, ranked or reviewed,
              and no comparison against DEXA, underwater weighing or any other reference method is quoted,
              because quoting one without measuring it would be fabrication.
            </li>
            <li>
              <b>The straight-line model is an assumption.</b> Real load cells are not perfectly linear and
              can be non-linear near zero or near their maximum. The two-mass test assumes one line
              describes the whole range; if it does not, no single correction factor exists.
            </li>
            <li>
              <b>The scatter figures are placeholders until you measure your own.</b> The repeatability,
              detection and drift tables are all computed <i>from</i> a scatter value. Until you run test 2
              and write down your actual number, the output describes a hypothetical machine.
            </li>
            <li>
              <b>Independence is assumed in the error arithmetic.</b> The corner spread, the slope error and
              the reading scatter are treated as separate and combined by simple addition or quadrature. If
              they share a cause — a sensor that is both non-linear and drifting — the totals here
              understate the real error.
            </li>
            <li>
              <b>The body fat sensitivities come from one model of the impedance chain.</b> The height term,
              the hydration constant and the shared-sensor ratios follow from the assumption that fat-free
              mass is estimated as body water divided by a constant. A manufacturer&apos;s actual firmware is
              not published and is almost certainly not this simple.
            </li>
            <li>
              <b>The sensitivities are local.</b> Every per-kilogram and per-centimetre figure is a
              derivative evaluated at your current numbers. Move a long way from there and they change.
            </li>
            <li>
              <b>WHO categories are screening bands, not diagnoses.</b> Being near a boundary is an
              arithmetic statement about where the number sits, not a statement about your health.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/bmi-calculator">BMI calculator</a> ·{" "}
            <a href="/scale-bmi">what a smart scale actually measures</a> ·{" "}
            <a href="/best-bmi-scale">what a spec sheet is really worth</a> ·{" "}
            <a href="/body-fat-calculator">body fat calculator</a> ·{" "}
            <a href="/measure-body-fat-percentage">how small a change your tape can see</a> ·{" "}
            <a href="/best-way-to-measure-body-fat">picking the method you can repeat</a> ·{" "}
            <a href="/fat-percentage-calculator">fat percentage across three methods</a> ·{" "}
            <a href="/how-to-measure-body-fat-at-home">how to measure body fat at home</a> ·{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a>
          </p>
          <p>
            <b>Not medical advice.</b> Every figure on this page is arithmetic performed here on the BMI
            definition and on a stated model of how a body composition scale works. No device was measured,
            no product is ranked, and nothing here is a claim about any manufacturer&apos;s accuracy. See our{" "}
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
