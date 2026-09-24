"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";
type Sex = "male" | "female";

const IN = 2.54;
const LB = 2.20462;

// ---- Model constants used by every figure on this page -----------------------
// A month is 365.25/12 days, so monthly rates are not rounded to 30 days.
const DAYS_PER_MONTH = 30.4375;
// Energy value of one kilogram of body fat used by this page. Stated as a
// modelling constant, not as a measured property of any individual.
const KCAL_PER_KG_FAT = 7700;
// Half-width of the recomposition window: the page calls the scale "flat" when
// net weight change stays within this many kilograms per month.
const FLAT_BAND = 0.15;

const ACTIVITY: [number, string][] = [
  [1.2, "Sedentary — mostly seated"],
  [1.375, "Lightly active — 1 to 3 days a week"],
  [1.55, "Moderately active — 3 to 5 days a week"],
  [1.725, "Very active — 6 to 7 days a week"],
  [1.9, "Extra active — physical job or twice daily"],
];

// Lean-mass gain rates, expressed as a fraction of lean body mass per month.
// These are modelling parameters chosen by this calculator so that the tables
// below are internally consistent. They are not measured outcomes, and the page
// says so wherever the number matters.
const TIERS: { id: string; label: string; rate: number }[] = [
  { id: "novice", label: "New to lifting (first year)", rate: 0.01 },
  { id: "intermediate", label: "Trained 1 to 3 years", rate: 0.005 },
  { id: "advanced", label: "Trained 3+ years", rate: 0.002 },
  { id: "none", label: "No progressive resistance training", rate: 0.001 },
];

const PROTEIN_TARGETS: [number, string][] = [
  [1.6, "1.6 g per kg lean mass"],
  [1.8, "1.8 g per kg lean mass"],
  [2.0, "2.0 g per kg lean mass"],
  [2.2, "2.2 g per kg lean mass"],
];

function mifflin(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
}

function fatLossPerMonth(deficit: number): number {
  return (deficit * DAYS_PER_MONTH) / KCAL_PER_KG_FAT;
}

function deficitForFatLoss(kgPerMonth: number): number {
  return (kgPerMonth * KCAL_PER_KG_FAT) / DAYS_PER_MONTH;
}

function thousands(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function project(
  fat0: number,
  lean0: number,
  fatPerMonth: number,
  leanPerMonth: number,
  months: number
): { fat: number; lean: number; weight: number; bf: number } | null {
  const fat = fat0 - fatPerMonth * months;
  const lean = lean0 + leanPerMonth * months;
  if (!Number.isFinite(fat) || !Number.isFinite(lean)) return null;
  if (fat <= 0 || lean <= 0) return null;
  return { fat, lean, weight: fat + lean, bf: (fat / (fat + lean)) * 100 };
}

export default function BodyRecompositionCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("us");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(70);
  const [weight, setWeight] = useState(176);
  const [bodyFat, setBodyFat] = useState(20);
  const [activity, setActivity] = useState(1.55);
  const [tier, setTier] = useState("intermediate");
  const [intake, setIntake] = useState(2400);
  const [proteinPerKg, setProteinPerKg] = useState(1.8);
  const [fatPerKg, setFatPerKg] = useState(0.8);

  const weightKg = unit === "us" ? weight / LB : weight;
  const heightCm = unit === "us" ? height * IN : height;

  const tierRate = TIERS.find((t) => t.id === tier)?.rate ?? 0.005;

  const bmr = mifflin(sex, weightKg, heightCm, age);
  const tdee = bmr * activity;

  const leanKg = weightKg * (1 - bodyFat / 100);
  const fatKg = weightKg - leanKg;

  const leanGain = tierRate * leanKg;
  const recompDeficit = deficitForFatLoss(leanGain);
  const recompIntake = tdee - recompDeficit;

  const windowLow = deficitForFatLoss(Math.max(0, leanGain - FLAT_BAND));
  const windowHigh = deficitForFatLoss(leanGain + FLAT_BAND);

  const deficit = tdee - intake;
  const fatPerMonth = fatLossPerMonth(deficit);

  const proteinG = proteinPerKg * leanKg;
  const fatG = fatPerKg * weightKg;
  const carbG = (intake - proteinG * 4 - fatG * 9) / 4;

  const p3 = project(fatKg, leanKg, fatPerMonth, leanGain, 3);
  const p6 = project(fatKg, leanKg, fatPerMonth, leanGain, 6);
  const p12 = project(fatKg, leanKg, fatPerMonth, leanGain, 12);

  const inWindow = deficit >= windowLow && deficit <= windowHigh;
  const verdict = inWindow
    ? "Inside the recomposition window: fat mass falls, lean mass rises, and the scale barely moves."
    : deficit > windowHigh
    ? "Deeper than the recomposition window. Fat loss outruns the lean mass you can build, so body weight drops. That is a cut, and a cut works — it just is not recomposition."
    : deficit > 0
    ? "Shallower than the recomposition window. Fat loss is slower than the lean mass you can add, so body weight drifts up while body fat percentage still falls."
    : "At or above maintenance. Fat mass is not falling, so any drop in body fat percentage has to come entirely from added lean mass.";

  const weightLabel = unit === "us" ? "lb" : "kg";
  const heightLabel = unit === "us" ? "in" : "cm";

  function switchUnit(next: Unit) {
    if (next === unit) return;
    if (next === "metric") {
      setHeight(Math.round(height * IN));
      setWeight(Math.round(weight / LB));
    } else {
      setHeight(Math.round(height / IN));
      setWeight(Math.round(weight * LB));
    }
    setUnit(next);
  }

  const showProjection =
    p3 && p6 && p12
      ? `${p3.bf.toFixed(1)}% at 3 months, ${p6.bf.toFixed(1)}% at 6 months, ${p12.bf.toFixed(1)}% at 12 months`
      : "outside the range this model can project";

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/tdee-calculator">TDEE</a>
          <a href="/body-fat-calculator">Body Fat %</a>
          <a href="/navy-body-fat-calculator">Navy</a>
          <a href="/body-fat-percentage-chart">Chart</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">BODY RECOMPOSITION CALCULATOR</div>
        <h1>Body Recomposition Calculator</h1>
        <p className="tool-lede">
          Lose fat and add lean mass at the same time, and the scale stops being useful. This calculator finds
          the daily intake where the two cancel out — the recomposition point — then gives you the protein
          target and the month-by-month body fat projection that go with it.
        </p>

        <div className="calc-layout">
          <div className="calc-card">
            <div className="field-grid">
              <Field label="Units">
                <select value={unit} onChange={(e) => switchUnit(e.target.value as Unit)}>
                  <option value="us">US (lb / in)</option>
                  <option value="metric">Metric (kg / cm)</option>
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
              <Field label={`Height (${heightLabel})`}>
                <input type="number" min={1} value={height} onChange={(e) => setHeight(+e.target.value)} />
              </Field>
              <Field label={`Weight (${weightLabel})`}>
                <input type="number" min={1} value={weight} onChange={(e) => setWeight(+e.target.value)} />
              </Field>
              <Field label="Body fat %">
                <input
                  type="number"
                  min={3}
                  max={70}
                  value={bodyFat}
                  onChange={(e) => setBodyFat(+e.target.value)}
                />
              </Field>
              <Field label="Activity">
                <select value={activity} onChange={(e) => setActivity(+e.target.value)}>
                  {ACTIVITY.map(([factor, label]) => (
                    <option value={factor} key={factor}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Training history">
                <select value={tier} onChange={(e) => setTier(e.target.value)}>
                  {TIERS.map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Daily intake (kcal)">
                <input type="number" min={800} value={intake} onChange={(e) => setIntake(+e.target.value)} />
              </Field>
              <Field label="Protein target">
                <select value={proteinPerKg} onChange={(e) => setProteinPerKg(+e.target.value)}>
                  {PROTEIN_TARGETS.map(([v, label]) => (
                    <option value={v} key={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fat (g per kg body weight)">
                <input
                  type="number"
                  min={0.2}
                  max={2}
                  step={0.1}
                  value={fatPerKg}
                  onChange={(e) => setFatPerKg(+e.target.value)}
                />
              </Field>
              <Field label=" ">
                <button className="calc-button" style={{ marginTop: 0 }} onClick={() => setIntake(Math.round(recompIntake))}>
                  Use the recomposition point
                </button>
              </Field>
            </div>
          </div>

          <div className="answer-card">
            <span>DAILY TARGET FOR RECOMPOSITION</span>
            <div className="answer-number">
              {thousands(recompIntake)}
              <small> kcal/day</small>
            </div>
            <p>
              Estimated TDEE is <b>{thousands(tdee)} kcal</b>, and at your training tier the lean mass you can
              add is worth <b>{thousands(recompDeficit)} kcal/day</b> of fat loss. Eat {thousands(recompIntake)}{" "}
              and the two cancel: body fat falls, body weight holds.
            </p>
            <p>
              You entered <b>{thousands(intake)} kcal</b>, a deficit of <b>{thousands(deficit)} kcal/day</b>.{" "}
              {verdict}
            </p>
            <p>
              Protein <b>{Math.round(proteinG)} g/day</b> at {proteinPerKg} g per kg of your{" "}
              {leanKg.toFixed(1)} kg lean mass. Fat <b>{Math.round(fatG)} g</b>, carbohydrate{" "}
              <b>{carbG > 0 ? Math.round(carbG) : 0} g</b>
              {carbG <= 0 ? " — protein and fat alone already exceed your intake." : "."}
            </p>
            <p>
              At your intake: fat {fatPerMonth >= 0 ? "−" : "+"}
              {Math.abs(fatPerMonth).toFixed(2)} kg/month, lean +{leanGain.toFixed(2)} kg/month, net weight{" "}
              {leanGain - fatPerMonth >= 0 ? "+" : "−"}
              {Math.abs(leanGain - fatPerMonth).toFixed(2)} kg/month. Projected body fat: {showProjection}.
            </p>
            <p>
              Recomposition window for your tier: <b>{thousands(windowLow)}–{thousands(windowHigh)} kcal/day</b>{" "}
              below TDEE, which is {(windowLow / tdee) * 100 > 0 ? (windowLow / tdee) * 100 : 0} to{" "}
              {((windowHigh / tdee) * 100).toFixed(1)} percent of your daily expenditure.
            </p>
          </div>
        </div>

        <div className="formula-box">
          <span>THE MODEL</span>
          <strong>
            TDEE = (10 × weight + 6.25 × height − 5 × age + 5 or − 161) × activity &nbsp;|&nbsp; fat loss per
            month = deficit × 30.4375 ÷ 7700 &nbsp;|&nbsp; recomposition point = lean gain × 7700 ÷ 30.4375
          </strong>
          <small>
            Weight in kilograms, height in centimetres. The first equation is Mifflin–St Jeor, the same one our{" "}
            <a href="/tdee-calculator">TDEE calculator</a> runs. 7700 kcal per kilogram of body fat and the
            per-tier lean gain rates are modelling constants chosen by this page, not measurements of any
            person. Every table below is arithmetic on those constants.
          </small>
        </div>

        <section className="content-block">
          <h2>What body recomposition actually means</h2>
          <p>
            Recomposition is a period during which fat mass falls and lean mass rises at the same time. Body
            weight is the sum of the two, so when the rates are close the scale does nothing for months while
            your body fat percentage moves steadily downward. That is the whole appeal, and it is also the
            whole problem: the scale, which is the easiest thing to measure, is exactly the instrument that
            stops reporting anything.
          </p>
          <p>
            The way out is to stop trying to read the outcome off a scale and start planning with rates
            instead. If you know two numbers — how fast fat is leaving, and how fast lean mass can arrive —
            everything else follows: what to eat, how much protein, how long the target takes, and which part
            of your result came from which process. That is what the rest of this page computes.
          </p>
          <p>
            The two inputs are wildly unequal in size. A modest 300 kcal daily deficit removes about 1.19 kg
            of fat a month. A trained lifter might add 0.32 kg of lean mass in that same month. Fat loss is
            the big lever on body fat percentage; lean gain is the small one. The tables below put a number on
            how small, because the honest answer is smaller than most recomposition marketing implies.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: the recomposition point, and how narrow the window is</h2>
          <p>
            Set monthly fat loss equal to monthly lean gain and solve for the deficit. That deficit is the
            recomposition point: eat there and weight is flat while body fat falls. Around it sits a band
            where the scale drifts by less than 0.15 kg a month — invisible on a bathroom scale, which is
            what makes it feel like recomposition. Both tables use a 178 cm, 30-year-old, moderately active
            man at 80 kg and 20 percent body fat, and a 165 cm, 30-year-old woman at 65 kg and 28 percent.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Male, 80 kg, 20% body fat</span>
              <b>Lean gain / month</b>
              <span>Recomp point</span>
              <span>Window (kcal/day below TDEE, % of TDEE)</span>
            </div>
            {[
              ["New to lifting (first year)", "0.64 kg", "162 kcal", "124–200 (4.5–7.3% of a 2,740 kcal TDEE)"],
              ["Trained 1 to 3 years", "0.32 kg", "81 kcal", "43–119 (1.6–4.3% of a 2,740 kcal TDEE)"],
              ["Trained 3+ years", "0.13 kg", "32 kcal", "0–70 (0.0–2.6% of a 2,740 kcal TDEE)"],
              ["No progressive resistance training", "0.06 kg", "16 kcal", "0–54 (0.0–2.0% of a 2,740 kcal TDEE)"],
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
              <span>Female, 65 kg, 28% body fat</span>
              <b>Lean gain / month</b>
              <span>Recomp point</span>
              <span>Window (kcal/day below TDEE, % of TDEE)</span>
            </div>
            {[
              ["New to lifting (first year)", "0.47 kg", "118 kcal", "80–156 (3.8–7.4% of a 2,124 kcal TDEE)"],
              ["Trained 1 to 3 years", "0.23 kg", "59 kcal", "21–97 (1.0–4.6% of a 2,124 kcal TDEE)"],
              ["Trained 3+ years", "0.09 kg", "24 kcal", "0–62 (0.0–2.9% of a 2,124 kcal TDEE)"],
              ["No progressive resistance training", "0.05 kg", "12 kcal", "0–50 (0.0–2.3% of a 2,124 kcal TDEE)"],
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
            The striking part is the width. For a lifter with one to three years of training, the entire
            recomposition window is 43 to 119 kcal a day — roughly one slice of bread, or 1.6 to 4.3 percent
            of daily expenditure. Nobody tracks intake to that precision in free-living conditions, which is
            worth saying plainly: recomposition is not a target you hit by arithmetic. It is a zone you
            operate inside by eating close to maintenance, hitting a protein target, and training hard enough
            to justify the lean gain rate you assumed.
          </p>
          <p>
            The other reading of the same table is more encouraging. Because the window is defined by how
            much lean mass you can add, and that is nearly fixed, the practical instruction is not
            &quot;find the perfect deficit&quot; but &quot;get your deficit small enough that it stops
            dominating&quot;. Below about 150 kcal a day, the recomposition story and the cut story are the
            same story with different emphasis.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what a daily deficit actually removes</h2>
          <p>
            This is the one table on this page with no modelling assumptions in it at all beyond the 7700 kcal
            constant. Pick a deficit, divide by the energy value of fat, and you have a rate.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Daily deficit</span>
              <b>Per week</b>
              <span>Per month</span>
              <span>Over 12 weeks (and in pounds)</span>
            </div>
            {[
              ["100 kcal", "0.09 kg", "0.40 kg", "1.09 kg — 2.4 lb"],
              ["150 kcal", "0.14 kg", "0.59 kg", "1.64 kg — 3.6 lb"],
              ["200 kcal", "0.18 kg", "0.79 kg", "2.19 kg — 4.8 lb"],
              ["250 kcal", "0.23 kg", "0.99 kg", "2.74 kg — 6.0 lb"],
              ["300 kcal", "0.27 kg", "1.19 kg", "3.28 kg — 7.2 lb"],
              ["400 kcal", "0.36 kg", "1.58 kg", "4.38 kg — 9.7 lb"],
              ["500 kcal", "0.46 kg", "1.98 kg", "5.47 kg — 12.1 lb"],
              ["700 kcal", "0.64 kg", "2.77 kg", "7.66 kg — 16.9 lb"],
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
            Read it against the lean gain column of the previous table. A 300 kcal deficit removes 1.19 kg of
            fat a month while a trained lifter adds 0.32 kg of lean — the fat side is nearly four times
            larger. At 100 kcal the ratio is about 1.6 to one. That crossover is why small deficits are where
            recomposition lives and large deficits are just cuts.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: twelve months at the recomposition point</h2>
          <p>
            Same 80 kg man at 20 percent body fat, trained one to three years, eating 75 kcal a day below his
            estimated 2,740 kcal TDEE — the recomposition point for his tier, rounded to the nearest 25. Fat
            mass falls 0.296 kg a month, lean mass rises 0.320 kg a month.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Month</span>
              <b>Body weight</b>
              <span>Body fat</span>
              <span>Composition behind it</span>
            </div>
            {[
              ["Start", "80.00 kg", "20.00%", "Fat 16.00 kg, lean 64.00 kg"],
              ["Month 1", "80.02 kg", "19.62%", "Fat 15.70 kg, lean 64.32 kg"],
              ["Month 2", "80.05 kg", "19.25%", "Fat 15.41 kg, lean 64.64 kg"],
              ["Month 3", "80.07 kg", "18.87%", "Fat 15.11 kg, lean 64.96 kg"],
              ["Month 6", "80.14 kg", "17.75%", "Fat 14.22 kg, lean 65.92 kg"],
              ["Month 9", "80.21 kg", "16.62%", "Fat 13.33 kg, lean 66.88 kg"],
              ["Month 12", "80.28 kg", "15.50%", "Fat 12.44 kg, lean 67.84 kg"],
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
            Four and a half percentage points of body fat in a year, during which the scale moved 0.28 kg —
            about the weight of a large apple, and well inside normal day-to-day water variation. Anyone
            weighing themselves weekly through this year would conclude nothing was happening. The tape
            measure and the body fat estimate would both disagree, and they would be right.
          </p>
          <p>
            Note also that the rate is not constant in percentage terms even though the kilogram rates are
            fixed: the first month costs 0.38 percentage points, the twelfth costs 0.37, but the
            <b> </b>percentage base is shrinking, so each point gets slightly harder to buy. On the{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a> this is the difference between
            moving within a band and crossing into the next one.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: the same twelve months, tier by tier</h2>
          <p>
            Each tier is run at its own recomposition point, rounded to the nearest 25 kcal. This is the table
            that shows what training history is actually worth in a recomposition plan.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Male, 80 kg, 20% body fat</span>
              <b>Deficit used</b>
              <span>Body fat at 6 months</span>
              <span>Body fat at 12 months, with weight change</span>
            </div>
            {[
              ["New to lifting (first year)", "150 kcal", "15.50%", "11.03% — weight 80.56 kg (+0.56 kg)"],
              ["Trained 1 to 3 years", "75 kcal", "17.75%", "15.50% — weight 80.28 kg (+0.28 kg)"],
              ["Trained 3+ years", "25 kcal", "19.22%", "18.44% — weight 80.35 kg (+0.35 kg)"],
              ["No progressive resistance training", "25 kcal", "19.31%", "18.61% — weight 79.58 kg (−0.42 kg)"],
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
              <span>Female, 65 kg, 28% body fat</span>
              <b>Deficit used</b>
              <span>Body fat at 6 months</span>
              <span>Body fat at 12 months, with weight change</span>
            </div>
            {[
              ["New to lifting (first year)", "125 kcal", "23.50%", "18.97% — weight 64.69 kg (−0.31 kg)"],
              ["Trained 1 to 3 years", "50 kcal", "26.09%", "24.19% — weight 65.44 kg (+0.44 kg)"],
              ["Trained 3+ years", "25 kcal", "27.10%", "26.20% — weight 64.94 kg (−0.06 kg)"],
              ["No progressive resistance training", "0 kcal", "27.88%", "27.76% — weight 65.56 kg (+0.56 kg)"],
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
            Two things are worth pulling out. First, the beginner&apos;s advantage is enormous: the same twelve
            months buys 8.97 percentage points for a first-year lifter and 1.56 for someone with three-plus
            years of training, purely because the lean gain rate differs by a factor of five. Second, the
            bottom row of each table is the honest control group — with no progressive resistance training
            there is almost no lean gain to cancel the deficit, so the year is just a very slow cut with a
            nearly flat scale.
          </p>
          <p>
            Some rows land below the essential-fat bands shown on our{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a>. Those rows are arithmetic, not
            targets. The model subtracts fat at a constant rate and has no floor.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: how much of the drop is muscle, really</h2>
          <p>
            Run the six-month projection twice more — once with the fat loss but no lean gain, once with the
            lean gain but no fat loss — and you can split the body fat percentage change into the part that
            came from losing fat and the part that came from adding lean mass.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Daily deficit (male, trained 1–3 years)</span>
              <b>Total drop at 6 months</b>
              <span>Share from lean gain</span>
            </div>
            {[
              ["75 kcal", "2.25 percentage points", "20.8% — 79.2% from fat loss"],
              ["150 kcal", "4.12 percentage points", "11.4% — 88.6% from fat loss"],
              ["300 kcal", "8.12 percentage points", "5.8% — 94.2% from fat loss"],
            ].map(([a, b, c]) => (
              <div className="chart-row" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <p>
            This is the most useful number on the page for calibrating expectations. Even at the
            recomposition point, where the deficit is as small as it can be while still removing fat, only
            about a fifth of the six-month improvement comes from added lean mass. Push the deficit to 300
            kcal and lean gain contributes under six percent. Muscle gain is real and it is worth training
            for, but as a driver of the body fat percentage number over six months it is a rounding error
            next to the fat you did not eat.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what one percentage point costs</h2>
          <p>
            Divide a month by the first month&apos;s change in body fat percentage and you get the calendar
            price of a point. The net weight column is the other half of the trade: the faster you buy points,
            the more the scale has to move.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Daily deficit</span>
              <b>Net weight / month</b>
              <span>Months per point</span>
              <span>What that means</span>
            </div>
            {[
              ["50 kcal", "+0.12 kg", "3.61", "Weight drifts up, body fat falls slowly — true recomposition"],
              ["75 kcal", "+0.02 kg", "2.66", "The recomposition point for this profile"],
              ["100 kcal", "−0.08 kg", "2.10", "Flat scale, steady progress"],
              ["150 kcal", "−0.27 kg", "1.48", "Still near-flat, twice the speed"],
              ["200 kcal", "−0.47 kg", "1.14", "A gentle cut that still reads as recomposition"],
              ["300 kcal", "−0.87 kg", "0.78", "Clearly a cut — the scale now tells you something"],
              ["400 kcal", "−1.26 kg", "0.59", "Fast cut, hard to sustain for a year"],
              ["500 kcal", "−1.66 kg", "0.48", "Aggressive cut; lean gain assumptions stop holding"],
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
            A useful planning shortcut falls out of this: at a deficit of about 200 kcal a day you lose one
            body fat percentage point roughly every five weeks while losing less than half a kilogram a month
            on the scale. That combination — visible progress, nearly invisible scale movement — is the
            practical version of recomposition for most trained people.
          </p>
        </section>

        <section className="content-block">
          <h2>Protein: the one number that is not negotiable</h2>
          <p>
            Calorie arithmetic decides how fast fat leaves. Protein is what makes the lean side of the ledger
            possible at all, and it is the part of a recomposition plan you can actually control day to day.
            The table is pure multiplication — the target in grams per kilogram of lean body mass times your
            lean mass. Note that lean mass, not body weight, is the reference: two people at 80 kg with
            different body fat percentages need different amounts, and using total weight over-prescribes for
            the one carrying more fat.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-five">
              <span>Lean body mass</span>
              <b>1.6 g/kg</b>
              <b>1.8 g/kg</b>
              <b>2.0 g/kg</b>
              <b>2.2 g/kg</b>
            </div>
            {[
              ["35 kg", "56 g", "63 g", "70 g", "77 g"],
              ["40 kg", "64 g", "72 g", "80 g", "88 g"],
              ["45 kg", "72 g", "81 g", "90 g", "99 g"],
              ["50 kg", "80 g", "90 g", "100 g", "110 g"],
              ["55 kg", "88 g", "99 g", "110 g", "121 g"],
              ["60 kg", "96 g", "108 g", "120 g", "132 g"],
              ["65 kg", "104 g", "117 g", "130 g", "143 g"],
              ["70 kg", "112 g", "126 g", "140 g", "154 g"],
              ["75 kg", "120 g", "135 g", "150 g", "165 g"],
              ["80 kg", "128 g", "144 g", "160 g", "176 g"],
            ].map(([a, b, c, d, e]) => (
              <div className="chart-row chart-row-five" key={a}>
                <span>{a}</span>
                <b>{b}</b>
                <span>{c}</span>
                <span>{d}</span>
                <span>{e}</span>
              </div>
            ))}
          </div>
          <p>
            Where does the rest of the plate go? Fat has a floor set by your own choice — 0.8 g per kilogram
            of body weight is the default in the calculator above — and carbohydrate takes whatever is left.
            For the 80 kg man with 64 kg of lean mass, at 1.8 g/kg of protein:
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Daily intake</span>
              <b>Protein</b>
              <span>Fat at 0.8 g/kg</span>
              <span>Carbohydrate remainder</span>
            </div>
            {[
              ["2,100 kcal", "115 g (461 kcal)", "64 g (576 kcal)", "266 g (1,063 kcal) — 51% of intake"],
              ["2,300 kcal", "115 g (461 kcal)", "64 g (576 kcal)", "316 g (1,263 kcal) — 55% of intake"],
              ["2,500 kcal", "115 g (461 kcal)", "64 g (576 kcal)", "366 g (1,463 kcal) — 59% of intake"],
              ["2,700 kcal", "115 g (461 kcal)", "64 g (576 kcal)", "416 g (1,663 kcal) — 62% of intake"],
              ["2,900 kcal", "115 g (461 kcal)", "64 g (576 kcal)", "466 g (1,863 kcal) — 64% of intake"],
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
            Protein holds absolutely still across that whole range — 115 g whether you eat 2,100 or 2,900
            calories. Carbohydrate absorbs the entire difference. That is the structural reason a
            recomposition plan is mostly a protein target plus a modest calorie adjustment: the macro that
            matters does not move when you change the deficit, so you can change the deficit without
            rebuilding the whole diet.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: how long your fat stores can fund the deficit</h2>
          <p>
            A deficit is a withdrawal from a finite account. This table is that arithmetic run forward, with
            the last column expressed against the 16 kg of fat mass our 80 kg example man starts with — a
            useful sanity check on any long plan.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Daily deficit</span>
              <b>3 months</b>
              <span>6 months</span>
              <span>12 months, and as a share of a 16 kg fat mass</span>
            </div>
            {[
              ["200 kcal", "2.37 kg", "4.74 kg", "9.49 kg — 59% of starting fat mass"],
              ["300 kcal", "3.56 kg", "7.12 kg", "14.23 kg — 89% of starting fat mass"],
              ["400 kcal", "4.74 kg", "9.49 kg", "18.97 kg — 119%: more fat than he has"],
              ["500 kcal", "5.93 kg", "11.86 kg", "23.72 kg — 148%: more fat than he has"],
              ["700 kcal", "8.30 kg", "16.60 kg", "33.20 kg — 208%: more fat than he has"],
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
            The rows that exceed 100 percent are not predictions, they are a demonstration that the constant
            rate has to stop. In reality metabolism adapts, intake drifts, and nobody holds a 700 kcal deficit
            for a year. The practical use of this table is short-horizon: over three months the numbers are
            plausible, and they tell you that a 300 kcal deficit consumes roughly a fifth of a lean-ish
            person&apos;s entire fat mass in that time.
          </p>
        </section>

        <section className="content-block">
          <h2>How to run this in practice</h2>
          <ul>
            <li>
              <b>Get a starting body fat number before you start.</b> The entire plan is built on lean mass,
              so a wrong starting percentage propagates into every number below. Use the{" "}
              <a href="/navy-body-fat-calculator">Navy tape method</a> or our{" "}
              <a href="/body-fat-calculator">body fat calculator</a>, and take the measurement twice.
            </li>
            <li>
              <b>Set protein first, calories second.</b> Protein is fixed by your lean mass and does not
              change when you adjust the deficit. Lock it, then move calories.
            </li>
            <li>
              <b>Pick a deficit below 200 kcal a day.</b> Per the rate table, that band keeps the scale nearly
              flat while still buying a percentage point every five weeks or so.
            </li>
            <li>
              <b>Weigh daily, read weekly.</b> Daily weight is too noisy to interpret at these rates; the
              weekly average is the signal. Our{" "}
              <a href="/weight-loss-percentage-calculator">weight loss percentage tool</a> exists because
              percentage change is more comparable than kilograms across people.
            </li>
            <li>
              <b>Re-measure body composition every four weeks, not weekly.</b> The changes are smaller than
              the error of any cheap method, so more frequent measurement buys noise. See the error bar on our{" "}
              <a href="/body-fat-percentage-calculator">body fat percentage calculator</a>.
            </li>
            <li>
              <b>Recalibrate intake against the trend every three to four weeks.</b> If the weekly average has
              not moved in a month and neither has body fat, you are at maintenance regardless of what the
              TDEE estimate said.
            </li>
            <li>
              <b>Train with progressive overload.</b> The lean gain rates that make recomposition possible
              assume the stimulus exists. Without it, use the bottom row of the tier tables.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Where this model is weak</h2>
          <ul>
            <li>
              <b>The lean gain rates are modelling parameters, not measurements.</b> They are chosen to make
              the tables internally consistent and to separate the tiers by roughly the right magnitude. No
              figure on this page is a study result.
            </li>
            <li>
              <b>Lean gain is held constant regardless of deficit.</b> In reality a large deficit suppresses
              it, so the aggressive rows in the rate table overstate lean gain and understate how much of your
              loss is lean tissue.
            </li>
            <li>
              <b>TDEE is an estimate from a prediction equation.</b> Mifflin–St Jeor has error for any
              individual, and the activity multiplier is a coarse category. A 100 kcal error in TDEE is the
              same size as the entire recomposition window.
            </li>
            <li>
              <b>There is no adaptive thermogenesis.</b> The model does not shrink expenditure as you lose
              weight, so long projections run optimistic.
            </li>
            <li>
              <b>There is no fat-mass floor.</b> Rows that project below the essential-fat bands are
              arithmetic, not targets.
            </li>
            <li>
              <b>Body fat percentage carries measurement error.</b> If your starting estimate is three points
              off, the trajectory is shifted, though the rates are still right.
            </li>
          </ul>
        </section>

        <section className="content-block">
          <h2>Frequently asked questions</h2>
          <div className="mini-faq">
            <details open>
              <summary>What is body recomposition?</summary>
              <p>
                Losing fat and gaining lean mass over the same period, so body fat percentage falls while body
                weight stays roughly constant. The tables above show that at the point where the scale is
                perfectly flat, body fat still drops about 4.5 percentage points in a year for a trained
                lifter.
              </p>
            </details>
            <details>
              <summary>How many calories should I eat to recomp?</summary>
              <p>
                Under this model, maintenance minus the energy equivalent of the lean mass you can add — for a
                trained lifter that works out to roughly 43 to 119 kcal a day below TDEE. The calculator
                above computes it for your own numbers, and the button under the inputs sets your intake to it
                directly.
              </p>
            </details>
            <details>
              <summary>How much protein do I need for body recomposition?</summary>
              <p>
                The calculator defaults to 1.8 g per kilogram of lean body mass and lets you choose between
                1.6 and 2.2. For the 80 kg example with 64 kg of lean mass, that is 115 g a day. Use lean
                mass rather than body weight as the reference so the number tracks the tissue it is meant to
                support.
              </p>
            </details>
            <details>
              <summary>How fast can you recomposition?</summary>
              <p>
                In this model, a trained lifter at the recomposition point drops one body fat percentage point
                every 2.7 months; at a 200 kcal deficit it is about one point every five weeks with the scale
                moving less than half a kilogram a month. A first-year lifter can go roughly twice as fast
                because the lean gain rate is larger.
              </p>
            </details>
            <details>
              <summary>Is recomposition better than bulking and cutting?</summary>
              <p>
                The tables give a fair answer: recomposition is slower in absolute body fat terms than a
                dedicated cut, and slower in lean mass terms than a dedicated bulk. What it buys is avoiding
                the fat gain of a bulk and the muscle risk of an aggressive cut. It suits people already near
                a body fat level they are happy to hold.
              </p>
            </details>
            <details>
              <summary>Can beginners really gain muscle while losing fat?</summary>
              <p>
                Yes, and the tier table quantifies why: the lean gain rate for a first-year lifter is five
                times the rate for someone with three-plus years of training, which makes the recomposition
                window five times wider and far easier to land inside by accident.
              </p>
            </details>
            <details>
              <summary>Why is my weight not changing but my body fat is?</summary>
              <p>
                Because fat mass and lean mass are moving in opposite directions at similar rates. At the
                recomposition point the net change is about 0.02 kg a month — far below the day-to-day water
                variation that dominates any single weigh-in.
              </p>
            </details>
            <details>
              <summary>Why does the scale barely move in the projections?</summary>
              <p>
                That is the definition of the recomposition point: the deficit is set so monthly fat loss
                equals monthly lean gain. Over twelve months the scale moves 0.28 kg in the worked example
                while body fat falls from 20.0 to 15.5 percent.
              </p>
            </details>
            <details>
              <summary>Do I need to track macros or only calories?</summary>
              <p>
                Protein is the macro that matters here and it does not change when you adjust your deficit, so
                a protein target plus total calories covers most of the benefit. Carbohydrate is whatever is
                left after protein and fat, as the split table above shows.
              </p>
            </details>
            <details>
              <summary>How do I know if it is working?</summary>
              <p>
                Weekly average body weight that is flat or drifting slightly, plus a body fat estimate that
                falls when re-measured every four weeks. If neither moves after a month, you are at
                maintenance regardless of the estimate, and intake needs to come down.
              </p>
            </details>
            <details>
              <summary>Where do the 7700 kcal and lean gain numbers come from?</summary>
              <p>
                7700 kcal per kilogram is the energy value this page assigns to body fat, used as a modelling
                constant. The lean gain rates by training tier are parameters chosen by this calculator so the
                tables are internally consistent. Neither is presented as a measured result, and the limits
                section lists what that means for accuracy.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/tdee-calculator">TDEE calculator</a> ·{" "}
            <a href="/body-fat-calculator">body fat calculator</a> ·{" "}
            <a href="/body-fat-percentage-calculator">body fat percentage with error bar</a> ·{" "}
            <a href="/navy-body-fat-calculator">Navy body fat calculator</a> ·{" "}
            <a href="/weight-loss-percentage-calculator">weight loss percentage</a> ·{" "}
            <a href="/body-fat-percentage-chart">body fat percentage chart</a> ·{" "}
            <a href="/ffmi-calculator">FFMI calculator</a>
          </p>
          <p>
            <b>Not medical advice.</b> This page runs an explicit arithmetic model whose assumptions are
            listed above; it is not a prediction of your outcome and not a substitute for professional
            advice. Speak to a qualified professional before making significant changes to your diet or
            training. See our <a href="/disclaimer">disclaimer</a>.
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
