"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";
type Sex = "male" | "female";
type Source = "navy" | "own" | "bmi";

const IN = 2.54;
const LB = 2.20462;

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

function deurenberg(sex: Sex, bmi: number, age: number): number {
  return 1.2 * bmi + 0.23 * age - 10.8 * (sex === "male" ? 1 : 0) - 5.4;
}

// ---- The two-compartment identity and the four routes that follow from it ----
// W = F + L, BF = F/W. Every route below is an exact inversion, not an approximation.
// A  cut fat only:      x = (F - tW) / (1 - t)          -> lose x kg, weight falls with it
// B  gain lean only:    y = F/t - W                     -> gain y kg, fat untouched
// C  swap at same W:    s = F - tW                      -> lose s fat AND gain s lean
// D  recomposition r:   x = (F - tW) / (1 - t(1 - r))   -> lose x fat, gain r*x lean
function routeCut(f: number, w: number, t: number): number {
  return (f - t * w) / (1 - t);
}
function routeGain(f: number, w: number, t: number): number {
  return f / t - w;
}
function routeSwap(f: number, w: number, t: number): number {
  return f - t * w;
}
function routeRecomp(f: number, w: number, t: number, r: number): number {
  return (f - t * w) / (1 - t * (1 - r));
}

// Fat share of a loss that must be fat for body fat percentage to fall by k points.
function fatShareNeeded(f: number, w: number, t: number, lossKg: number): number {
  return (f - t * (w - lossKg)) / lossKg;
}

function n(x: number, d = 2): string {
  return Number.isFinite(x) ? x.toFixed(d) : "—";
}

export default function BodyCompositionCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(80);
  const [source, setSource] = useState<Source>("navy");
  const [waist, setWaist] = useState(92);
  const [neck, setNeck] = useState(39);
  const [hip, setHip] = useState(98);
  const [ownBf, setOwnBf] = useState(21);
  const [target, setTarget] = useState(16);

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
        ? ownBf
        : bodyOk
          ? deurenberg(sex, bmi, age)
          : NaN;

  const valid = Number.isFinite(bf) && bf > 2 && bf < 70 && bodyOk;
  const frac = valid ? bf / 100 : NaN;
  const W = weightKg;
  const F = valid ? frac * W : NaN;
  const L = valid ? W - F : NaN;

  // What one kilogram is worth, in percentage points, at this exact body.
  const perKgFat = valid ? (100 * L) / (W * W) : NaN; // fat gained, weight rises with it
  const perKgLean = valid ? (100 * F) / (W * W) : NaN; // lean gained, or lean lost (same magnitude)
  const ratio = valid ? L / F : NaN;

  const tOk = target > 2 && target < 70 && target < bf - 0.05;
  const t = target / 100;
  const cut = valid && tOk ? routeCut(F, W, t) : NaN;
  const gain = valid && tOk ? routeGain(F, W, t) : NaN;
  const swap = valid && tOk ? routeSwap(F, W, t) : NaN;
  const recX = valid && tOk ? routeRecomp(F, W, t, 0.5) : NaN;

  // The same scale reading, read two ways.
  const amb = (d: number) => {
    if (!valid || W + d <= 0 || F + d < 0) return { fat: NaN, lean: NaN, spread: NaN };
    const fat = ((F + d) / (W + d)) * 100;
    const lean = (F / (W + d)) * 100;
    return { fat, lean, spread: Math.abs(lean - fat) };
  };
  const a1 = amb(-1);
  const a2 = amb(-2);
  const a5 = amb(-5);

  // Break-even: the share of every lost kilogram that has to be fat just to stand still.
  const breakEven = valid ? bf : NaN;
  const share5 = valid && tOk ? fatShareNeeded(F, W, (bf - 1) / 100, 5) * 100 : NaN;
  const share2 = valid && tOk ? fatShareNeeded(F, W, (bf - 1) / 100, 2) * 100 : NaN;
  const weightAtTarget = valid && tOk ? F / t : NaN;

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

  function fiveLower() {
    if (!valid) return;
    setTarget(Math.max(3, Math.round((bf - 5) * 10) / 10));
  }

  const show = valid;

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/body-fat-calculator">Body Fat %</a>
          <a href="/fat-percentage-calculator">Three Methods</a>
          <a href="/body-recomposition-calculator">Recomposition</a>
          <a href="/ffmi-calculator">FFMI</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">BODY COMPOSITION CALCULATOR</div>
        <h1>Body Composition Calculator</h1>
        <p className="tool-lede">
          Your weight is one number. Your body composition is two — fat mass and lean mass — and the two
          behave completely differently. This page splits your weight into those two compartments and then
          prices every kilogram: how much a kilogram of fat moves your percentage against a kilogram of lean,
          how many kilograms each of four different routes to the same target actually costs, and how far
          apart two honest readings of the same bathroom scale can sit. Everything runs in your browser;
          nothing is uploaded.
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
                  <input type="number" min={3} max={65} step={0.1} value={ownBf} onChange={(e) => setOwnBf(+e.target.value)} />
                </Field>
              ) : null}
              <Field label="Target body fat %">
                <input type="number" min={3} max={65} step={0.1} value={target} onChange={(e) => setTarget(+e.target.value)} />
              </Field>
              {source === "bmi" ? (
                <Field label=" ">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#667067", lineHeight: 1.5 }}>
                    Estimated with the Deurenberg equation from BMI and age. A BMI estimate is not an
                    independent measurement — it is built from the weight you just entered.
                  </span>
                </Field>
              ) : null}
            </div>
            <button className="calc-button" onClick={fiveLower}>
              Set my target 5 points below my current reading
            </button>
          </div>

          <div className="answer-card">
            <span>TWO-COMPARTMENT SPLIT · WITH WHAT EACH KILOGRAM COSTS</span>
            <div className="answer-number">
              {show ? n(bf, 1) : "—"}
              <small>% body fat</small>
            </div>
            {show ? (
              <>
                <p>
                  At {n(W, 1)} {weightLabel} that splits into <b>{n(F, 2)} kg of fat</b> and{" "}
                  <b>{n(L, 2)} kg of lean</b> — {n(F * LB, 1)} lb and {n(L * LB, 1)} lb. Everything below
                  follows from those two numbers and from nothing else.
                </p>
                <p>
                  <b>Your kilogram budget.</b> One kg of fat is worth <b>{n(perKgFat, 3)} points</b> at this
                  body; one kg of lean is worth <b>{n(perKgLean, 3)} points</b>. Fat moves your percentage{" "}
                  <b>{n(ratio, 2)}× harder</b> than lean does, and that ratio is exactly your lean-to-fat
                  mass ratio — nothing else about you enters it.
                </p>
                {tOk ? (
                  <p>
                    <b>Four routes to {n(target, 1)}%.</b> Cut only fat: <b>{n(cut, 2)} kg</b>, leaving you at{" "}
                    {n(W - cut, 1)} kg. Gain only lean: <b>{n(gain, 2)} kg</b>, leaving you at{" "}
                    {n(W + gain, 1)} kg. Swap at your current weight: <b>{n(swap, 2)} kg</b> of fat out and the
                    same {n(swap, 2)} kg of lean in. Or recompose at two-to-one: <b>{n(recX, 2)} kg</b> of fat
                    lost against <b>{n(recX / 2, 2)} kg</b> of lean gained, ending at {n(W - recX + recX / 2, 1)}{" "}
                    kg. Same destination, four very different amounts of work.
                  </p>
                ) : (
                  <p>
                    Set a target below your current reading and the four routes to it appear here — how much
                    fat you would have to lose, how much lean you would have to gain, and what each one does
                    to the number on your scale.
                  </p>
                )}
                <p>
                  <b>What your scale cannot tell you.</b> Lose 2 kg and your body fat could legitimately read
                  anywhere from <b>{n(a2.fat, 2)}%</b> to <b>{n(a2.lean, 2)}%</b> — a{" "}
                  <b>{n(a2.spread, 2)}-point spread</b>, and the two ends point in opposite directions. At 5
                  kg the spread widens to <b>{n(a5.spread, 2)} points</b> ({n(a5.fat, 2)}% to {n(a5.lean, 2)}
                  %). Identical scale readings, different bodies.
                </p>
                <p>
                  <b>The break-even rule.</b> Exactly <b>{n(breakEven, 1)}%</b> of every kilogram you lose has
                  to be fat for your percentage to stand still — that is your current body fat percentage, and
                  it is the same for everybody by algebra, not by observation. Lose 5 kg and{" "}
                  <b>{n(share5, 1)}%</b> of it must be fat to move you down a single point; lose only 2 kg and
                  <b> {n(share2, 1)}%</b> must be.
                </p>
                {Number.isFinite(weightAtTarget) && (
                  <p>
                    Carry your current {n(F, 2)} kg of fat unchanged and you would read {n(target, 1)}% at{" "}
                    <b>{n(weightAtTarget, 1)} kg</b> — that is how much pure lean the muscle route costs.
                  </p>
                )}
              </>
            ) : (
              <p>
                Enter your height and weight, then either the tape measurements, your own body fat reading, or
                let the BMI estimate fill it in. The waist–neck difference must be positive.
              </p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>THE IDENTITY EVERY TABLE ON THIS PAGE COMES FROM</span>
          <strong>
            W = F + L &nbsp;&nbsp;·&nbsp;&nbsp; BF = F ÷ W
            <br />
            A: cut fat only → x = (F − tW) ÷ (1 − t) &nbsp;·&nbsp; B: gain lean only → y = F ÷ t − W
            <br />
            C: swap at fixed weight → s = F − tW &nbsp;·&nbsp; D: recomposition at ratio r → x = (F − tW) ÷ (1
            − t(1 − r))
          </strong>
          <small>
            F is fat mass, L is lean mass, W is body weight, t is the target fraction. All four are exact
            inversions of BF = F ÷ W — no approximation, no fitted constant, no reference population. The same
            identity gives the sensitivity results: one kg of fat moves the percentage by 100·L ÷ W² points and
            one kg of lean by 100·F ÷ W², so their ratio is L ÷ F. And it gives the break-even rule: holding BF
            fixed while losing weight requires the fat share of the loss to equal BF itself. If a body fat
            figure is needed, this page uses the U.S. Navy tape equation — the same one this site uses
            everywhere — or the Deurenberg BMI equation, both published prediction equations. Every table
            below is arithmetic this page performs on that identity. None of it is copied, and none of it is a
            claim about how accurate any equation is.
          </small>
        </div>

        <section className="content-block">
          <h2>Your weight is one number; your composition is two</h2>
          <p>
            A bathroom scale reports W. Body composition is the pair (F, L) that adds up to it, and there are
            infinitely many such pairs. What makes the distinction practical rather than philosophical is that
            the two compartments are not interchangeable: they move your body fat percentage by amounts that
            differ by a factor of four or more on an ordinary body.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>At 80 kg</span>
              <b>Fat mass</b>
              <b>Lean mass</b>
              <b>Difference from 21%</b>
              <b>What the scale reads</b>
            </div>
            {[
              ["8%", "6.40", "73.60", "−10.40 kg fat", "80.0"],
              ["10%", "8.00", "72.00", "−8.80 kg fat", "80.0"],
              ["15%", "12.00", "68.00", "−4.80 kg fat", "80.0"],
              ["20%", "16.00", "64.00", "−0.80 kg fat", "80.0"],
              ["21%", "16.80", "63.20", "—", "80.0"],
              ["25%", "20.00", "60.00", "+3.20 kg fat", "80.0"],
              ["30%", "24.00", "56.00", "+7.20 kg fat", "80.0"],
              ["35%", "28.00", "52.00", "+11.20 kg fat", "80.0"],
              ["40%", "32.00", "48.00", "+15.20 kg fat", "80.0"],
              ["45%", "36.00", "44.00", "+19.20 kg fat", "80.0"],
            ].map((row) => (
              <div className="chart-row chart-row-five" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]} kg</b>
                <span>{row[2]} kg</span>
                <span>{row[3]}</span>
                <span>{row[4]} kg</span>
              </div>
            ))}
          </div>
          <p>
            Two people weighing 80.0 kg, one at 15% and one at 35%, differ by <b>16 kg of fat</b> and 16 kg of
            lean, in opposite directions. The scale cannot see any of it. That gap is roughly the mass of a
            medium suitcase, carried internally, invisible to the only instrument most people own.
          </p>
          <p>
            The same arithmetic run on the reference body used throughout this page — 178 cm, 80 kg, 30 years,
            92 cm waist, 39 cm neck, which the Navy equation puts at <b>21.0%</b> — gives{" "}
            <b>16.78 kg of fat</b> and <b>63.22 kg of lean</b>. Every number below starts there.
          </p>
        </section>

        <section className="content-block">
          <h2>What one kilogram is actually worth</h2>
          <p>
            Differentiate BF = F ÷ W with respect to each compartment and the asymmetry is immediate. Add a
            kilogram of fat and the weight rises with it, so the percentage moves by 100·L ÷ W² points. Add a
            kilogram of lean and it moves by 100·F ÷ W². Divide one by the other and every term cancels except{" "}
            <b>L ÷ F</b> — your lean-to-fat ratio. On the reference body that is 63.22 ÷ 16.78 ={" "}
            <b>3.76</b>, so a kilogram of fat is worth nearly four kilograms of lean.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Body fat</span>
              <b>1 kg of fat</b>
              <b>1 kg of lean</b>
              <b>Fat is worth this much more</b>
            </div>
            {[
              ["10%", "1.1250 pts", "0.1250 pts", "9.0× — at 10% a kilogram of fat is nine kilograms of lean"],
              ["15%", "1.0625", "0.1875", "5.7×"],
              ["20%", "1.0000", "0.2500", "4.0× — exactly four, because lean is exactly four times fat"],
              ["21% (reference)", "0.9875", "0.2625", "3.8×"],
              ["25%", "0.9375", "0.3125", "3.0×"],
              ["30%", "0.8750", "0.3750", "2.3×"],
              ["35%", "0.8125", "0.4375", "1.9×"],
              ["40%", "0.7500", "0.5000", "1.5× — the advantage shrinks as fat grows"],
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
            Evaluated at 80 kg. The pattern is worth stating plainly: the leaner you are, the more a kilogram
            of fat matters and the less a kilogram of lean does. This is the structural reason recomposition
            gets harder as you get leaner — not a motivational claim, just the derivative of a ratio.
          </p>
          <p>
            Because W² sits in the denominator, heavier bodies move less per kilogram:
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Body weight</span>
              <b>Points per kg of fat</b>
              <b>Kilograms to swap one point</b>
            </div>
            {[
              ["60 kg", "1.317", "0.60"],
              ["70 kg", "1.129", "0.70"],
              ["80 kg", "0.988", "0.80"],
              ["90 kg", "0.878", "0.90"],
              ["100 kg", "0.790", "1.00"],
              ["120 kg", "0.658", "1.20"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p>
            Held at 21% body fat. The second column is 79 ÷ W exactly, and the third is W ÷ 100 — a neat
            consequence of the constant-weight swap, where one percentage point always costs one hundredth of
            your body weight, whatever else is true about you.
          </p>
        </section>

        <section className="content-block">
          <h2>Four routes to the same number</h2>
          <p>
            Suppose you want to reach 16% from the reference body&apos;s 21.0%. There is no single answer to
            &quot;how much do I need to lose&quot;, because the answer depends on which compartment moves. Four
            clean routes, each an exact inversion of the same identity:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Drop</span>
              <b>Cut fat only</b>
              <b>Gain lean only</b>
              <b>Swap at 80 kg</b>
              <b>Recomp 2:1</b>
              <b>Ending weight</b>
            </div>
            {[
              ["1 pt → 20.0%", "1.00 kg", "4.00 kg", "0.80 kg", "0.89 / 0.44", "79.0 / 84.0 / 80.0 / 79.6"],
              ["2 pt → 19.0%", "1.98", "8.43", "1.60", "1.77 / 0.88", "78.0 / 88.4 / 80.0 / 79.1"],
              ["3 pt → 18.0%", "2.93", "13.35", "2.40", "2.64 / 1.32", "77.1 / 93.3 / 80.0 / 78.7"],
              ["5 pt → 16.0%", "4.76", "25.03", "4.00", "4.35 / 2.17", "75.2 / 105.0 / 80.0 / 77.8"],
              ["10 pt → 11.0%", "8.99", "72.87", "8.00", "8.47 / 4.23", "71.0 / 152.9 / 80.0 / 75.8"],
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
            The ending-weight column lists the four routes in order: cut, gain, swap, recompose. Read the
            5-point row. Losing <b>4.76 kg</b> of fat gets there. So does gaining <b>25.03 kg</b> of lean while
            touching no fat at all — a quarter of a person&apos;s body weight in new muscle, which is why this
            route belongs in the table as arithmetic and not as advice. Holding weight constant and swapping
            4.00 kg is cheaper still. And losing 4.35 kg of fat while adding 2.17 kg of lean lands at 77.8 kg.
          </p>
          <p>
            The same computation for one point, across starting points, shows why the lean route is so
            sensitive to where you begin:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Starting body fat</span>
              <b>Cut fat</b>
              <b>Gain lean</b>
              <b>Swap at fixed weight</b>
            </div>
            {[
              ["10%", "0.879 kg", "8.889 kg", "0.800 kg — always W ÷ 100, independent of where you start"],
              ["15%", "0.930", "5.714", "0.800"],
              ["20%", "0.988", "4.211", "0.800"],
              ["25%", "1.053", "3.333", "0.800"],
              ["30%", "1.127", "2.759", "0.800"],
              ["35%", "1.212", "2.353", "0.800"],
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
            At 80 kg. Two things stand out. The cut route barely changes across the whole range — between 0.88
            and 1.21 kg per point — while the lean route swings from <b>2.35 kg to 8.89 kg</b>, a factor of
            nearly four, and in the opposite direction: the leaner you are, the more muscle each point costs
            you. And the swap column never moves at all, because at constant weight a percentage point is
            always one hundredth of the body, whatever the body is made of.
          </p>
          <p>
            For the female reference body — 165 cm, 65 kg, 30 years, 78 cm waist, 98 cm hip, 32 cm neck, which
            the Navy equation puts at <b>30.7%</b>:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Drop</span>
              <b>Cut fat only</b>
              <b>Gain lean only</b>
              <b>Swap at 65 kg</b>
              <b>Ending weight</b>
            </div>
            {[
              ["1 pt → 29.7%", "0.93 kg", "2.19 kg", "0.65 kg", "64.1 / 67.2 / 65.0"],
              ["3 pt → 27.7%", "2.70", "7.03", "1.95", "62.3 / 72.0 / 65.0"],
              ["5 pt → 25.7%", "4.38", "12.63", "3.25", "60.6 / 77.6 / 65.0"],
              ["10 pt → 20.7%", "8.20", "31.35", "6.50", "56.8 / 96.4 / 65.0"],
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
            The same shape, shifted. Because she starts at a higher percentage, her lean-to-fat ratio is lower
            (45.05 ÷ 19.96 = 2.26), so the gap between the routes narrows: 4.38 kg cut against 12.63 kg gained
            for five points, versus 4.76 against 25.03 on the male reference body.
          </p>
        </section>

        <section className="content-block">
          <h2>The same kilogram, read two ways</h2>
          <p>
            Here is the part that makes weight-only tracking unreliable. Take the reference body at 80 kg and
            21.0%, and suppose the scale goes down. Nothing about the number on the scale says which
            compartment the mass came from, so the honest answer is a range, not a point.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Change on the scale</span>
              <b>All of it fat</b>
              <b>Half and half</b>
              <b>None of it fat</b>
            </div>
            {[
              ["−0.5 kg", "20.48%", "20.80%", "21.11%", "spread 0.63 pts"],
              ["−1 kg", "19.98%", "20.61%", "21.24%", "spread 1.27 pts"],
              ["−2 kg", "18.95%", "20.23%", "21.52%", "spread 2.56 pts"],
              ["−3 kg", "17.90%", "19.85%", "21.80%", "spread 3.90 pts"],
              ["−5 kg", "15.71%", "19.04%", "22.38%", "spread 6.67 pts"],
              ["+1 kg", "21.95%", "21.34%", "20.72%", "spread 1.24 pts"],
              ["+2 kg", "22.91%", "21.69%", "20.47%", "spread 2.44 pts"],
              ["+5 kg", "25.63%", "22.69%", "19.74%", "spread 5.88 pts"],
            ].map((row) => (
              <div className="chart-row chart-row-wide" key={row[0]}>
                <span>
                  {row[0]} <span style={{ color: "#728f28" }}>{row[4]}</span>
                </span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <p>
            Read the −2 kg row carefully. If both kilograms were fat, body composition improved to{" "}
            <b>18.95%</b>. If neither was — if it was water, glycogen and a little lean tissue — body
            composition got <i>worse</i>, to <b>21.52%</b>. Same scale, same two kilograms, and the two honest
            readings sit <b>2.56 points</b> apart on opposite sides of where you started. A −5 kg month spans{" "}
            <b>6.67 points</b>, from 15.71% to 22.38%.
          </p>
          <p>
            The spread scales with how much weight moved and shrinks as the body gets heavier:
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Body weight</span>
              <b>Spread for −1 kg</b>
              <b>Spread for −5 kg</b>
            </div>
            {[
              ["60 kg", "1.69 pts", "9.09 pts"],
              ["70 kg", "1.45", "7.69"],
              ["80 kg", "1.27", "6.67"],
              ["90 kg", "1.12", "5.88"],
              ["100 kg", "1.01", "5.26"],
              ["120 kg", "0.84", "4.35"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p>
            Held at 21% body fat. A lighter body is more sensitive to the same ambiguity, which is the same
            finding as before, wearing different clothes: every composition statement gets noisier as you get
            leaner.
          </p>
          <p>
            Put the other way round — fix the loss at 5 kg and vary what it was made of — the outcome spans a
            range most people would find shocking:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Fat share of the 5 kg</span>
              <b>Fat left</b>
              <b>Lean left</b>
              <b>Body fat at 75 kg</b>
            </div>
            {[
              ["100% — a textbook perfect cut", "11.78 kg", "63.22 kg", "15.71%"],
              ["75%", "13.03 kg", "61.97 kg", "17.38%"],
              ["50%", "14.28 kg", "60.72 kg", "19.04%"],
              ["21% — exactly your starting percentage", "15.73 kg", "59.27 kg", "20.98%"],
              ["0% — all water and lean", "16.78 kg", "58.22 kg", "22.38%"],
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
            Five kilograms lost, five different bodies, from 15.71% to 22.38%. The middle row is the one to
            remember: lose exactly 21% of the weight as fat — your starting percentage — and your body fat
            percentage does not move at all.
          </p>
        </section>

        <section className="content-block">
          <h2>How much of what you lose has to be fat</h2>
          <p>
            That last row is not a coincidence, and it generalises. Set BF constant while weight falls and the
            algebra gives the required fat share directly: <b>p = BF</b>. If 21% of every kilogram you lose is
            fat, your percentage holds; below that it rises no matter what the scale says.
          </p>
          <p>
            Reaching further, the share needed to actually <i>drop</i> k points while losing Δ kilograms is{" "}
            <b>p = (F − t·(W − Δ)) ÷ Δ</b> with t the target fraction. Values above 100% are impossible — they
            mean the loss is too small to deliver that drop however perfectly it is composed.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Total loss</span>
              <b>Drop 1 pt</b>
              <b>Drop 2 pts</b>
              <b>Drop 3 pts</b>
              <b>Drop 5 pts</b>
            </div>
            {[
              ["1 kg", "100.0%", "impossible (179%)", "impossible (258%)", "impossible (416%)"],
              ["2 kg", "60.0%", "99.0%", "impossible (138%)", "impossible (216%)"],
              ["3 kg", "46.7%", "72.3%", "98.0%", "impossible (149%)"],
              ["5 kg", "36.0%", "51.0%", "66.0%", "96.0%"],
              ["10 kg", "28.0%", "35.0%", "42.0%", "56.0%"],
              ["20 kg", "24.0%", "27.0%", "30.0%", "36.0%"],
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
            Computed on the reference body, 80 kg at 21.0%. The table has a clear shape: the faster the loss,
            the more of it must be fat, and as the loss grows the requirement falls toward the target
            percentage as its floor — 20% is the asymptote for the 1-point column, 16% for the 5-point column,
            and no amount of scale movement gets you below it.
          </p>
          <p>
            The top-left cell is the practically important one. Losing a single kilogram and expecting your
            body fat percentage to fall by a point requires <b>100%</b> of that kilogram to be fat. That is
            not a demanding standard, it is an unreachable one — and it is why a week of good adherence so
            often produces no visible change in the percentage even when the scale cooperates.
          </p>
        </section>

        <section className="content-block">
          <h2>The weight window that hides a percentage</h2>
          <p>
            Invert the identity once more and ask a different question: over what range of scale readings
            would your body fat sit within one point of where it is now? The answer depends entirely on which
            compartment is doing the moving — and the two answers are wildly different sizes.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-six">
              <span>Body fat</span>
              <b>If the change is fat</b>
              <b>Width</b>
              <b>If the change is lean</b>
              <b>Width</b>
              <b>Ratio</b>
            </div>
            {[
              ["10%", "79.12 – 80.90 kg", "1.78", "72.73 – 88.89 kg", "16.16", "9.09"],
              ["15%", "79.07 – 80.95", "1.88", "75.00 – 85.71", "10.71", "5.69"],
              ["20%", "79.01 – 81.01", "2.00", "76.19 – 84.21", "8.02", "4.01"],
              ["21%", "79.00 – 81.03", "2.03", "76.36 – 84.00", "7.64", "3.77"],
              ["25%", "78.95 – 81.08", "2.13", "76.92 – 83.33", "6.41", "3.00"],
              ["30%", "78.87 – 81.16", "2.29", "77.42 – 82.76", "5.34", "2.34"],
              ["40%", "78.69 – 81.36", "2.67", "78.05 – 82.05", "4.00", "1.50"],
            ].map((row) => (
              <div className="chart-row chart-row-six" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]} kg</span>
                <span>{row[3]}</span>
                <span>{row[4]} kg</span>
                <span>{row[5]}×</span>
              </div>
            ))}
          </div>
          <p>
            At 80 kg. On the reference body, a ±1 point band in body fat corresponds to a <b>2.03 kg</b> window
            in weight if fat is what changed, but a <b>7.64 kg</b> window if lean is — and the lean window runs{" "}
            <i>backwards</i>: weighing more means a lower percentage. Weigh 80.5 kg having gained 0.5 kg and
            you are at 20.87% if it was lean, 21.49% if it was fat. The scale moved the same half kilogram in
            both cases; body composition moved in opposite directions.
          </p>
          <p>
            The final column is the same L ÷ F ratio as before, appearing in a completely different
            derivation — 3.77 against 3.76, agreeing to rounding. That repetition is the useful thing about
            working from an identity: the same structural constant keeps surfacing, so one number you compute
            yourself can be checked against another.
          </p>
        </section>

        <section className="content-block">
          <h2>How to use this without fooling yourself</h2>
          <p>
            None of the arithmetic above requires a better scale. It requires a second number. The practical
            consequences, in the order they matter:
          </p>
          <ul>
            <li>
              <b>Track two things, not one.</b> Weight alone cannot distinguish 18.95% from 21.52% after a
              2 kg drop. A tape measurement, a skinfold, a scale that reports composition, or a photo —
              anything that supplies the second equation.
            </li>
            <li>
              <b>Judge a cut by the fat share, not by the kilograms.</b> Below 21% of the loss being fat on
              the reference body, the percentage rises while the scale falls. The break-even share is your own
              current body fat percentage.
            </li>
            <li>
              <b>Expect the lean route to be expensive.</b> Holding fat fixed, one percentage point costs
              4 kg of new lean at 21% on an 80 kg body — and 8.89 kg if you are already at 10%. Losing the
              fat is almost always the shorter path to the same number.
            </li>
            <li>
              <b>Weight the swap route honestly.</b> At constant weight a point always costs W ÷ 100 kg —
              0.80 kg on an 80 kg body, at any starting body fat. It is the one figure here that does not
              depend on where you begin, which makes it a useful planning constant.
            </li>
            <li>
              <b>Do not over-read small losses.</b> Dropping one point while losing one kilogram needs 100%
              of that kilogram to be fat. Give a change enough mass, or enough time, before calling it a
              result.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Where this page&apos;s arithmetic stops being true</h2>
          <p>
            Every figure above is this page&apos;s own algebra on the identity W = F + L, plus — where a body
            fat number is needed — one published prediction equation. The assumptions worth naming:
          </p>
          <ul>
            <li>
              <b>Two compartments is a model, not anatomy.</b> Lean mass is itself water, protein, mineral and
              glycogen, and those move independently on short timescales. A two-compartment split cannot
              distinguish a change in muscle from a change in hydration, which is precisely the confusion the
              tables above are pricing.
            </li>
            <li>
              <b>The routes are arithmetic, not physiology.</b> Gaining 25 kg of lean to move five points is a
              valid solution to the equation and not a plausible human plan. The table shows what the
              identity permits; it says nothing about what a body will do.
            </li>
            <li>
              <b>Where a percentage is needed, it comes from a prediction equation.</b> The Navy tape
              equation and the Deurenberg BMI equation are population fits with their own error. Every
              conclusion here inherits that error: the algebra is exact, the input is not.
            </li>
            <li>
              <b>The BMI estimate is not independent.</b> Choose that source and body fat is derived from the
              same height and weight that set W, so the two-compartment split is algebraically tied to BMI.
              Anything computed from it will agree with BMI by construction.
            </li>
            <li>
              <b>Sensitivities are local.</b> Each points-per-kilogram figure is a derivative evaluated at one
              body. Move several kilograms and it changes — the direction is visible in the grids, but a single
              number from the calculator applies only to the body entered.
            </li>
            <li>
              <b>No health claim is being made.</b> Fat mass and lean mass are quantities, not diagnoses.
              Where fat is stored, and what it does, is a different question from how much of it there is.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Frequently asked questions</h2>
          <div className="mini-faq">
            <details open>
              <summary>What is body composition?</summary>
              <p>
                The split of body weight into fat mass and lean mass. Two people of identical weight can
                differ enormously: at 80 kg, one at 15% and one at 35% differ by 16 kg of fat and 16 kg of
                lean, and a bathroom scale reads the same number for both. This page computes the split and
                then prices what each kilogram of either compartment is worth.
              </p>
            </details>
            <details>
              <summary>How much fat do I need to lose to drop one percentage point?</summary>
              <p>
                On the reference body — 80 kg at 21% — losing 1.00 kg of fat drops you one point. The amount
                depends almost entirely on your weight and barely at all on your starting body fat: it runs
                0.88 kg at 10% to 1.21 kg at 35% on an 80 kg body, and scales roughly with weight.
              </p>
            </details>
            <details>
              <summary>Can I lower my body fat percentage by gaining muscle instead?</summary>
              <p>
                Arithmetically yes, and the identity says exactly how much: at 21% and 80 kg, holding fat
                fixed, one point costs 4.00 kg of new lean, and five points cost 25.03 kg. Because the lean
                route gets steeper as you get leaner — 8.89 kg per point at 10% — losing fat is the shorter
                path for nearly everyone.
              </p>
            </details>
            <details>
              <summary>Why did my body fat percentage go up when I lost weight?</summary>
              <p>
                Because less than 21% of what you lost was fat, if you started at 21%. The break-even share of
                every lost kilogram is exactly your current body fat percentage — that falls out of the algebra
                rather than from any study. Lose 5 kg with only 10% of it fat and your percentage rises from
                21.0% to somewhere near 22.4%.
              </p>
            </details>
            <details>
              <summary>How accurate is a body composition calculator?</summary>
              <p>
                The arithmetic on this page is exact. The body fat percentage fed into it is not: it comes
                from a prediction equation or from your own device, each with its own error. That error
                propagates into the fat and lean split one-for-one, so treat the split as an estimate and the
                routes below as planning arithmetic.
              </p>
            </details>
            <details>
              <summary>What is a good body fat percentage?</summary>
              <p>
                There is no single number, and reference ranges differ by who publishes them and by whether
                they stratify by age. Our{" "}
                <a href="/body-fat-percentage-chart-men-women-age">body fat percentage chart by age and sex</a>{" "}
                lays out several published sets side by side so you can see how much they disagree.
              </p>
            </details>
            <details>
              <summary>Is body composition the same as BMI?</summary>
              <p>
                No. BMI is weight divided by height squared — one input, no composition. Two bodies with
                identical BMI can sit at very different body fat percentages, which is why BMI misclassifies
                muscular people and, in the other direction, people with low lean mass. Our{" "}
                <a href="/obese-scale">obese scale page</a> works through those disagreements numerically.
              </p>
            </details>
            <details>
              <summary>How often should I measure?</summary>
              <p>
                Often enough to average, rarely enough to avoid chasing noise. Because a 2 kg drop is
                consistent with anything from 18.95% to 21.52% depending on the compartment, a single reading
                cannot resolve the question. Weekly measurements averaged over a month will tell you far more
                than daily ones.
              </p>
            </details>
            <details>
              <summary>What is the difference between fat mass and body fat percentage?</summary>
              <p>
                Fat mass is kilograms; percentage is that mass divided by total weight. They can move in
                opposite directions — gain lean and fat mass stays put while the percentage falls. The four
                routes table above is built entirely on that distinction: the same percentage can be reached
                by removing fat, by adding lean, or by both.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>The rest of this site&apos;s composition tools</h2>
          <p>
            Each of these works on the same two numbers from a different direction — pick the one that matches
            the question you actually have.
          </p>
          <div className="related-grid">
            <a href="/body-fat-calculator">
              <span>START HERE</span>
              <strong>Body Fat Calculator</strong>
              <i>→</i>
            </a>
            <a href="/fat-percentage-calculator">
              <span>METHOD SPREAD</span>
              <strong>Fat Percentage Calculator</strong>
              <i>→</i>
            </a>
            <a href="/body-recomposition-calculator">
              <span>ENERGY SIDE</span>
              <strong>Body Recomposition Calculator</strong>
              <i>→</i>
            </a>
            <a href="/ffmi-calculator">
              <span>LEAN MASS</span>
              <strong>FFMI Calculator</strong>
              <i>→</i>
            </a>
            <a href="/measure-body-fat">
              <span>AGE AND SEX</span>
              <strong>Measure Body Fat</strong>
              <i>→</i>
            </a>
            <a href="/how-to-measure-body-fat-at-home">
              <span>TECHNIQUE</span>
              <strong>How to Measure Body Fat at Home</strong>
              <i>→</i>
            </a>
          </div>
          <p>
            <b>Not medical advice.</b> Every figure on this page is arithmetic this page performs on the
            identity W = F + L, with body fat supplied by a published prediction equation where a percentage
            is needed. The algebra is exact; the measurements you feed it are not. See our{" "}
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
