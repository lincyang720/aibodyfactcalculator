"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";
type Sex = "male" | "female";
type Method = "tape" | "caliper";

const IN = 2.54;
const LB = 2.20462;
const LN10 = Math.log(10);

// ---- Published prediction equations used by this page -----------------------
// U.S. Navy circumference equations, inches. These are the same constants the
// rest of this site uses.
function navyTape(sex: Sex, waistCm: number, neckCm: number, hipCm: number, heightCm: number): number {
  const h = heightCm / IN;
  if (sex === "male") {
    const a = (waistCm - neckCm) / IN;
    return 86.01 * Math.log10(a) - 70.041 * Math.log10(h) + 36.76;
  }
  const a = (waistCm + hipCm - neckCm) / IN;
  return 163.205 * Math.log10(a) - 97.684 * Math.log10(h) - 78.387;
}

// Circumference difference (inches) that the Navy equations actually use.
function navyArg(sex: Sex, waistCm: number, neckCm: number, hipCm: number): number {
  return sex === "male" ? (waistCm - neckCm) / IN : (waistCm + hipCm - neckCm) / IN;
}

// Exact partial derivative dBF/dcircumference, expressed per centimetre.
function tapePerCm(sex: Sex, a: number): number {
  const k = sex === "male" ? 86.01 : 163.205;
  return k / (LN10 * a) / IN;
}

// Exact partial derivative dBF/dheight, per centimetre.
function heightPerCm(sex: Sex, heightCm: number): number {
  const k = sex === "male" ? 70.041 : 97.684;
  return k / (LN10 * (heightCm / IN)) / IN;
}

// Jackson-Pollock 3-site body density plus the Siri conversion.
function jp3(sex: Sex, sum: number, age: number): { bd: number; bf: number } {
  const bd =
    sex === "male"
      ? 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age
      : 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age;
  return { bd, bf: 495 / bd - 450 };
}

// Exact partial derivative dBF/d(skinfold sum), per millimetre.
function caliperPerMm(sex: Sex, sum: number, age: number): number {
  const { bd } = jp3(sex, sum, age);
  const dbd = sex === "male" ? -0.0008267 + 2 * 0.0000016 * sum : -0.0009929 + 2 * 0.0000023 * sum;
  return -(495 / (bd * bd)) * dbd;
}

function caliperPerYear(sex: Sex, sum: number, age: number): number {
  const { bd } = jp3(sex, sum, age);
  const c3 = sex === "male" ? 0.0002574 : 0.0001392;
  return (495 / (bd * bd)) * c3;
}

const TAPE_SLIPS: [number, string][] = [
  [0.5, "0.5 cm — careful, tape checked twice"],
  [1, "1 cm — normal self-measurement"],
  [2, "2 cm — rushed, or tape riding up"],
  [3, "3 cm — over clothing or wrong landmark"],
];

const CALIPER_SLIPS: [number, string][] = [
  [0.5, "0.5 mm — trained assessor, repeatable pinch"],
  [1, "1 mm — careful self-measurement"],
  [2, "2 mm — typical first attempt"],
  [3, "3 mm — grabbing muscle, or cheap calipers"],
];

const READINGS: [number, string][] = [
  [1, "1 reading per site"],
  [2, "2 readings, averaged"],
  [3, "3 readings, averaged"],
  [5, "5 readings, averaged"],
];

export default function FatCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(80);
  const [method, setMethod] = useState<Method>("tape");
  const [waist, setWaist] = useState(92);
  const [neck, setNeck] = useState(39);
  const [hip, setHip] = useState(98);
  const [siteA, setSiteA] = useState(16);
  const [siteB, setSiteB] = useState(26);
  const [siteC, setSiteC] = useState(20);
  const [slip, setSlip] = useState(1);
  const [readings, setReadings] = useState(3);

  const heightCm = unit === "us" ? height * IN : height;
  const weightKg = unit === "us" ? weight / LB : weight;
  const waistCm = unit === "us" ? waist * IN : waist;
  const neckCm = unit === "us" ? neck * IN : neck;
  const hipCm = unit === "us" ? hip * IN : hip;

  const lengthLabel = unit === "us" ? "in" : "cm";
  const weightLabel = unit === "us" ? "lb" : "kg";

  const arg = navyArg(sex, waistCm, neckCm, hipCm);
  const tapeValid = arg > 1 && heightCm > 50 && weightKg > 20;
  const bfTape = tapeValid ? navyTape(sex, waistCm, neckCm, hipCm, heightCm) : NaN;
  const dWaist = tapeValid ? tapePerCm(sex, arg) : NaN;
  const dHeight = heightCm > 50 ? heightPerCm(sex, heightCm) : NaN;

  const sum = siteA + siteB + siteC;
  const caliperValid = sum > 6 && sum < 300 && age > 5 && age < 100;
  const jp = caliperValid ? jp3(sex, sum, age) : { bd: NaN, bf: NaN };
  const dMm = caliperValid ? caliperPerMm(sex, sum, age) : NaN;
  const dYear = caliperValid ? caliperPerYear(sex, sum, age) : NaN;

  const active = method === "tape" ? tapeValid : caliperValid;
  const bf = method === "tape" ? bfTape : jp.bf;

  const siteCount = method === "tape" ? (sex === "male" ? 2 : 3) : 3;
  const perUnit = method === "tape" ? dWaist : dMm;
  const sessionSigma = Number.isFinite(perUnit) ? perUnit * slip * Math.sqrt(siteCount) : NaN;
  const sigmaAt = (n: number) => sessionSigma / Math.sqrt(n);
  const mdd = (n: number) => 1.96 * Math.SQRT2 * sigmaAt(n);
  const cmPerPoint = Number.isFinite(dWaist) && dWaist > 0 ? 1 / dWaist : NaN;
  const mmPerPoint = Number.isFinite(dMm) && dMm > 0 ? 1 / dMm : NaN;

  const fatKg = weightKg * (bf / 100);
  const leanKg = weightKg - fatKg;

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

  const slipOptions = method === "tape" ? TAPE_SLIPS : CALIPER_SLIPS;
  const slipUnit = method === "tape" ? "cm" : "mm";

  const caliperLabels: [string, string, string] =
    sex === "male"
      ? ["Chest skinfold (mm)", "Abdomen skinfold (mm)", "Thigh skinfold (mm)"]
      : ["Triceps skinfold (mm)", "Suprailiac skinfold (mm)", "Thigh skinfold (mm)"];

  const methodName = method === "tape" ? "NAVY TAPE METHOD" : "JACKSON-POLLOCK 3-SITE METHOD";

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/body-fat-calculator">Body Fat %</a>
          <a href="/navy-body-fat-calculator">Navy</a>
          <a href="/body-fat-percentage-calculator">Error Bar</a>
          <a href="/body-fat-percentage-chart">Chart</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">FAT CALCULATOR</div>
        <h1>Fat Calculator</h1>
        <p className="tool-lede">
          Enter the measurements you can actually take at home — three tape circumferences, or three skinfolds
          with a caliper — and get a body fat percentage plus the number most calculators leave out: how much
          of that answer is measurement error. Everything runs in your browser; nothing is uploaded.
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
              <Field label="Method">
                <select
                  value={method}
                  onChange={(e) => {
                    setMethod(e.target.value as Method);
                    setSlip(e.target.value === "tape" ? 1 : 2);
                  }}
                >
                  <option value="tape">Tape circumferences</option>
                  <option value="caliper">Skinfold caliper</option>
                </select>
              </Field>

              {method === "tape" ? (
                <>
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
                    <input
                      type="number"
                      min={1}
                      step={0.5}
                      value={neck}
                      onChange={(e) => setNeck(+e.target.value)}
                    />
                  </Field>
                  {sex === "female" ? (
                    <Field label={`Hip (${lengthLabel})`}>
                      <input
                        type="number"
                        min={1}
                        step={0.5}
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
              ) : (
                <>
                  <Field label={caliperLabels[0]}>
                    <input type="number" min={1} step={1} value={siteA} onChange={(e) => setSiteA(+e.target.value)} />
                  </Field>
                  <Field label={caliperLabels[1]}>
                    <input type="number" min={1} step={1} value={siteB} onChange={(e) => setSiteB(+e.target.value)} />
                  </Field>
                  <Field label={caliperLabels[2]}>
                    <input type="number" min={1} step={1} value={siteC} onChange={(e) => setSiteC(+e.target.value)} />
                  </Field>
                </>
              )}

              <Field label="How sloppy is each measurement?">
                <select value={slip} onChange={(e) => setSlip(+e.target.value)}>
                  {slipOptions.map(([v, label]) => (
                    <option value={v} key={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Readings per site">
                <select value={readings} onChange={(e) => setReadings(+e.target.value)}>
                  {READINGS.map(([v, label]) => (
                    <option value={v} key={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="answer-card">
            <span>{methodName}</span>
            <div className="answer-number">
              {active && Number.isFinite(bf) ? bf.toFixed(1) : "—"}
              <small>% body fat</small>
            </div>
            {active && Number.isFinite(bf) ? (
              <>
                <p>
                  At {slip} {slipUnit} of slip per site, the measurement error alone is{" "}
                  <b>±{sigmaAt(readings).toFixed(2)} percentage points</b> across {siteCount} measurement
                  {siteCount > 2 ? "s" : ""} with {readings} reading{readings > 1 ? "s" : ""} averaged at each.
                  That is the error bar on this number, not a prediction about your health.
                </p>
                <p>
                  Fat mass <b>{fatKg.toFixed(1)} kg</b>, lean mass <b>{leanKg.toFixed(1)} kg</b>. Body fat
                  percentage is a ratio, so the same measurement slip moves the percentage more when you are
                  light and less when you are heavy.
                </p>
                {method === "tape" ? (
                  <p>
                    The waist carries <b>{dWaist.toFixed(2)} points per centimetre</b>
                    {sex === "female" ? ", the hip the same" : ""}, and the neck moves the result{" "}
                    {dWaist.toFixed(2)} points in the opposite direction. One full percentage point is{" "}
                    <b>{cmPerPoint.toFixed(2)} cm</b> of waist at your current measurements. A height entry 2 cm
                    off shifts the answer {Math.abs(dHeight * 2).toFixed(2)} points.
                  </p>
                ) : (
                  <p>
                    Each millimetre of skinfold — at any one of the three sites — is worth{" "}
                    <b>{dMm.toFixed(3)} points</b> at your current sum of {sum} mm, so one full percentage point
                    is <b>{mmPerPoint.toFixed(1)} mm</b> of skinfold. Age enters at{" "}
                    <b>{dYear.toFixed(3)} points per year</b>, which is why a birthday alone nudges the result.
                  </p>
                )}
                <p>
                  Comparing two sessions taken this way, a change has to exceed{" "}
                  <b>{mdd(readings).toFixed(2)} points</b> before it is larger than the noise. Smaller movements
                  are real or not — this method cannot tell you which.
                </p>
              </>
            ) : (
              <p>
                Enter a complete set of measurements. For the tape method the waist must be larger than the
                neck; for the caliper method the three skinfolds add up to a sum between roughly 10 and 250 mm.
              </p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>THE TWO EQUATIONS THIS PAGE RUNS</span>
          <strong>
            Navy (men): BF% = 86.010·log₁₀(waist − neck) − 70.041·log₁₀(height) + 36.76
            <br />
            Navy (women): BF% = 163.205·log₁₀(waist + hip − neck) − 97.684·log₁₀(height) − 78.387
            <br />
            Jackson–Pollock 3-site: density = 1.10938 − 0.0008267·Σ + 0.0000016·Σ² − 0.0002574·age (men) —
            then BF% = 495 ÷ density − 450
          </strong>
          <small>
            Circumferences and height in inches, skinfolds in millimetres, Σ is the sum of the three
            skinfolds. These are published prediction equations, not inventions of this page — but every
            sensitivity figure, error budget and mistake table below is arithmetic this page performs on them,
            and none of it is copied from anywhere. The ± band the calculator prints covers{" "}
            <b>measurement error only</b>. It does not include the equations&apos; own error against a
            laboratory reference method, which is a separate and usually larger problem.
          </small>
        </div>

        <section className="content-block">
          <h2>What a fat calculator is actually doing</h2>
          <p>
            A fat calculator takes two or three numbers off your body and runs them through a prediction
            equation fitted long ago on a specific group of people. It does not measure your fat. It predicts
            it, and the prediction carries two separate kinds of error that almost every calculator hides:
            the error of the equation itself, and the error of the numbers you typed into it.
          </p>
          <p>
            This page deals honestly with the second kind and is explicit that it cannot fix the first. The
            equation error is a property of the equation and the population it was fitted on; no amount of
            careful measuring removes it. The measurement error is entirely yours, it is often larger than
            people assume, and unlike the equation error it is something you can shrink this afternoon.
            Everything below is about shrinking it and knowing when you have.
          </p>
          <p>
            There is also a structural point worth making before any table: both equations here are built on
            <b> differences and ratios of circumferences</b>, not on the circumferences themselves. A waist
            that reads 2 cm large does not add a fixed amount of body fat — it adds an amount that depends on
            how big the waist−neck difference already is. That single fact is why the sensitivity tables below
            exist, and why a one-centimetre slip is worth almost three times as much to a lean person as to a
            heavy one.
          </p>
        </section>

        <section className="content-block">
          <h2>Tape protocol: where exactly to put it</h2>
          <p>
            These are the landmark definitions the circumference equations were developed with. The equations
            were fitted on measurements taken this way, so departing from it does not just add noise — it adds
            a bias that never averages out.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Site</span>
              <b>Landmark</b>
              <span>How to hold the tape</span>
              <span>When to read it</span>
            </div>
            {[
              [
                "Waist — men",
                "Horizontal around the abdomen at the level of the navel, not at the narrowest point and not at the belt line",
                "Tape flat against skin, parallel to the floor all the way round, snug but not compressing",
                "At the end of a normal exhale, standing, arms relaxed at your sides",
              ],
              [
                "Waist — women",
                "Horizontal at the narrowest point of the torso, usually a couple of centimetres above the navel",
                "Same as above; if there is no obvious narrow point, use the midpoint between the lowest rib and the hip bone",
                "Same — normal exhale, standing, no breath held",
              ],
              [
                "Neck",
                "Just below the larynx, with the tape angled slightly downward toward the front of the throat",
                "Snug against the skin with no gap; the tape must not ride up over the jaw or slip down onto the collarbones",
                "While breathing normally, head level and facing forward",
              ],
              [
                "Hip — women only",
                "Horizontal around the fullest part of the buttocks, viewed from the side",
                "Tape parallel to the floor; check the back in a mirror, this is the site that most often sags",
                "Standing with feet together and weight even on both legs",
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
            Two habits change the result more than any landmark debate. First, read at the end of a normal
            exhale every single time — holding a breath or sucking in changes the circumference by more than
            the landmark argument is worth. Second, measure on bare skin. A t-shirt hem adds more than a
            centimetre and it adds it non-uniformly, which is the worst kind of error because it does not
            cancel between sessions.
          </p>
        </section>

        <section className="content-block">
          <h2>Caliper protocol: the pinch is the measurement</h2>
          <p>
            With skinfolds, the caliper is the easy part. The pinch is the measurement, and the pinch is where
            self-measurement goes wrong. The rule is that you are lifting a fold of skin plus the fat directly
            under it, and nothing else. If you feel the muscle underneath, you have grabbed the wrong tissue
            and the reading is meaningless at that site.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Site</span>
              <b>Landmark</b>
              <span>Fold direction</span>
              <span>Reading rule</span>
            </div>
            {[
              [
                "Chest — men",
                "Diagonal fold halfway between the front crease of the armpit and the nipple",
                "Diagonal, following the natural line from shoulder to opposite hip",
                "Read 2 seconds after the caliper jaws close; discard if the reading is still falling",
              ],
              [
                "Abdomen — men",
                "Vertical fold 2 cm to the right of the navel",
                "Vertical",
                "Same 2-second rule; a reading that keeps dropping means you pinched too shallow",
              ],
              [
                "Thigh — both sexes",
                "Midpoint between the hip crease and the top of the kneecap, on the front midline of the thigh",
                "Vertical, along the length of the femur",
                "Stand with weight on the opposite leg so the measured thigh is relaxed",
              ],
              [
                "Triceps — women",
                "Back midline of the upper arm, halfway between the shoulder tip and the elbow tip",
                "Vertical, parallel to the bone",
                "Arm hanging loose at the side, not flexed",
              ],
              [
                "Suprailiac — women",
                "Just above the hip bone, along the line running down from the armpit",
                "Diagonal, roughly 45 degrees",
                "Same 2-second rule; this is the site most often taken vertically by mistake",
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
            Take all measurements on the same side of the body — conventionally the right — and rotate through
            the sites rather than measuring one site three times in a row. A repeated pinch on the same spot
            compresses the tissue and reads progressively lower, which is a real effect that will make
            consecutive readings look like they are converging when they are actually just draining.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what one centimetre is worth</h2>
          <p>
            Differentiate the circumference equation with respect to each measurement and you get the exact
            sensitivity at your own numbers. Below are two worked profiles — a 178 cm, 80 kg, 30-year-old man
            with a 92 cm waist and 39 cm neck, and a 165 cm, 65 kg, 30-year-old woman with a 78 cm waist, 98
            cm hip and 32 cm neck. Every figure is the derivative above evaluated at those measurements.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Male profile — Navy 21.0%</span>
              <b>Measurement</b>
              <span>Points per cm</span>
              <span>One percentage point costs</span>
            </div>
            {[
              ["Waist", "92 cm", "+0.70 — a larger waist raises the estimate", "1.42 cm"],
              ["Neck", "39 cm", "−0.70 — a larger neck lowers it", "1.42 cm smaller"],
              ["Height", "178 cm", "−0.17 — a taller entry lowers it", "5.85 cm"],
            ].map((row) => (
              <div className="chart-row chart-row-wide" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Female profile — Navy 30.7%</span>
              <b>Measurement</b>
              <span>Points per cm</span>
              <span>One percentage point costs</span>
            </div>
            {[
              ["Waist", "78 cm", "+0.49", "2.03 cm"],
              ["Hip", "98 cm", "+0.49", "2.03 cm"],
              ["Neck", "32 cm", "−0.49", "2.03 cm smaller"],
              ["Height", "165 cm", "−0.26", "3.89 cm"],
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
            The woman&apos;s profile has three measurement sites to the man&apos;s two, yet each one is worth
            less in absolute terms, because her waist + hip − neck difference is 144 cm against his 53 cm
            waist − neck. Sensitivity falls as the circumference difference grows. She is not measuring more
            carefully; her arithmetic is simply less twitchy.
          </p>
          <p>
            The height row deserves a comment because it surprises people. Height enters the equation as a
            divisor, so entering a height 2 cm too short adds about 0.34 points to the man&apos;s result and
            0.51 to the woman&apos;s. That is not a measurement you repeat every session — you type it once
            and forget it — which makes it the classic source of a constant offset between two calculators
            that otherwise agree.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: the same sensitivity across body sizes</h2>
          <p>
            Because the derivative depends on the circumference difference, the cost of a slip is not a
            constant. Here it is evaluated across the range real bodies occupy. Find your own difference —
            waist minus neck for men, waist plus hip minus neck for women — and read the cost of a centimetre.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Men: waist − neck (cm)</span>
              <b>Points per cm</b>
              <span>Women: waist + hip − neck (cm)</span>
              <b>Points per cm</b>
            </div>
            {[
              ["25", "1.49", "100", "0.71"],
              ["30", "1.25", "110", "0.64"],
              ["35", "1.07", "120", "0.59"],
              ["40", "0.93", "130", "0.55"],
              ["45", "0.83", "140", "0.51"],
              ["50", "0.75", "150", "0.47"],
              ["55", "0.68", "160", "0.44"],
              ["60", "0.62", "170", "0.42"],
            ].map((row) => (
              <div className="chart-row chart-row-wide" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
                <b>{row[3]}</b>
              </div>
            ))}
          </div>
          <p>
            The spread is close to threefold at the extremes. A lean man with a 25 cm waist-to-neck difference
            pays 1.49 points for a single sloppy centimetre; a man with a 60 cm difference pays 0.62. The
            practical consequence is that body fat estimates from circumferences get <i>noisier</i> as you get
            leaner, exactly when you care most about the number. That is not a flaw you can fix by buying a
            better tape — it is in the equation.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what one millimetre is worth</h2>
          <p>
            The skinfold equation behaves differently. Its derivative with respect to the sum falls as the sum
            grows, so a millimetre is worth most when you are leanest — the same direction as the tape method,
            but reached through a different route.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Sum of three skinfolds (mm)</span>
              <b>Male — points per mm</b>
              <span>Female — points per mm</span>
            </div>
            {[
              ["20", "0.320", "0.385"],
              ["30", "0.311", "0.371"],
              ["40", "0.301", "0.357"],
              ["50", "0.291", "0.342"],
              ["60", "0.281", "0.326"],
              ["70", "0.270", "0.309"],
              ["80", "0.258", "0.291"],
              ["90", "0.246", "0.273"],
              ["100", "0.234", "0.254"],
              ["120", "0.208", "0.214"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p>
            At the two worked profiles — the man at a 62 mm sum and the woman at 70 mm — a millimetre is worth
            0.279 and 0.309 points respectively. Note what that means in practice: a skinfold measurement is
            recorded to the nearest millimetre, and the rounding alone is worth about a third of a percentage
            point per site. Rounding error on three sites is not negligible next to the changes people try to
            detect month to month.
          </p>
          <p>
            Age enters the skinfold equation and not the circumference one. For these profiles it contributes
            0.114 points per year for men and 0.064 for women, so a birthday moves the estimate by about a
            tenth of a point. Small, but it is a systematic nudge that runs the same direction every year and
            will quietly flatten or steepen a long trend if you never account for it.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: the total error budget</h2>
          <p>
            Assume the slip at each site is independent and roughly the same size. Then the errors do not add
            — they combine as the square root of the sum of squares, because a slip in one direction at one
            site partly offsets a slip in the other. These totals use the two worked profiles above.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Slip per site — tape</span>
              <b>Male (2 sites)</b>
              <span>Female (3 sites)</span>
            </div>
            {[
              ["0.5 cm — careful, checked twice", "±0.50 points", "±0.43 points"],
              ["1 cm — normal self-measurement", "±1.00 points", "±0.85 points"],
              ["1.5 cm — rushed", "±1.50 points", "±1.28 points"],
              ["2 cm — tape riding up", "±1.99 points", "±1.71 points"],
              ["3 cm — over clothing", "±2.99 points", "±2.56 points"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <div className="chart-table">
            <div className="chart-row">
              <span>Slip per site — caliper</span>
              <b>Male (62 mm sum)</b>
              <span>Female (70 mm sum)</span>
            </div>
            {[
              ["0.5 mm — trained assessor", "±0.24 points", "±0.27 points"],
              ["1 mm — careful self-measurement", "±0.48 points", "±0.53 points"],
              ["2 mm — typical first attempt", "±0.97 points", "±1.07 points"],
              ["3 mm — grabbing muscle", "±1.45 points", "±1.60 points"],
              ["5 mm — uncalibrated plastic calipers", "±2.41 points", "±2.67 points"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p>
            Read the 1 cm tape row against the 2 mm caliper row, because those are the two honest descriptions
            of a first attempt by an untrained person: both land near one percentage point. The caliper is not
            inherently more precise at home. It is more precise only in trained hands, and the gap between
            those two rows — 0.24 against 2.41 points — is the entire skill of skinfold measurement expressed
            as a number.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what the common mistakes are worth</h2>
          <p>
            The slip sizes in the first column are illustrative — how big yours actually is depends on you.
            The shift columns are not illustrative: they are exact arithmetic on the sensitivities above, for
            the same two profiles. Use this table to decide which mistake is worth fixing, because they are
            nowhere near equal.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Mistake</span>
              <b>Example slip</b>
              <span>Shift in the result</span>
              <span>Bias or noise?</span>
            </div>
            {[
              [
                "Tape sagging at the back, not parallel to the floor",
                "+2 cm waist",
                "Male +1.41 points, female +0.98",
                "Bias — repeats identically every session, so it cancels in a trend",
              ],
              [
                "Measuring over the belt line instead of at the navel (men)",
                "+3 cm waist",
                "Male +2.11 points",
                "Bias, and a large one — this alone can move you a whole category",
              ],
              [
                "Sucking in or holding breath at the moment of reading",
                "−2 cm waist",
                "Male −1.41 points, female −0.98",
                "Bias if you always do it; noise if you sometimes do",
              ],
              [
                "Neck tape riding up over the larynx",
                "+2 cm neck",
                "Male −1.41 points, female −0.98",
                "Bias — the neck enters with a minus sign, so a bigger neck reads leaner",
              ],
              [
                "Height typed 2 cm short",
                "−2 cm height",
                "Male +0.34 points, female +0.51",
                "Bias — and permanent, because you never re-measure it",
              ],
              [
                "Hip taken at the narrowest point instead of the fullest (women)",
                "−3 cm hip",
                "Female −1.48 points",
                "Bias; the most common female-site error by a wide margin",
              ],
              [
                "Reading the caliper before the jaws settle",
                "+2 mm at one site",
                "Male +0.56 points, female +0.62",
                "Bias if you always rush; noise if you sometimes wait",
              ],
              [
                "Pinching thigh muscle instead of the fat fold above it",
                "+3 mm at one site",
                "Male +0.84 points, female +0.93",
                "Bias — and it grows as you get leaner, because there is less fat to grab",
              ],
              [
                "Suprailiac taken vertically instead of diagonally (women)",
                "+2 mm at one site",
                "Female +0.62 points",
                "Bias — consistent, so harmless for tracking, fatal for comparing to a chart",
              ],
              [
                "Re-pinching the same spot three times in a row",
                "−1 mm on repeats",
                "Male −0.28 points, female −0.31",
                "Bias that fakes precision: consecutive readings converge for the wrong reason",
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
            The bias-versus-noise column is the one that should change how you behave. A bias shifts every
            measurement the same direction by the same amount, which means it ruins comparisons against a
            chart or another person&apos;s number while leaving month-to-month tracking perfectly intact. Noise
            does the opposite. If your goal is to watch your own trend, the male belt-line mistake — worth
            2.11 points — costs you nothing at all as long as you make it identically every month. If your goal
            is to know whether you are at 15 percent or 18 percent, it costs you everything.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: how small a change you can actually detect</h2>
          <p>
            Two sessions each carry their own error, so the difference between them carries √2 times a single
            session&apos;s error. At 95 percent confidence, a change has to be at least 1.96 × √2 × σ before
            you can call it real. Averaging <i>n</i> readings at each site divides σ by √n. Both rules applied
            to the worked profiles:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Readings per site</span>
              <b>Male tape, 1 cm slip</b>
              <b>Female tape, 1 cm slip</b>
              <b>Male caliper, 2 mm slip</b>
              <b>Female caliper, 2 mm slip</b>
            </div>
            {[
              ["1", "2.76 pts", "2.36 pts", "1.34 pts", "1.48 pts"],
              ["2", "1.95 pts", "1.67 pts", "0.95 pts", "1.05 pts"],
              ["3", "1.60 pts", "1.36 pts", "0.77 pts", "0.86 pts"],
              ["5", "1.24 pts", "1.06 pts", "0.60 pts", "0.66 pts"],
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
            This is the table that should set your re-measurement schedule. With a tape, one reading per site,
            a change smaller than roughly 2.4 to 2.8 points is indistinguishable from measurement noise — and
            a genuine month of fat loss is often under one point. Taking three readings per site and averaging
            them cuts that to about 1.4 to 1.6 points, which is still larger than a month of progress for most
            people. The honest conclusion is that a tape measurement cannot resolve one month of change at
            all; it resolves about a quarter&apos;s worth.
          </p>
          <p>
            The caliper rows are better but not transformative: at a realistic 2 mm per site with three
            readings averaged, you can resolve about 0.8 points, which is roughly two to three months of
            progress. Anyone reporting skinfold-derived body fat changes week to week is reporting noise,
            whatever the caliper cost.
          </p>
          <p>
            Notice also that averaging has sharply diminishing returns. Going from one reading to three buys a
            42 percent reduction in the error bar; going from three to five buys only another 22 percent. Three
            readings per site is where the effort stops paying.
          </p>
        </section>

        <section className="content-block">
          <h2>Tape and caliper on the same person</h2>
          <p>
            Run both methods on the same two profiles and they do not agree. The man comes out at 21.0 percent
            by tape and 18.5 percent by the caliper equation on a 62 mm sum — a 2.5 point gap. The woman comes
            out at 30.7 percent and 27.3 percent — 3.4 points. Neither is wrong in any simple sense; they are
            different prediction equations fitted on different populations, and they answer slightly different
            questions about where the fat is.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Waist on the male profile, neck fixed at 39 cm</span>
              <b>Navy body fat</b>
              <span>Change from the previous row</span>
            </div>
            {[
              ["80 cm", "11.4%", "—"],
              ["84 cm", "14.9%", "+3.5 points for 4 cm"],
              ["88 cm", "18.1%", "+3.2 points"],
              ["92 cm", "21.0%", "+2.9 points"],
              ["96 cm", "23.7%", "+2.7 points"],
              ["100 cm", "26.2%", "+2.5 points"],
              ["104 cm", "28.6%", "+2.4 points"],
            ].map((row) => (
              <div className="chart-row" key={row[0]}>
                <span>{row[0]}</span>
                <b>{row[1]}</b>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p>
            The diminishing per-centimetre return in the last column is the derivative shrinking as the waist
            grows, exactly as the sensitivity table predicted. It also means the tape method is at its most
            informative in the middle of the range, and least informative at both ends — for the very lean and
            for the very heavy, a centimetre of waist tells you less.
          </p>
          <p>
            The single rule that follows from all of this: <b>pick one method and never switch</b>. A trend
            built from tape measurements is comparable to other tape measurements and to nothing else. The
            moment you compare a tape number to a caliper number — or either to a smart scale — you are reading
            the difference between equations, not a change in your body. Our{" "}
            <a href="/body-fat-percentage-calculator">body fat percentage calculator with an error bar</a>{" "}
            runs the cross-method comparison explicitly if you want to see the spread on your own numbers.
          </p>
        </section>

        <section className="content-block">
          <h2>How to run this at home</h2>
          <ul>
            <li>
              <b>Choose the method you can repeat, not the one that sounds most accurate.</b> Per the error
              budget, a careful tape measurement beats a sloppy caliper measurement every time.
            </li>
            <li>
              <b>Measure at the same time of day, in the same state.</b> Morning, after the bathroom, before
              food and training is the standard for a reason: it removes the largest single source of
              within-person variation.
            </li>
            <li>
              <b>Take three readings per site and average them.</b> That is where averaging stops paying, and
              it cuts the error bar by more than 40 percent for about two extra minutes.
            </li>
            <li>
              <b>Write down the raw measurements, not just the percentage.</b> When a number looks wrong six
              weeks later, the raw waist reading is what tells you whether you measured badly or changed.
            </li>
            <li>
              <b>Re-measure monthly, not weekly.</b> The detectable-change table says a single month of real
              progress is smaller than the noise of any home method. Quarterly is honest; weekly is theatre.
            </li>
            <li>
              <b>Track the raw circumference as well.</b> Waist in centimetres needs no equation, carries no
              prediction error, and moves in the direction you care about. It is often the better number to
              watch.
            </li>
            <li>
              <b>Cross-check against something independent occasionally.</b> A{" "}
              <a href="/body-fat-calculator-from-photo">photo-based estimate</a> or a{" "}
              <a href="/body-fat-percentage-chart">reference chart</a> will not settle the truth, but a method
              that disagrees with everything else is a method you are using wrong.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Where this is weak</h2>
          <ul>
            <li>
              <b>The error bar covers measurement error only.</b> It does not include how far the equation
              itself sits from a laboratory reference method for your body. That second error is usually
              larger, and this page does not compute it because it cannot be computed from your inputs.
            </li>
            <li>
              <b>Prediction equations are population-specific.</b> Both equations here were fitted on
              particular samples decades ago. They are known to behave differently outside those groups, and
              no arithmetic on this page repairs that.
            </li>
            <li>
              <b>The slip sizes are yours to supply.</b> Every error budget figure is conditional on the slip
              you selected. The calculator&apos;s default of 1 cm or 2 mm is a guess about a typical
              self-measurement, not a measurement of yours.
            </li>
            <li>
              <b>Independence between sites is assumed, not proven.</b> If you measure badly you often measure
              badly at every site in the same direction, which makes the true error larger than the
              root-sum-square figure here.
            </li>
            <li>
              <b>Women&apos;s body fat varies across the menstrual cycle.</b> Water shifts change
              circumferences and skinfolds alike; this page has no way to model it, so compare like phase to
              like phase.
            </li>
            <li>
              <b>Nothing here is a health assessment.</b> A body fat percentage is one number with a wide
              error band. It is not a diagnosis and not a target by itself.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Frequently asked questions</h2>
          <div className="mini-faq">
            <details open>
              <summary>What is a fat calculator?</summary>
              <p>
                A tool that predicts your body fat percentage from a few body measurements rather than
                measuring it directly. This one runs two published equations — the Navy circumference method
                and the Jackson–Pollock 3-site skinfold method — and then computes how much of the answer is
                measurement error.
              </p>
            </details>
            <details>
              <summary>How accurate is a body fat calculator?</summary>
              <p>
                The measurement part is computable and the tables above give it: around ±1 percentage point
                for a careful tape measurement, ±0.5 to ±1 for careful skinfolds, and ±2 to ±3 for a rushed job
                either way. The larger and uncomputable part is the equation&apos;s own error against a
                laboratory reference, which this page does not claim to know.
              </p>
            </details>
            <details>
              <summary>Tape or caliper — which should I use?</summary>
              <p>
                Whichever you can repeat identically. At realistic self-measured slip sizes both land near one
                percentage point of error. The caliper only wins clearly in trained hands, where its error
                budget drops to about a quarter of a point.
              </p>
            </details>
            <details>
              <summary>Why do I get a different number from every calculator?</summary>
              <p>
                Because they use different equations, and sometimes different landmark definitions for the
                same equation. A 2 cm difference in where you place the waist tape moves the Navy result by
                1.4 points on the male profile above, which is more than the gap between most calculators.
              </p>
            </details>
            <details>
              <summary>How much does 1 cm of waist change my body fat percentage?</summary>
              <p>
                It depends on your waist-to-neck difference: 1.49 points per centimetre at a 25 cm difference,
                0.70 at 53 cm, and 0.62 at 60 cm. For the worked male profile, one full percentage point is
                1.42 cm of waist.
              </p>
            </details>
            <details>
              <summary>Can I track progress weekly with this?</summary>
              <p>
                No. The detectable-change table puts the smallest trustworthy difference at roughly 1.4 to 2.8
                points depending on method and care, while a month of genuine fat loss is usually under one
                point. Measure monthly at best, quarterly if you want to be certain.
              </p>
            </details>
            <details>
              <summary>Does taking more readings help?</summary>
              <p>
                Yes, with diminishing returns. Averaging three readings instead of one cuts the error bar by
                about 42 percent; going to five cuts it by a further 22 percent. Three is the practical
                stopping point.
              </p>
            </details>
            <details>
              <summary>Why does my neck measurement matter?</summary>
              <p>
                The Navy equations use the difference between waist (and hip, for women) and neck, so a larger
                neck lowers the estimate. It is not a decoration — on the male profile it is worth −0.70 points
                per centimetre, exactly as much as the waist is worth positively.
              </p>
            </details>
            <details>
              <summary>Is a smart scale better than this?</summary>
              <p>
                Different failure mode, not a better one. Bioelectrical impedance infers body composition from
                an electrical signal that moves with hydration, so its error is dominated by something you
                cannot control by measuring more carefully. Our{" "}
                <a href="/scale-bmi">BMI scale page</a> goes into what those devices actually measure.
              </p>
            </details>
            <details>
              <summary>Do I need someone else to measure me?</summary>
              <p>
                For skinfolds, it helps a lot — several of the sites are hard to pinch correctly on yourself,
                and the error budget table shows the difference between a 0.5 mm and a 3 mm slip is 0.24
                versus 1.45 points. For tape measurements, self-measurement is fine if you can keep the tape
                parallel all the way round.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/body-fat-calculator">body fat calculator</a> ·{" "}
            <a href="/navy-body-fat-calculator">Navy body fat calculator</a> ·{" "}
            <a href="/body-fat-percentage-calculator">body fat percentage with error bar</a> ·{" "}
            <a href="/how-to-measure-body-fat-at-home">how to measure body fat at home</a> ·{" "}
            <a href="/scale-bmi">BMI and smart scales</a> ·{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a> ·{" "}
            <a href="/army-body-fat-calculator">Army body fat calculator</a>
          </p>
          <p>
            <b>Not medical advice.</b> Every error figure on this page is conditional on the slip size you
            selected and covers measurement error only, not the prediction error of the underlying equations.
            See our <a href="/disclaimer">disclaimer</a>.
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
