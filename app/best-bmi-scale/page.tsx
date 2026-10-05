"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "metric" | "us";
type Sex = "male" | "female";

const LB = 2.20462;
const CM_PER_IN = 2.54;

// Printed weight tolerances, in kilograms.
const TOLS = [0.05, 0.1, 0.2, 0.5, 1.0];

// Display graduations, converted to kilograms.
const GRADS = [
  { label: "0.05 kg", kg: 0.05 },
  { label: "0.1 kg", kg: 0.1 },
  { label: "0.2 lb", kg: 0.2 / LB },
  { label: "0.5 kg", kg: 0.5 },
  { label: "1 lb", kg: 1 / LB },
];

// How far the stored height might be from the truth, in centimetres.
const DHS = [0, 0.5, 1, 2, 3];

// Printed body fat tolerance, in percentage points.
const BF_TOLS = [1, 2, 3, 3.5, 5];

// Your own day-to-day water noise, in percentage points.
const USER_SIGMA = [0.5, 1, 1.5, 2, 2.5];

// How many readings you average before making a decision.
const NS = [1, 3, 7, 14, 28];

// WHO adult BMI category boundaries.
const LINES = [18.5, 25, 30, 35, 40];

function bmiClass(b: number): string {
  if (b < 18.5) return "Underweight";
  if (b < 25) return "Normal";
  if (b < 30) return "Overweight";
  if (b < 35) return "Obese I";
  if (b < 40) return "Obese II";
  return "Obese III";
}

// Deurenberg-style BMI estimate used elsewhere on this site, shown here only as a cross-check.
function bmiMethodBf(bmi: number, age: number, sex: Sex): number {
  return 1.2 * bmi + 0.23 * age - 10.8 * (sex === "male" ? 1 : 0) - 5.4;
}

const f = (x: number, n = 2) => (Number.isFinite(x) ? x.toFixed(n) : "—");

export default function BestBmiScalePage() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(34);
  const [height, setHeight] = useState(175); // cm in metric, inches in US
  const [weight, setWeight] = useState(78); // kg in metric, lb in US
  const [bfScale, setBfScale] = useState(22); // what the scale reports

  const [tolIdx, setTolIdx] = useState(1); // 0.1 kg
  const [gradIdx, setGradIdx] = useState(1); // 0.1 kg
  const [dhIdx, setDhIdx] = useState(2); // 1 cm
  const [bfTolIdx, setBfTolIdx] = useState(3); // 3.5 pts
  const [sigmaIdx, setSigmaIdx] = useState(2); // 1.5 pts
  const [nIdx, setNIdx] = useState(2); // 7 readings
  const [pathIdx, setPathIdx] = useState(0); // foot only

  const heightCm = unit === "us" ? height * CM_PER_IN : height;
  const weightKg = unit === "us" ? weight / LB : weight;
  const weightLabel = unit === "us" ? "lb" : "kg";
  const heightLabel = unit === "us" ? "in" : "cm";

  const tol = TOLS[tolIdx];
  const grad = GRADS[gradIdx].kg;
  const dhCm = DHS[dhIdx];
  const bfTol = BF_TOLS[bfTolIdx];
  const userSigma = USER_SIGMA[sigmaIdx];
  const n = NS[nIdx];
  const footOnly = pathIdx === 0;

  const hm = heightCm / 100;
  const ok =
    heightCm > 120 &&
    heightCm < 230 &&
    weightKg > 30 &&
    weightKg < 250 &&
    age > 13 &&
    age < 90 &&
    bfScale > 2 &&
    bfScale < 65;

  const bmi = weightKg / (hm * hm);

  // BMI uncertainty, split by source.
  const bmiFromTol = tol / (hm * hm);
  const bmiFromHeight = (2 * bmi * (dhCm / 100)) / hm;
  const bmiUnc = Math.sqrt(bmiFromTol ** 2 + bmiFromHeight ** 2);

  // The same two errors expressed as kilograms of weight.
  const kgEquivHeight = (2 * weightKg * (dhCm / 100)) / hm;
  const combinedKg = Math.sqrt(tol ** 2 + kgEquivHeight ** 2);
  const ratio = tol > 0 ? kgEquivHeight / tol : Infinity;

  // Distance to the nearest WHO class line, in kilograms.
  let clearance = Infinity;
  let nearestLine = 0;
  for (const b of LINES) {
    const d = Math.abs(weightKg - b * hm * hm);
    if (d < clearance) {
      clearance = d;
      nearestLine = b;
    }
  }
  const safe = clearance > combinedKg;

  // Body fat error: the device offset never averages away, your own water noise does.
  const sigmaOnScale = userSigma / Math.sqrt(n);
  const sigmaCrossDevice = Math.sqrt(bfTol ** 2 + (userSigma * userSigma) / n);
  const detectOnScale = 1.96 * Math.SQRT2 * sigmaOnScale;
  const crossBand = 1.96 * sigmaCrossDevice;
  const crossFloor = 1.96 * bfTol;

  // How much a better device would buy you.
  const totalNow = Math.sqrt(userSigma ** 2 + bfTol ** 2);
  const totalHalf = Math.sqrt(userSigma ** 2 + (bfTol / 2) ** 2);
  const gain = ((totalNow - totalHalf) / totalNow) * 100;

  // The three levers, all of which scale with (1 - body fat).
  const lean = (1 - bfScale / 100) * 100;
  const perR = lean * 0.01; // points per 1% of resistance error
  const perHydConst = lean * (0.01 / 0.73); // points per 0.01 of the hydration constant
  const perHeightCm = lean * 2 * (0.01 / hm); // points per 1 cm of height error
  const perLegShare = lean * 0.05; // points per 5% relative error in the assumed leg share
  const floorTarget = bfTol / 1.96;

  const bfCross = ok ? bmiMethodBf(bmi, age, sex) : NaN;

  function switchUnit(next: Unit) {
    if (next === unit) return;
    setHeight(next === "us" ? Math.round(heightCm / CM_PER_IN) : Math.round(heightCm));
    setWeight(next === "us" ? Math.round(weightKg * LB) : Math.round(weightKg));
    setUnit(next);
  }

  function typical() {
    setTolIdx(1);
    setGradIdx(1);
    setDhIdx(2);
    setBfTolIdx(3);
    setSigmaIdx(2);
    setNIdx(2);
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
        <div className="tool-eyebrow">BEST BMI SCALE · SPEC ARITHMETIC</div>
        <h1>Best BMI Scale: What the Spec Sheet Is Really Worth</h1>
        <p className="tool-lede">
          Every BMI scale does the same arithmetic: it weighs you, divides by the height you typed once, and
          calls the result BMI. That means the largest error in your BMI is usually not in the scale at all —
          it is in the height. This page prices every printed spec in units you can actually use. A &plusmn;0.1
          kg weight tolerance is worth &plusmn;0.035 BMI. One centimetre of wrong height is worth 0.294. The
          height is eight and a half times the tolerance. Everything below is arithmetic this page performs;
          nothing here names, ranks or reviews any product.
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
              <Field label={`Weight (${weightLabel})`}>
                <input type="number" min={1} value={weight} onChange={(e) => setWeight(+e.target.value)} />
              </Field>
              <Field label={`Height you entered (${heightLabel})`}>
                <input type="number" min={1} value={height} onChange={(e) => setHeight(+e.target.value)} />
              </Field>
              <Field label="Body fat your scale reports (%)">
                <input type="number" min={3} max={60} value={bfScale} onChange={(e) => setBfScale(+e.target.value)} />
              </Field>
              <Field label="Printed weight tolerance">
                <select value={tolIdx} onChange={(e) => setTolIdx(+e.target.value)}>
                  {TOLS.map((t, i) => (
                    <option value={i} key={t}>
                      &plusmn;{t} kg
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Display graduation">
                <select value={gradIdx} onChange={(e) => setGradIdx(+e.target.value)}>
                  {GRADS.map((g, i) => (
                    <option value={i} key={g.label}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Height error you might have">
                <select value={dhIdx} onChange={(e) => setDhIdx(+e.target.value)}>
                  {DHS.map((d, i) => (
                    <option value={i} key={d}>
                      {d} cm{d === 0 ? " (measured)" : d === 1 ? " (rounded)" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Printed body fat tolerance">
                <select value={bfTolIdx} onChange={(e) => setBfTolIdx(+e.target.value)}>
                  {BF_TOLS.map((t, i) => (
                    <option value={i} key={t}>
                      &plusmn;{t} points
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Your day-to-day water noise">
                <select value={sigmaIdx} onChange={(e) => setSigmaIdx(+e.target.value)}>
                  {USER_SIGMA.map((s, i) => (
                    <option value={i} key={s}>
                      {s} pt — {i === 0 ? "very steady" : i === 1 ? "steady" : i === 2 ? "typical" : i === 3 ? "variable" : "very variable"}
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
              <Field label="Electrode path">
                <select value={pathIdx} onChange={(e) => setPathIdx(+e.target.value)}>
                  <option value={0}>Foot to foot</option>
                  <option value={1}>Hand to foot</option>
                </select>
              </Field>
            </div>
            <button className="calc-button" onClick={typical}>
              Reset to typical mid-range specs
            </button>
          </div>

          <div className="answer-card">
            <span>YOUR BMI, WITH ITS ERROR SPLIT BY SOURCE</span>
            <div className="answer-number">
              {ok ? f(bmi, 1) : "—"}
              <small>BMI · {ok ? bmiClass(bmi) : ""}</small>
            </div>
            {ok ? (
              <>
                <p>
                  Uncertainty <b>&plusmn;{f(bmiUnc, 3)} BMI</b> — of which{" "}
                  <b>{f(bmiFromTol, 3)}</b> comes from the &plusmn;{tol} kg weight tolerance and{" "}
                  <b>{f(bmiFromHeight, 3)}</b> comes from {dhCm} cm of height error.{" "}
                  {dhCm > 0 ? (
                    <>
                      That height error is worth <b>{f(kgEquivHeight, 2)} kg</b> of weight,{" "}
                      <b>{f(ratio, 1)}&times;</b> the scale&apos;s own tolerance.{" "}
                    </>
                  ) : (
                    <>With the height measured exactly, the tolerance is the whole story. </>
                  )}
                  The honest reading is <b>{f(bmi - bmiUnc, 2)}–{f(bmi + bmiUnc, 2)}</b>.
                </p>
                <p>
                  Nearest category line is BMI <b>{nearestLine}</b>, which sits{" "}
                  <b>{f(clearance, 2)} kg</b> away. Your combined error is{" "}
                  <b>{f(combinedKg, 2)} kg</b>, so your category is{" "}
                  <b>{safe ? "safe" : "at risk"}</b> —{" "}
                  {safe
                    ? "the error cannot move you across the line."
                    : "the error is wide enough to flip which category you land in."}
                </p>
                <p>
                  <b>Body fat {f(bfScale, 1)}%.</b> On this same scale you can detect a change of{" "}
                  <b>{f(detectOnScale, 2)} points</b> at {n} reading{n === 1 ? "" : "s"}, because a fixed
                  device offset cancels when you compare two of your own readings. Against another device, a
                  chart or a target, the offset does not cancel: your reading sits within{" "}
                  <b>&plusmn;{f(crossBand, 2)} points</b> of where a reference would put you, and no amount of
                  averaging takes that band below <b>&plusmn;{f(crossFloor, 2)}</b>. Halving the device&apos;s
                  body fat error would improve your day-to-day total by only <b>{f(gain, 1)}%</b>.
                </p>
                <p>
                  Levers at {f(bfScale, 1)}%: <b>{f(perR, 2)}</b> points per 1% of resistance error,{" "}
                  <b>{f(perHydConst, 2)}</b> per 0.01 of the hydration constant,{" "}
                  <b>{f(perHeightCm, 2)}</b> per 1 cm of height, and{" "}
                  {footOnly ? (
                    <>
                      <b>{f(perLegShare, 2)}</b> per 5% of error in the assumed leg share — the lever only a
                      foot-to-foot path has.{" "}
                    </>
                  ) : (
                    <>no leg-share lever at all, because a hand-to-foot path crosses the whole body. </>
                  )}
                  For reference, the BMI-method equation predicts <b>{f(bfCross, 1)}%</b> for your BMI, age
                  and sex.
                </p>
              </>
            ) : (
              <p>
                Enter a height between 120 and 230 cm, a weight between 30 and 250 kg, an age between 14 and
                85, and a body fat reading between 3 and 60 percent.
              </p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>THE TWO IDENTITIES EVERYTHING ON THIS PAGE COMES FROM</span>
          <strong>
            BMI = W ÷ H² &nbsp;&nbsp;→&nbsp;&nbsp; ΔBMI = ΔW ÷ H² &nbsp;and&nbsp; ΔBMI = 2·BMI·(ΔH ÷ H)
            <br />
            Body fat = 1 − FFM ÷ W &nbsp;&nbsp;→&nbsp;&nbsp; ΔBF = (1 − BF) × (relative error in FFM)
          </strong>
          <small>
            The first line is exact calculus on the BMI definition: weight error divides by height squared,
            height error is amplified by two because height is squared and sits in the denominator. The second
            line is the structural fact behind every body fat number a scale prints. Fat-free mass is estimated
            as a measured quantity divided by an assumed constant, so any relative error anywhere in that chain
            — impedance, the hydration fraction, the share of the body the current actually crossed — moves the
            reported body fat by the same multiple of your remaining lean fraction. A leaner person pays more
            per percent of error, which is the opposite of what most people assume. Every table below is this
            page evaluating those two identities; none of it is copied from anywhere.
          </small>
        </div>

        <section className="content-block">
          <h2>The short answer</h2>
          <p>
            This page will not tell you which brand to buy, because it has not measured any device, and a
            ranking written without measurements would be fiction. What it can do is tell you which numbers on
            the box change the answer and by how much, so that you can read any spec sheet and know what you
            are looking at.
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              <b>The BMI number is limited by your height entry, not the load cells.</b> At 1.70 m and BMI 25,
              a &plusmn;0.1 kg tolerance moves BMI by 0.035; one centimetre of wrong height moves it by 0.294.
              Measure your height against a wall and type it in once, correctly.
            </li>
            <li>
              <b>The body fat number is limited by the device&apos;s own constants, not by averaging.</b> A
              fixed offset is the same every morning, so it cancels when you compare two of your own readings
              and never cancels when you compare against anything else.
            </li>
            <li>
              <b>Buying past a point buys nothing.</b> Once the device&apos;s body fat error falls below about
              0.46 times your own day-to-day noise, you are within 10 percent of the best total error
              available to you, and every further improvement goes into your own protocol instead.
            </li>
            <li>
              <b>The features worth paying for are the ones that reduce your error, not the ones that add
              digits.</b> Correct height handling, consistent units, one decimal place, raw data export, and a
              current path that crosses the whole body.
            </li>
          </ul>
          <p>
            If you only want one number: at 1.70 m, one centimetre of height error is worth 0.85 kg of body
            weight. Most scales are specified to 0.1 kg. You are comparing an eight-and-a-half kilogram
            problem to a one-kilogram solution.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what each printed spec is worth</h2>
          <p>
            A tolerance in kilograms means almost nothing to most people. Dividing by height squared turns it
            into BMI points, which is the unit the number is reported in. The table below is{" "}
            <b>tolerance ÷ height²</b>, computed at seven heights and five tolerances.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Height</span>
              <b>±0.05 kg</b>
              <b>±0.1 kg</b>
              <b>±0.2 kg</b>
              <b>±0.5 kg</b>
              <b>±1.0 kg</b>
            </div>
            {[
              ["1.55 m", "0.021", "0.042", "0.083", "0.208", "0.416"],
              ["1.60 m", "0.020", "0.039", "0.078", "0.195", "0.391"],
              ["1.65 m", "0.018", "0.037", "0.073", "0.184", "0.367"],
              ["1.70 m", "0.017", "0.035", "0.069", "0.173", "0.346"],
              ["1.75 m", "0.016", "0.033", "0.065", "0.163", "0.327"],
              ["1.80 m", "0.015", "0.031", "0.062", "0.154", "0.309"],
              ["1.85 m", "0.015", "0.029", "0.058", "0.146", "0.292"],
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
            Read down the &plusmn;0.1 kg column: the entire range of BMI uncertainty from a good weight sensor
            runs from 0.042 at 1.55 m to 0.029 at 1.85 m. That is the whole prize for buying a better load
            cell, and it is smaller than the third decimal place of the number the scale shows you.
          </p>
          <p>
            Graduation is a separate and smaller effect. A display that steps in units of <i>u</i> rounds your
            true weight by a uniform amount of width <i>u</i>, whose standard deviation is <i>u</i> ÷ √12. At
            1.70 m, a 0.1 kg graduation carries a rounding standard deviation of 0.029 kg, worth 0.010 BMI —
            smaller than the &plusmn;0.1 kg tolerance itself. A 1 lb graduation carries 0.131 kg, worth 0.045
            BMI. Graduation matters only once it is coarser than the tolerance, and on most devices it is not.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: the height you typed is the biggest number in the room</h2>
          <p>
            Height enters BMI squared and in the denominator, so the derivative carries a factor of two: a
            relative error of <i>ε</i> in height produces a relative error of 2<i>ε</i> in BMI. One centimetre
            on a 1.70 m person is a 0.59 percent height error and therefore a 1.18 percent BMI error. The
            table below converts that into the two units that matter — BMI points, and the kilograms of body
            weight it would take to produce the same shift.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Body</span>
              <b>Weight at that BMI</b>
              <span>BMI shift per cm</span>
              <span>kg-equivalent per cm</span>
            </div>
            {[
              ["1.60 m at BMI 20", "51.20 kg", "0.250", "0.640 kg"],
              ["1.60 m at BMI 25", "64.00 kg", "0.313", "0.800 kg"],
              ["1.60 m at BMI 30", "76.80 kg", "0.375", "0.960 kg"],
              ["1.70 m at BMI 20", "57.80 kg", "0.235", "0.680 kg"],
              ["1.70 m at BMI 25", "72.25 kg", "0.294", "0.850 kg"],
              ["1.70 m at BMI 30", "86.70 kg", "0.353", "1.020 kg"],
              ["1.80 m at BMI 20", "64.80 kg", "0.222", "0.720 kg"],
              ["1.80 m at BMI 25", "81.00 kg", "0.278", "0.900 kg"],
              ["1.80 m at BMI 30", "97.20 kg", "0.333", "1.080 kg"],
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
            At 1.70 m and BMI 25 the effect is linear in the size of the mistake: half a centimetre costs 0.147
            BMI and is worth 0.425 kg; one centimetre costs 0.294 and is worth 0.850 kg; two centimetres cost
            0.588 and are worth 1.700 kg; three cost 0.882 and are worth 2.550 kg. Compare any of those to the
            tolerance table above. The comparison is the point of this page, so here it is directly:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Body</span>
              <b>kg per cm</b>
              <b>vs ±0.05 kg</b>
              <b>vs ±0.1 kg</b>
              <b>vs ±0.2 kg</b>
              <b>vs ±0.5 kg</b>
            </div>
            {[
              ["60 kg, 1.60 m", "0.750", "15.0×", "7.5×", "3.8×", "1.5×"],
              ["72.25 kg, 1.70 m", "0.850", "17.0×", "8.5×", "4.3×", "1.7×"],
              ["85 kg, 1.75 m", "0.971", "19.4×", "9.7×", "4.9×", "1.9×"],
              ["100 kg, 1.80 m", "1.111", "22.2×", "11.1×", "5.6×", "2.2×"],
              ["120 kg, 1.85 m", "1.297", "25.9×", "13.0×", "6.5×", "2.6×"],
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
            One centimetre of height is worth between 7.5 and 13.0 times a &plusmn;0.1 kg weight tolerance,
            depending on how large you are. Even against a loose &plusmn;0.5 kg tolerance it is worth 1.5 to
            2.6 times. There is no consumer scale on the market whose weight sensor compensates for a height
            entered from memory. This is the single highest-value thing you can fix, it costs nothing, and it
            is not a feature anybody sells.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: how close are you to a category line</h2>
          <p>
            BMI is usually reported as a category, and a category has edges. If the combined error in your
            weight and height is wider than your distance to the nearest edge, the category itself is
            uncertain — which is a different and more useful question than whether the number is accurate.
            Combining the two errors as independent gives a required clearance of √(<i>tol</i>² +{" "}
            <i>kgEquiv</i>²). At 1.70 m, in kilograms of body weight:
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Tolerance and height error</span>
              <b>Clearance needed at the BMI 25 line</b>
              <span>Clearance needed at the BMI 30 line</span>
            </div>
            {[
              ["±0.1 kg, height exact", "0.10 kg", "0.10 kg"],
              ["±0.1 kg, 0.5 cm out", "0.44 kg", "0.52 kg"],
              ["±0.1 kg, 1 cm out", "0.86 kg", "1.03 kg"],
              ["±0.1 kg, 2 cm out", "1.70 kg", "2.04 kg"],
              ["±0.2 kg, height exact", "0.20 kg", "0.20 kg"],
              ["±0.2 kg, 1 cm out", "0.87 kg", "1.04 kg"],
              ["±0.5 kg, height exact", "0.50 kg", "0.50 kg"],
              ["±0.5 kg, 1 cm out", "0.99 kg", "1.14 kg"],
              ["±0.5 kg, 2 cm out", "1.77 kg", "2.10 kg"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Notice how flat the tolerance column is and how steep the height column is. Going from a
            &plusmn;0.5 kg sensor to a &plusmn;0.1 kg sensor changes the required clearance by a few hundred
            grams. Going from an exact height to a height that is one centimetre out changes it by roughly
            eight hundred grams to a kilogram. If your weight sits within about a kilogram of 18.5, 25, 30, 35
            or 40 BMI, the honest statement is not which category you are in but that you are near a line, and
            the fix is a measured height.
          </p>
          <p>
            The bands themselves are wide enough to make this manageable once the height is right: at 1.70 m
            the normal band spans 18.76 kg and each band above it spans 14.42 kg. One BMI point is 2.89 kg at
            that height, 2.56 kg at 1.60 m and 3.24 kg at 1.80 m.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: the three levers inside the body fat number</h2>
          <p>
            Body fat is one minus fat-free mass over weight. Fat-free mass is not measured; it is built by
            dividing a measured quantity by an assumed constant. That structure produces a single rule:{" "}
            <b>a one percent relative error anywhere in the chain costs (1 − your body fat) points</b> — 0.90
            points if you are at 10 percent, 0.80 at 20 percent, 0.70 at 30 percent. Leaner people pay more
            per percent of error, because there is more lean tissue for the error to land on. The levers:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Your body fat</span>
              <b>Per 1% resistance error</b>
              <b>Per 0.01 of hydration constant</b>
              <b>Per 5% leg-share error</b>
              <b>Per 1 cm of height (1.70 m)</b>
            </div>
            {[
              ["10%", "0.900", "1.233", "4.500", "1.059"],
              ["15%", "0.850", "1.164", "4.250", "1.000"],
              ["20%", "0.800", "1.096", "4.000", "0.941"],
              ["25%", "0.750", "1.027", "3.750", "0.882"],
              ["30%", "0.700", "0.959", "3.500", "0.824"],
              ["35%", "0.650", "0.890", "3.250", "0.765"],
              ["40%", "0.600", "0.822", "3.000", "0.706"],
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
            Three things follow. First, the hydration constant is a finer lever than people expect: moving the
            assumed water fraction of fat-free tissue from 0.73 to 0.74 swings a 20 percent reading by 1.08
            points, and two devices that disagree only about that constant will disagree by roughly two points
            before anything else is considered.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Reading at k = 0.73</span>
              <b>k = 0.71</b>
              <b>k = 0.72</b>
              <b>k = 0.73</b>
              <b>k = 0.74</b>
              <b>k = 0.75</b>
            </div>
            {[
              ["10%", "7.46", "8.75", "10.00", "11.22", "12.40"],
              ["20%", "17.75", "18.89", "20.00", "21.08", "22.13"],
              ["30%", "28.03", "29.03", "30.00", "30.95", "31.87"],
              ["40%", "38.31", "39.17", "40.00", "40.81", "41.60"],
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
            Second, height enters the body fat number too, and twice as hard as it enters BMI, because the
            impedance-to-water conversion uses height squared. One centimetre at 1.70 m moves a 20 percent
            reading by 0.94 points — three times the 0.294 BMI shift from the same centimetre.
          </p>
          <p>
            Third, the leg-share lever is the largest of the three and it belongs only to foot-only devices. A
            foot-to-foot scale sends its current up one leg and down the other, then scales what it found up
            to a whole body using an assumed share. Under the pure-ratio form of that model, a 5 percent
            relative error in the assumed share is worth 4.00 points at 20 percent body fat. Real devices use
            regression equations fitted on populations rather than a bare ratio, so the effective sensitivity
            is smaller than this — treat 4.00 as the size of the lever, not as a measured error. It is still
            the reason a hand-to-foot path, which crosses the trunk as well as the limbs, is the structural
            upgrade rather than a marketing one, and the reason these devices behave worst on people whose
            legs are unrepresentative of their whole body.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: how much a better scale can actually buy you</h2>
          <p>
            Two errors combine as the square root of the sum of squares. Call your own day-to-day noise{" "}
            <i>u</i> — the part that comes from your hydration, your last meal, the time of day — and the
            device&apos;s contribution <i>d</i>. The total is √(<i>u</i>² + <i>d</i>²), and the best you could
            ever reach by buying a perfect device is <i>u</i>.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Device error</span>
              <b>u = 0.5</b>
              <b>u = 1.0</b>
              <b>u = 1.5</b>
              <b>u = 2.0</b>
              <b>u = 2.5</b>
            </div>
            {[
              ["3.0 pts", "3.041", "3.162", "3.354", "3.606", "3.905"],
              ["2.5 pts", "2.550", "2.693", "2.915", "3.202", "3.536"],
              ["2.0 pts", "2.062", "2.236", "2.500", "2.828", "3.202"],
              ["1.5 pts", "1.581", "1.803", "2.121", "2.500", "2.915"],
              ["1.0 pts", "1.118", "1.414", "1.803", "2.236", "2.693"],
              ["0.5 pts", "0.707", "1.118", "1.581", "2.062", "2.550"],
              ["0.25 pts", "0.559", "1.031", "1.521", "2.016", "2.512"],
              ["0 pts (perfect device)", "0.500", "1.000", "1.500", "2.000", "2.500"],
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
            Reading down the <i>u</i> = 1.5 column: a device contributing 3.0 points gives a total of 3.354,
            and a perfect device gives 1.500. The entire range of hardware quality is worth 55 percent of your
            total error. The rest is yours. Halving the device error, over and over:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Device error, halved</span>
              <b>Total before</b>
              <span>Total after</span>
              <span>Gain</span>
            </div>
            {[
              ["3.0 → 1.5 pts", "3.354", "2.121", "36.8%"],
              ["2.0 → 1.0 pts", "2.500", "1.803", "27.9%"],
              ["1.5 → 0.75 pts", "2.121", "1.677", "20.9%"],
              ["1.0 → 0.5 pts", "1.803", "1.581", "12.3%"],
              ["0.5 → 0.25 pts", "1.581", "1.521", "3.8%"],
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
            The returns collapse. The first halving is worth 36.8 percent of your total error; by the time the
            device is down to half a point, halving it again is worth 3.8 percent. There is a clean place to
            stop. Solving √(<i>u</i>² + <i>d</i>²) ≤ 1.10·<i>u</i> gives <i>d</i> ≤ 0.4583·<i>u</i>:{" "}
            <b>once the device error is below about 0.46 times your own noise, better hardware cannot move
            your total by more than 10 percent.</b> If your day-to-day noise is 1.5 points, that threshold is
            0.69 points; at 2.5 points of noise it is 1.15. The marginal rate makes the same point — at{" "}
            <i>u</i> = 1.5, each further point of device improvement returns 0.894 points of total when the
            device is at 3.0, but only 0.164 when the device is at 0.25.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: averaging has a floor</h2>
          <p>
            Averaging <i>n</i> readings divides your own noise by √<i>n</i>. It does nothing at all to a
            device offset, because a constant is the same on every reading. That gives two different floors,
            and confusing them is the most common way people misread these devices.
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              <b>Comparing two of your own readings on the same scale.</b> The offset cancels. Your floor is
              1.96·√2·(<i>u</i> ÷ √<i>n</i>). With 1.5 points of daily noise, a single pair of readings can
              only resolve a 4.16 point change; a week of readings on each side brings that to 1.57 points.
            </li>
            <li>
              <b>Comparing against another device, a chart or a target.</b> The offset does not cancel. Your
              95 percent band is 1.96·√(<i>d</i>² + <i>u</i>²/<i>n</i>), and it can never fall below
              1.96·<i>d</i>. With a &plusmn;3.5 point device that floor is &plusmn;6.86 points, at any number
              of readings.
            </li>
          </ul>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>You want agreement to</span>
              <b>Device error must be under</b>
              <b>Readings if d = 0.1</b>
              <b>Readings if d = 0.2</b>
              <b>Readings if d = 0.3</b>
            </div>
            {[
              ["±0.25 pts", "0.128", "359", "impossible", "impossible"],
              ["±0.5 pts", "0.255", "41", "90", "impossible"],
              ["±1.0 pts", "0.510", "9", "11", "14"],
              ["±1.5 pts", "0.765", "4", "5", "5"],
              ["±2.0 pts", "1.020", "3", "3", "3"],
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
            Readings column assumes 1.5 points of your own daily noise; with 2.5 points the &plusmn;0.5 row
            needs 114 readings at <i>d</i> = 0.1 and 250 at <i>d</i> = 0.2. The word &ldquo;impossible&rdquo;
            is literal: once the device offset exceeds the target divided by 1.96, no amount of data recovers
            it. This is the arithmetic answer to &ldquo;should I weigh in every day?&rdquo; — daily weighing
            is worth it for the trend, and worthless for the comparison against anything outside your own
            bathroom.
          </p>
        </section>

        <section className="content-block">
          <h2>The decision rule: which spec matters for what you are doing</h2>
          <p>
            &ldquo;Best&rdquo; is a function of the job. Each row below names the one spec that decides the
            outcome, the threshold this page&apos;s arithmetic puts on it, and what you can safely ignore.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>What you are doing</span>
              <b>The spec that decides it</b>
              <span>Threshold, computed above</span>
              <span>Ignore</span>
            </div>
            {[
              [
                "Classifying your BMI",
                "Weight tolerance plus a measured height",
                "Combined error under your clearance to the nearest line: 0.86 kg at 1.70 m with ±0.1 kg and 1 cm of height error",
                "Body fat, metabolic age, visceral ratings",
              ],
              [
                "Tracking a cut week to week",
                "Repeatability, not absolute accuracy",
                "Detectable change = 1.96·√2·σ: 0.28 kg at σ = 0.1 kg, 1.39 kg at σ = 0.5 kg",
                "Whether it agrees with the machine at your gym",
              ],
              [
                "Tracking a body fat trend",
                "An offset below your own noise, plus averaging",
                "Below 0.46× your noise buys under 10% more: 0.69 pts if your noise is 1.5 pts",
                "Extra decimal places",
              ],
              [
                "Comparing to a chart or another device",
                "The offset, which never averages away",
                "Floor is 1.96× the offset: ±3.5 pts stays ±6.86 pts at 28 readings",
                "Taking more readings",
              ],
              [
                "Carrying fat centrally",
                "A tape measure, not a scale",
                "Waist-to-height 0.500 and waist-to-hip 0.90 / 0.85; see the computed tables on the visceral fat page",
                "Any visceral score a scale prints",
              ],
              [
                "An official or clinical requirement",
                "The method the organisation specifies",
                "Not a consumer device, at any tolerance",
                "Everything on a retail box",
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
          <p style={{ marginTop: 22 }}>
            Put together, the shopping list is short and almost none of it is about accuracy claims. You want a
            device that makes you enter height once and correctly and stores it per user; that reports weight
            to one decimal in a unit you will keep using; that lets you export the raw history rather than
            locking it in an app; and whose current path crosses your whole body if you care about the body
            fat number at all. You do not need the tightest printed tolerance on the shelf, and per the tables
            above you cannot buy your way past your own hydration.
          </p>
        </section>

        <section className="content-block">
          <h2>Setting one up so the numbers are usable</h2>
          <p>
            Most disappointment with these devices is a protocol problem rather than a hardware problem. This
            is the short version; the{" "}
            <a href="/scale-bmi">longer version on our smart scale page</a> covers what the device measures at
            each step.
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              Measure your height barefoot against a wall with something flat on your head, and enter it to
              the nearest half centimetre. Per the tables above this is worth more than every other setting
              combined.
            </li>
            <li>
              Put the scale on a hard, level floor and never move it. Carpet and uneven tiles change the load
              cell readings, and moving the scale changes them again.
            </li>
            <li>
              Weigh at the same point in your day — after the bathroom, before food and coffee is the most
              repeatable state most people have.
            </li>
            <li>
              Leave four hours between hard training or a sauna and a reading, and skip the morning after a
              very salty meal or a long flight.
            </li>
            <li>
              Record the reading every time and decide from the seven-day average. One reading resolves
              nothing that matters.
            </li>
            <li>
              Re-enter your height once a year. A stale height quietly corrupts both the BMI and the
              impedance conversion, and nothing on the device will tell you.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Where this page&apos;s arithmetic stops being true</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              <b>No product is named, ranked, reviewed or recommended here.</b> This page has not measured any
              device. There are no prices, brands, model numbers or star ratings on it, by deliberate choice.
            </li>
            <li>
              <b>The body fat model is a model.</b> The hydration fraction of 0.73 and the height-squared
              impedance relationship are this page&apos;s working description of a class of devices. They are
              not any manufacturer&apos;s firmware, and no manufacturer publishes its constants.
            </li>
            <li>
              <b>The leg-share lever is an upper bound.</b> 4.00 points per 5 percent is what the pure-ratio
              form gives. Real devices use population-fitted regression equations, so the effective
              sensitivity is smaller. The number sizes the lever; it is not a measured error for any device.
            </li>
            <li>
              <b>&ldquo;Tolerance&rdquo; is not defined consistently across the industry.</b> This page treats
              the figure you enter as a bound comparable to a standard deviation and combines errors as
              independent. What a given box meant by its number may be something else entirely.
            </li>
            <li>
              <b>BMI categories are WHO classifications for adults.</b> They are screening categories, not
              diagnoses, and they do not apply to children, to pregnancy, or to people with unusual muscle
              mass. The class-boundary arithmetic says whether your <i>category</i> is certain; it says
              nothing about your health.
            </li>
            <li>
              <b>The BMI-method body fat shown in the calculator is not independent.</b> It is a population
              prediction equation evaluated on your BMI, age and sex, so agreement with your scale is not
              confirmation of either number.
            </li>
            <li>
              <b>Your own noise figure is an estimate.</b> The tables treat it as known. If you want it
              measured rather than assumed, weigh daily for two weeks under fixed conditions and take the
              standard deviation of the readings.
            </li>
            <li>
              None of this is medical advice. See the <a href="/disclaimer">disclaimer</a>.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Best BMI scale questions</h2>
          <div className="mini-faq">
            <details>
              <summary>What is the best BMI scale?</summary>
              <p>
                This page does not rank products, because it has measured none. What the arithmetic says is
                that the device qualities which decide your numbers are a correctly entered height stored per
                user, a hard level floor, one decimal place in a unit you will keep, raw data export, and a
                current path that crosses your whole body rather than only your legs. A tighter printed weight
                tolerance is worth, at most, a few hundredths of a BMI point.
              </p>
            </details>
            <details>
              <summary>Is a more expensive scale more accurate?</summary>
              <p>
                Not in any way these tables can detect. The whole range of weight tolerance from &plusmn;0.05
                kg to &plusmn;1.0 kg is worth between 0.015 and 0.416 BMI, and the part that matters most —
                the height you typed — is free to get right. Per the diminishing-returns table, halving a
                device error that is already below half your own daily noise improves your total by under 4
                percent.
              </p>
            </details>
            <details>
              <summary>How accurate is the BMI number on a smart scale?</summary>
              <p>
                As accurate as its weight sensor and your height. BMI is weight divided by height squared; the
                scale supplies the first and you supply the second. With a &plusmn;0.1 kg sensor and an exact
                height at 1.70 m, BMI carries about &plusmn;0.035 of uncertainty. With the same sensor and a
                height that is one centimetre out, it carries &plusmn;0.296 — roughly eight times worse, from
                an error the scale cannot see.
              </p>
            </details>
            <details>
              <summary>Why does my scale disagree with the one at my gym?</summary>
              <p>
                Because the body fat figure is built from a measured impedance divided by constants each
                manufacturer chooses. Per the lever table, moving only the assumed hydration fraction from
                0.73 to 0.75 shifts a 20 percent reading by 2.13 points, and a foot-only path versus a
                hand-to-foot path adds a lever with a larger span still. Two devices can disagree by several
                points on the same person in the same minute without either malfunctioning.
              </p>
            </details>
            <details>
              <summary>Do I need a scale with hand electrodes?</summary>
              <p>
                If you care about the body fat number, it is the one structural upgrade worth having. A
                foot-to-foot path crosses only your legs and then scales up by an assumed share; under this
                page&apos;s ratio model a 5 percent error in that share is worth 4.00 points at 20 percent
                body fat. A hand-to-foot path crosses the trunk and removes the lever entirely.
              </p>
            </details>
            <details>
              <summary>What does &ldquo;body fat &plusmn;3.5%&rdquo; on the box actually mean?</summary>
              <p>
                Whatever the manufacturer meant by it, and they do not all mean the same thing. Taken as a
                bound comparable to a standard deviation and treated as an offset, it means two things: on
                your own scale it cancels and you can still detect small changes; against any other device it
                sets a floor of 1.96 × 3.5 = 6.86 points that no number of readings will reduce.
              </p>
            </details>
            <details>
              <summary>Should I weigh myself every day?</summary>
              <p>
                Yes, if you use the average. Daily data is what makes averaging work: with 1.5 points of daily
                noise, a single reading resolves 4.16 points while a week of readings resolves 1.57. Just do
                not expect daily weighing to make your scale agree with anyone else&apos;s.
              </p>
            </details>
            <details>
              <summary>Does hydration really change the reading?</summary>
              <p>
                Yes, and it is the largest single source of day-to-day movement. Our{" "}
                <a href="/scale-bmi">smart scale page</a> prices it directly: under this site&apos;s model,
                one kilogram of water is worth roughly 1.4 to 2.3 body fat points, and the swing is larger on
                a smaller body.
              </p>
            </details>
            <details>
              <summary>Can a BMI scale measure visceral fat?</summary>
              <p>
                No. Visceral fat sits inside the abdominal cavity and a current through your feet cannot
                separate it from the fat under your skin. Any visceral rating the display shows is derived
                from the same estimated body fat number with more assumptions on top. A tape measure at your
                waist is more honest, and our{" "}
                <a href="/visceral-fat-calculator">visceral fat page</a> computes what a waist measurement can
                and cannot support.
              </p>
            </details>
            <details>
              <summary>My BMI says one thing and my body fat says another. Which is right?</summary>
              <p>
                They answer different questions and can legitimately disagree, because BMI is pure arithmetic
                on weight and height while body fat depends on how much of your weight is muscle. Our{" "}
                <a href="/obese-scale">obese scale page</a> works through the cross-classification with
                computed tables.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/bmi-calculator">BMI calculator</a> ·{" "}
            <a href="/scale-bmi">BMI scale accuracy and what a smart scale measures</a> ·{" "}
            <a href="/body-fat-calculator">body fat calculator</a> ·{" "}
            <a href="/measure-body-fat-percentage">measure body fat percentage</a> ·{" "}
            <a href="/fat-percentage-calculator">fat percentage across three methods</a> ·{" "}
            <a href="/visceral-fat-calculator">visceral fat calculator</a> ·{" "}
            <a href="/how-to-measure-body-fat-at-home">how to measure body fat at home</a> ·{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a>
          </p>
          <p>
            <b>Not medical advice.</b> Every figure on this page is arithmetic this page performs on the BMI
            definition and on a stated model of how impedance devices estimate fat-free mass. No device was
            measured, no product is ranked, and nothing here is a claim about any manufacturer&apos;s
            accuracy. See our <a href="/disclaimer">disclaimer</a>.
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
