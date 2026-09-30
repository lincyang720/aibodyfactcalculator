"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";
type Sex = "male" | "female";

const IN = 2.54;
const LB = 2.20462;

// ---- Published prediction equations, identical to the ones used elsewhere on this site ----
function navyTape(sex: Sex, waistCm: number, neckCm: number, hipCm: number, heightCm: number): number {
  const h = heightCm / IN;
  if (sex === "male") {
    const a = (waistCm - neckCm) / IN;
    return 86.01 * Math.log10(a) - 70.041 * Math.log10(h) + 36.76;
  }
  const a = (waistCm + hipCm - neckCm) / IN;
  return 163.205 * Math.log10(a) - 97.684 * Math.log10(h) - 78.387;
}

function deurenberg(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const bmi = weightKg / (heightCm / 100) ** 2;
  return 1.2 * bmi + 0.23 * age - 10.8 * (sex === "male" ? 1 : 0) - 5.4;
}

function jp3(sex: Sex, sum: number, age: number): { bd: number; bf: number } {
  const bd =
    sex === "male"
      ? 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age
      : 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age;
  return { bd, bf: 495 / bd - 450 };
}

// ---- Inverses: what another method would have had to see to reach the same number ----
// Waist (cm) at which the Navy equation returns a given body fat percentage.
function waistForNavy(sex: Sex, bf: number, neckCm: number, hipCm: number, heightCm: number): number {
  const h = heightCm / IN;
  if (sex === "male") {
    const a = 10 ** ((bf + 70.041 * Math.log10(h) - 36.76) / 86.01);
    return a * IN + neckCm;
  }
  const a = 10 ** ((bf + 97.684 * Math.log10(h) + 78.387) / 163.205);
  return a * IN + neckCm - hipCm;
}

// Weight (kg) at which the BMI equation returns a given body fat percentage.
function weightForDeurenberg(sex: Sex, bf: number, heightCm: number, age: number): number {
  const bmi = (bf + 10.8 * (sex === "male" ? 1 : 0) + 5.4 - 0.23 * age) / 1.2;
  return bmi * (heightCm / 100) ** 2;
}

// Three-site skinfold sum (mm) that reproduces a given body fat percentage.
// Solves the Jackson-Pollock quadratic after substituting Siri; the smaller root is the physical one.
function sumForBf(sex: Sex, bf: number, age: number): number {
  const bd = 495 / (bf + 450);
  if (sex === "male") {
    const A = 0.0000016;
    const B = -0.0008267;
    const C = 1.10938 - 0.0002574 * age - bd;
    const disc = B * B - 4 * A * C;
    if (disc < 0) return NaN;
    return (-B - Math.sqrt(disc)) / (2 * A);
  }
  const A = 0.0000023;
  const B = -0.0009929;
  const C = 1.0994921 - 0.0001392 * age - bd;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return NaN;
  return (-B - Math.sqrt(disc)) / (2 * A);
}

export default function FatPercentageCalculatorPage() {
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

  const heightCm = unit === "us" ? height * IN : height;
  const weightKg = unit === "us" ? weight / LB : weight;
  const waistCm = unit === "us" ? waist * IN : waist;
  const neckCm = unit === "us" ? neck * IN : neck;
  const hipCm = unit === "us" ? hip * IN : hip;

  const lengthLabel = unit === "us" ? "in" : "cm";
  const weightLabel = unit === "us" ? "lb" : "kg";

  const sum = siteA + siteB + siteC;
  const tapeOk = sex === "male" ? waistCm - neckCm > 5 : waistCm + hipCm - neckCm > 20;
  const bodyOk = heightCm > 100 && heightCm < 250 && weightKg > 25 && weightKg < 300 && age > 10 && age < 95;
  const skinOk = sum > 8 && sum < 260;

  const navy = tapeOk && bodyOk ? navyTape(sex, waistCm, neckCm, hipCm, heightCm) : NaN;
  const deu = bodyOk ? deurenberg(sex, weightKg, heightCm, age) : NaN;
  const jp = skinOk && age > 10 && age < 95 ? jp3(sex, sum, age).bf : NaN;

  const values = [navy, deu, jp].filter((v) => Number.isFinite(v));
  const ok = values.length >= 2 && bodyOk;
  const sorted = values.slice().sort((a, b) => a - b);
  const lo = sorted[0];
  const hi = sorted[sorted.length - 1];
  const spread = hi - lo;
  const median = sorted.length === 3 ? sorted[1] : (lo + hi) / 2;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd =
    values.length >= 2
      ? Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1))
      : NaN;

  const fatKgLo = (weightKg * lo) / 100;
  const fatKgHi = (weightKg * hi) / 100;

  // Cross-method translations: what each method would have had to see.
  const agreeWaist = Number.isFinite(deu) && bodyOk ? waistForNavy(sex, deu, neckCm, hipCm, heightCm) : NaN;
  const agreeWeight = Number.isFinite(navy) && bodyOk ? weightForDeurenberg(sex, navy, heightCm, age) : NaN;
  const navySum = Number.isFinite(navy) ? sumForBf(sex, navy, age) : NaN;
  const deuSum = Number.isFinite(deu) ? sumForBf(sex, deu, age) : NaN;

  const waistGap = Number.isFinite(agreeWaist) ? waistCm - agreeWaist : NaN;
  const weightGap = Number.isFinite(agreeWeight) ? weightKg - agreeWeight : NaN;
  const sumGap = Number.isFinite(navySum) ? sum - navySum : NaN;

  const nFor = (target: number) => (Number.isFinite(sd) && sd > 0 ? Math.ceil((1.96 * sd) / target) ** 2 : NaN);

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

  const caliperLabels: [string, string, string] =
    sex === "male"
      ? ["Chest skinfold (mm)", "Abdomen skinfold (mm)", "Thigh skinfold (mm)"]
      : ["Triceps skinfold (mm)", "Suprailiac skinfold (mm)", "Thigh skinfold (mm)"];

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/body-fat-calculator">Body Fat %</a>
          <a href="/fat-calculator">Fat Calculator</a>
          <a href="/navy-body-fat-calculator">Navy</a>
          <a href="/body-fat-percentage-chart">Chart</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">FAT PERCENTAGE CALCULATOR</div>
        <h1>Fat Percentage Calculator</h1>
        <p className="tool-lede">
          Most fat percentage calculators give you one number from one equation. This one runs three published
          equations on the same body at the same time and shows you the range they span — because that range,
          not any single figure, is the honest answer. It also tells you what each method would have had to
          measure to agree with the others. Everything runs in your browser; nothing is uploaded.
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
                <input type="number" min={1} step={0.5} value={neck} onChange={(e) => setNeck(+e.target.value)} />
              </Field>
              {sex === "female" ? (
                <Field label={`Hip (${lengthLabel})`}>
                  <input type="number" min={1} step={0.5} value={hip} onChange={(e) => setHip(+e.target.value)} />
                </Field>
              ) : (
                <Field label=" ">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#667067", lineHeight: 1.5 }}>
                    Men: waist at the navel, neck just below the larynx. No hip measurement is used.
                  </span>
                </Field>
              )}
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
            <button
              className="calc-button"
              onClick={() => {
                if (!Number.isFinite(agreeWaist)) return;
                const cm = agreeWaist;
                setWaist(unit === "us" ? Math.round((cm / IN) * 10) / 10 : Math.round(cm * 10) / 10);
              }}
            >
              Set the waist that makes tape and BMI agree
            </button>
          </div>

          <div className="answer-card">
            <span>THREE METHODS · MEDIAN AND RANGE</span>
            <div className="answer-number">
              {ok ? median.toFixed(1) : "—"}
              <small>% body fat</small>
            </div>
            {ok ? (
              <>
                <p>
                  Same body, three published equations. Navy tape{" "}
                  <b>{Number.isFinite(navy) ? navy.toFixed(1) : "—"}</b>, BMI method{" "}
                  <b>{deu.toFixed(1)}</b>, Jackson–Pollock 3-site <b>{Number.isFinite(jp) ? jp.toFixed(1) : "—"}</b>.
                  Median <b>{median.toFixed(1)}%</b>, full range <b>{lo.toFixed(1)}–{hi.toFixed(1)}%</b>, spread{" "}
                  <b>{spread.toFixed(1)} points</b>.
                </p>
                <p>
                  At {weightKg.toFixed(0)} kg that range is <b>{fatKgLo.toFixed(1)}–{fatKgHi.toFixed(1)} kg of fat</b>{" "}
                  — the choice of method is worth {(fatKgHi - fatKgLo).toFixed(1)} kg of fat on a body that has not
                  moved at all.
                </p>
                {Number.isFinite(waistGap) && (
                  <p>
                    For the tape to land on the BMI method&apos;s number, your waist would have to read{" "}
                    <b>{agreeWaist.toFixed(1)} cm</b> — you entered {waistCm.toFixed(1)} cm, a gap of{" "}
                    <b>{Math.abs(waistGap).toFixed(1)} cm</b> {waistGap > 0 ? "more" : "less"}. Going the other way,
                    the BMI method would need you to weigh <b>{agreeWeight.toFixed(1)} kg</b> against the{" "}
                    {weightKg.toFixed(1)} kg you entered.
                  </p>
                )}
                {Number.isFinite(sumGap) && (
                  <p>
                    For the skinfold equation to return the tape&apos;s number, your three-site sum would have to
                    be <b>{navySum.toFixed(0)} mm</b> instead of the {sum} mm you entered —{" "}
                    <b>{Math.abs(sumGap).toFixed(0)} mm</b> of difference, spread over three sites.
                  </p>
                )}
                <p>
                  Between-method standard deviation <b>{sd.toFixed(2)} points</b>. Under the most generous
                  possible assumption — that methods are independent samples — pinning the average to ±1.0 points
                  would take <b>{nFor(1)} methods</b>, and ±0.5 points would take <b>{nFor(0.5)}</b>. There are not
                  that many home methods. Report the range.
                </p>
              </>
            ) : (
              <p>
                Enter a complete set of measurements: height, weight, waist, neck (plus hip for women) and three
                skinfolds. At least two of the three methods must have valid inputs.
              </p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>THE THREE EQUATIONS THIS PAGE RUNS</span>
          <strong>
            Navy tape: BF% = 86.010·log₁₀(waist − neck) − 70.041·log₁₀(height) + 36.76 (men)
            <br />
            BMI method: BF% = 1.20·BMI + 0.23·age − 10.8·sex − 5.4
            <br />
            Jackson–Pollock 3-site: density = 1.10938 − 0.0008267·Σ + 0.0000016·Σ² − 0.0002574·age (men) — then
            BF% = 495 ÷ density − 450
          </strong>
          <small>
            Circumferences and height in inches, skinfolds in millimetres, Σ is the sum of three skinfolds, sex
            is 1 for men and 0 for women. These three are published prediction equations, not inventions of this
            page. Every translation figure, every grid and every table below is arithmetic this page performs on
            them, and none of it is copied from anywhere. The gap between them is real: these equations were
            fitted on different populations and they read different things about your body. This page does not
            claim to know which one is closest to the truth for you — nobody can tell you that from a tape, a
            scale and a caliper.
          </small>
        </div>

        <section className="content-block">
          <h2>Why three methods on one body disagree</h2>
          <p>
            The usual answer to &ldquo;why does every calculator give me a different number&rdquo; is that some
            are better than others. That is only half of it. The structural half is more interesting:{" "}
            <b>these methods do not look at the same body</b>. Each one reads a small set of inputs, and the sets
            barely overlap.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Method</span>
              <b>Inputs it reads</b>
              <span>Inputs it ignores</span>
              <span>What it is blind to</span>
            </div>
            {[
              [
                "Navy tape",
                "Waist, neck, hip (women), height, sex",
                "Weight, age, skinfolds",
                "Completely blind to how much you weigh — two people with identical tape numbers get identical results at any weight",
              ],
              [
                "BMI method",
                "Weight, height, age, sex",
                "Waist, neck, hip, skinfolds",
                "Completely blind to where the mass sits — it cannot tell a 100 kg lifter from a 100 kg sedentary body",
              ],
              [
                "Jackson–Pollock 3-site",
                "Three skinfolds, age, sex",
                "Weight, height, waist, neck, hip",
                "Completely blind to body size — it only reads the fat layer directly under the skin at three spots",
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
            Read the overlap carefully. Navy and the BMI method share exactly one input — height. Navy and
            skinfolds share none. The BMI method and skinfolds share one — age. So when two of them agree, that
            agreement is genuine evidence rather than an artefact of reading the same number twice, and when they
            disagree, that disagreement is not a mistake by either of them. They are answering questions about
            different features of the same body.
          </p>
          <p>
            The practical consequence is that there is no referee available at home. Every method here is a
            prediction equation, and the thing they predict can only be settled by a laboratory method —
            underwater weighing, DEXA, or a four-compartment model. What you can do honestly is carry the range
            instead of a single figure, and pick one method to track over time so that your trend is at least
            internally consistent.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: the tape method cannot see your weight</h2>
          <p>
            This is the sharpest demonstration of the point above, and it is pure arithmetic. Hold one man&apos;s
            tape measurements completely fixed — 178 cm tall, 30 years old, 92 cm waist, 39 cm neck — and change
            only his weight. The Navy equation never touches weight, so its answer does not move by a thousandth
            of a point. The BMI method moves enormously.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Weight</span>
              <b>BMI</b>
              <b>Navy</b>
              <b>BMI method</b>
              <b>Difference</b>
            </div>
            {[
              ["60 kg", "18.9", "21.0", "13.4", "−7.6 points"],
              ["70 kg", "22.1", "21.0", "17.2", "−3.8 points"],
              ["80 kg", "25.2", "21.0", "21.0", "0.0 points"],
              ["90 kg", "28.4", "21.0", "24.8", "+3.8 points"],
              ["100 kg", "31.6", "21.0", "28.6", "+7.6 points"],
              ["110 kg", "34.7", "21.0", "32.4", "+11.4 points"],
              ["120 kg", "37.9", "21.0", "36.1", "+15.2 points"],
            ].map((row) => (
              <div className="chart-row chart-row-five" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
                <b>{row[4]}</b>
              </div>
            ))}
          </div>
          <p>
            A 22.7-point swing produced entirely by weight, against a tape reading that did not change. Nobody
            cheats here: both equations are being used exactly as published. The 80 kg row is the coincidence —
            that is the weight at which these two methods happen to land on the same answer for this tape, and
            the calculator above finds it for your own numbers with the{" "}
            <b>set the waist that makes them agree</b> button.
          </p>
          <p>
            Which of the two is right at 120 kg depends on what that weight is made of. A 120 kg man with a 92 cm
            waist is carrying muscle, and the tape is closer to the truth. A 120 kg man with a 92 cm waist
            measured over the belt line instead of at the navel is not carrying muscle, and the BMI method is
            closer. The equations cannot tell the difference, and neither can this page — but the size of the gap
            tells you how much is riding on the question.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: the disagreement grid</h2>
          <p>
            Because the tape method ignores weight and the BMI method ignores waist, the gap between them is a
            function of exactly two things. Here it is mapped — every cell is Navy minus the BMI method, in
            percentage points, for a 178 cm, 30-year-old man with a 39 cm neck. Positive means the tape reads
            fatter; negative means the BMI method does.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Weight ↓ / Waist →</span>
              <b>80 cm</b>
              <b>86 cm</b>
              <b>92 cm</b>
              <b>98 cm</b>
            </div>
            {[
              ["60 kg", "−2.0", "+3.1", "+7.6", "+11.6"],
              ["70 kg", "−5.8", "−0.7", "+3.8", "+7.8"],
              ["80 kg", "−9.6", "−4.5", "0.0", "+4.0"],
              ["90 kg", "−13.4", "−8.3", "−3.8", "+0.2"],
              ["100 kg", "−17.2", "−12.1", "−7.6", "−3.6"],
              ["110 kg", "−21.0", "−15.9", "−11.4", "−7.4"],
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
            The zero line runs diagonally, and that diagonal is the interesting object: it is the set of bodies
            where the two methods agree. Above it — heavy for your waist — the tape reads you leaner. Below it —
            light for your waist — the BMI method does. The disagreement is not random noise, it is a systematic
            function of the ratio between how much you weigh and how wide you are.
          </p>
          <p>
            The same grid for a 165 cm, 30-year-old woman with a 32 cm neck and 98 cm hip:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Weight ↓ / Waist →</span>
              <b>80 cm</b>
              <b>86 cm</b>
              <b>92 cm</b>
              <b>98 cm</b>
            </div>
            {[
              ["50 kg", "+8.2", "+11.0", "+13.8", "+16.4"],
              ["58 kg", "+4.6", "+7.5", "+10.2", "+12.9"],
              ["65 kg", "+1.6", "+4.4", "+7.2", "+9.8"],
              ["72 kg", "−1.5", "+1.3", "+4.1", "+6.7"],
              ["80 kg", "−5.1", "−2.2", "+0.5", "+3.2"],
              ["90 kg", "−9.5", "−6.6", "−3.9", "−1.2"],
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
            Note the sign. Across most of this grid the Navy equation reads the woman fatter than the BMI method
            does, whereas on the male grid the tape reads lean at low weights. That is not a bias in either
            equation in the moral sense — it is what happens when two curves fitted on different populations
            cross. The crossing point is different for men and women because the female Navy equation takes hip
            into the sum, which raises its argument and flattens its sensitivity.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what the other method would have had to see</h2>
          <p>
            A difference in points is abstract. The same difference translated into the units of the measurement
            you actually took is not. These two tables invert the equations: given one method&apos;s answer, what
            would the other method&apos;s input have to be to return the same number?
          </p>
          <p>
            First, the waist the tape would have to read for the Navy equation to match the BMI method — for a
            30-year-old man with a 39 cm neck:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Height ↓ / Weight →</span>
              <b>60 kg</b>
              <b>70 kg</b>
              <b>80 kg</b>
              <b>90 kg</b>
            </div>
            {[
              ["160 cm", "84.9", "91.0", "98.0", "105.8"],
              ["168 cm", "83.5", "88.9", "94.9", "101.6"],
              ["178 cm", "82.3", "86.9", "92.0", "97.7"],
              ["185 cm", "81.7", "85.9", "90.5", "95.6"],
              ["193 cm", "81.2", "85.0", "89.2", "93.7"],
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
            Taller bodies need a smaller agreement waist at the same weight, because the height term in the Navy
            equation is a divisor. The 178 cm / 80 kg cell reads 92.0 cm — which is exactly the tape we started
            from in the first table, and confirms the inversion is correct rather than merely plausible.
          </p>
          <p>
            Now the reverse: the weight you would have to be for the BMI method to return the tape&apos;s answer,
            for the same man at 178 cm and 30 years old.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Waist (neck 39 cm, height 178 cm, age 30)</span>
              <b>Navy body fat</b>
              <span>Agreement weight</span>
            </div>
            {[
              ["80 cm", "11.4%", "54.6 kg"],
              ["86 cm", "16.5%", "68.1 kg"],
              ["92 cm", "21.0%", "79.9 kg"],
              ["98 cm", "25.0%", "90.5 kg"],
              ["104 cm", "28.6%", "100.1 kg"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p>
            Read that as a calibration of how much the two methods trust different evidence. A 6 cm step in the
            waist — from 92 to 98 cm — moves the tape answer by 4 points, and the BMI method needs 10.6 kg of
            body weight to move the same distance. Roughly 1.8 kg per centimetre of waist, at this height. If
            you are comparing your own numbers against someone else&apos;s, that is the exchange rate between the
            two scales.
          </p>
          <p>
            The same inversion for a 165 cm, 30-year-old woman with a 32 cm neck and 98 cm hip — waist on the
            left, agreement weight on the right:
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Waist</span>
              <b>Navy body fat</b>
              <span>Agreement weight</span>
            </div>
            {[
              ["72 cm", "27.7%", "59.5 kg"],
              ["78 cm", "30.7%", "66.3 kg"],
              ["84 cm", "33.6%", "72.9 kg"],
              ["90 cm", "36.4%", "79.2 kg"],
              ["96 cm", "39.1%", "85.3 kg"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p>
            Here the exchange rate is about 1.1 kg per centimetre of waist — shallower than the man&apos;s, and
            for a reason worth spelling out. The rate is the product of two factors: how much the tape result
            moves per centimetre of waist, and how much weight the BMI equation needs to move one percentage
            point. For her those are 0.49 points per centimetre and 2.27 kg per point; for him, 0.70 points per
            centimetre and 2.64 kg per point. She needs less weight per point because she is shorter, but her
            tape is far less twitchy per centimetre because her waist + hip − neck figure is much larger — and
            that second effect wins. Both figures are recomputed for whoever you enter in the calculator above.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: disagreement in millimetres</h2>
          <p>
            Skinfolds are the third method, and the inverse works there too — but the quadratic has to be solved
            rather than read off a logarithm. This table gives the three-site sum, in millimetres, that makes the
            Jackson–Pollock equation return a stated body fat percentage.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Target body fat</span>
              <b>Man, 30</b>
              <b>Man, 50</b>
              <b>Woman, 30</b>
              <b>Woman, 50</b>
            </div>
            {[
              ["8%", "26.6 mm", "19.8 mm", "15.2 mm", "12.2 mm"],
              ["12%", "39.6 mm", "32.4 mm", "25.6 mm", "22.4 mm"],
              ["15%", "49.7 mm", "42.1 mm", "33.6 mm", "30.4 mm"],
              ["18%", "60.2 mm", "52.2 mm", "42.0 mm", "38.5 mm"],
              ["20%", "67.4 mm", "59.2 mm", "47.7 mm", "44.1 mm"],
              ["25%", "86.5 mm", "77.4 mm", "62.7 mm", "58.8 mm"],
              ["30%", "107.6 mm", "97.2 mm", "79.0 mm", "74.6 mm"],
              ["35%", "131.5 mm", "119.4 mm", "97.0 mm", "92.1 mm"],
              ["40%", "160.5 mm", "145.2 mm", "117.9 mm", "111.9 mm"],
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
            The age column is worth a look. At the same body fat percentage, a 50-year-old is required to have a
            thinner skinfold sum than a 30-year-old — about 7–8 mm thinner for men, 3–4 mm for women. That is the
            age term inside the equation doing its work: for a given pinch, an older body is assumed to carry
            proportionally more of its fat internally. The Navy equation has no age term at all, which is one
            structural reason the two drift apart over a lifetime.
          </p>
          <p>
            And here is the millimetre cost of a single percentage point, obtained by differencing the table
            above rather than by differentiating it — the same answer, arrived at independently:
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>At a body fat of</span>
              <b>Man, 30 — mm per point</b>
              <span>Woman, 30 — mm per point</span>
            </div>
            {[
              ["10%", "3.26 mm", "2.61 mm"],
              ["15%", "3.45 mm", "2.75 mm"],
              ["20%", "3.70 mm", "2.92 mm"],
              ["25%", "4.03 mm", "3.14 mm"],
              ["30%", "4.51 mm", "3.45 mm"],
              ["35%", "5.28 mm", "3.91 mm"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p>
            So a two-point disagreement between the skinfold method and the tape method, at 20 percent body fat
            on a man, is about 7.4 mm of total skinfold across three sites — under 2.5 mm per site. Calipers are
            read to the nearest whole millimetre. The entire disagreement between two respected methods fits
            inside the rounding of the instrument.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: eight bodies, three methods each</h2>
          <p>
            The profiles below are constructed example bodies — the measurements were chosen to span the range
            real adults occupy, and every percentage in the table is computed from them by the three equations
            above. They are not measurements of real people. Spread is the largest minus the smallest; SD is the
            sample standard deviation of the three.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Body</span>
              <b>Navy</b>
              <b>BMI method</b>
              <b>Skinfold</b>
              <b>Spread / SD</b>
            </div>
            {[
              ["Man 30, 178 cm, 80 kg, waist 92, Σ62 mm", "21.0", "21.0", "18.5", "2.5 / 1.43"],
              ["Man 30, 178 cm, 95 kg, waist 104, Σ95 mm", "27.4", "26.7", "27.1", "0.8 / 0.38"],
              ["Man 45, 174 cm, 72 kg, waist 86, Σ55 mm", "18.0", "22.7", "18.2", "4.7 / 2.65"],
              ["Man 25, 185 cm, 105 kg, waist 96, Σ70 mm", "20.5", "26.4", "20.1", "6.2 / 3.50"],
              ["Woman 30, 165 cm, 65 kg, waist 78, Σ70 mm", "30.7", "30.2", "27.3", "3.4 / 1.84"],
              ["Woman 30, 165 cm, 52 kg, waist 68, Σ48 mm", "22.4", "24.4", "20.1", "4.3 / 2.16"],
              ["Woman 55, 160 cm, 78 kg, waist 92, Σ95 mm", "40.8", "43.8", "36.1", "7.7 / 3.88"],
              ["Woman 22, 170 cm, 60 kg, waist 72, Σ58 mm", "24.9", "24.6", "23.0", "1.9 / 1.03"],
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
            The spread runs from 0.8 to 7.7 points. It is smallest for the second body, where all three inputs
            were chosen consistently, and largest for the seventh, where the tape is wide relative to the
            skinfolds — exactly the pattern the grid above predicts. The spread is not a constant property of the
            methods. It is a property of the methods <i>and your particular body</i>, which is why this page
            computes it on your numbers instead of quoting an average.
          </p>
          <p>
            Only two of the eight have a spread under two points. If you have been treating a single calculator&apos;s
            output as accurate to the decimal, this is the table that should stop you.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: who is leaner depends on the method</h2>
          <p>
            A spread is one thing. A reversal is worse. Take two constructed men, both 30 years old, and ask a
            simple question: which one has less body fat?
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Body</span>
              <b>Navy tape</b>
              <b>BMI method</b>
              <b>Skinfold</b>
            </div>
            {[
              ["A — 185 cm, 95 kg, waist 88, neck 42, Σ55 mm", "14.5%", "24.0%", "16.5%"],
              ["B — 170 cm, 72 kg, waist 90, neck 37, Σ78 mm", "22.4%", "20.6%", "22.8%"],
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
            By the tape method, A is leaner by 7.9 points. By the BMI method, B is leaner by 3.4 points. By
            skinfolds, A is leaner again, by 6.3 points. Two out of three say A. That is not a verdict — it is a
            reminder that these are three different questions, and &ldquo;who is leaner&rdquo; only has one answer
            once you decide what you mean by lean.
          </p>
          <p>
            The reason is visible in the inputs. A is tall, heavy and narrow-waisted, which is the profile the
            tape rewards and the BMI method punishes. B is shorter, lighter and wider-waisted for his height,
            which is the reverse. Any ranking produced by one method alone is a ranking of that method&apos;s
            preferred body type, not of the people.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: how many methods would it take?</h2>
          <p>
            Averaging several methods feels like the obvious fix. It is worth checking what that would actually
            cost. If methods disagreed like independent random draws with standard deviation <i>s</i>, the
            95 percent half-width of an average of <i>n</i> of them would be 1.96·s/√n, so the number needed is{" "}
            <i>n</i> = (1.96·s ÷ target)². That assumption is far too generous — methods share biases and are not
            independent — which makes the figures below a best case, not a realistic one.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Between-method SD</span>
              <b>To reach ±1.0 point</b>
              <b>To reach ±0.5 point</b>
              <b>To reach ±0.25 point</b>
            </div>
            {[
              ["1.0 point", "4 methods", "16 methods", "62 methods"],
              ["1.5 points", "9 methods", "35 methods", "139 methods"],
              ["2.0 points", "16 methods", "62 methods", "246 methods"],
              ["2.5 points", "25 methods", "97 methods", "385 methods"],
              ["3.0 points", "35 methods", "139 methods", "554 methods"],
              ["4.0 points", "62 methods", "246 methods", "984 methods"],
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
            Even at the most favourable SD in the table, and even granting the independence assumption that is
            certainly false, you would need four independent methods to know your body fat to within one point —
            and there are not four independent methods available outside a laboratory. At the SDs actually
            observed in the eight-body table above, the requirement runs into the dozens.
          </p>
          <p>
            The conclusion is not that measurement is hopeless. It is that the honest unit of a home body fat
            estimate is a range of a few points, and that the way to get precision is not to average more bad
            methods but to stop needing the number to be that precise. A waist measurement in centimetres needs
            no equation at all and moves in the direction you care about. If you want the percentage for its own
            sake, carry the range.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: the disagreement in kilograms</h2>
          <p>
            Percentages are hard to feel. Fat mass is not, and it is where a two-point spread turns into
            something you can picture. Multiplying each method&apos;s percentage by the same body weight:
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Body</span>
              <b>Fat mass range across methods</b>
              <span>Spread</span>
            </div>
            {[
              ["Man 30, 178 cm, 80 kg", "14.8 – 16.8 kg of fat", "2.0 kg"],
              ["Woman 30, 165 cm, 65 kg", "17.7 – 20.0 kg of fat", "2.2 kg"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p>
            Two kilograms of fat, decided entirely by which equation you used, on a body that did not change.
            For scale against something this site computes rather than assumes: a 5 percent loss on the same
            80 kg man is 4.0 kg, so on his body the choice of equation is worth half of that milestone before he
            has lost anything at all. Multiply the largest spread in the table above — 7.7 points on the 78 kg
            body — and it comes to 6.0 kg. The honest reading is that an unqualified body fat percentage cannot
            resolve changes of that size, and switching equations will not fix it.
          </p>
        </section>

        <section className="content-block">
          <h2>How to report one number honestly</h2>
          <ul>
            <li>
              <b>Pick one method and stay on it.</b> The disagreement between methods can be larger than the
              real change you are trying to detect — it runs from 0.8 to 7.7 points on the eight bodies above —
              so switching methods mid-diet produces a step in your chart that has nothing to do with your body.
            </li>
            <li>
              <b>Quote the range, not the point.</b> If the three methods say 18.5 to 21.0, &ldquo;around 20 percent&rdquo;
              is a true statement and &ldquo;20.2 percent&rdquo; is not.
            </li>
            <li>
              <b>Report the raw measurements alongside the percentage.</b> Waist, weight and skinfold sums need no
              equation, and they let anyone else recompute your number by their own preferred method.
            </li>
            <li>
              <b>Use the translation figures to sanity-check, not to correct.</b> If the tape would need a waist
              8 cm smaller than the one you measured to agree with the BMI method, the disagreement is structural,
              not a rounding problem — do not nudge your inputs to make them meet.
            </li>
            <li>
              <b>Treat the skinfold method as a separate instrument.</b> It is the only one of the three that
              samples tissue directly, and the only one whose error is dominated by technique rather than by body
              shape.
            </li>
            <li>
              <b>Re-measure on a schedule that matches the noise.</b> Our{" "}
              <a href="/fat-calculator">fat calculator</a> works out the smallest change a given method can
              actually resolve; it is usually a quarter, not a week.
            </li>
            <li>
              <b>Cross-check against something that is not an equation.</b> A{" "}
              <a href="/body-fat-calculator-from-photo">photo-based estimate</a> or a{" "}
              <a href="/body-fat-percentage-chart">reference chart</a> will not settle the truth either, but a
              method that disagrees with everything else at once is a method you are using wrong.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Where this page&apos;s arithmetic stops being true</h2>
          <ul>
            <li>
              <b>The three equations are population fits, and their own error is not in any number here.</b>{" "}
              Everything on this page measures how much the methods disagree with each other. It says nothing
              about how far any of them sits from a laboratory reference method for your body. That second error
              is usually larger and cannot be computed from a tape, a scale and a caliper.
            </li>
            <li>
              <b>The methods-needed table assumes independence that does not exist.</b> Real methods share
              biases — they were often fitted on overlapping populations and they all assume the same
              two-compartment model of the body. The counts in that table are a lower bound and the true
              requirement is worse.
            </li>
            <li>
              <b>The eight bodies and the two comparison bodies are constructed, not measured.</b> Their inputs
              were chosen to span a range; the percentages follow from the equations, but no real person was
              measured to produce them.
            </li>
            <li>
              <b>The agreement-waist and agreement-weight figures are counterfactuals, not corrections.</b> They
              tell you what another measurement would have to be. They do not tell you that your measurement is
              wrong.
            </li>
            <li>
              <b>Measurement error is not modelled on this page.</b> The spread here is the difference between
              equations applied to exact inputs. Real inputs carry their own error, which our{" "}
              <a href="/fat-calculator">error-budget page</a> handles separately. The two sources add.
            </li>
            <li>
              <b>None of this is a health assessment.</b> A body fat percentage with a multi-point range is a
              rough descriptor, not a diagnosis and not a target on its own.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Frequently asked questions</h2>
          <div className="mini-faq">
            <details open>
              <summary>What is a fat percentage calculator?</summary>
              <p>
                A tool that predicts what share of your body mass is fat, from measurements you can take at home.
                This one runs three published equations at once — the Navy circumference method, a BMI-based
                equation, and the Jackson–Pollock 3-site skinfold method — and reports the range they span rather
                than a single figure.
              </p>
            </details>
            <details>
              <summary>Why does every calculator give me a different number?</summary>
              <p>
                Mostly because they use different equations that read different inputs. The Navy equation never
                uses your weight; the BMI equation never uses your waist; the skinfold equation uses neither. On
                the eight constructed bodies above the spread between them runs from 0.8 to 7.7 percentage
                points.
              </p>
            </details>
            <details>
              <summary>Which of the three should I believe?</summary>
              <p>
                This page deliberately does not answer that, because it cannot be answered from home inputs.
                Settling it requires a laboratory method. What the page does instead is show you how much is
                riding on the choice, so you can decide whether you need it settled at all.
              </p>
            </details>
            <details>
              <summary>Is the BMI method just BMI in disguise?</summary>
              <p>
                It is driven by BMI, yes — the equation is 1.20·BMI + 0.23·age − 10.8·sex − 5.4 — so it inherits
                BMI&apos;s blind spot: it cannot tell muscle from fat. It is included here not as a good method but
                as the one most people have already been given, so you can see how far it sits from the others.
              </p>
            </details>
            <details>
              <summary>How much does 1 cm of waist move the tape result?</summary>
              <p>
                It depends on your waist-to-neck difference: about 0.49 points per centimetre at a 30 cm
                difference, 0.29 at 50 cm and 0.25 at 60 cm. Because the BMI method ignores the waist entirely,
                every one of those centimetres also widens or narrows the disagreement with it.
              </p>
            </details>
            <details>
              <summary>Can I average the three methods to get a better number?</summary>
              <p>
                Not usefully. Under the generous assumption that they behave like independent draws, reaching
                ±1.0 point would take 4 methods at a 1-point spread and 16 at a 2-point spread — and the
                independence assumption is false. Averaging three methods that share a model buys less precision
                than the arithmetic suggests.
              </p>
            </details>
            <details>
              <summary>What does the spread mean in real terms?</summary>
              <p>
                On the worked examples, a 2.5-point spread on an 80 kg man is 2.0 kg of fat, and a 3.4-point
                spread on a 65 kg woman is 2.2 kg — decided purely by which equation you used, on a body that
                has not moved. Put next to a milestone you might actually be chasing, 5 percent of that
                man&apos;s body weight is 4.0 kg, so the equation is worth half the milestone.
              </p>
            </details>
            <details>
              <summary>Do I need skinfolds, or is the tape enough?</summary>
              <p>
                The tape alone gives you one of the three numbers and none of the cross-check. Skinfolds are the
                only method here that samples tissue directly rather than inferring from size, and the
                millimetre tables above show the disagreement between it and the tape amounts to under 2.5 mm per
                site — which is also about the rounding of the instrument.
              </p>
            </details>
            <details>
              <summary>How often should I re-measure?</summary>
              <p>
                Rarely enough that the noise does not exceed the change. Our{" "}
                <a href="/fat-calculator">fat calculator</a> computes the smallest detectable change for a given
                method and care level; it is typically 1.4 to 2.8 points, which is a quarter of progress rather
                than a week.
              </p>
            </details>
            <details>
              <summary>Is a smart scale better than all three?</summary>
              <p>
                It is a fourth method with a different failure mode — bioelectrical impedance infers composition
                from an electrical signal that moves with hydration, so its error is not something you can shrink
                by measuring more carefully. Our <a href="/scale-bmi">BMI and smart scale page</a> covers what
                those devices actually measure.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/body-fat-calculator">body fat calculator</a> ·{" "}
            <a href="/fat-calculator">fat calculator with error budget</a> ·{" "}
            <a href="/body-fat-percentage-calculator">body fat percentage with error bar</a> ·{" "}
            <a href="/navy-body-fat-calculator">Navy body fat calculator</a> ·{" "}
            <a href="/how-to-measure-body-fat-at-home">how to measure body fat at home</a> ·{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a> ·{" "}
            <a href="/scale-bmi">BMI and smart scales</a>
          </p>
          <p>
            <b>Not medical advice.</b> Every figure on this page is arithmetic performed on three published
            prediction equations; it describes how far the methods disagree with each other and says nothing about
            how close any of them is to the truth for you. See our <a href="/disclaimer">disclaimer</a>.
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
