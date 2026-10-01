"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";
type Sex = "male" | "female";

const IN = 2.54;
const LB = 2.20462;
const L10 = Math.log(10);

// ---- Published prediction equations, the same ones this site uses everywhere ----
function navyTape(sex: Sex, waistCm: number, neckCm: number, hipCm: number, heightCm: number): number {
  const h = heightCm / IN;
  if (sex === "male") {
    const a = (waistCm - neckCm) / IN;
    return 86.01 * Math.log10(a) - 70.041 * Math.log10(h) + 36.76;
  }
  const a = (waistCm + hipCm - neckCm) / IN;
  return 163.205 * Math.log10(a) - 97.684 * Math.log10(h) - 78.387;
}

function jp3(sex: Sex, sum: number, age: number): number {
  const bd =
    sex === "male"
      ? 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age
      : 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age;
  return 495 / bd - 450;
}

// ---- Sensitivity: percentage points per centimetre / per millimetre, from the exact derivatives ----
// Navy is logarithmic, so d(BF)/d(waist) = k / (ln10 * argument_in_cm).
function tapePerCm(sex: Sex, argCm: number): number {
  return (sex === "male" ? 86.01 : 163.205) / (L10 * argCm);
}

function caliperPerMm(sex: Sex, sum: number, age: number): number {
  const e = 0.001;
  return (jp3(sex, sum + e, age) - jp3(sex, sum - e, age)) / (2 * e);
}

// ---- Kilograms of fat that must leave the body to move body fat percentage by d points ----
// Pure fat loss: weight falls with the fat, lean mass held fixed. Exact inversion, not an approximation.
function fatKgForPoints(dPts: number, weightKg: number, bfPct: number): number {
  const d = dPts / 100;
  const bf = bfPct / 100;
  return (d * weightKg) / (1 - bf + d);
}

const TAPE_GRADS: { label: string; cm: number }[] = [
  { label: "1 cm", cm: 1 },
  { label: "0.5 cm", cm: 0.5 },
  { label: "1 mm (digital)", cm: 0.1 },
  { label: "1 inch", cm: 2.54 },
  { label: "1/2 inch", cm: 1.27 },
  { label: "1/4 inch", cm: 0.635 },
];

const CALIPER_GRADS: { label: string; mm: number }[] = [
  { label: "5 mm", mm: 5 },
  { label: "2 mm", mm: 2 },
  { label: "1 mm", mm: 1 },
  { label: "0.5 mm", mm: 0.5 },
  { label: "0.1 mm", mm: 0.1 },
];

export default function MeasureBodyFatPercentagePage() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(80);
  const [waist, setWaist] = useState(92);
  const [neck, setNeck] = useState(39);
  const [hip, setHip] = useState(98);
  const [siteA, setSiteA] = useState(16);
  const [siteB, setSiteB] = useState(26);
  const [siteC, setSiteC] = useState(20);
  const [tapeIdx, setTapeIdx] = useState(0);
  const [calIdx, setCalIdx] = useState(2);

  const heightCm = unit === "us" ? height * IN : height;
  const weightKg = unit === "us" ? weight / LB : weight;
  const waistCm = unit === "us" ? waist * IN : waist;
  const neckCm = unit === "us" ? neck * IN : neck;
  const hipCm = unit === "us" ? hip * IN : hip;

  const lengthLabel = unit === "us" ? "in" : "cm";
  const weightLabel = unit === "us" ? "lb" : "kg";

  const tapeU = TAPE_GRADS[tapeIdx].cm;
  const calU = CALIPER_GRADS[calIdx].mm;

  const argCm = sex === "male" ? waistCm - neckCm : waistCm + hipCm - neckCm;
  const terms = sex === "male" ? 2 : 3; // how many rounded readings go into the argument

  const bodyOk = heightCm > 100 && heightCm < 250 && weightKg > 25 && weightKg < 300 && age > 10 && age < 95;
  const tapeOk = argCm > 5;
  const sum = siteA + siteB + siteC;
  const skinOk = sum > 8 && sum < 260;

  const navy = tapeOk && bodyOk ? navyTape(sex, waistCm, neckCm, hipCm, heightCm) : NaN;
  const jp = skinOk && age > 10 && age < 95 ? jp3(sex, sum, age) : NaN;

  const perCm = tapeOk ? tapePerCm(sex, argCm) : NaN;
  const perMm = skinOk ? caliperPerMm(sex, sum, age) : NaN;

  // Bracket: the argument is built from `terms` readings that are each rounded to the nearest mark,
  // so the true argument can sit anywhere within +/- terms/2 marks of the one you wrote down.
  const halfSpan = (terms / 2) * tapeU;
  const navyLo = tapeOk && bodyOk ? navyTape(sex, waistCm - halfSpan, neckCm, hipCm, heightCm) : NaN;
  const navyHi = tapeOk && bodyOk ? navyTape(sex, waistCm + halfSpan, neckCm, hipCm, heightCm) : NaN;
  const jpLo = skinOk ? jp3(sex, Math.max(1, sum - 1.5 * calU), age) : NaN;
  const jpHi = skinOk ? jp3(sex, sum + 1.5 * calU, age) : NaN;

  const floorPts = perCm * tapeU;
  const noiseSd = perCm * tapeU * Math.sqrt(terms / 12);
  const calFloor = perMm * calU;

  const kgPerMark = Number.isFinite(floorPts) && Number.isFinite(navy) ? fatKgForPoints(floorPts, weightKg, navy) : NaN;
  const kgPerCalMark = Number.isFinite(calFloor) && Number.isFinite(jp) ? fatKgForPoints(calFloor, weightKg, jp) : NaN;

  const readingsFor = (target: number) =>
    Number.isFinite(noiseSd) && noiseSd > 0 ? Math.max(1, Math.ceil((noiseSd / target) ** 2)) : NaN;

  // Digits beyond the marks on your tape are not information.
  const offGrid = Math.abs(waistCm - Math.round(waistCm / tapeU) * tapeU);
  const phantomPts = Number.isFinite(perCm) ? perCm * offGrid : NaN;

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

  function snapToGrid() {
    const u = unit === "us" ? tapeU / IN : tapeU;
    const r = (x: number) => Math.round(x / u) * u;
    setWaist(Number(r(waist).toFixed(2)));
    setNeck(Number(r(neck).toFixed(2)));
    setHip(Number(r(hip).toFixed(2)));
  }

  const caliperLabels: [string, string, string] =
    sex === "male"
      ? ["Chest skinfold (mm)", "Abdomen skinfold (mm)", "Thigh skinfold (mm)"]
      : ["Triceps skinfold (mm)", "Suprailiac skinfold (mm)", "Thigh skinfold (mm)"];

  const show = Number.isFinite(navy) && Number.isFinite(jp);

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/body-fat-calculator">Body Fat %</a>
          <a href="/fat-calculator">Fat Calculator</a>
          <a href="/navy-body-fat-calculator">Navy</a>
          <a href="/how-to-measure-body-fat-at-home">At Home</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">MEASURE BODY FAT PERCENTAGE</div>
        <h1>Measure Body Fat Percentage</h1>
        <p className="tool-lede">
          Two home methods, run at once — the Navy tape method and the Jackson–Pollock 3-site skinfold method.
          This page also answers the question most calculators skip: how small a change can the instrument in
          your hand actually see? Enter your measurements and the tape&apos;s graduation, and you get your
          percentage, the range that your tape is really capable of reporting, and what one mark on it is worth
          in kilograms of fat. Everything runs in your browser; nothing is uploaded.
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
                <input type="number" min={14} max={90} value={age} onChange={(e) => setAge(+e.target.value)} />
              </Field>
              <Field label={`Height (${lengthLabel})`}>
                <input type="number" min={1} value={height} onChange={(e) => setHeight(+e.target.value)} />
              </Field>
              <Field label={`Weight (${weightLabel})`}>
                <input type="number" min={1} value={weight} onChange={(e) => setWeight(+e.target.value)} />
              </Field>
              <Field label="Tape graduation">
                <select value={tapeIdx} onChange={(e) => setTapeIdx(+e.target.value)}>
                  {TAPE_GRADS.map((g, i) => (
                    <option value={i} key={g.label}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </Field>
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
                <input type="number" min={1} step={0.1} value={neck} onChange={(e) => setNeck(+e.target.value)} />
              </Field>
              {sex === "female" ? (
                <Field label={`Hip (${lengthLabel})`}>
                  <input type="number" min={1} step={0.1} value={hip} onChange={(e) => setHip(+e.target.value)} />
                </Field>
              ) : (
                <Field label=" ">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#667067", lineHeight: 1.5 }}>
                    Men: waist at the navel, neck just below the larynx. No hip measurement is used.
                  </span>
                </Field>
              )}
              <Field label="Caliper graduation">
                <select value={calIdx} onChange={(e) => setCalIdx(+e.target.value)}>
                  {CALIPER_GRADS.map((g, i) => (
                    <option value={i} key={g.label}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={caliperLabels[0]}>
                <input type="number" min={1} step={1} value={siteA} onChange={(e) => setSiteA(+e.target.value)} />
              </Field>
              <Field label={caliperLabels[1]}>
                <input type="number" min={1} step={1} value={siteB} onChange={(e) => setSiteB(+e.target.value)} />
              </Field>
              <Field label={caliperLabels[2]}>
                <input type="number" min={1} step={1} value={siteC} onChange={(e) => setSiteC(+e.target.value)} />
              </Field>
            </div>
            <button className="calc-button" onClick={snapToGrid}>
              Snap my measurements to the tape&apos;s marks
            </button>
          </div>

          <div className="answer-card">
            <span>TAPE METHOD · WITH ITS RESOLUTION FLOOR</span>
            <div className="answer-number">
              {Number.isFinite(navy) ? navy.toFixed(1) : "—"}
              <small>% body fat</small>
            </div>
            {show ? (
              <>
                <p>
                  Your tape can only report it to the nearest mark, so the honest answer is a band:{" "}
                  <b>
                    {navyLo.toFixed(1)}–{navyHi.toFixed(1)}%
                  </b>{" "}
                  is everything a {TAPE_GRADS[tapeIdx].label} tape can say about the body you measured. The band
                  is <b>{(navyHi - navyLo).toFixed(2)} points</b> wide, and it is not caused by you measuring
                  badly — it is the instrument.
                </p>
                <p>
                  <b>Resolution floor: {floorPts.toFixed(2)} points.</b> That is the smallest change your tape
                  can register at this waist — one mark. At {weightKg.toFixed(0)} kg it corresponds to{" "}
                  <b>{kgPerMark.toFixed(2)} kg of fat</b>, so any real change smaller than that is invisible to
                  this tape no matter how carefully you pull it.
                </p>
                <p>
                  Rounding noise alone is ±{noiseSd.toFixed(2)} points (one standard deviation), ±
                  {(1.96 * noiseSd).toFixed(2)} at 95%. To push that under 0.5 points you need{" "}
                  <b>{readingsFor(0.5)} readings</b>; under 0.25 points, <b>{readingsFor(0.25)}</b>.
                </p>
                <p>
                  Skinfold method on the same body: <b>{jp.toFixed(1)}%</b>, consistent band{" "}
                  <b>
                    {jpLo.toFixed(1)}–{jpHi.toFixed(1)}%
                  </b>{" "}
                  with a {CALIPER_GRADS[calIdx].label} caliper. Its floor is <b>{calFloor.toFixed(2)} points</b>{" "}
                  ({kgPerCalMark.toFixed(2)} kg of fat).
                </p>
                {offGrid > 0.001 && (
                  <p>
                    Phantom precision: your waist reading sits {offGrid.toFixed(2)} cm off the nearest mark on
                    this tape. Those extra digits move the result by {phantomPts.toFixed(2)} points, which is
                    arithmetic noise, not information.
                  </p>
                )}
              </>
            ) : (
              <p>
                Enter height, weight, waist, neck (plus hip for women) and three skinfolds. The waist–neck
                difference must be positive, and the skinfold total must be above 8 mm.
              </p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>THE TWO EQUATIONS THIS PAGE RUNS</span>
          <strong>
            Navy tape: BF% = 86.010·log₁₀(waist − neck) − 70.041·log₁₀(height) + 36.76 (men)
            <br />
            Jackson–Pollock 3-site: density = 1.10938 − 0.0008267·Σ + 0.0000016·Σ² − 0.0002574·age (men) — then
            BF% = 495 ÷ density − 450
          </strong>
          <small>
            Circumferences and height in inches, skinfolds in millimetres, Σ is the sum of three sites. Both are
            published prediction equations, not inventions of this page. Every table below is arithmetic this
            page performs on them: derivatives taken analytically for the tape equation and numerically for the
            skinfold equation, rounding treated as a uniform error of half a mark per reading. None of it is
            copied from anywhere, and none of it is a claim about how accurate these equations are — only about
            how much precision the instrument destroys before the equation ever sees your numbers.
          </small>
        </div>

        <section className="content-block">
          <h2>The protocol this page assumes</h2>
          <p>
            Before any of the arithmetic matters, the numbers have to be taken the same way every time. This is
            the protocol the calculator above is built around — the same landmarks this site uses on its Navy
            and fat-calculator pages.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Site</span>
              <b>Where the tape goes</b>
              <span>Position</span>
              <span>Common failure</span>
            </div>
            {[
              [
                "Waist (men)",
                "Horizontal around the abdomen at the level of the navel",
                "Standing, tape level, snug but not compressing",
                "Drifting to the belt line or to the narrowest point, which are different circumferences",
              ],
              [
                "Waist (women)",
                "Horizontal at the narrowest point of the torso",
                "Standing, exhale normally, do not suck in",
                "Measuring at the navel instead, or over clothing",
              ],
              [
                "Hip (women)",
                "Horizontal at the fullest part of the buttocks",
                "Feet together, tape level all the way round",
                "Taking it at the narrowest point, which is several centimetres smaller",
              ],
              [
                "Neck (both)",
                "Just below the larynx, angled slightly down toward the front of the throat",
                "Standing, shoulders relaxed",
                "Riding up over the larynx, which adds centimetres to the wrong side of the equation",
              ],
              [
                "Skinfolds (men)",
                "Chest, abdomen, thigh — vertical folds, 1 cm from the pinch line",
                "Pinch with thumb and forefinger, read at 2 seconds",
                "Reading too early, before the caliper pressure has settled",
              ],
              [
                "Skinfolds (women)",
                "Triceps, suprailiac, thigh — suprailiac taken diagonally",
                "Same side of the body every time",
                "Taking the suprailiac vertically instead of diagonally",
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
            The full landmark list and the ten common mistakes, with what each one costs in points, are on our{" "}
            <a href="/fat-calculator">fat calculator page</a>. This page picks up where that one stops: even
            with perfect technique, the instrument itself throws precision away, and that loss is the subject
            of every table below.
          </p>
        </section>

        <section className="content-block">
          <h2>Your tape has a resolution floor</h2>
          <p>
            The Navy equation is logarithmic in the waist–neck difference, so its sensitivity has a closed
            form: <b>37.35 divided by that difference in centimetres</b> gives the percentage points you move
            per centimetre of waist, for men; the constant is 70.89 for women, whose argument also carries the
            hip. Multiply by the size of one mark on your tape and you have the floor — the smallest change
            your instrument can register.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Tape graduation</span>
              <b>a = 30 cm</b>
              <b>a = 40 cm</b>
              <b>a = 53 cm</b>
              <b>a = 65 cm</b>
            </div>
            {[
              ["1 cm", "1.245", "0.934", "0.705", "0.575"],
              ["0.5 cm", "0.623", "0.467", "0.352", "0.287"],
              ["1 mm (digital)", "0.125", "0.093", "0.070", "0.057"],
              ["1 inch", "3.163", "2.372", "1.790", "1.460"],
              ["1/2 inch", "1.581", "1.186", "0.895", "0.730"],
              ["1/4 inch", "0.791", "0.593", "0.448", "0.365"],
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
            Read the male table at the reference body used throughout this page — 178 cm, 80 kg, 30 years, 92 cm
            waist, 39 cm neck, so a = 53 cm. With a tape marked in whole centimetres, one mark is worth{" "}
            <b>0.705 points</b>. Switching to a 1 mm digital tape drops the floor to 0.070 points, a factor of
            ten. Switching to an inch-marked tape raises it to 1.790 points, which is more than two and a half
            times worse than the centimetre tape — not because inches are worse units, but because the marks
            are further apart.
          </p>
          <p>
            The same computation for women, whose argument is waist + hip − neck:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Tape graduation</span>
              <b>S = 100 cm</b>
              <b>S = 120 cm</b>
              <b>S = 144 cm</b>
              <b>S = 170 cm</b>
            </div>
            {[
              ["1 cm", "0.709", "0.591", "0.492", "0.417"],
              ["0.5 cm", "0.354", "0.295", "0.246", "0.208"],
              ["1 mm (digital)", "0.071", "0.059", "0.049", "0.042"],
              ["1 inch", "1.800", "1.500", "1.250", "1.059"],
              ["1/2 inch", "0.900", "0.750", "0.625", "0.530"],
              ["1/4 inch", "0.450", "0.375", "0.313", "0.265"],
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
            Two structural facts fall out of these grids. First, the floor gets <i>lower</i> as the argument
            gets bigger: the same tape resolves a 170 cm female argument nearly twice as finely as a 100 cm one.
            A tape resolves lean bodies worse than it resolves larger ones, which is the opposite of what most
            people expect. Second, the floor is a property of the tape, not of the body — which is why the
            fix is to buy a better tape, not to measure more often.
          </p>
        </section>

        <section className="content-block">
          <h2>The bracket your instrument can actually report</h2>
          <p>
            A tape reading is not a number, it is a rounding. What you write down as 92 cm means the true
            circumference is somewhere within half a mark of 92. The male Navy argument is a{" "}
            <b>difference</b> of two such roundings, so its error can reach a full mark in either direction; the
            female argument adds hip as a third reading, so it can reach a mark and a half. Propagating that
            through the derivative gives the band of percentages consistent with what you measured.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Tape graduation</span>
              <b>Men ± worst</b>
              <b>Men ± points</b>
              <b>Men ±1.96 SD</b>
              <b>Women ± points</b>
              <b>Women ±1.96 SD</b>
            </div>
            {[
              ["1 cm", "±1.000 cm", "±0.705", "±0.564", "±0.738", "±0.482"],
              ["0.5 cm", "±0.500 cm", "±0.352", "±0.282", "±0.369", "±0.241"],
              ["1 mm (digital)", "±0.100 cm", "±0.070", "±0.056", "±0.074", "±0.048"],
              ["1 inch", "±2.540 cm", "±1.790", "±1.432", "±1.875", "±1.225"],
              ["1/2 inch", "±1.270 cm", "±0.895", "±0.716", "±0.938", "±0.613"],
              ["1/4 inch", "±0.635 cm", "±0.448", "±0.358", "±0.469", "±0.306"],
            ].map((row) => (
              <div className="chart-row chart-row-six" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
                <span>{row[4]}</span>
                <span>{row[5]}</span>
              </div>
            ))}
          </div>
          <p>
            Men are evaluated at a = 53 cm and women at S = 144 cm — the reference bodies. The worst-case
            column is the honest bracket; the 1.96 SD column is what you would quote if you assumed each
            reading&apos;s rounding error is uniform over half a mark and independent, which is the standard
            textbook assumption for rounded data. Both columns are computed here, neither is copied.
          </p>
          <p>
            Applied to the two reference bodies, the brackets are:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Body and tape</span>
              <b>Reported</b>
              <b>Consistent band</b>
              <b>Width</b>
              <b>Fat equivalent</b>
            </div>
            {[
              ["Man 92/39, 1 cm tape — 80 kg", "21.0%", "20.27 – 21.68%", "1.41 pts", "1.40 kg"],
              ["Man 92/39, 0.5 cm tape — 80 kg", "21.0%", "20.62 – 21.33%", "0.70 pts", "0.70 kg"],
              ["Man 92/39, 1 mm tape — 80 kg", "21.0%", "20.91 – 21.05%", "0.14 pts", "0.14 kg"],
              ["Woman 78/98/32, 1 cm tape — 65 kg", "30.7%", "29.99 – 31.47%", "1.48 pts", "1.36 kg"],
              ["Woman 78/98/32, 0.5 cm tape — 65 kg", "30.7%", "30.36 – 31.10%", "0.74 pts", "0.69 kg"],
              ["Woman 78/98/32, 1 mm tape — 65 kg", "30.7%", "30.66 – 30.80%", "0.15 pts", "0.14 kg"],
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
            The last column is the one worth sitting with. A centimetre tape on a 178 cm man cannot distinguish
            21.0% from 21.6%, and the difference between those two numbers is real fat. If your tracking plan
            calls for detecting changes smaller than the bracket, the plan is asking more of a tape than a tape
            can give, and the failure will look like a plateau rather than like a rounding error.
          </p>
        </section>

        <section className="content-block">
          <h2>How many different numbers can your tape produce</h2>
          <p>
            Another way to see the same thing: count the outputs. Sweep the waist across a realistic range in
            steps of one graduation and count how many distinct body fat percentages the equation can return.
            Everything between two adjacent values is unreachable — the tape has no way to say it.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Instrument</span>
              <b>Distinct readings</b>
              <b>Mean step</b>
              <b>Full span</b>
            </div>
            {[
              ["Man, waist 80–110 cm, 1 cm tape", "31", "0.684 pts (0.900 → 0.530)", "11.39 – 31.90%"],
              ["Man, waist 80–110 cm, 0.5 cm tape", "61", "0.342 pts (0.453 → 0.264)", "11.39 – 31.90%"],
              ["Man, waist 80–110 cm, 1 mm tape", "301", "0.068 pts (0.091 → 0.053)", "11.39 – 31.90%"],
              ["Woman, waist 70–110 cm, 1 cm tape", "41", "0.457 pts (0.519 → 0.404)", "26.68 – 44.95%"],
              ["Woman, waist 70–110 cm, 0.5 cm tape", "81", "0.228 pts (0.260 → 0.202)", "26.68 – 44.95%"],
              ["Woman, waist 70–110 cm, 1 mm tape", "401", "0.046 pts (0.052 → 0.040)", "26.68 – 44.95%"],
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
            The span is identical in all three rows of each block — the equation covers the same range no matter
            how finely you measure — but the number of reachable values differs by a factor of ten. Note the
            direction of the step size inside each row: the step is largest at the small end of the waist range
            and smallest at the large end. A tape resolves better on a large waist than on a small one, so the
            leaner you get, the coarser your instrument becomes.
          </p>
          <p>
            Skinfolds behave the same way, and worse, because the caliper is the cruder instrument:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Instrument</span>
              <b>Distinct readings</b>
              <b>Mean step</b>
              <b>Full span</b>
            </div>
            {[
              ["Man, Σ 30–100 mm, 5 mm caliper", "15", "1.372 pts (1.544 → 1.186)", "9.06 – 28.27%"],
              ["Man, Σ 30–100 mm, 2 mm caliper", "36", "0.549 pts (0.620 → 0.471)", "9.06 – 28.27%"],
              ["Man, Σ 30–100 mm, 1 mm caliper", "71", "0.274 pts (0.311 → 0.235)", "9.06 – 28.27%"],
              ["Man, Σ 30–100 mm, 0.1 mm caliper", "701", "0.027 pts (0.031 → 0.023)", "9.06 – 28.27%"],
              ["Woman, Σ 30–100 mm, 5 mm caliper", "15", "1.579 pts (1.839 → 1.294)", "13.66 – 35.76%"],
              ["Woman, Σ 30–100 mm, 1 mm caliper", "71", "0.316 pts (0.371 → 0.255)", "13.66 – 35.76%"],
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
            A caliper read to the nearest 5 mm can only produce fifteen different answers across the whole
            plausible skinfold range, at a mean step of 1.37 points for men. That is the instrument, not the
            technician: no amount of care turns a 5 mm scale into a 1 mm one.
          </p>
        </section>

        <section className="content-block">
          <h2>What one mark is worth in fat</h2>
          <p>
            Points are abstract, so convert them. If fat leaves the body and lean mass stays, weight falls with
            the fat, and the exact relationship is <b>Δ = dF·(1 − BF%) ÷ (W − dF)</b>, which inverts to{" "}
            <b>dF = Δ·W ÷ (1 − BF% + Δ)</b> with Δ in fractions. That gives the kilograms of fat corresponding to
            one mark on your tape.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Mark size</span>
              <b>60 kg</b>
              <b>70 kg</b>
              <b>80 kg</b>
              <b>90 kg</b>
              <b>100 kg</b>
            </div>
            {[
              ["0.25 pts (1 mm tape)", "0.19", "0.22", "0.25", "0.28", "0.31"],
              ["0.50 pts", "0.37", "0.43", "0.50", "0.56", "0.62"],
              ["0.705 pts (1 cm tape)", "0.52", "0.61", "0.70", "0.79", "0.87"],
              ["1.245 pts (1 cm, lean waist)", "0.92", "1.07", "1.23", "1.38", "1.53"],
              ["1.790 pts (1 inch tape)", "1.31", "1.53", "1.75", "1.97", "2.19"],
            ].map((row) => (
              <div className="chart-row chart-row-six" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
                <span>{row[4]}</span>
                <span>{row[5]}</span>
              </div>
            ))}
          </div>
          <p>
            Kilograms of fat at 20% body fat. On the reference man — 80 kg, 1 cm tape — one mark is{" "}
            <b>0.70 kg of fat</b>. On a woman at 65 kg and 30%, whose sensitivity is 0.492 points per
            centimetre, one mark is <b>0.45 kg</b>. If instead you hold weight constant and imagine
            recomposition, the constant-weight conversion dF = W·Δ/100 gives 0.42 kg at 60 kg and 0.70 kg at 100
            kg for the same 0.705-point mark; the two versions differ because one lets the scale move and the
            other does not.
          </p>
          <p>
            That is the practical meaning of the resolution floor. A tape marked in whole centimetres cannot
            see a fat loss smaller than about two thirds of a kilogram on an 80 kg man. Sub-kilogram changes
            are real, they are just below the instrument.
          </p>
        </section>

        <section className="content-block">
          <h2>Switching landmarks is not free</h2>
          <p>
            Protocols disagree about where the waist is: at the navel, at the narrowest point of the torso, or
            midway between the lowest rib and the top of the hip bone. This page takes no position on which
            definition is correct. It prices the difference. Whatever the true displacement d is between the
            landmark you used last month and the one you use today, the reading moves by d multiplied by the
            sensitivity — and that movement will be read as progress or as a stall.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Displacement</span>
              <b>a = 30 cm</b>
              <b>a = 40 cm</b>
              <b>a = 53 cm</b>
              <b>a = 65 cm</b>
              <b>Fat equivalent</b>
            </div>
            {[
              ["1 cm", "1.25", "0.93", "0.70", "0.57", "0.70 kg"],
              ["2 cm", "2.49", "1.87", "1.41", "1.15", "1.40 kg"],
              ["3 cm", "3.74", "2.80", "2.11", "1.72", "2.08 kg"],
              ["4 cm", "4.98", "3.74", "2.82", "2.30", "2.76 kg"],
              ["5 cm", "6.23", "4.67", "3.52", "2.87", "3.41 kg"],
            ].map((row) => (
              <div className="chart-row chart-row-six" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
                <span>{row[4]}</span>
                <b>{row[5]}</b>
              </div>
            ))}
          </div>
          <p>
            Points of body fat for men; the last column converts the a = 53 cm case into kilograms of fat at 80
            kg and the 21.0% that body&apos;s own tape returns. For women at S = 144 cm the same displacements
            are worth 0.49, 0.98, 1.48, 1.97 and 2.46 points, or 0.46, 0.91, 1.36, 1.80 and 2.23 kg of fat at
            65 kg and 30.7%.
          </p>
          <p>
            The severity is worth stating plainly. A two-centimetre difference in where you put the tape —
            entirely plausible between the navel and the narrowest point of a torso — is worth{" "}
            <b>1.41 points</b> on the reference man, which is twice the resolution floor of the tape itself. In
            other words, the landmark choice is a bigger source of error than the instrument, and unlike the
            instrument it is free to fix: write down where you measured, and go back to the same place.
          </p>
        </section>

        <section className="content-block">
          <h2>Calipers: the same problem in millimetres</h2>
          <p>
            The skinfold equations take the <b>sum</b> of three sites, so the caliper&apos;s graduation enters
            three times — and the rounding errors of three independent readings have a standard deviation of
            half a graduation on the total. Sensitivity is also much flatter here than in the tape equation:
            the derivative barely moves across the plausible skinfold range, so the floor is set almost
            entirely by the instrument.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Caliper graduation</span>
              <b>Σ = 30 mm</b>
              <b>Σ = 45 mm</b>
              <b>Σ = 60 mm</b>
              <b>Σ = 80 mm</b>
            </div>
            {[
              ["5 mm", "1.555", "1.482", "1.404", "1.292"],
              ["2 mm", "0.622", "0.593", "0.562", "0.517"],
              ["1 mm", "0.311", "0.296", "0.281", "0.258"],
              ["0.5 mm", "0.156", "0.148", "0.140", "0.129"],
              ["0.1 mm", "0.031", "0.030", "0.028", "0.026"],
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
          <p>Points per mark for men at 30 years old. For women the same grid reads:</p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Caliper graduation</span>
              <b>Σ = 30 mm</b>
              <b>Σ = 45 mm</b>
              <b>Σ = 60 mm</b>
              <b>Σ = 80 mm</b>
            </div>
            {[
              ["5 mm", "1.856", "1.747", "1.628", "1.456"],
              ["2 mm", "0.743", "0.699", "0.651", "0.582"],
              ["1 mm", "0.371", "0.349", "0.326", "0.291"],
              ["0.5 mm", "0.186", "0.175", "0.163", "0.146"],
              ["0.1 mm", "0.037", "0.035", "0.033", "0.029"],
            ].map((row) => (
              <div className="chart-row chart-row-five" key={row[0] + "w"}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
                <span>{row[4]}</span>
              </div>
            ))}
          </div>
          <p>
            And the bracket that follows from it, for a man at 30 years old with a 62 mm three-site sum:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Caliper</span>
              <b>Reported</b>
              <b>Consistent band</b>
              <b>Width</b>
              <b>Fat at 80 kg</b>
            </div>
            {[
              ["5 mm", "18.5%", "16.38 – 20.56%", "4.18 pts", "3.90 kg"],
              ["2 mm", "18.5%", "17.66 – 19.34%", "1.67 pts", "1.61 kg"],
              ["1 mm", "18.5%", "18.09 – 18.92%", "0.84 pts", "0.82 kg"],
              ["0.5 mm", "18.5%", "18.30 – 18.71%", "0.42 pts", "0.41 kg"],
              ["0.1 mm", "18.5%", "18.46 – 18.55%", "0.08 pts", "0.08 kg"],
            ].map((row) => (
              <div className="chart-row chart-row-five" key={row[0] + "b"}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
                <span>{row[4]}</span>
              </div>
            ))}
          </div>
          <p>
            A caliper you read to the nearest 5 mm carries a <b>4.18-point</b> band on that body — nearly three
            times the band of a 1 cm tape, and worth 3.90 kg of fat at 80 kg. The same body, the same
            technician, the same morning; only the scale on the tool differs. For a woman with the same 62 mm
            sum the 5 mm band runs 22.31 – 27.15%, a width of 4.83 points.
          </p>
        </section>

        <section className="content-block">
          <h2>What averaging readings actually buys</h2>
          <p>
            Averaging n independent readings cuts the standard deviation by √n, so the number of readings
            needed to bring rounding noise under a target is (SD ÷ target)². Using the reference male tape
            (a = 53 cm) and a male caliper at Σ = 45 mm:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Instrument</span>
              <b>Rounding SD</b>
              <b>n for ±0.5</b>
              <b>n for ±0.25</b>
              <b>n for ±0.10</b>
              <b>Verdict</b>
            </div>
            {[
              ["Tape 1 cm", "0.288 pts", "1", "2", "9", "Two readings, then stop"],
              ["Tape 0.5 cm", "0.144 pts", "1", "1", "3", "One reading is enough"],
              ["Tape 1 mm", "0.029 pts", "1", "1", "1", "Rounding is irrelevant"],
              ["Tape 1 inch", "0.731 pts", "3", "9", "54", "Buy a better tape"],
              ["Tape 1/2 inch", "0.365 pts", "1", "3", "14", "Three readings"],
              ["Caliper 5 mm", "0.741 pts", "3", "9", "—", "Buy a better caliper"],
              ["Caliper 1 mm", "0.148 pts", "1", "1", "—", "One reading is enough"],
            ].map((row) => (
              <div className="chart-row chart-row-six" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
                <span>{row[4]}</span>
                <span>{row[5]}</span>
              </div>
            ))}
          </div>
          <p>
            Two things follow. Repeating a measurement helps only until the rounding noise falls below the
            other errors in the chain — the slip of the tape, the landmark, the equation itself — and past that
            point it buys nothing. And when the instrument is coarse, averaging is a poor substitute for a
            finer scale: reaching ±0.10 points with an inch-marked tape would take 54 readings of the same
            morning, which is absurd, while a 1 mm tape needs one.
          </p>
        </section>

        <section className="content-block">
          <h2>The unit trap</h2>
          <p>
            The single most common way to get a wildly wrong number at home is to put inches into a
            centimetre field. The equations are not dimensionally guarded — they take logarithms of whatever
            they are given — so a unit mistake produces a plausible-looking percentage instead of an error
            message. Here is what the Navy equation returns for the reference man and woman under each
            mismatch, computed by feeding it the wrong units on purpose:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>What was entered</span>
              <b>Result</b>
              <b>Correct value</b>
              <b>How to spot it</b>
            </div>
            {[
              ["Man: 178 cm, waist 92 cm, neck 39 cm", "21.0%", "—", "The baseline"],
              ["Man: height 70 (inches) with cm waist and neck", "49.4%", "21.0%", "Implausibly high for any tape this size"],
              ["Man: waist 36.2, neck 15.4 (inches) with cm height", "−14.0%", "21.0%", "Negative — the argument went below zero"],
              ["Man: all three entered as inches", "14.4%", "21.0%", "Plausible, and wrong by 6.6 points"],
              ["Woman: 165 cm, 78 cm waist, 98 cm hip, 32 cm neck", "30.7%", "—", "The baseline"],
              ["Woman: height 65 (inches) with cm girths", "70.3%", "30.7%", "Implausibly high"],
              ["Woman: all entered as inches", "4.6%", "30.7%", "Implausibly low"],
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
            The dangerous row is the fourth. Mixing units can produce a number that looks entirely reasonable
            — 14.4% instead of 21.0% — and nothing in the output flags it. The defence is a sanity check
            against something independent: if the tape says 14% and your waist-to-height ratio says otherwise,
            one of them is in the wrong unit.
          </p>
        </section>

        <section className="content-block">
          <h2>How to write your number down</h2>
          <p>
            Recording 21.3% when your tape resolves 0.7 points is writing down digits you did not earn. The
            reporting precision follows directly from the floor: round to the nearest step that your instrument
            can actually distinguish.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Tape</span>
              <b>Resolution floor</b>
              <b>Report to</b>
            </div>
            {[
              ["1 cm", "0.705 pts", "Nearest 1 point — 21%"],
              ["0.5 cm", "0.352 pts", "Nearest 0.5 point — 21.0%"],
              ["1 mm digital", "0.070 pts", "Nearest 0.1 point — 20.98%"],
              ["1 inch", "1.790 pts", "Nearest 2 points — 20% or 22%"],
              ["1/2 inch", "0.895 pts", "Nearest 1 point — 21%"],
              ["1/4 inch", "0.448 pts", "Nearest 0.5 point — 21.0%"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p>
            Evaluated on the reference man; recompute for your own body with the calculator at the top. Better
            still, record the band rather than the point — 20.3 to 21.7% — because that is what the
            measurement actually established.
          </p>
        </section>

        <section className="content-block">
          <h2>Where this page&apos;s arithmetic stops being true</h2>
          <p>
            Every number above is this page&apos;s own arithmetic on two published equations, and each step
            rests on assumptions worth naming:
          </p>
          <ul>
            <li>
              <b>The resolution floor is a floor, not an error bar.</b> It is the precision lost in the
              instrument. The equations themselves carry their own error, which is larger and which this page
              does not attempt to quantify — no home method can tell you how far a given equation sits from the
              truth for you.
            </li>
            <li>
              <b>Rounding is modelled as uniform over half a mark, independently per reading.</b> Real reading
              habits are not uniform: people favour round numbers, and a reader who likes 92 will not produce
              the error distribution assumed here. The SD columns are therefore optimistic.
            </li>
            <li>
              <b>Landmark displacement is treated as a pure shift in centimetres.</b> Moving the tape from the
              navel to the narrowest point changes the circumference, but it may also change which tissue the
              tape encircles; the tables price the shift and nothing else.
            </li>
            <li>
              <b>The fat-mass conversions assume all change is fat.</b> The inversion dF = Δ·W ÷ (1 − BF% + Δ)
              holds lean mass fixed. During recomposition, or during anything that moves water, neither version
              of the conversion describes what happened.
            </li>
            <li>
              <b>Sensitivity is local.</b> Every points-per-mark figure is a derivative evaluated at one
              argument. Move far enough and it changes — the direction is shown in the grids, but a single
              number from the calculator applies only to the body entered.
            </li>
            <li>
              <b>None of this is a claim about the equations themselves.</b> Both are population prediction
              equations fitted on specific groups. This page describes how much precision the tape or the
              caliper destroys before the equation sees the numbers; it says nothing about whether the equation
              was the right one to use.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Frequently asked questions</h2>
          <div className="mini-faq">
            <details open>
              <summary>How do I measure my body fat percentage at home?</summary>
              <p>
                Two practical routes are the Navy tape method — waist, neck and, for women, hip, plus height —
                and the Jackson–Pollock 3-site skinfold method with a caliper. This page runs both, and adds
                the part most guides leave out: the band of values your instrument can actually distinguish,
                which for a tape marked in whole centimetres is about 1.4 points wide on a typical male body.
              </p>
            </details>
            <details>
              <summary>Is a tape or a caliper more precise?</summary>
              <p>
                On the reference bodies computed here, a 1 cm tape has a floor of 0.705 points for men and
                0.492 for women; a 1 mm caliper has a floor of about 0.28 points for men. A caliper read only to
                the nearest 5 mm is far worse than either, at 1.48 points per mark. The instrument&apos;s
                smallest mark decides the answer, not the method.
              </p>
            </details>
            <details>
              <summary>Why does my number jump around when I have not changed?</summary>
              <p>
                Partly rounding — one mark on a centimetre tape is 0.705 points on the reference man — and
                partly landmarks. A two-centimetre change in where you place the tape is worth 1.41 points,
                twice the instrument&apos;s own floor. Fix the landmark first; the tape is the smaller problem.
              </p>
            </details>
            <details>
              <summary>Should I buy a digital tape?</summary>
              <p>
                If you track month to month, yes, and it is the cheapest precision available. Going from 1 cm
                marks to 1 mm cuts the floor tenfold, from 0.705 to 0.070 points, and it removes the averaging
                chore entirely: one reading with a 1 mm tape beats nine readings with a 1 cm one.
              </p>
            </details>
            <details>
              <summary>How many decimal places should I record?</summary>
              <p>
                As many as your instrument supports and no more. A 1 cm tape resolves 0.7 points, so write 21%
                or the band 20.3–21.7%. A 1 mm tape resolves 0.07 points and can carry one decimal honestly.
              </p>
            </details>
            <details>
              <summary>Does averaging three readings help?</summary>
              <p>
                It helps exactly as far as the arithmetic says: with a 1 cm tape on the reference man, one
                reading has a rounding SD of 0.288 points, two bring it under 0.25, and nine are needed to
                reach 0.10. Past the point where rounding falls below your landmark and technique error,
                averaging buys nothing.
              </p>
            </details>
            <details>
              <summary>My result is negative or absurd. What happened?</summary>
              <p>
                Almost always a unit mismatch. Entering 36.2 and 15.4 — inches — into centimetre waist and neck
                fields returns −14.0% for the reference man, because the waist–neck difference collapses. The
                quieter failure is the all-inches case, which returns a believable 14.4% against a true 21.0%.
              </p>
            </details>
            <details>
              <summary>Where exactly should the waist tape go?</summary>
              <p>
                This page follows the convention used across this site: at the navel for men, at the narrowest
                point of the torso for women, with the neck just below the larynx and the hip at its fullest.
                Other protocols define the waist differently. Whichever you choose, choose it once — a 2 cm
                difference between visits is worth 1.41 points. The full landmark list is on our{" "}
                <a href="/fat-calculator">fat calculator</a> page.
              </p>
            </details>
            <details>
              <summary>Is a smart scale better than this?</summary>
              <p>
                It is a third method with a different failure mode: bioelectrical impedance infers composition
                from an electrical signal that moves with hydration, so its error is not reduced by measuring
                more carefully. Our <a href="/scale-bmi">BMI and smart scale page</a> covers what those devices
                actually measure.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/body-fat-calculator">body fat calculator</a> ·{" "}
            <a href="/fat-calculator">fat calculator with error budget</a> ·{" "}
            <a href="/how-to-measure-body-fat-at-home">how to measure body fat at home</a> ·{" "}
            <a href="/navy-body-fat-calculator">Navy body fat calculator</a> ·{" "}
            <a href="/fat-percentage-calculator">fat percentage across three methods</a> ·{" "}
            <a href="/measure-body-fat">measure body fat by age and sex</a> ·{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a>
          </p>
          <p>
            <b>Not medical advice.</b> Every figure on this page is arithmetic this page performs on two
            published prediction equations. It describes precision lost in the instrument and in the protocol;
            it says nothing about how close either equation is to the truth for you. See our{" "}
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
