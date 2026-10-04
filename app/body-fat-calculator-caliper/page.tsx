"use client";

import { useState } from "react";
import "../tool-pages.css";

type Sex = "male" | "female";
type Unit = "metric" | "us";

const LB = 2.20462;

const SITES = [
  "Chest",
  "Midaxillary",
  "Triceps",
  "Subscapular",
  "Abdomen",
  "Suprailiac",
  "Thigh",
];

const DEFAULTS: Record<Sex, number[]> = {
  male: [12, 14, 11, 18, 26, 20, 19],
  female: [14, 15, 21, 19, 27, 22, 28],
};

// Jackson-Pollock 3-site subsets: chest / abdomen / thigh for men, triceps / suprailiac / thigh for women.
const TRI: Record<Sex, number[]> = { male: [0, 4, 6], female: [2, 5, 6] };

// ---- Published prediction equations. Body density first, then the Siri conversion. ----
function bd7(sex: Sex, S: number, age: number): number {
  return sex === "male"
    ? 1.112 - 0.00043499 * S + 0.00000055 * S * S - 0.00028826 * age
    : 1.097 - 0.00046971 * S + 0.00000056 * S * S - 0.00012828 * age;
}

function bd3(sex: Sex, S: number, age: number): number {
  return sex === "male"
    ? 1.10938 - 0.0008267 * S + 0.0000016 * S * S - 0.0002574 * age
    : 1.0994921 - 0.0009929 * S + 0.0000023 * S * S - 0.0001392 * age;
}

function jp7(sex: Sex, S: number, age: number): number {
  return 495 / bd7(sex, S, age) - 450;
}

function jp3(sex: Sex, S: number, age: number): number {
  return 495 / bd3(sex, S, age) - 450;
}

function brozek(bd: number): number {
  return (4.57 / bd - 4.142) * 100;
}

// Percentage points per millimetre of the skinfold SUM, taken numerically.
function slope(sex: Sex, S: number, age: number, eq: 3 | 7): number {
  const h = 0.001;
  const f = (x: number) => (eq === 7 ? jp7(sex, x, age) : jp3(sex, x, age));
  return (f(S + h) - f(S - h)) / (2 * h);
}

// The share of the seven-site total that the three sites must carry for both equations to return
// the same number. Solved by bisection; body fat rises with the sum, so the function is monotone.
function rhoStar(sex: Sex, S7: number, age: number): number {
  const target = jp7(sex, S7, age);
  let lo = 0.05;
  let hi = 0.95;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (jp3(sex, m * S7, age) < target) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

// Kilograms of fat that must leave the body to drop body fat percentage by dPts, lean mass held fixed.
function fatKgForPoints(dPts: number, weightKg: number, bfPct: number): number {
  const d = dPts / 100;
  const bf = bfPct / 100;
  return (d * weightKg) / (1 - bf + d);
}

const SIGMA_OPTIONS = [0.5, 1, 1.5, 2];

export default function BodyFatCalculatorCaliperPage() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(78);
  const [sites, setSites] = useState<number[]>(DEFAULTS.male);
  const [sigmaIdx, setSigmaIdx] = useState(1);

  const weightKg = unit === "us" ? weight / LB : weight;
  const weightLabel = unit === "us" ? "lb" : "kg";

  const tri = TRI[sex];
  const S7 = sites.reduce((a, b) => a + b, 0);
  const S3 = tri.reduce((a, i) => a + sites[i], 0);

  const ageOk = age > 10 && age < 90;
  const wOk = weightKg > 30 && weightKg < 250;
  const ok = ageOk && wOk && S7 > 20 && S7 < 320 && S3 > 8;

  const bf7 = ok ? jp7(sex, S7, age) : NaN;
  const bf3 = ok ? jp3(sex, S3, age) : NaN;
  const dens = ok ? bd7(sex, S7, age) : NaN;
  const rho = S7 > 0 ? S3 / S7 : NaN;
  const rStar = ok ? rhoStar(sex, S7, age) : NaN;

  const sigma = SIGMA_OPTIONS[sigmaIdx];
  const s7 = ok ? Math.abs(slope(sex, S7, age, 7)) : NaN;
  const s3 = ok ? Math.abs(slope(sex, S3, age, 3)) : NaN;

  const sd7 = s7 * sigma * Math.sqrt(7);
  const sd3 = s3 * sigma * Math.sqrt(3);
  const band95 = 1.96 * sd7;
  const thr7 = 1.96 * Math.SQRT2 * sd7;
  const thr3 = 1.96 * Math.SQRT2 * sd3;
  const thrMm = Number.isFinite(s7) && s7 > 0 ? thr7 / s7 : NaN;
  const thrKg = Number.isFinite(thr7) ? fatKgForPoints(thr7, weightKg, bf7) : NaN;

  const setsFor = (target: number) => Math.max(1, Math.ceil((thr7 / target) ** 2));

  function changeSex(next: Sex) {
    if (next === sex) return;
    setSex(next);
    setSites(DEFAULTS[next]);
    setAge(next === "male" ? 30 : 32);
    setWeight(next === "male" ? 78 : 64);
  }

  function switchUnit(next: Unit) {
    if (next === unit) return;
    setWeight(next === "us" ? Math.round(weight * LB) : Math.round(weight / LB));
    setUnit(next);
  }

  function setSite(i: number, v: number) {
    const next = sites.slice();
    next[i] = v;
    setSites(next);
  }

  const rhoVerdict =
    Number.isFinite(rho) && Number.isFinite(rStar)
      ? rho > rStar
        ? "your three sites carry more than the equilibrium share, so the 3-site equation reads high"
        : "your three sites carry less than the equilibrium share, so the 3-site equation reads low"
      : "";

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/body-fat-calculator">Body Fat %</a>
          <a href="/fat-calculator">Fat Calculator</a>
          <a href="/measure-body-fat-percentage">Measure</a>
          <a href="/how-to-measure-body-fat-at-home">At Home</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">BODY FAT CALCULATOR · CALIPER</div>
        <h1>Body Fat Calculator Caliper</h1>
        <p className="tool-lede">
          Enter seven skinfolds and this runs the Jackson&ndash;Pollock 7-site and 3-site equations at the same
          time on the same folds, then tells you something no caliper chart does: how wide the band around your
          number really is. You get your percentage, the spread between the two protocols, the reason they
          disagree, and the smallest change you are entitled to call real. Everything runs in your browser;
          nothing is uploaded.
        </p>

        <div className="calc-layout">
          <div className="calc-card">
            <div className="field-grid">
              <Field label="Sex">
                <select value={sex} onChange={(e) => changeSex(e.target.value as Sex)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </Field>
              <Field label="Units">
                <select value={unit} onChange={(e) => switchUnit(e.target.value as Unit)}>
                  <option value="metric">Metric (kg)</option>
                  <option value="us">US (lb)</option>
                </select>
              </Field>
              <Field label="Age">
                <input type="number" min={14} max={85} value={age} onChange={(e) => setAge(+e.target.value)} />
              </Field>
              <Field label={`Weight (${weightLabel})`}>
                <input type="number" min={1} value={weight} onChange={(e) => setWeight(+e.target.value)} />
              </Field>
              {SITES.map((name, i) => (
                <Field key={name} label={`${name} (mm)${tri.includes(i) ? " · 3-site" : ""}`}>
                  <input
                    type="number"
                    min={1}
                    max={80}
                    step={1}
                    value={sites[i]}
                    onChange={(e) => setSite(i, +e.target.value)}
                  />
                </Field>
              ))}
              <Field label="Your per-site scatter (σ)">
                <select value={sigmaIdx} onChange={(e) => setSigmaIdx(+e.target.value)}>
                  {SIGMA_OPTIONS.map((s, i) => (
                    <option value={i} key={s}>
                      {s} mm — {i === 0 ? "very steady" : i === 1 ? "typical" : i === 2 ? "shaky" : "beginner"}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="answer-card">
            <span>CALIPER RESULT · JACKSON–POLLOCK 7-SITE</span>
            <div className="answer-number">
              {Number.isFinite(bf7) ? bf7.toFixed(1) : "—"}
              <small>% body fat</small>
            </div>
            {Number.isFinite(bf7) ? (
              <>
                <p>
                  Seven-site total <b>{S7} mm</b>, body density <b>{dens.toFixed(4)} g/mL</b>. The 3-site
                  equation on the same folds returns <b>{bf3.toFixed(1)}%</b> from {S3} mm, a gap of{" "}
                  <b>{(bf3 - bf7).toFixed(2)} points</b>.
                </p>
                <p>
                  Your three sites carry <b>{(rho * 100).toFixed(1)}%</b> of your seven-site total. For your age
                  and totals the two equations agree at <b>{(rStar * 100).toFixed(1)}%</b> — {rhoVerdict}. That
                  gap is arithmetic, not a mistake you made.
                </p>
                <p>
                  <b>Noise band ±{band95.toFixed(2)} points</b> at 95% with {sigma} mm of per-site scatter, so
                  the honest reading is <b>{(bf7 - band95).toFixed(1)}–{(bf7 + band95).toFixed(1)}%</b>. One
                  millimetre at a single site is worth {s7.toFixed(3)} points here; the same millimetre at every
                  site is worth {(s7 * 7).toFixed(2)}.
                </p>
                <p>
                  <b>Smallest change you can call real: {thr7.toFixed(2)} points</b> — that is {thrMm.toFixed(1)}{" "}
                  mm off your seven-site total, or {thrKg.toFixed(2)} kg of fat at {weightKg.toFixed(0)} kg.
                  Anything smaller than that is your pinch, not your body. On the 3-site protocol the threshold
                  is looser, {thr3.toFixed(2)} points, and you would need{" "}
                  <b>{setsFor(0.5)} independent sets</b> to bring this one under half a point.
                </p>
              </>
            ) : (
              <p>
                Enter an age between 14 and 85, a weight, and seven skinfolds that sum to more than 20 mm. A
                single site below about 4 mm is usually a pinch that caught muscle rather than fat.
              </p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>THE EQUATIONS THIS PAGE RUNS</span>
          <strong>
            7-site density (men) = 1.112 − 0.00043499·Σ₇ + 0.00000055·Σ₇² − 0.00028826·age
            <br />
            3-site density (men) = 1.10938 − 0.0008267·Σ₃ + 0.0000016·Σ₃² − 0.0002574·age
            <br />
            then body fat % = 495 ÷ density − 450
          </strong>
          <small>
            Skinfolds in millimetres, Σ is the sum of the sites, women use the corresponding female constants.
            These are published prediction equations, not inventions of this page. Every table below is
            arithmetic this page performs on them: derivatives taken numerically, per-site error propagated as
            an independent random error of σ millimetres, and the 3-site-versus-7-site equilibrium solved by
            bisection. None of it is copied from anywhere, and none of it claims to say how close these
            equations are to your true body fat — only how much the protocol and the instrument move the number
            before the equation ever sees it.
          </small>
        </div>

        <section className="content-block">
          <h2>The seven sites, exactly</h2>
          <p>
            A caliper is only as good as the place you put it. These are the seven landmarks the equation
            above expects, with the direction the fold runs at each one. Two rules apply to all seven: measure
            the same side of the body every time — the right side by convention — and mark the spot with a skin
            pencil rather than re-finding it by eye.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Site</span>
              <b>Fold</b>
              <span>Exactly where</span>
              <span>What goes wrong</span>
            </div>
            {[
              [
                "Chest",
                "Diagonal",
                "Halfway from the front armpit crease to the nipple for men; one third of the way for women",
                "Taking it horizontal, or pinching into the pectoral muscle instead of lifting skin and fat off it",
              ],
              [
                "Midaxillary",
                "Vertical",
                "On the mid-armpit line, level with the bottom tip of the breastbone",
                "Raising the arm to find it — the landmark moves before you pinch",
              ],
              [
                "Triceps",
                "Vertical",
                "Back of the upper arm, midway between the shoulder tip and the elbow tip, arm hanging relaxed",
                "Flexing, or reaching the arm across the body",
              ],
              [
                "Subscapular",
                "Diagonal, about 45°",
                "Just below the bottom tip of the shoulder blade",
                "Reaching behind your back to find the blade, which drags the skin and relocates the site",
              ],
              [
                "Abdomen",
                "Vertical",
                "About two centimetres to the right of the navel",
                "Pinching at the navel itself, or measuring after a hard exhale",
              ],
              [
                "Suprailiac",
                "Diagonal",
                "Just above the hip bone, in line with the front armpit crease",
                "Taking it vertically, or sliding down onto the hip bone",
              ],
              [
                "Thigh",
                "Vertical",
                "Front midline of the thigh, midway between the hip crease and the top of the kneecap, weight on the other foot",
                "Measuring seated, or with weight spread evenly, which flattens the fold",
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
            The three sites flagged in the calculator are the ones the 3-site equation uses: chest, abdomen and
            thigh for men; triceps, suprailiac and thigh for women. Everything else on this page follows from
            those seven numbers.
          </p>
        </section>

        <section className="content-block">
          <h2>The pinch and the read</h2>
          <p>
            Technique is where most of the error lives, and it is systematic — it pushes every reading the same
            way, which is worse than random scatter because averaging will not remove it.
          </p>
          <ol style={{ paddingLeft: 20, marginTop: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              Measure at the same time of day, under the same conditions, before training. Skin hydration and
              temperature change how a fold behaves, which is why protocols fix the conditions rather than
              pretending they do not matter.
            </li>
            <li>
              Grasp the fold with thumb and forefinger roughly a centimetre apart and lift it away from the
              muscle underneath. If you can feel muscle inside the pinch, you do not have a skinfold — let go
              and take it again.
            </li>
            <li>
              Put the jaws on the fold about a centimetre below your fingers, at the marked line, with the jaws
              perpendicular to the direction the fold runs.
            </li>
            <li>
              Release the trigger and let the spring close. Do not squeeze the caliper shut; the spring tension
              is the whole point of the instrument.
            </li>
            <li>
              Read at the same count every time. Two seconds after release is the usual convention. The number
              is still falling at that point, which sounds like a flaw and is not: as long as you always read at
              two seconds, the drift is identical at every visit and cancels out of the comparison. Read at four
              seconds once and you have moved the result by the amounts in the drift table below.
            </li>
            <li>
              Take two readings per site. If they differ by more than one or two millimetres, take a third and
              record the middle value. Never discard the high one because you did not like it.
            </li>
            <li>
              Total the seven. Do not round the total to the nearest five — the equation is close to linear in
              the sum, so rounding the sum throws away information the caliper actually gave you.
            </li>
          </ol>
        </section>

        <section className="content-block">
          <h2>Why 3-site and 7-site disagree</h2>
          <p>
            This is the question every caliper user eventually asks, and it has a clean answer. The two
            equations were fitted on different people with different site sets, so they only return the same
            number when the three sites happen to carry a particular share of the seven-site total. Call that
            share ρ. Solving for the ρ that makes the two agree gives a number that barely moves:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Seven-site total</span>
              <b>Age 20</b>
              <b>Age 30</b>
              <b>Age 40</b>
              <b>Age 50</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>80 mm</span>
              <b>0.478</b>
              <b>0.484</b>
              <b>0.489</b>
              <b>0.495</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>120 mm</span>
              <b>0.480</b>
              <b>0.484</b>
              <b>0.488</b>
              <b>0.492</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>160 mm</span>
              <b>0.474</b>
              <b>0.478</b>
              <b>0.481</b>
              <b>0.484</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>200 mm</span>
              <b>0.465</b>
              <b>0.467</b>
              <b>0.470</b>
              <b>0.473</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>240 mm</span>
              <b>0.451</b>
              <b>0.453</b>
              <b>0.456</b>
              <b>0.459</b>
            </div>
          </div>
          <p style={{ marginTop: 22 }}>
            <b>Men.</b> Across every age and total computed here the equilibrium sits between 0.451 and 0.500 —
            your three sites have to carry roughly <b>47 to 48 percent</b> of the seven-site total. The same
            table for women, over the identical grid, runs from 0.466 to 0.504:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Seven-site total</span>
              <b>Age 20</b>
              <b>Age 30</b>
              <b>Age 40</b>
              <b>Age 50</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>80 mm</span>
              <b>0.504</b>
              <b>0.502</b>
              <b>0.500</b>
              <b>0.499</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>120 mm</span>
              <b>0.492</b>
              <b>0.490</b>
              <b>0.489</b>
              <b>0.488</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>160 mm</span>
              <b>0.484</b>
              <b>0.483</b>
              <b>0.482</b>
              <b>0.481</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>200 mm</span>
              <b>0.477</b>
              <b>0.476</b>
              <b>0.475</b>
              <b>0.474</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>240 mm</span>
              <b>0.470</b>
              <b>0.469</b>
              <b>0.468</b>
              <b>0.467</b>
            </div>
          </div>
          <p style={{ marginTop: 22 }}>
            Now the useful part: how far apart the two protocols land when ρ is somewhere else. At age 30,
            difference in percentage points, 3-site minus 7-site:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Seven-site total</span>
              <b>ρ = 0.40</b>
              <b>ρ = 0.45</b>
              <b>ρ = 0.48</b>
              <b>ρ = 0.55</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>Men · 100 mm (14.6%)</span>
              <b>−2.51</b>
              <b>−1.02</b>
              <b>−0.13</b>
              <b>+1.89</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>Men · 140 mm (20.0%)</span>
              <b>−3.17</b>
              <b>−1.20</b>
              <b>−0.04</b>
              <b>+2.58</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>Men · 180 mm (24.6%)</span>
              <b>−3.41</b>
              <b>−1.05</b>
              <b>+0.32</b>
              <b>+3.38</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>Men · 220 mm (28.6%)</span>
              <b>−3.23</b>
              <b>−0.56</b>
              <b>+0.96</b>
              <b>+4.31</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>Women · 100 mm (20.6%)</span>
              <b>−3.33</b>
              <b>−1.57</b>
              <b>−0.53</b>
              <b>+1.85</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>Women · 140 mm (26.7%)</span>
              <b>−3.90</b>
              <b>−1.61</b>
              <b>−0.28</b>
              <b>+2.71</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>Women · 180 mm (32.1%)</span>
              <b>−4.19</b>
              <b>−1.51</b>
              <b>+0.02</b>
              <b>+3.40</b>
            </div>
            <div className="chart-row chart-row-five">
              <span>Women · 220 mm (36.8%)</span>
              <b>−4.19</b>
              <b>−1.26</b>
              <b>+0.39</b>
              <b>+3.89</b>
            </div>
          </div>
          <p style={{ marginTop: 22 }}>
            A five-point swing in ρ — which is a completely ordinary difference in where someone stores fat —
            moves the answer by roughly five points. That is larger than anyone&apos;s technique error and
            larger than the difference between a cheap caliper and an expensive one. It is the single biggest
            reason two honest measurements of the same person come out different, and it is invisible unless
            you run both protocols on the same folds, which is what the calculator above does.
          </p>
        </section>

        <section className="content-block">
          <h2>What one millimetre is worth</h2>
          <p>
            Both equations are near-linear in the skinfold sum over the range most people occupy, so the
            sensitivity has a simple meaning: percentage points per millimetre of total. It is not a constant —
            it falls as the total rises, because of the small positive quadratic term.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Sum (mm)</span>
              <b>Men 3-site</b>
              <b>Men 7-site</b>
              <b>Women 3-site</b>
              <b>Women 7-site</b>
            </div>
            {[
              ["60", "0.281", "0.157", "0.326", "0.175"],
              ["80", "0.258", "0.149", "0.291", "0.168"],
              ["100", "0.234", "0.142", "0.254", "0.160"],
              ["120", "0.208", "0.134", "0.214", "0.152"],
              ["140", "0.181", "0.125", "0.172", "0.144"],
              ["160", "0.153", "0.117", "0.128", "0.135"],
            ].map((r) => (
              <div className="chart-row chart-row-five" key={r[0]}>
                <span>{r[0]} mm</span>
                <b>{r[1]}</b>
                <b>{r[2]}</b>
                <b>{r[3]}</b>
                <b>{r[4]}</b>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Two things follow. First, the 3-site equation is roughly twice as steep as the 7-site one, so each
            millimetre of error hurts about twice as much there. Second, a millimetre matters far less than
            people assume: at a seven-site total of 140 mm, a man would need about <b>8 mm</b> of real change to
            move one percentage point. A single bad site is not your problem — eight millimetres of distributed
            change is.
          </p>
        </section>

        <section className="content-block">
          <h2>Two kinds of error, and only one of them averages away</h2>
          <p>
            Random error is the site-to-site wobble in your own hand: you pinch slightly differently each time.
            If each site carries an independent error of σ millimetres, the sum carries σ·√n, and that
            propagates through the sensitivity above. At a 180 mm seven-site total for men and a 90 mm
            three-site total:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Per-site σ</span>
              <b>Men 3-site</b>
              <b>Men 7-site</b>
              <b>Women 3-site</b>
              <b>Women 7-site</b>
            </div>
            {[
              ["0.5 mm", "0.213", "0.143", "0.236", "0.167"],
              ["1.0 mm", "0.427", "0.285", "0.473", "0.333"],
              ["1.5 mm", "0.640", "0.428", "0.709", "0.500"],
              ["2.0 mm", "0.854", "0.571", "0.946", "0.666"],
            ].map((r) => (
              <div className="chart-row chart-row-five" key={r[0]}>
                <span>{r[0]}</span>
                <b>±{r[1]}</b>
                <b>±{r[2]}</b>
                <b>±{r[3]}</b>
                <b>±{r[4]}</b>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Seven sites win, but by less than the arithmetic of &ldquo;more data&rdquo; suggests. They have √7
            against √3 — 1.53 times more accumulated noise — and only claw that back because the 7-site
            equation is about half as steep. The net gain at σ = 1 mm is 0.427 versus 0.285 points, about a
            third. Worth having, not transformative.
          </p>
          <p>
            Technique bias is the other family, and it behaves completely differently. If every site is off by
            the same amount — because you pinched shallow, or read late, or your landmark drifted — the error
            adds linearly, and the number of sites stops helping:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Error</span>
              <b>Men 7-site</b>
              <b>Men 3-site</b>
              <b>Women 7-site</b>
              <b>Women 3-site</b>
            </div>
            {[
              ["+1 mm at one site", "+0.11", "+0.25", "+0.13", "+0.27"],
              ["+2 mm at one site", "+0.21", "+0.49", "+0.25", "+0.54"],
              ["+1 mm at every site", "+0.74", "+0.73", "+0.87", "+0.81"],
              ["+2 mm at every site", "+1.47", "+1.46", "+1.72", "+1.60"],
            ].map((r) => (
              <div className="chart-row chart-row-five" key={r[0]}>
                <span>{r[0]}</span>
                <b>{r[1]}</b>
                <b>{r[2]}</b>
                <b>{r[3]}</b>
                <b>{r[4]}</b>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Look at the last two rows: one millimetre at every site costs <b>0.74 points on the 7-site
            protocol and 0.73 on the 3-site</b> — identical to two decimal places, and the same near-equality
            holds for women. Adding four more sites does nothing whatsoever against a systematic error, because
            four more sites also means four more places for it to happen. Averaging does not help either; a
            bias is not noise. The only defence is the protocol itself: mark the landmark, read at the same
            count, lift fat rather than muscle.
          </p>
          <p>
            Timing the read is the easiest bias to acquire by accident. If your reading decays by d millimetres
            per site between the two-second mark and whenever you actually look, the whole sum drops by n·d:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Drift per site</span>
              <b>Men 7-site</b>
              <b>Men 3-site</b>
              <b>Women 7-site</b>
              <b>Women 3-site</b>
            </div>
            {[
              ["0.5 mm", "−0.38", "−0.37", "−0.44", "−0.41"],
              ["1.0 mm", "−0.77", "−0.74", "−0.89", "−0.83"],
              ["2.0 mm", "−1.55", "−1.50", "−1.81", "−1.67"],
            ].map((r) => (
              <div className="chart-row chart-row-five" key={r[0]}>
                <span>{r[0]}</span>
                <b>{r[1]}</b>
                <b>{r[2]}</b>
                <b>{r[3]}</b>
                <b>{r[4]}</b>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            The size of d is a modelling parameter here, not a measured constant — it depends on your caliper,
            your tissue and how patient you are. What is not a modelling assumption is the shape of the result:
            drift is multiplied by the number of sites and then by the sensitivity, so it lands in exactly the
            same place as any other systematic error.
          </p>
        </section>

        <section className="content-block">
          <h2>The smallest change you are allowed to believe</h2>
          <p>
            Comparing two measurements means comparing two noisy numbers, so the noise adds: the standard
            deviation of the difference is √2 times the single-visit figure. At 95% confidence the change has
            to exceed 1.96·√2·σ<sub>BF</sub> before it means anything. Both columns below are the same
            calculation, expressed once in percentage points and once in millimetres of the total.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Per-site σ</span>
              <b>Men 7-site</b>
              <b>Men 3-site</b>
              <b>Women 7-site</b>
              <b>Women 3-site</b>
            </div>
            {[
              ["0.5 mm", "0.40 pt · 3.7 mm", "0.59 pt · 2.4 mm", "0.46 pt · 3.7 mm", "0.66 pt · 2.4 mm"],
              ["1.0 mm", "0.79 pt · 7.3 mm", "1.18 pt · 4.8 mm", "0.92 pt · 7.3 mm", "1.31 pt · 4.8 mm"],
              ["2.0 mm", "1.58 pt · 14.7 mm", "2.37 pt · 9.6 mm", "1.85 pt · 14.7 mm", "2.62 pt · 9.6 mm"],
            ].map((r) => (
              <div className="chart-row chart-row-five" key={r[0]}>
                <span>{r[0]}</span>
                <b>{r[1]}</b>
                <b>{r[2]}</b>
                <b>{r[3]}</b>
                <b>{r[4]}</b>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            With ordinary steadiness — 1 mm per site — a man using seven sites needs <b>0.79 points</b>, or
            about <b>7 mm off his total</b>, before the drop is real rather than his own hand. Note the
            millimetre figure is the same for men and women while the point figure is not: the millimetres are
            pure noise geometry, the points go through each equation&apos;s own sensitivity.
          </p>
          <p>
            Averaging whole sets is the way to buy precision back, and it is expensive. To drag the 95%
            threshold below a given figure at 1 mm of per-site scatter, the number of independent complete sets
            you need is:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Threshold</span>
              <b>Men 7-site</b>
              <b>Men 3-site</b>
              <b>Women 7-site</b>
              <b>Women 3-site</b>
            </div>
            {[
              ["1.0 point", "1", "2", "1", "2"],
              ["0.5 point", "3", "6", "4", "7"],
              ["0.25 point", "11", "23", "14", "28"],
            ].map((r) => (
              <div className="chart-row chart-row-five" key={r[0]}>
                <span>{r[0]}</span>
                <b>{r[1]}</b>
                <b>{r[2]}</b>
                <b>{r[3]}</b>
                <b>{r[4]}</b>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            Twenty-three complete three-site sets to resolve a quarter point is not a practical protocol, and
            the honest conclusion is that monthly tracking should be read to the nearest point, not the nearest
            tenth. Anyone showing you a caliper chart with one decimal place is reporting their arithmetic, not
            your body.
          </p>
        </section>

        <section className="content-block">
          <h2>Siri or Brozek: the other choice nobody mentions</h2>
          <p>
            The caliper gives you a sum of millimetres. The equation turns that into a body density, and a
            second equation turns the density into a percentage. There are two standard ways to do the second
            step, and they do not agree. This page uses Siri throughout; here is what the alternative would
            have given you.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-quad">
              <span>Body density</span>
              <b>Siri %</b>
              <b>Brozek %</b>
              <b>Siri − Brozek</b>
            </div>
            {[
              ["1.030", "30.58", "29.49", "+1.09"],
              ["1.040", "25.96", "25.22", "+0.74"],
              ["1.050", "21.43", "21.04", "+0.39"],
              ["1.060", "16.98", "16.93", "+0.05"],
              ["1.0614", "16.37", "16.36", "0.00"],
              ["1.070", "12.62", "12.90", "−0.29"],
              ["1.080", "8.33", "8.95", "−0.61"],
            ].map((r) => (
              <div className="chart-row chart-row-quad" key={r[0]}>
                <span>{r[0]}</span>
                <b>{r[1]}</b>
                <b>{r[2]}</b>
                <b>{r[3]}</b>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            They cross at a density of <b>1.0614</b>, about 16.4% body fat, and diverge in opposite directions
            on either side of it — Siri reads higher on fatter bodies, Brozek higher on leaner ones. Below
            about 12% or above about 30% the choice is worth more than half a point, which is comparable to
            your per-site technique error. Whichever you pick, pick it once and write it down next to your
            log, because half the &ldquo;my numbers jumped&rdquo; stories are someone switching conversion
            equations between visits without knowing there was a choice.
          </p>
        </section>

        <section className="content-block">
          <h2>What a fold actually is</h2>
          <p>
            One piece of geometry explains why skinfold millimetres feel oddly large. A skinfold is a double
            layer of skin with the subcutaneous fat between them: the caliper is measuring down one side and
            back up the other. A 20 mm reading is two layers of roughly 10 mm each, and only part of that is
            fat — the skin itself is in there twice as well.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-quad">
              <span>Caliper reading</span>
              <b>Per layer</b>
              <b>Two skins</b>
              <b>Fat thickness per layer</b>
            </div>
            {[
              ["5 mm", "2.5 mm", "a large share", "thin"],
              ["10 mm", "5.0 mm", "smaller share", "a few mm"],
              ["20 mm", "10.0 mm", "small share", "most of it"],
              ["30 mm", "15.0 mm", "negligible share", "nearly all"],
              ["40 mm", "20.0 mm", "negligible share", "nearly all"],
            ].map((r) => (
              <div className="chart-row chart-row-quad" key={r[0]}>
                <span>{r[0]}</span>
                <b>{r[1]}</b>
                <b>{r[2]}</b>
                <b>{r[3]}</b>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 22 }}>
            The halving is exact arithmetic. The skin share is deliberately left qualitative here because it
            varies by site and by person, and any specific millimetre figure would be invented. The practical
            consequence is real though: on lean bodies, where a single layer may only be a few millimetres, the
            skin is a meaningful fraction of what you measured, which is one reason caliper methods behave
            worst at the lean end. Conversely a large fold is almost entirely fat, so the same absolute error
            in millimetres represents a smaller proportional error — the tables above already account for this
            through the falling sensitivity.
          </p>
        </section>

        <section className="content-block">
          <h2>Choosing a caliper</h2>
          <p>
            Every proper skinfold caliper does the same thing: a spring closes the jaws at a nominally constant
            pressure and a scale reports the gap. That constant pressure is the whole design — it is what makes
            your reading comparable to the readings the equations were built on, and it is why you release the
            trigger rather than squeezing.
          </p>
          <p>The differences that exist are narrow and worth being honest about:</p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: "#5e685f" }}>
            <li>
              <b>Graduation.</b> Plastic entry-level calipers are commonly marked to 1 mm or 0.5 mm; metal dial
              and digital models commonly read to 0.5 mm or 0.1 mm. A finer scale lets you record finer
              differences. It does not steady your hand, and the tables above show the hand is the limiting
              factor long before the scale is.
            </li>
            <li>
              <b>Frame.</b> A body that flexes under the spring adds its own error to every reading. A rigid
              frame does not. This is the one structural difference that plausibly matters, and it is why
              metal frames are standard in settings where readings are compared over time.
            </li>
            <li>
              <b>Dial versus digital.</b> Both report the same jaw gap. Digital removes parallax and the
              rounding you do when you glance at a needle; a dial never needs a battery and lets you watch the
              needle settle, which some people find makes their read timing more consistent. Read timing
              consistency is worth more than the display, per the drift table above.
            </li>
            <li>
              <b>Cost.</b> Nothing on this page suggests an expensive caliper buys accuracy. Per the bias
              table, a systematic one-millimetre error at every site moves the answer by about three quarters
              of a point whether you spent a little or a lot, and per the equilibrium table the choice of
              protocol can move it five times as far.
            </li>
          </ul>
          <p>
            The one test worth doing, and it costs nothing: pinch the same site five times in a row at the same
            landmark, releasing fully between each. Work out the standard deviation of those five numbers. That
            is your σ, and it is the value the calculator at the top of this page asks for. If it comes out
            near 2 mm, no caliper will make your monthly comparison tighter than about 1.6 points — and if it
            comes out near 0.5 mm, the instrument was never your problem and you should spend your effort on
            landmarks instead.
          </p>
        </section>

        <section className="content-block">
          <h2>Caliper questions</h2>
          <div className="mini-faq">
            <details>
              <summary>How do I use a body fat caliper?</summary>
              <p>
                Pinch a fold of skin and fat about a centimetre above the landmark, lift it away from the
                muscle, place the jaws a centimetre below your fingers perpendicular to the fold, release the
                trigger and read at the same count every time — two seconds is the usual convention. Take two
                readings per site and a third if they differ by more than a millimetre or two. Total seven
                sites and run them through a Jackson&ndash;Pollock equation, which is what the calculator above
                does.
              </p>
            </details>
            <details>
              <summary>How accurate is a skinfold caliper?</summary>
              <p>
                This page can only speak to precision, not to accuracy against a laboratory reference. What the
                arithmetic shows is that with a typical 1 mm of per-site scatter, seven sites carry a 95% band
                of about ±0.56 points around a single reading, and a change has to exceed 0.79 points to be
                distinguishable from noise. Systematic technique error is the larger hazard: one millimetre at
                every site moves the result by 0.74 points and no amount of averaging removes it.
              </p>
            </details>
            <details>
              <summary>Should I use 3 sites or 7?</summary>
              <p>
                Seven, if you are willing to take them, but know what you are buying. Against random per-site
                scatter the 7-site result is about a third quieter — 0.285 points versus 0.427 at 1 mm. Against
                systematic error it buys almost nothing: 0.74 points versus 0.73 for the same one-millimetre
                bias. Seven sites also give you the ρ check, which tells you whether a disagreement between
                protocols is your fat distribution or a bad pinch.
              </p>
            </details>
            <details>
              <summary>Why do my 3-site and 7-site numbers disagree?</summary>
              <p>
                Because the two equations were fitted on different site sets, they only agree when your three
                sites carry a specific share of the seven-site total — between 0.45 and 0.50 for men and 0.47
                and 0.50 for women across every age and total computed here. Outside that band the gap opens
                fast: at a 180 mm total, moving that share from 0.40 to 0.55 swings the difference by about 6.8
                points for men. The calculator above reports your share and the equilibrium for your numbers.
              </p>
            </details>
            <details>
              <summary>How many millimetres is one percent of body fat?</summary>
              <p>
                It depends on your total. At a seven-site sum of 140 mm a man needs roughly 8 mm of change for
                one point; at 100 mm the sensitivity is 0.142 points per millimetre, so about 7 mm. The
                sensitivity falls as the total rises, so leaner people move further per millimetre than the
                table implies at the top end.
              </p>
            </details>
            <details>
              <summary>How often should I measure?</summary>
              <p>
                Monthly is the sensible cadence. With 1 mm of per-site scatter the smallest believable change
                at 95% is 0.79 points, and losing 0.79 points of body fat takes a realistic amount of time;
                measuring weekly mostly measures your hand. Measure at the same time of day, before training,
                under the same conditions.
              </p>
            </details>
            <details>
              <summary>Can I measure myself, or do I need a partner?</summary>
              <p>
                Most sites are reachable alone — chest, abdomen, thigh, suprailiac and triceps all are. The
                subscapular and midaxillary folds are the difficult ones, because reaching for them moves the
                skin you are about to pinch. If you measure alone, do it alone every time; switching between
                self-measured and partner-measured introduces a systematic difference that will look exactly
                like progress or exactly like a plateau.
              </p>
            </details>
            <details>
              <summary>My caliper and my smart scale disagree. Which is right?</summary>
              <p>
                Neither is a reference. A caliper measures the thickness of a pinch at specific landmarks and
                infers the rest from an equation; a smart scale sends a current through you and infers
                composition from an electrical signal that moves with hydration. They fail in different ways,
                which is why the spread between them is not evidence that one is broken. Our{" "}
                <a href="/scale-bmi">BMI and smart scale page</a> covers what those devices actually measure,
                and our <a href="/fat-percentage-calculator">fat percentage page</a> runs several methods side
                by side.
              </p>
            </details>
            <details>
              <summary>Where exactly does the caliper go on the abdomen and thigh?</summary>
              <p>
                Abdomen: a vertical fold about two centimetres to the right of the navel, not at the navel
                itself. Thigh: a vertical fold on the front midline, midway between the hip crease and the top
                of the kneecap, with your weight on the opposite foot so the muscle underneath relaxes and the
                fold lifts cleanly. Both are listed with their failure modes in the seven-site table above.
              </p>
            </details>
            <details>
              <summary>Do I need an expensive caliper?</summary>
              <p>
                The arithmetic here does not support that. Graduation finer than 0.5 mm records detail your
                pinch does not contain, and the dominant errors — landmark drift, reading timing, lifting
                muscle with the fat — are identical on any caliper. A rigid frame and a scale you can read
                consistently are worth paying for; extra digits are not.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/body-fat-calculator">body fat calculator</a> ·{" "}
            <a href="/fat-calculator">fat calculator with error budget</a> ·{" "}
            <a href="/measure-body-fat-percentage">measure body fat percentage</a> ·{" "}
            <a href="/how-to-measure-body-fat-at-home">how to measure body fat at home</a> ·{" "}
            <a href="/fat-percentage-calculator">fat percentage across three methods</a> ·{" "}
            <a href="/navy-body-fat-calculator">Navy tape method</a> ·{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a>
          </p>
          <p>
            <b>Not medical advice.</b> Every figure on this page is arithmetic this page performs on published
            prediction equations. It describes precision lost in the instrument and the protocol; it says
            nothing about how close those equations are to the truth for you. See our{" "}
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
