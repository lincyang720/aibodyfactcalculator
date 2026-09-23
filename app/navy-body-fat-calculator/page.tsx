"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";
type Sex = "male" | "female";

const IN = 2.54;

// The circumference equations used here are the ones this site already runs on
// /body-fat-calculator and /body-fat-percentage-calculator, and they are
// documented in the U.S. Navy Physical Readiness Program. Circumferences go in
// as inches. Nothing else is assumed about any service's administrative limits.
function navyBodyFat(sex: Sex, waistCm: number, neckCm: number, hipCm: number, heightCm: number): number | null {
  const h = heightCm / IN;
  const n = neckCm / IN;
  const w = waistCm / IN;
  if (![h, n, w].every(Number.isFinite)) return null;
  if (h <= 0 || n <= 0 || w <= 0) return null;
  if (sex === "male") {
    if (w - n <= 0) return null;
    return 86.01 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
  }
  const hp = hipCm / IN;
  if (!Number.isFinite(hp) || hp <= 0) return null;
  if (w + hp - n <= 0) return null;
  return 163.205 * Math.log10(w + hp - n) - 97.684 * Math.log10(h) - 78.387;
}

// Inverse of the equation above: the waist circumference that produces a given
// body fat percentage, holding neck (and hip) fixed. Solved algebraically, not
// searched numerically, so every figure in the tables below is exact.
function waistForBodyFat(sex: Sex, bf: number, neckCm: number, hipCm: number, heightCm: number): number | null {
  const h = heightCm / IN;
  const n = neckCm / IN;
  if (h <= 0 || n <= 0) return null;
  if (sex === "male") {
    const d = Math.pow(10, (bf + 70.041 * Math.log10(h) - 36.76) / 86.01);
    return (d + n) * IN;
  }
  const hp = hipCm / IN;
  const d = Math.pow(10, (bf + 97.684 * Math.log10(h) + 78.387) / 163.205);
  return (d + n - hp) * IN;
}

function classifyBodyFat(bf: number, sex: Sex): string {
  if (sex === "male") {
    if (bf < 6) return "Essential fat";
    if (bf < 14) return "Athlete range";
    if (bf < 18) return "Fitness range";
    if (bf < 25) return "Average range";
    return "Above average";
  }
  if (bf < 14) return "Essential fat";
  if (bf < 21) return "Athlete range";
  if (bf < 25) return "Fitness range";
  if (bf < 32) return "Average range";
  return "Above average";
}

const ARMY_LINE = 0.55;

export default function NavyBodyFatCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("us");
  const [sex, setSex] = useState<Sex>("male");
  const [height, setHeight] = useState(70);
  const [waist, setWaist] = useState(34);
  const [neck, setNeck] = useState(15);
  const [hip, setHip] = useState(38);

  const toCm = (v: number) => (unit === "us" ? v * IN : v);

  const heightCm = toCm(height);
  const waistCm = toCm(waist);
  const neckCm = toCm(neck);
  const hipCm = toCm(hip);

  const bf = navyBodyFat(sex, waistCm, neckCm, hipCm, heightCm);
  const bfOk = bf !== null && Number.isFinite(bf) && (bf as number) > 0 && (bf as number) < 80;

  const whtr = heightCm > 0 ? waistCm / heightCm : null;
  const passesArmy = whtr !== null ? whtr < ARMY_LINE : null;
  const limitWaistCm = heightCm * ARMY_LINE;
  const waistGapCm = waistCm - limitWaistCm;

  const waistAt25 = waistForBodyFat("male", 25, neckCm, hipCm, heightCm);
  const waistAt32 = waistForBodyFat("female", 32, neckCm, hipCm, heightCm);

  const lengthUnit = unit === "us" ? "in" : "cm";
  const show = (cm: number) => (unit === "us" ? `${(cm / IN).toFixed(1)} in` : `${cm.toFixed(1)} cm`);

  function switchUnit(next: Unit) {
    if (next === unit) return;
    if (next === "metric") {
      setHeight(Math.round(height * IN));
      setWaist(Math.round(waist * IN));
      setNeck(Math.round(neck * IN));
      setHip(Math.round(hip * IN));
    } else {
      setHeight(Math.round(height / IN));
      setWaist(Math.round(waist / IN));
      setNeck(Math.round(neck / IN));
      setHip(Math.round(hip / IN));
    }
    setUnit(next);
  }

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/army-body-fat-calculator">Army</a>
          <a href="/body-fat-calculator">Body Fat %</a>
          <a href="/body-fat-percentage-calculator">Error Bar</a>
          <a href="/body-fat-percentage-chart">Chart</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">NAVY BODY FAT CALCULATOR</div>
        <h1>Navy Body Fat Calculator</h1>
        <p className="tool-lede">
          Enter one set of tape measurements and get both answers at once: your body fat percentage from the Navy
          circumference equation, and your waist-to-height ratio against the 0.550 Army line described on our{" "}
          <a href="/army-body-fat-calculator">Army calculator page</a>. The two are different tests, they rank
          people differently, and the tables further down show exactly where they disagree.
        </p>

        <div className="calc-layout">
          <div className="calc-card">
            <div className="field-grid">
              <Field label="Units">
                <select value={unit} onChange={(e) => switchUnit(e.target.value as Unit)}>
                  <option value="us">US (in)</option>
                  <option value="metric">Metric (cm)</option>
                </select>
              </Field>
              <Field label="Sex">
                <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </Field>
              <Field label={`Height (${lengthUnit})`}>
                <input type="number" min={1} value={height} onChange={(e) => setHeight(+e.target.value)} />
              </Field>
              <Field label={`Waist at navel (${lengthUnit})`}>
                <input type="number" min={1} value={waist} onChange={(e) => setWaist(+e.target.value)} />
              </Field>
              <Field label={`Neck (${lengthUnit})`}>
                <input type="number" min={1} value={neck} onChange={(e) => setNeck(+e.target.value)} />
              </Field>
              {sex === "female" ? (
                <Field label={`Hip at fullest (${lengthUnit})`}>
                  <input type="number" min={1} value={hip} onChange={(e) => setHip(+e.target.value)} />
                </Field>
              ) : (
                <Field label="Hip (not used)">
                  <input type="number" value={hip} disabled />
                </Field>
              )}
            </div>
          </div>

          <div className="answer-card">
            <span>NAVY BODY FAT PERCENTAGE</span>
            <div className="answer-number">{bfOk ? `${(bf as number).toFixed(1)}%` : "—"}</div>
            {bfOk ? (
              <>
                <p>
                  Category by the standard bands: <b>{classifyBodyFat(bf as number, sex)}</b>. Computed from
                  waist {show(waistCm)}, neck {show(neckCm)}
                  {sex === "female" ? `, hip ${show(hipCm)}` : ""} and height {show(heightCm)}.
                </p>
                {whtr !== null ? (
                  <p>
                    Army waist-to-height ratio: <b>{whtr.toFixed(3)}</b> —{" "}
                    {passesArmy ? (
                      <b>
                        below the 0.550 line, with {show(Math.abs(waistGapCm))} of waist in hand.
                      </b>
                    ) : (
                      <b>
                        at or above the 0.550 line; you would need to drop {show(Math.abs(waistGapCm))} of waist
                        to reach it.
                      </b>
                    )}
                  </p>
                ) : null}
                <p>
                  The waist that puts you exactly on the Army line is <b>{show(limitWaistCm)}</b>.{" "}
                  {sex === "male"
                    ? `Holding your neck fixed, a waist of ${
                        waistAt25 !== null ? show(waistAt25) : "—"
                      } is what the Navy equation reads as 25 percent.`
                    : `Holding your neck and hip fixed, a waist of ${
                        waistAt32 !== null ? show(waistAt32) : "—"
                      } is what the Navy equation reads as 32 percent.`}
                </p>
                <p>
                  At your proportions it takes{" "}
                  <b>
                    {(
                      (sex === "male"
                        ? ((waistCm - neckCm) / 86.01) * Math.log(10)
                        : ((waistCm + hipCm - neckCm) / 163.205) * Math.log(10)) as number
                    ).toFixed(2)}{" "}
                    cm of waist
                  </b>{" "}
                  to move the Navy number by one percentage point, and every centimetre of waist moves your
                  WHtR by <b>{heightCm > 0 ? (1 / heightCm).toFixed(4) : "—"}</b>.
                </p>
              </>
            ) : (
              <p>Enter your height, waist, and neck to see the Navy estimate and the Army ratio.</p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>THE EQUATIONS</span>
          <strong>
            Men: 86.010 × log₁₀(waist − neck) − 70.041 × log₁₀(height) + 36.76 &nbsp;|&nbsp; Women: 163.205 ×
            log₁₀(waist + hip − neck) − 97.684 × log₁₀(height) − 78.387
          </strong>
          <small>
            Circumferences and height in inches. Army WHtR is waist ÷ height in any single unit, recorded
            truncated to three decimals, and must be less than 0.550.
          </small>
        </div>

        <section className="content-block">
          <h2>What the Navy method actually is</h2>
          <p>
            The Navy method is a circumference equation, not a scale reading and not a scan. It takes the
            difference between your waist and your neck, scales it against your height on a log curve, and
            returns an estimated body fat percentage. For women the hip circumference enters the equation
            as well, because lower-body fat distribution is a larger share of total fat for most women.
          </p>
          <p>
            Its appeal is that it needs nothing but a tape measure, and unlike a BMI-derived equation it
            responds to where you carry weight. Its limitation is the same as every circumference method: it
            models you as a set of cylinders, so it is sensitive to tape placement and it cannot tell muscle
            from fat directly. The arithmetic below quantifies that sensitivity instead of hand-waving it.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Method</span>
              <b>What it answers</b>
              <span>Inputs</span>
            </div>
            {[
              ["Navy circumference", "Estimated body fat %", "Waist, neck, hip (women), height"],
              ["Army WHtR (2026)", "Meets / does not meet the ratio standard", "Waist, height"],
              ["BMI method", "Estimated body fat % from mass only", "Weight, height, age, sex"],
            ].map(([a, b, c]) => (
              <div className="chart-row" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-block">
          <h2>Computed: the waist that lands on each body fat percentage</h2>
          <p>
            Most calculators only run the equation forwards. Run it backwards instead and you get a much more
            useful planning number: the waist circumference that corresponds to each body fat target. The
            tables below were produced by algebraically inverting the Navy equation for waist, holding the
            other circumferences at the stated values. They are exact consequences of the published
            constants, not survey averages.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Men, 175 cm tall, neck 38 cm</span>
              <b>Waist (cm)</b>
              <span>Waist (in)</span>
              <span>Note</span>
            </div>
            {[
              ["10% body fat", "77.0", "30.3", "Lean, visible abdominal definition"],
              ["15% body fat", "82.5", "32.5", "Athletic, midsection still flat"],
              ["18% body fat", "86.3", "34.0", "Upper end of the fitness band"],
              ["20% body fat", "88.9", "35.0", "Top of the average-lean boundary"],
              ["25% body fat", "96.2", "37.9", "Top of the average band"],
              ["30% body fat", "104.6", "41.2", "Above average"],
            ].map(([a, b, c, d]) => (
              <div className="chart-row chart-row-wide" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Men, 180 cm tall, neck 40 cm</span>
              <b>Waist (cm)</b>
              <span>Waist (in)</span>
              <span>Note</span>
            </div>
            {[
              ["10% body fat", "79.9", "31.4", "Same percentage, larger tape"],
              ["15% body fat", "85.6", "33.7", "Height and neck both scale up"],
              ["18% body fat", "89.4", "35.2", "Upper end of the fitness band"],
              ["20% body fat", "92.1", "36.3", "Top of the average-lean boundary"],
              ["25% body fat", "99.6", "39.2", "Top of the average band"],
              ["30% body fat", "108.1", "42.6", "Above average"],
            ].map(([a, b, c, d]) => (
              <div className="chart-row chart-row-wide" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Women, 162 cm tall, neck 33 cm, hip 98 cm</span>
              <b>Waist (cm)</b>
              <span>Waist (in)</span>
              <span>Note</span>
            </div>
            {[
              ["20% body fat", "57.4", "22.6", "Athletic"],
              ["25% body fat", "66.4", "26.1", "Fitness band"],
              ["28% body fat", "72.0", "28.4", "Upper fitness"],
              ["30% body fat", "76.0", "29.9", "Average band"],
              ["32% body fat", "80.0", "31.5", "Top of the average band"],
              ["35% body fat", "86.3", "34.0", "Above average"],
            ].map(([a, b, c, d]) => (
              <div className="chart-row chart-row-wide" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
          <p>
            The practical use: pick the percentage you are aiming at and read off the waist. That is a
            tape-measurable target, which a body fat percentage by itself is not.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what the Army line is worth in body fat</h2>
          <p>
            Put a person exactly on the Army limit — waist equal to 0.550 times height — and ask the Navy
            equation what body fat that corresponds to. Neck is held at 38 cm for men, and neck 33 cm with
            hip 98 cm for women, so the only thing changing down the column is height.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Height</span>
              <b>Waist at the 0.550 line</b>
              <span>Men, Navy %</span>
              <span>Women, Navy %</span>
            </div>
            {[
              ["160 cm", "88.0 cm", "22.0", "36.3"],
              ["165 cm", "90.8 cm", "23.1", "36.3"],
              ["170 cm", "93.5 cm", "24.1", "36.3"],
              ["175 cm", "96.3 cm", "25.0", "36.3"],
              ["180 cm", "99.0 cm", "25.9", "36.3"],
              ["185 cm", "101.8 cm", "26.7", "36.3"],
              ["190 cm", "104.5 cm", "27.5", "36.3"],
            ].map(([a, b, c, d]) => (
              <div className="chart-row chart-row-wide" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
          <p>
            Two things fall out of that arithmetic. For men, being exactly on the Army line is a very
            different body composition depending on how tall you are: about 22 percent at 160 cm and about
            27.5 percent at 190 cm, because the ratio scales waist with height while the Navy equation also
            credits height. For women the column is flat at 36.3 percent across the whole height range — the
            height term in the female equation almost exactly cancels the proportional rise in waist. That
            flatness is a property of the equation, not a claim about real bodies.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: eight profiles where the two methods disagree</h2>
          <p>
            These are not real people. They are eight sets of tape numbers put through both calculations so
            you can see how often the two verdicts come apart. Every figure is computed from the equations
            above.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Profile</span>
              <b>WHtR</b>
              <span>Army verdict</span>
              <span>Navy body fat</span>
            </div>
            {[
              ["Male 185 cm, waist 95, neck 41", "0.514", "Passes", "20.5%"],
              ["Male 188 cm, waist 82, neck 38", "0.436", "Passes", "12.4%"],
              ["Male 175 cm, waist 90, neck 38", "0.514", "Passes", "20.8%"],
              ["Male 168 cm, waist 95, neck 39", "0.565", "Does not meet", "24.8%"],
              ["Male 180 cm, waist 99, neck 40", "0.550", "Does not meet", "24.6%"],
              ["Female 168 cm, waist 72, neck 32, hip 95", "0.429", "Passes", "25.4%"],
              ["Female 162 cm, waist 80, neck 33, hip 98", "0.494", "Passes", "32.0%"],
              ["Female 160 cm, waist 88, neck 34, hip 102", "0.550", "Does not meet", "37.7%"],
            ].map(([a, b, c, d]) => (
              <div className="chart-row chart-row-wide" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
          <p>
            The pattern is consistent: waist-to-height ratio punishes short stature and rewards height,
            because it compares one circumference to a length. The Navy equation credits neck and hip, so it
            separates a thick-necked lifter from someone carrying the same waist without the muscle. Someone
            can clear one test and fail the other, which is precisely why you should not use one as a proxy
            for the other.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: how much tape error the numbers can absorb</h2>
          <p>
            Differentiating the Navy equation gives the waist change that equals one body fat point. It is
            not a fixed number: the wider the gap between your waist and neck, the more waist you have to
            move to shift the estimate by a point.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Men: waist − neck</span>
              <b>Waist per 1 body fat point</b>
              <span>In inches</span>
            </div>
            {[
              ["30 cm", "0.80 cm", "0.32 in"],
              ["40 cm", "1.07 cm", "0.42 in"],
              ["50 cm", "1.34 cm", "0.53 in"],
              ["60 cm", "1.61 cm", "0.63 in"],
              ["70 cm", "1.87 cm", "0.74 in"],
            ].map(([a, b, c]) => (
              <div className="chart-row" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <div className="chart-table">
            <div className="chart-row">
              <span>Women: waist + hip − neck</span>
              <b>Waist per 1 body fat point</b>
              <span>In inches</span>
            </div>
            {[
              ["120 cm", "1.69 cm", "0.67 in"],
              ["130 cm", "1.83 cm", "0.72 in"],
              ["140 cm", "1.98 cm", "0.78 in"],
              ["150 cm", "2.12 cm", "0.83 in"],
              ["160 cm", "2.26 cm", "0.89 in"],
            ].map(([a, b, c]) => (
              <div className="chart-row" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <p>
            The Army side is simpler and harsher. One centimetre of waist moves WHtR by 1 divided by your
            height, so at 175 cm a single centimetre of tape error is 0.0057 of ratio — more than half the
            distance between 0.545 and 0.550. If you are within two centimetres of the line, your tape
            technique decides the result more than your body does.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Height</span>
              <b>Waist at the 0.550 line</b>
              <span>WHtR change per 1 cm of waist</span>
            </div>
            {[
              ["155 cm", "85.25 cm", "0.0065"],
              ["160 cm", "88.00 cm", "0.0063"],
              ["165 cm", "90.75 cm", "0.0061"],
              ["170 cm", "93.50 cm", "0.0059"],
              ["175 cm", "96.25 cm", "0.0057"],
              ["180 cm", "99.00 cm", "0.0056"],
              ["185 cm", "101.75 cm", "0.0054"],
              ["190 cm", "104.50 cm", "0.0053"],
            ].map(([a, b, c]) => (
              <div className="chart-row" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-block">
          <h2>How to take the three measurements</h2>
          <ul>
            <li>
              <b>Waist, at the navel.</b> Stand relaxed, exhale normally, and read the tape at the level of
              the navel. Do not suck in, and do not pull the tape tight enough to compress the skin.
            </li>
            <li>
              <b>Neck, below the larynx.</b> Measure at the narrowest point below the Adam&apos;s apple, with
              the tape sloping slightly downward toward the front. This one is chronically measured too low,
              which inflates the male result.
            </li>
            <li>
              <b>Hip, at the fullest point.</b> Women only, for this equation. Feet together, tape around the
              widest part of the buttocks.
            </li>
            <li>
              <b>Repeat each one twice.</b> If two readings differ by more than half a centimetre, take a
              third and use the middle value. Given the sensitivities above, that half centimetre is worth
              roughly half a body fat point.
            </li>
            <li>
              <b>Measure at the same time of day.</b> A large meal or a hard training session changes waist
              circumference by measurable amounts.
            </li>
            <li>
              <b>Track the trend, not the reading.</b> A one-off number carries an error band; the same
              measurement repeated every two weeks carries far more information.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Frequently asked questions</h2>
          <div className="mini-faq">
            <details open>
              <summary>What is the Navy body fat calculator formula?</summary>
              <p>
                For men: 86.010 × log₁₀(waist − neck) − 70.041 × log₁₀(height) + 36.76. For women: 163.205 ×
                log₁₀(waist + hip − neck) − 97.684 × log₁₀(height) − 78.387. All measurements in inches. The
                calculator above runs both, and takes centimetres if you prefer.
              </p>
            </details>
            <details>
              <summary>Is the Navy method accurate?</summary>
              <p>
                It is an estimate built from circumferences, not a measurement of tissue. Its useful property
                is repeatability: measured the same way every time, the change over weeks is more informative
                than the absolute value. Our{" "}
                <a href="/body-fat-percentage-calculator">body fat percentage calculator</a> puts a computed
                error bar around the same equation.
              </p>
            </details>
            <details>
              <summary>Do waist and neck really need to be in inches?</summary>
              <p>
                The published constants are fitted to inches, so the equation must be evaluated in inches. The
                calculator converts centimetres for you before applying them, which is not the same as
                substituting centimetres into the formula.
              </p>
            </details>
            <details>
              <summary>Why does the Navy number differ from my smart scale?</summary>
              <p>
                A consumer scale estimates body fat from bioelectrical impedance, which is driven by your
                hydration state on the day. A circumference equation is driven by your tape measurements. They
                can differ by several points and both still be behaving as designed. See{" "}
                <a href="/scale-bmi">how a BMI scale actually works</a>.
              </p>
            </details>
            <details>
              <summary>Is the Navy method the same as the Army standard?</summary>
              <p>
                No. The Navy circumference equation estimates a percentage. The current Army body composition
                assessment described on our{" "}
                <a href="/army-body-fat-standards-2026">Army standards page</a> is a waist-to-height ratio
                that must be less than 0.550. Different inputs, different output, different purpose.
              </p>
            </details>
            <details>
              <summary>Does this page state any service pass or fail limit?</summary>
              <p>
                No. This page applies the Army waist-to-height figure that our Army pages describe from Army
                public material, and it runs the Navy circumference equation. Administrative limits,
                exemptions, and measurement procedures are set by each service&apos;s own current instruction
                and by your unit. Nothing here determines compliance.
              </p>
            </details>
            <details>
              <summary>How much waist do I need to lose to pass the Army ratio?</summary>
              <p>
                Waist minus 0.550 × height. The answer card above computes it for your own numbers, in
                centimetres or inches. Because one centimetre of waist is worth about 0.006 of ratio at
                average height, aim to be at least two centimetres clear rather than exactly on the line.
              </p>
            </details>
            <details>
              <summary>Which should I use for my own training?</summary>
              <p>
                If your goal is body composition, track the Navy number as a trend and check it against a
                visual estimate. If your goal is a service standard, train against that standard&apos;s own
                measurement, because the tables above show the two do not rank people the same way.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/army-body-fat-calculator">Army body fat calculator</a> ·{" "}
            <a href="/army-body-fat-standards-2026">Army standards 2026</a> ·{" "}
            <a href="/body-fat-calculator">body fat calculator</a> ·{" "}
            <a href="/body-fat-percentage-calculator">body fat percentage with error bar</a> ·{" "}
            <a href="/how-to-measure-body-fat-at-home">measuring body fat at home</a> ·{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a>
          </p>
          <p>
            <b>Not medical advice, and not an official assessment.</b> This is an independent educational
            tool. It is not affiliated with or endorsed by the U.S. Navy, the U.S. Army, the Department of
            Defense, or any other service. Only an official measurement conducted under your service&apos;s
            current procedure determines compliance. See our <a href="/disclaimer">disclaimer</a>.
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
