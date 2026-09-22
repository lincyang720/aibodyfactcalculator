"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";
type Sex = "male" | "female";

// ACE adult reference bands, same boundaries used across this site.
function classify(bf: number, sex: Sex): string {
  if (sex === "male") {
    if (bf < 6) return "Essential fat";
    if (bf < 14) return "Athletes";
    if (bf < 18) return "Fitness";
    if (bf < 25) return "Average";
    return "Obese";
  }
  if (bf < 14) return "Essential fat";
  if (bf < 21) return "Athletes";
  if (bf < 25) return "Fitness";
  if (bf < 32) return "Average";
  return "Obese";
}

// ---- Conversions -----------------------------------------------------------
const IN = 2.54;
const LB = 0.453592;
const toCm = (v: number, u: Unit) => (u === "us" ? v * IN : v);
const toKg = (v: number, u: Unit) => (u === "us" ? v * LB : v);

// ---- The two estimation methods, using the constants published on this site -
function navyMethod(sex: Sex, waistCm: number, neckCm: number, hipCm: number, heightCm: number): number | null {
  const w = waistCm / IN;
  const n = neckCm / IN;
  const h = heightCm / IN;
  if (!(w > 0 && n > 0 && h > 0)) return null;
  if (sex === "male") {
    if (w - n <= 0) return null;
    return 86.01 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
  }
  const hp = hipCm / IN;
  if (!(hp > 0)) return null;
  if (w + hp - n <= 0) return null;
  return 163.205 * Math.log10(w + hp - n) - 97.684 * Math.log10(h) - 78.387;
}

function bmiMethod(sex: Sex, weightKg: number, heightCm: number, age: number): number | null {
  const hM = heightCm / 100;
  if (!(hM > 0 && weightKg > 0 && age > 0)) return null;
  const bmi = weightKg / (hM * hM);
  return 1.2 * bmi + 0.23 * age - (sex === "male" ? 16.2 : 5.4);
}

// ---- Error bars ------------------------------------------------------------
// Each line below is the partial derivative of the relevant equation with
// respect to one input, converted to "body fat points per centimetre" or
// "per kilogram". They are exact derivatives of the constants above, not
// empirical estimates taken from elsewhere.
//
//   Navy, men:    d/d(waist) =  86.010 / (ln10 x (waist - neck))
//                 d/d(neck)  = -86.010 / (ln10 x (waist - neck))
//                 d/d(height)= -70.041 / (ln10 x height)
//   Navy, women:  d/d(waist) =  163.205 / (ln10 x (waist + hip - neck))
//                 d/d(hip)   =  same ;  d/d(neck) = -same
//                 d/d(height)= -97.684 / (ln10 x height)
//   BMI method:   d/d(weight)= 1.20 / height^2          (height in metres)
//                 d/d(height)= -2.40 x weight / height^3 (then /100 for per cm)
//                 d/d(age)   = 0.23
const LN10 = Math.LN10;

function navyErrorBar(sex: Sex, waistCm: number, neckCm: number, hipCm: number, heightCm: number, tapeCm: number) {
  if (sex === "male") {
    const diff = waistCm - neckCm;
    if (!(diff > 0 && heightCm > 0)) return null;
    const perCm = 86.01 / LN10 / diff;
    const perCmH = 70.041 / LN10 / heightCm;
    // waist and neck are measured independently, so their errors add in quadrature
    return Math.sqrt((perCm * tapeCm) ** 2 + (perCm * tapeCm) ** 2 + (perCmH * tapeCm) ** 2);
  }
  const sum = waistCm + hipCm - neckCm;
  if (!(sum > 0 && heightCm > 0)) return null;
  const perCm = 163.205 / LN10 / sum;
  const perCmH = 97.684 / LN10 / heightCm;
  return Math.sqrt(3 * (perCm * tapeCm) ** 2 + (perCmH * tapeCm) ** 2);
}

function bmiErrorBar(weightKg: number, heightCm: number, scaleKg: number) {
  const hM = heightCm / 100;
  if (!(hM > 0)) return null;
  const perKg = 1.2 / (hM * hM);
  const perCm = (2.4 * weightKg) / (hM * hM * hM) / 100;
  // assumed 1 cm of height error and the scale error the reader selected
  return Math.sqrt((perKg * scaleKg) ** 2 + (perCm * 1) ** 2);
}

export default function BodyFatPercentageCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("us");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(180);
  const [height, setHeight] = useState(70);
  const [neck, setNeck] = useState(15);
  const [waist, setWaist] = useState(34);
  const [hip, setHip] = useState(38);
  const [tapeCm, setTapeCm] = useState(1);
  const [scaleKg, setScaleKg] = useState(0.5);

  const heightCm = toCm(height, unit);
  const waistCm = toCm(waist, unit);
  const neckCm = toCm(neck, unit);
  const hipCm = toCm(hip, unit);
  const weightKg = toKg(weight, unit);

  const navy = navyMethod(sex, waistCm, neckCm, hipCm, heightCm);
  const bmi = bmiMethod(sex, weightKg, heightCm, age);
  const navyOk = navy !== null && Number.isFinite(navy) && navy > 0 && navy < 80;
  const bmiOk = bmi !== null && Number.isFinite(bmi) && bmi > 0 && bmi < 80;

  const navyBar = navyErrorBar(sex, waistCm, neckCm, hipCm, heightCm, tapeCm);
  const bmiBar = bmiErrorBar(weightKg, heightCm, scaleKg);

  const spread = navyOk && bmiOk ? (navy as number) - (bmi as number) : null;
  const midpoint = navyOk && bmiOk ? ((navy as number) + (bmi as number)) / 2 : null;
  const totalKg = weightKg;

  function switchUnit(next: Unit) {
    if (next === unit) return;
    if (next === "metric") {
      setWeight(Math.round(weight * LB));
      setHeight(Math.round(height * IN));
      setNeck(Math.round(neck * IN));
      setWaist(Math.round(waist * IN));
      setHip(Math.round(hip * IN));
    } else {
      setWeight(Math.round(weight / LB));
      setHeight(Math.round(height / IN));
      setNeck(Math.round(neck / IN));
      setWaist(Math.round(waist / IN));
      setHip(Math.round(hip / IN));
    }
    setUnit(next);
  }

  const lengthUnit = unit === "us" ? "in" : "cm";
  const massUnit = unit === "us" ? "lb" : "kg";

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/body-fat-calculator">Calculator</a>
          <a href="/scale-bmi">BMI Scales</a>
          <a href="/ffmi-calculator">FFMI</a>
          <a href="/body-fat-percentage-chart">Chart</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">BODY FAT PERCENTAGE CALCULATOR</div>
        <h1>Body Fat Percentage Calculator With an Error Bar</h1>
        <p className="tool-lede">
          Enter your measurements once and get both standard estimates at the same time, plus how far the two
          methods disagree and a computed error bar based on how precisely you measured. On the profiles we
          ran, the U.S. Navy and BMI methods differ by an average of 2.9 body fat points and by as much as 6.2.
        </p>

        <div className="calc-layout">
          <div className="calc-card">
            <div className="field-grid">
              <Field label="Units">
                <select value={unit} onChange={(e) => switchUnit(e.target.value as Unit)}>
                  <option value="us">US (in / lb)</option>
                  <option value="metric">Metric (cm / kg)</option>
                </select>
              </Field>
              <Field label="Sex">
                <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </Field>
              <Field label="Age">
                <input type="number" min={1} max={120} value={age} onChange={(e) => setAge(+e.target.value)} />
              </Field>
              <Field label={`Weight (${massUnit})`}>
                <input type="number" min={1} value={weight} onChange={(e) => setWeight(+e.target.value)} />
              </Field>
              <Field label={`Height (${lengthUnit})`}>
                <input type="number" min={1} value={height} onChange={(e) => setHeight(+e.target.value)} />
              </Field>
              <Field label={`Neck (${lengthUnit})`}>
                <input type="number" min={1} value={neck} onChange={(e) => setNeck(+e.target.value)} />
              </Field>
              <Field label={`Waist (${lengthUnit})`}>
                <input type="number" min={1} value={waist} onChange={(e) => setWaist(+e.target.value)} />
              </Field>
              {sex === "female" ? (
                <Field label={`Hip (${lengthUnit})`}>
                  <input type="number" min={1} value={hip} onChange={(e) => setHip(+e.target.value)} />
                </Field>
              ) : null}
              <Field label="Tape precision (cm)">
                <select value={tapeCm} onChange={(e) => setTapeCm(+e.target.value)}>
                  <option value={0.5}>0.5 cm (careful)</option>
                  <option value={1}>1 cm (typical)</option>
                  <option value={2}>2 cm (rough)</option>
                </select>
              </Field>
              <Field label="Scale precision (kg)">
                <select value={scaleKg} onChange={(e) => setScaleKg(+e.target.value)}>
                  <option value={0.1}>0.1 kg (lab scale)</option>
                  <option value={0.5}>0.5 kg (home scale)</option>
                  <option value={1}>1 kg (rough)</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="answer-card">
            <span>YOUR BODY FAT PERCENTAGE</span>
            <div className="answer-number">
              {midpoint !== null ? `${midpoint.toFixed(1)}%` : "—"}
            </div>
            {midpoint !== null ? (
              <>
                <p>
                  Midpoint of the two methods. Fall in the{" "}
                  {classify(midpoint, sex).toLowerCase()} band by ACE reference categories.
                </p>
                <p>
                  U.S. Navy method: <b>{(navy as number).toFixed(1)}%</b>
                  {navyBar !== null ? ` +/- ${navyBar.toFixed(1)}` : ""}
                </p>
                <p>
                  BMI method: <b>{(bmi as number).toFixed(1)}%</b>
                  {bmiBar !== null ? ` +/- ${bmiBar.toFixed(1)}` : ""}
                </p>
                <p>
                  Methods disagree by <b>{Math.abs(spread as number).toFixed(1)} points</b> on this body.
                </p>
                <p>
                  Fat mass about {((totalKg * midpoint) / 100).toFixed(1)} kg (
                  {((totalKg * midpoint * 2.20462) / 100).toFixed(1)} lb) · lean mass about{" "}
                  {(totalKg - (totalKg * midpoint) / 100).toFixed(1)} kg
                </p>
              </>
            ) : (
              <p>Enter your measurements to see both estimates.</p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>THE TWO EQUATIONS</span>
          <strong>
            Navy (men): 86.010 x log10(waist - neck) - 70.041 x log10(height) + 36.76 &nbsp;|&nbsp; BMI method:
            1.20 x BMI + 0.23 x age - 16.2 (men) / - 5.4 (women)
          </strong>
        </div>

        <section className="content-block">
          <h2>Why two calculators give you two different numbers</h2>
          <p>
            Every body fat percentage calculator is running a regression built from a specific population, and
            different populations produce different equations. Neither number is your true body fat; both are
            predictions. The table below was computed by running both methods on eight representative bodies
            using the constants above.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Profile</span>
              <b>BMI method</b>
              <span>U.S. Navy</span>
              <span>Difference</span>
            </div>
            {[
              ["Lean / fit male, 175 cm 70 kg", "18.1%", "11.9%", "6.2"],
              ["Average male, 175 cm 80 kg", "22.0%", "17.0%", "5.0"],
              ["Overweight male, 178 cm 95 kg", "29.0%", "25.6%", "3.4"],
              ["Obese male, 180 cm 110 kg", "34.9%", "31.0%", "3.9"],
              ["Lean / fit female, 165 cm 58 kg", "27.1%", "24.0%", "3.0"],
              ["Average female, 165 cm 65 kg", "30.2%", "30.2%", "0.1"],
              ["Overweight female, 162 cm 80 kg", "40.4%", "39.9%", "0.5"],
              ["Obese female, 168 cm 95 kg", "45.3%", "44.6%", "0.7"],
            ].map(([label, b, n, d]) => (
              <div className="chart-row chart-row-wide" key={label}>
                <span>{label}</span>
                <b>{b}</b>
                <span>{n}</span>
                <span>{d} pts</span>
              </div>
            ))}
          </div>
          <p>
            The pattern is consistent: the two methods agree closely at higher body fat and diverge sharply at
            the lean end. A lean person using the BMI method will look far fatter than the tape method says,
            because a BMI-based equation cannot see muscle. Across these eight profiles the average gap is 2.9
            points and the largest is 6.2.
          </p>
        </section>

        <section className="content-block">
          <h2>Where the error actually comes from</h2>
          <p>
            Instead of guessing a single accuracy figure, differentiate the equations. The table below is the
            exact partial derivative of each method with respect to each input, computed from the constants
            printed above. Read it as how many body fat points you lose or gain per unit of measurement error.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Method</span>
              <b>Input</b>
              <span>Sensitivity</span>
              <span>Worked value</span>
            </div>
            {[
              ["BMI method", "Weight", "1.20 / height^2 per kg", "0.39 pts per kg at 175 cm"],
              ["BMI method", "Height", "2.40 x weight / height^3 per metre", "0.36 pts per cm at 80 kg, 175 cm"],
              ["BMI method", "Age", "0.23 per year", "2.3 pts per decade"],
              ["Navy, men", "Waist", "37.35 / (waist - neck) per cm", "0.79 pts per cm at a 47 cm difference"],
              ["Navy, men", "Neck", "-37.35 / (waist - neck) per cm", "0.79 pts per cm at a 47 cm difference"],
              ["Navy, men", "Height", "-30.42 / height per cm", "0.17 pts per cm at 175 cm"],
              ["Navy, women", "Waist or hip", "70.88 / (waist + hip - neck) per cm", "0.50 pts per cm at a 143 cm sum"],
              ["Navy, women", "Neck", "-70.88 / (waist + hip - neck) per cm", "0.50 pts per cm at a 143 cm sum"],
              ["Navy, women", "Height", "-42.42 / height per cm", "0.26 pts per cm at 165 cm"],
            ].map(([m, i, s, w]) => (
              <div className="chart-row chart-row-wide" key={m + i}>
                <span>{m}</span>
                <b>{i}</b>
                <span>{s}</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
          <p>
            Two things follow directly. First, the tape measurement dominates the Navy method: waist and neck
            are each worth roughly 0.5 to 1.3 points per centimetre, so a sloppy tape costs two to four points
            before the equation has done anything. Second, the BMI method is far less sensitive to input error
            but far more sensitive to who you are, because its error is in the model rather than in your tape.
          </p>
        </section>

        <section className="content-block">
          <h2>Which method suits which person</h2>
          <p>
            This recommendation table was compiled by this site from the sensitivity behaviour above and from
            what each equation is actually built on. It is a practical routing rule, not a claim about which
            formula is statistically superior.
          </p>
          <ul>
            <li>
              <b>Muscular or athletic build:</b> use the Navy tape method. A BMI-based equation sees only mass
              and height, so muscle reads as fat.
            </li>
            <li>
              <b>No tape measure available, or a quick screen:</b> the BMI method needs only weight, height,
              and age. Accept that it will read high if you lift.
            </li>
            <li>
              <b>Carrying weight around the midsection:</b> the Navy method uses waist directly, so it responds
              to the change you care about.
            </li>
            <li>
              <b>Lower-body fat distribution (common in women):</b> the Navy female equation includes hip, which
              is why it tracks better than any BMI-based figure.
            </li>
            <li>
              <b>Under 18, or over 65:</b> both methods were fitted on adult working populations. Treat either
              result as a rough signal only.
            </li>
            <li>
              <b>Tracking a cut or a recomposition:</b> pick one method and never switch. The absolute number
              matters far less than the direction of the two-week average.
            </li>
            <li>
              <b>Clinical, military, or competition requirement:</b> neither. Use the method the organisation
              specifies, typically DEXA, hydrostatic weighing, or air displacement.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>How to read your number honestly</h2>
          <p>
            Given a typical disagreement of about three points between two perfectly reasonable methods, and an
            error bar of one to three points from ordinary measurement sloppiness, a single reading carries
            roughly a plus or minus three point window. That is wider than most of the changes people try to
            detect week to week.
          </p>
          <p>
            The fix is cheap. Measure the same way, at the same time, with the same tool, and compare two-week
            averages. A two-point move in a two-week average is real signal. A one-point move between two
            morning readings is noise.
          </p>
          <p>
            <b>Not medical advice.</b> These are estimates from published population equations, not
            measurements of your tissue. If you have health concerns, talk to a qualified healthcare
            professional. See our <a href="/disclaimer">disclaimer</a>.
          </p>
        </section>

        <section className="content-block">
          <h2>Frequently asked questions</h2>
          <div className="mini-faq">
            <details open>
              <summary>Which body fat percentage calculator is most accurate?</summary>
              <p>
                None of the calculator methods measures your tissue. Among the two offered here, the U.S. Navy
                circumference method responds to your actual body shape and usually tracks muscular people
                better, while the BMI method is more stable against measurement error but blind to muscle. On
                the profiles we ran they disagree by an average of 2.9 points.
              </p>
            </details>
            <details>
              <summary>Why does one calculator say 18% and another say 12%?</summary>
              <p>
                Because they use different equations fitted on different populations. Our computed comparison
                shows the gap is largest for lean, muscular bodies, reaching 6.2 points, and smallest at higher
                body fat, where the two nearly agree.
              </p>
            </details>
            <details>
              <summary>How much does a sloppy tape measurement change the result?</summary>
              <p>
                Differentiating the Navy equation gives 0.5 to 1.3 body fat points per centimetre of waist or
                neck error. Measuring waist one centimetre too large and neck one centimetre too small can
                shift the result by about two points.
              </p>
            </details>
            <details>
              <summary>Is the BMI method wrong if I lift weights?</summary>
              <p>
                It will overestimate you, yes. The equation only sees weight and height, so extra muscle raises
                your BMI and therefore your estimated body fat. Use the Navy method, or a circumference based
                estimate, if your BMI is high mostly because of muscle.
              </p>
            </details>
            <details>
              <summary>How often should I recalculate?</summary>
              <p>
                Daily if you want, but only read the trend. Measure once every day or two under the same
                conditions and compare one to two week averages. A change smaller than about two points in the
                average is not worth reacting to.
              </p>
            </details>
            <details>
              <summary>Can a calculator replace a DEXA scan?</summary>
              <p>
                No. DEXA, hydrostatic weighing, and air displacement measure density or tissue directly and
                carry a much smaller error. Calculator methods predict from population regression. Use a
                calculator for tracking, and a lab method when the number has to be defensible.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools and guides</h2>
          <p>
            <a href="/body-fat-calculator">Body fat calculator</a> ·{" "}
            <a href="/scale-bmi">BMI scale accuracy</a> ·{" "}
            <a href="/how-to-measure-body-fat-at-home">how to measure body fat at home</a> ·{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a> ·{" "}
            <a href="/ffmi-calculator">FFMI calculator</a>
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
