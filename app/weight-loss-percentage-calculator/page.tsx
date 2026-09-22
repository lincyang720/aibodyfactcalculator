"use client";

import { useState } from "react";
import "../tool-pages.css";

type Unit = "us" | "metric";

const LB = 0.453592;
const toKg = (v: number, u: Unit) => (u === "us" ? v * LB : v);

// A weekly average of 7 daily weigh-ins has standard error sigma/sqrt(7).
// The difference of two consecutive weekly averages therefore has standard
// error sigma x sqrt(2/7), and a 95 percent detection threshold is about
// 2 x that, i.e. 1.069 x sigma. Both figures below are exact consequences of
// that arithmetic, not empirical estimates taken from anywhere else.
const NOISE_FACTOR = 2 * Math.sqrt(2 / 7); // 1.069

export default function WeightLossPercentageCalculatorPage() {
  const [unit, setUnit] = useState<Unit>("us");
  const [start, setStart] = useState(200);
  const [current, setCurrent] = useState(186);
  const [goal, setGoal] = useState(170);
  const [weeks, setWeeks] = useState(12);
  const [sigma, setSigma] = useState(0.5);

  const startKg = toKg(start, unit);
  const currentKg = toKg(current, unit);
  const goalKg = toKg(goal, unit);

  const lostKg = startKg - currentKg;
  const pctLost = startKg > 0 ? (lostKg / startKg) * 100 : null;
  const targetKg = startKg - goalKg;
  const pctOfGoal = targetKg > 0 ? (lostKg / targetKg) * 100 : null;
  const rateKgPerWeek = weeks > 0 ? lostKg / weeks : null;
  const ratePctPerWeek = weeks > 0 && startKg > 0 ? (lostKg / startKg / weeks) * 100 : null;
  const kgLeft = currentKg - goalKg;
  const weeksToGoal =
    kgLeft > 0 && rateKgPerWeek !== null && rateKgPerWeek > 0 ? kgLeft / rateKgPerWeek : null;

  const noiseFloor = NOISE_FACTOR * sigma;
  const weeksNeeded =
    rateKgPerWeek !== null && rateKgPerWeek > 0 ? noiseFloor / rateKgPerWeek : null;

  const aboveNoise = rateKgPerWeek !== null ? rateKgPerWeek >= noiseFloor : null;
  const valid =
    startKg > 0 &&
    currentKg > 0 &&
    weeks > 0 &&
    Number.isFinite(pctLost as number) &&
    (pctLost as number) > -100;

  function switchUnit(next: Unit) {
    if (next === unit) return;
    if (next === "metric") {
      setStart(Math.round(start * LB));
      setCurrent(Math.round(current * LB));
      setGoal(Math.round(goal * LB));
    } else {
      setStart(Math.round(start / LB));
      setCurrent(Math.round(current / LB));
      setGoal(Math.round(goal / LB));
    }
    setUnit(next);
  }

  const massUnit = unit === "us" ? "lb" : "kg";

  return (
    <div className="tool-page">
      <header className="tool-nav">
        <a href="/">BF · AI Body Fat Calculator</a>
        <div>
          <a href="/progress-tracker">Progress</a>
          <a href="/tdee-calculator">TDEE</a>
          <a href="/body-fat-percentage-calculator">Body Fat %</a>
          <a href="/body-fat-percentage-chart">Chart</a>
        </div>
      </header>
      <main className="tool-main">
        <div className="tool-eyebrow">WEIGHT LOSS PERCENTAGE CALCULATOR</div>
        <h1>Weight Loss Percentage Calculator and Plateau Check</h1>
        <p className="tool-lede">
          Enter your starting weight, current weight, and how many weeks have passed. You get your weight loss
          percentage, how much of your goal you have already banked, and whether your weekly change is actually
          bigger than your own scale noise. With a typical 0.5 kg day-to-day swing, a weekly loss slower than
          about 0.53 kg is invisible week to week.
        </p>

        <div className="calc-layout">
          <div className="calc-card">
            <div className="field-grid">
              <Field label="Units">
                <select value={unit} onChange={(e) => switchUnit(e.target.value as Unit)}>
                  <option value="us">US (lb)</option>
                  <option value="metric">Metric (kg)</option>
                </select>
              </Field>
              <Field label="Weeks elapsed">
                <input type="number" min={1} max={520} value={weeks} onChange={(e) => setWeeks(+e.target.value)} />
              </Field>
              <Field label={`Starting weight (${massUnit})`}>
                <input type="number" min={1} value={start} onChange={(e) => setStart(+e.target.value)} />
              </Field>
              <Field label={`Current weight (${massUnit})`}>
                <input type="number" min={1} value={current} onChange={(e) => setCurrent(+e.target.value)} />
              </Field>
              <Field label={`Goal weight (${massUnit})`}>
                <input type="number" min={1} value={goal} onChange={(e) => setGoal(+e.target.value)} />
              </Field>
              <Field label="Daily scale swing (kg)">
                <select value={sigma} onChange={(e) => setSigma(+e.target.value)}>
                  <option value={0.3}>0.3 kg (very steady)</option>
                  <option value={0.5}>0.5 kg (typical)</option>
                  <option value={0.8}>0.8 kg (fluctuates)</option>
                  <option value={1}>1.0 kg (very noisy)</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="answer-card">
            <span>WEIGHT LOSS PERCENTAGE</span>
            <div className="answer-number">{valid ? `${(pctLost as number).toFixed(1)}%` : "—"}</div>
            {valid ? (
              <>
                <p>
                  That is {lostKg.toFixed(1)} kg ({Math.abs(lostKg * 2.20462).toFixed(1)} lb){" "}
                  {lostKg >= 0 ? "down" : "up"} from your starting weight.
                </p>
                {pctOfGoal !== null ? (
                  <p>
                    <b>{pctOfGoal.toFixed(0)}%</b> of the way to your goal weight
                    {kgLeft > 0 ? ` · ${kgLeft.toFixed(1)} kg left` : " · goal reached"}.
                  </p>
                ) : null}
                <p>
                  Average rate: <b>{(rateKgPerWeek as number).toFixed(2)} kg per week</b> (
                  {(ratePctPerWeek as number).toFixed(2)}% of starting weight per week).
                </p>
                <p>
                  Your noise floor is <b>{noiseFloor.toFixed(2)} kg per week</b>. Your observed rate is{" "}
                  {aboveNoise ? (
                    <b>above it, so the change is measurable.</b>
                  ) : (
                    <b>
                      below it, so a single week proves nothing. Judge in blocks of{" "}
                      {weeksNeeded !== null ? Math.ceil(weeksNeeded) : "several"} weeks.
                    </b>
                  )}
                </p>
                {weeksToGoal !== null ? (
                  <p>At this rate, about {Math.ceil(weeksToGoal)} more weeks to goal.</p>
                ) : null}
              </>
            ) : (
              <p>Enter your weights and elapsed weeks to see your progress.</p>
            )}
          </div>
        </div>

        <div className="formula-box">
          <span>THE CALCULATION</span>
          <strong>weight loss % = (starting weight − current weight) ÷ starting weight × 100</strong>
        </div>

        <section className="content-block">
          <h2>Why percentage beats kilograms</h2>
          <p>
            Two people can both lose 5 kg and have done completely different amounts of work. For someone
            starting at 60 kg that is 8.3 percent of their body. For someone starting at 120 kg it is 4.2
            percent. Percentage is the only version of the number that is comparable between people, and it is
            also the version that makes plateaus make sense: as you get lighter, the same weekly deficit is a
            smaller absolute loss but roughly the same percentage of a smaller body.
          </p>
          <p>
            The second number worth tracking is the percentage of your goal achieved, which is lost weight
            divided by total weight you intended to lose. That one keeps motivation honest in the middle of a
            long cut, when the mirror has not caught up yet.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what each weekly rate adds up to</h2>
          <p>
            The table below was computed by compounding a fixed weekly rate of body weight. Week n weight is
            starting weight times (1 minus rate) to the power n. The percentage column is independent of your
            starting size; the kilogram columns use a 90 kg and a 70 kg start as examples.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Weekly rate</span>
              <b>4 weeks</b>
              <span>8 weeks</span>
              <span>12 weeks</span>
            </div>
            {[
              ["0.50% per week", "2.0%", "3.9%", "5.8%"],
              ["0.75% per week", "3.0%", "5.8%", "8.6%"],
              ["1.00% per week", "3.9%", "7.7%", "11.4%"],
              ["1.25% per week", "4.9%", "9.6%", "14.0%"],
            ].map(([r, a, b, c]) => (
              <div className="chart-row chart-row-wide" key={r}>
                <span>{r}</span>
                <b>{a}</b>
                <span>{b}</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Weekly rate</span>
              <b>16 weeks</b>
              <span>24 weeks</span>
              <span>52 weeks</span>
            </div>
            {[
              ["0.50% per week", "7.7%", "11.3%", "22.9%"],
              ["0.75% per week", "11.3%", "16.5%", "32.4%"],
              ["1.00% per week", "14.9%", "21.4%", "40.7%"],
              ["1.25% per week", "18.2%", "26.1%", "48.0%"],
            ].map(([r, a, b, c]) => (
              <div className="chart-row chart-row-wide" key={r}>
                <span>{r}</span>
                <b>{a}</b>
                <span>{b}</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <p>
            In kilograms, a 90 kg person losing 0.50 percent per week reaches 88.2 kg at four weeks, 86.5 kg
            at eight, 84.7 kg at twelve, and 79.8 kg at twenty-four. At 1.00 percent per week the same person
            reaches 86.5 kg at four weeks and 70.7 kg at twenty-four.
          </p>
        </section>

        <section className="content-block">
          <h2>Computed: what the common milestones weigh</h2>
          <p>
            Five, ten, fifteen and twenty percent of starting weight are the checkpoint levels many
            programmes use. The table is pure arithmetic on each starting weight: the first number is the
            kilograms to lose, the second is the weight you would land on.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Start weight</span>
              <b>5%</b>
              <span>10%</span>
              <span>15%</span>
            </div>
            {[
              ["60 kg", "3.0 kg, to 57.0", "6.0 kg, to 54.0", "9.0 kg, to 51.0"],
              ["70 kg", "3.5 kg, to 66.5", "7.0 kg, to 63.0", "10.5 kg, to 59.5"],
              ["80 kg", "4.0 kg, to 76.0", "8.0 kg, to 72.0", "12.0 kg, to 68.0"],
              ["90 kg", "4.5 kg, to 85.5", "9.0 kg, to 81.0", "13.5 kg, to 76.5"],
              ["100 kg", "5.0 kg, to 95.0", "10.0 kg, to 90.0", "15.0 kg, to 85.0"],
              ["120 kg", "6.0 kg, to 114.0", "12.0 kg, to 108.0", "18.0 kg, to 102.0"],
            ].map(([s, a, b, c]) => (
              <div className="chart-row chart-row-wide" key={s}>
                <span>{s}</span>
                <b>{a}</b>
                <span>{b}</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="content-block">
          <h2>Computed: when a plateau is real and when it is just noise</h2>
          <p>
            A bathroom scale does not measure fat, it measures whatever is on the scale that morning, and
            water swings it. If your daily weigh-ins have a standard deviation of sigma kilograms, then a mean
            of seven of them has a standard error of sigma divided by the square root of seven. Comparing two
            consecutive weekly means doubles the variance, so a change has to clear about 1.07 x sigma before
            you can call it real at 95 percent confidence. Every number below follows from that single line
            of arithmetic.
          </p>
          <div className="chart-table">
            <div className="chart-row">
              <span>Daily swing (sigma)</span>
              <b>Weekly mean error</b>
              <span>Minimum detectable weekly change</span>
            </div>
            {[
              ["0.3 kg", "0.11 kg", "0.32 kg"],
              ["0.5 kg", "0.19 kg", "0.53 kg"],
              ["0.8 kg", "0.30 kg", "0.86 kg"],
              ["1.0 kg", "0.38 kg", "1.07 kg"],
            ].map(([s, e, m]) => (
              <div className="chart-row" key={s}>
                <span>{s}</span>
                <b>{e}</b>
                <span>{m}</span>
              </div>
            ))}
          </div>
          <p>
            Now divide that detection threshold by your actual rate of loss, and you get how many weeks of
            data you need before a flat reading means something. This is the plateau table.
          </p>
          <div className="chart-table">
            <div className="chart-row chart-row-wide">
              <span>Daily swing</span>
              <b>0.25 kg/wk</b>
              <span>0.50 kg/wk</span>
              <span>0.75 kg/wk</span>
            </div>
            {[
              ["0.3 kg", "1.3 weeks", "0.6 weeks", "0.4 weeks"],
              ["0.5 kg", "2.1 weeks", "1.1 weeks", "0.7 weeks"],
              ["0.8 kg", "3.4 weeks", "1.7 weeks", "1.1 weeks"],
              ["1.0 kg", "4.3 weeks", "2.1 weeks", "1.4 weeks"],
            ].map(([s, a, b, c]) => (
              <div className="chart-row chart-row-wide" key={s}>
                <span>{s}</span>
                <b>{a}</b>
                <span>{b}</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <p>
            The practical reading: if you are losing slowly and your scale is noisy, a single stalled week is
            meaningless. Someone dropping 0.25 kg per week with a 1.0 kg daily swing needs more than four
            weeks of flat data before the word plateau is justified. Someone dropping 0.75 kg per week with a
            steady 0.3 kg swing can call it in under a week.
          </p>
        </section>

        <section className="content-block">
          <h2>How to make the percentage trustworthy</h2>
          <ul>
            <li>
              <b>Weigh daily, decide weekly.</b> Daily data is what lets averaging reduce the noise; weekly
              averages are what you actually read.
            </li>
            <li>
              <b>Fix one condition.</b> Same time, after the bathroom, before food and drink. Most of the swing
              you are fighting is water and gut contents.
            </li>
            <li>
              <b>Pick a start weight you can defend.</b> Take the average of your first week, not your heaviest
              ever morning.
            </li>
            <li>
              <b>Recalculate the percentage every two to four weeks.</b> More often than that and you are
              reading noise.
            </li>
            <li>
              <b>Watch the percentage, not the kilograms, once you are deep in a cut.</b> Absolute loss slows
              as you get lighter even when nothing has gone wrong.
            </li>
            <li>
              <b>Expect the first week to be wrong.</b> Early rapid drops are largely glycogen and water, not
              tissue.
            </li>
          </ul>
          <p>
            <b>Not medical advice.</b> This is tracking arithmetic, not clinical guidance. If you have health
            concerns or a medical reason to manage your weight, talk to a qualified healthcare professional.
            See our <a href="/disclaimer">disclaimer</a>.
          </p>
        </section>

        <section className="content-block">
          <h2>Frequently asked questions</h2>
          <div className="mini-faq">
            <details open>
              <summary>How do I calculate my weight loss percentage?</summary>
              <p>
                Subtract your current weight from your starting weight, divide by your starting weight, and
                multiply by 100. Losing 6.3 kg from 90 kg is 7.0 percent. The calculator above does it in both
                kilograms and pounds.
              </p>
            </details>
            <details>
              <summary>What is a good weight loss percentage?</summary>
              <p>
                It depends entirely on your timeline and starting point. The trajectory table above shows what
                each sustained weekly rate compounds to: 0.5 percent per week reaches about 11.3 percent in
                twenty-four weeks, and 1.0 percent per week reaches about 21.4 percent in the same period.
              </p>
            </details>
            <details>
              <summary>Why has my weight not moved for a week?</summary>
              <p>
                Check it against your noise floor first. With a typical 0.5 kg daily swing you need a weekly
                change larger than about 0.53 kg before it is distinguishable from water movement. One flat
                week is not a plateau.
              </p>
            </details>
            <details>
              <summary>How many weeks before I can call it a plateau?</summary>
              <p>
                Divide 1.07 times your daily swing by your weekly rate of loss. At 0.5 kg per week with a 0.5
                kg daily swing that is about 1.1 weeks; at 0.25 kg per week with a 1.0 kg swing it is over
                four weeks.
              </p>
            </details>
            <details>
              <summary>Should I track kilograms or percentage?</summary>
              <p>
                Percentage, if you want to compare yourself with anyone else or with your own past at a
                different size. Kilograms are fine for day-to-day decisions, but they shrink in meaning as you
                get lighter.
              </p>
            </details>
            <details>
              <summary>Does this tell me how much fat I have lost?</summary>
              <p>
                No. A scale cannot separate fat from water, glycogen, or muscle. For composition, pair this
                with a body fat estimate and track both over the same window.
              </p>
            </details>
          </div>
        </section>

        <section className="content-block">
          <h2>Related tools</h2>
          <p>
            <a href="/progress-tracker">Progress tracker</a> ·{" "}
            <a href="/body-fat-percentage-calculator">body fat percentage calculator</a> ·{" "}
            <a href="/tdee-calculator">TDEE calculator</a> · <a href="/psmf-calculator">protein target calculator</a>{" "}
            · <a href="/scale-bmi">BMI scale accuracy</a>
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
