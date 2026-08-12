"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

type AnalysisResult = {
  bodyFatPercentage: number;
  confidenceRange: [number, number];
  bodyFatLevel: "Essential Fat" | "Athletic" | "Fit" | "Average" | "Overweight";
  muscleAssessment: { chest:number; shoulders:number; abs:number; arms:number; back:number; legs:number };
  actionPlan: { dailyCalories:number; proteinGrams:number; cardioRecommendation:string; strengthRecommendation:string; estimatedWeeksToTarget:number };
  summary: string;
};

const faqs = [
  ["How accurate is AI body fat estimation?", "AI photo analysis is best used as a directional estimate, not a diagnosis. Your result includes a confidence range because lighting, pose, clothing and photo angle all affect visual estimates."],
  ["AI body fat calculator vs DEXA scan?", "DEXA is a clinical measurement and remains the more precise option. Our calculator is a fast, accessible way to get a baseline and track visual progress between formal measurements."],
  ["How do I take the best photo?", "Stand relaxed against a plain background in even lighting. Keep your full body in frame, face the camera, and wear fitted clothing. Avoid flexing, filters and dramatic shadows."],
  ["Is it really free?", "Yes. You can run up to three complimentary scans per day with no account required. Your photo is sent to our AI processor only for the requested analysis and is not stored by BodyLens."],
] as const;

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [sex, setSex] = useState<"male"|"female"|"skip">("male");
  const [scansLeft, setScansLeft] = useState(3);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const saved = JSON.parse(localStorage.getItem("bodylens-scans") || "null") as {date:string;count:number} | null;
    const update = window.setTimeout(() => setScansLeft(saved?.date === today ? Math.max(0, 3 - saved.count) : 3), 0);
    return () => window.clearTimeout(update);
  }, []);

  function chooseFile(next?: File) {
    setError("");
    if (!next) return;
    if (!next.type.match(/^image\/(jpeg|png|webp)$/)) {
      setError("Please choose a JPG, PNG or WebP photo.");
      return;
    }
    if (next.size > 10 * 1024 * 1024) {
      setError("That photo is over 10MB. Please choose a smaller file.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setResult(null);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  async function analyze() {
    if (!file) {
      setError("Please add a full-body photo first.");
      inputRef.current?.click();
      return;
    }
    if (scansLeft <= 0) {
      setError("You have used today’s 3 free analyses. Please come back tomorrow.");
      return;
    }
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("photo", file);
    form.append("sex", sex);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/analyze", { method:"POST", body:form, signal:controller.signal });
      const data = await response.json() as AnalysisResult & { error?:string };
      if (!response.ok) throw new Error(data.error || "Please try again with a clearer photo");
      setResult(data);
      const today = new Date().toISOString().slice(0, 10);
      const nextLeft = Math.max(0, scansLeft - 1);
      setScansLeft(nextLeft);
      localStorage.setItem("bodylens-scans", JSON.stringify({date:today,count:3-nextLeft}));
      window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (requestError) {
      setError(requestError instanceof DOMException && requestError.name === "AbortError" ? "Analysis is taking longer than expected. Please try a smaller photo." : requestError instanceof Error ? requestError.message : "Please try again with a clearer photo");
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    setResult(null);
    setError("");
    inputRef.current?.click();
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="AI Body Fat Calculator home"><span className="brand-mark">BF</span><span>Body<span>Lens</span></span></a>
        <nav aria-label="Main navigation">
          <a href="#top">Home</a><a href="/tdee-calculator">TDEE</a><a href="/bmi-calculator">BMI</a><a href="#faq">FAQ</a>
        </nav>
        <a className="header-cta" href="#analyzer">Try it free <span>→</span></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot" /> AI-powered body composition</div>
          <h1>AI Body Fat<br/><em>Calculator</em></h1>
          <p className="hero-lede">Turn one photo into a clear body composition estimate, muscle assessment, and a practical plan built around you.</p>
          <div className="trust-row"><span>✓ Free to try</span><span>✓ No signup</span><span>✓ Private by design</span></div>
          <div className="social-proof">
            <div className="avatar-stack"><i>J</i><i>M</i><i>A</i><i>R</i></div>
            <p><strong>12,400+ analyses</strong><br/><span>completed this month</span></p>
          </div>
        </div>

        <div className="analyzer-card" id="analyzer">
          <div className="card-heading"><div><span className="step-label">STEP 01</span><h2>Add a full-body photo</h2></div><span className="privacy-badge">Private</span></div>
          <div className="free-strip"><b>FREE</b><span>No signup</span><span>±3–5% margin</span><span>{scansLeft} scans left today</span></div>
          <div
            className={`dropzone ${dragging ? "is-dragging" : ""} ${preview ? "has-preview" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
            aria-label="Upload a full-body photo"
          >
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => chooseFile(e.target.files?.[0])} />
            {preview ? <img src={preview} alt="Your uploaded full-body photo for AI body fat analysis" /> : <>
              <div className="camera-icon">⌁</div>
              <strong>Drop your photo here</strong>
              <span>or <u>browse from your device</u></span>
              <small>JPG, PNG or WebP · Max 10MB</small>
            </>}
            {preview && <span className="replace-photo">Choose another photo</span>}
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="sex-picker"><span>Reference profile</span><div>{(["male","female","skip"] as const).map(option=><button type="button" aria-pressed={sex===option} className={sex===option?"active":""} key={option} onClick={()=>setSex(option)}>{option[0].toUpperCase()+option.slice(1)}</button>)}</div></div>
          <div className="photo-tips"><span>For best results:</span><b>Full body</b><b>Even lighting</b><b>Relaxed pose</b></div>
          <button className="analyze-button" onClick={analyze} disabled={loading}>{loading ? <><i className="spinner" /> Analyzing body composition…</> : <>Analyze my body fat <span>→</span></>}</button>
          <p className="secure-note">🔒 Processed privately for this analysis · Not stored by BodyLens</p>
          <div className="disclaimer"><strong>Educational estimate only.</strong> Visual analysis has a typical ±3–5% margin of error and is not a medical device.</div>
        </div>
        <div className="hero-orb orb-one"/><div className="hero-orb orb-two"/>
      </section>

      {result && <section className="results" id="results">
        <div className="results-head"><div><span className="step-label dark">YOUR ANALYSIS</span><h2>A strong baseline.<br/>Now let&apos;s sharpen it.</h2></div><p>Based on visual markers in your photo. Use this result to guide progress—not as medical advice.</p></div>
        <div className="result-grid">
          <article className="score-card">
            <span>Estimated body fat</span><div className="big-score">{result.bodyFatPercentage}<sup>%</sup></div><div className="range">Confidence range <strong>{result.confidenceRange[0]}–{result.confidenceRange[1]}%</strong></div>
            <div className="level-row"><span>Body fat level</span><b>{result.bodyFatLevel}</b></div>
            <div className="spectrum"><i style={{left:`${Math.max(4,Math.min(96,result.bodyFatPercentage * 2.4))}%`}}/><div/><div/><div/><div/></div>
            <div className="spectrum-labels"><span>Essential</span><span>Athletic</span><span>Fit</span><span>Average</span><span>High</span></div>
          </article>
          <article className="muscle-card"><div className="result-title"><span>02</span><h3>Muscle group assessment</h3></div><div className="muscle-list">{Object.entries(result.muscleAssessment).map(([key, score]) => <div className="muscle" key={key}><span>{key === "abs" ? "Abs & Core" : key[0].toUpperCase()+key.slice(1)}</span><div><i style={{width:`${score * 10}%`}}/></div><b>{score}<small>/10</small></b></div>)}</div></article>
          <article className="plan-card"><div className="result-title"><span>03</span><h3>Your action plan</h3></div><div className="plan-list"><div><span>Daily target</span><strong>{result.actionPlan.dailyCalories.toLocaleString()} <small>kcal</small></strong></div><div><span>Protein</span><strong>{result.actionPlan.proteinGrams} <small>g/day</small></strong></div><div><span>Cardio</span><strong>{result.actionPlan.cardioRecommendation}</strong></div><div><span>Timeline</span><strong>~{result.actionPlan.estimatedWeeksToTarget} <small>weeks</small></strong></div></div><p>{result.summary} {result.actionPlan.strengthRecommendation}</p></article>
        </div>
        <div className="result-actions"><button onClick={() => navigator.clipboard?.writeText(`My estimated body fat is ${result.bodyFatPercentage}% — analyzed with BodyLens.`)}>Share results</button><button className="secondary" onClick={reset}>Analyze another photo</button></div>
      </section>}

      <section className="how"><div className="section-kicker">HOW IT WORKS</div><h2>From photo to <em>forward plan.</em></h2><p className="section-intro">No calipers. No complicated measurements. Just a simple, honest starting point.</p><div className="steps"><article><span>01</span><div className="step-icon">↥</div><h3>Upload your photo</h3><p>Use a clear, front-facing full-body photo in natural light.</p></article><article><span>02</span><div className="step-icon">✣</div><h3>AI reads the signals</h3><p>We assess definition, proportion, and visible fat distribution.</p></article><article><span>03</span><div className="step-icon">⌁</div><h3>Get your roadmap</h3><p>See your range, muscle scores, calories, protein, and training focus.</p></article></div></section>

      <section className="benefits"><div className="benefit-copy"><div className="section-kicker light">MORE THAN A NUMBER</div><h2>Know where you are.<br/><em>Know what to do next.</em></h2><p>A body fat estimate only matters if it changes what you do tomorrow. BodyLens translates your result into focused, achievable next steps.</p><a href="#analyzer">Start your free analysis →</a></div><div className="benefit-cards"><article><span>01</span><h3>Body fat range</h3><p>A realistic estimate with confidence bounds—not false precision.</p></article><article><span>02</span><h3>Muscle balance</h3><p>Visual scoring across six major muscle groups highlights strengths and gaps.</p></article><article><span>03</span><h3>Personal action plan</h3><p>Calorie, protein, cardio, and strength targets that make the next step obvious.</p></article></div></section>

      <section className="reference-section"><div className="reference-head"><div className="section-kicker">UNDERSTAND YOUR RESULT</div><h2>Body fat reference ranges</h2><p>Common ACE-style categories provide context. Individual health and performance can vary within every range.</p></div><div className="range-table" role="table" aria-label="Body fat percentage reference ranges"><div className="table-row head" role="row"><span>Category</span><b>Men</b><b>Women</b></div>{[["Essential fat","2–5%","10–13%"],["Athletes","6–13%","14–20%"],["Fitness","14–17%","21–24%"],["Average","18–24%","25–31%"],["Higher range","25%+","32%+"]].map(row=><div className="table-row" role="row" key={row[0]}><span>{row[0]}</span><b>{row[1]}</b><b>{row[2]}</b></div>)}</div></section>

      <section className="comparison"><div className="section-kicker light">CHOOSE THE RIGHT MEASURE</div><h2>Fast estimate or clinical precision?</h2><div className="compare-grid"><article><span>AI PHOTO</span><h3>Instant & accessible</h3><strong>±3–5%</strong><p>Best for quick baselines and consistent progress check-ins at home.</p></article><article><span>SKINFOLD CALIPERS</span><h3>Technique dependent</h3><strong>±3–5%</strong><p>Useful when the same trained person measures the same sites each time.</p></article><article><span>DEXA SCAN</span><h3>Clinical benchmark</h3><strong>±1–2%</strong><p>Best when you need a detailed professional body-composition measurement.</p></article></div></section>

      <section className="faq" id="faq"><div><div className="section-kicker">QUESTIONS, ANSWERED</div><h2>The honest answers.</h2><p>Body composition is nuanced. Here is what to know before you scan.</p></div><div className="faq-list">{faqs.map(([q,a], i) => <details key={q} open={i===0}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>

      <section className="tools" id="tools"><div><div className="section-kicker">KEEP GOING</div><h2>Related free tools</h2></div><div className="tool-links"><a href="/tdee-calculator"><span>Daily energy needs</span><strong>TDEE Calculator</strong><i>→</i></a><a href="/bmi-calculator"><span>Healthy weight range</span><strong>BMI Calculator</strong><i>→</i></a><a href="/body-fat-percentage-chart"><span>Visual reference guide</span><strong>Body Fat Chart</strong><i>→</i></a><a href="/psmf-calculator"><span>Rapid fat loss protocol</span><strong>PSMF Calculator</strong><i>→</i></a></div></section>

      <footer><div className="brand footer-brand"><span className="brand-mark">BF</span><span>Body<span>Lens</span></span></div><p>Clearer data. Smarter progress.</p><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:hello@aibodyfatcalculator.com">Contact</a></div><small>© 2026 AI Body Fat Calculator. Results are estimates and not medical advice.</small></footer>
    </main>
  );
}
