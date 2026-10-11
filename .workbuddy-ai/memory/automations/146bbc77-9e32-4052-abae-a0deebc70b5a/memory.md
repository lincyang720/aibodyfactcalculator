# Automation memory — daily page publishing (aibodyfatcalculator.com)

## Run #23 (2026-10-11) — NO PUBLISH, batch exhausted (3rd consecutive day)
- Re-read content-log.md: all 20 approved words still used (2026-09-21 → 2026-10-08). No word left, so per
  the operator's rule: stop publishing, output 「本批词用完，请给下一批」. No invented word, no estimated volume.
- Verified live state only: sitemap.xml HTTP 200 with 44 `<loc>` entries (unchanged); homepage HTTP 200;
  /body-mass-scale HTTP 200 with its title rendered. Sitemap already contains all 20 pages — nothing to add.
- Committed today's content-log.md entry plus the backlog of workspace memory files (2026-10-08/09/10) and
  pushed to main; remote is in sync (cb1b37b).
- 28-day GSC/GA4 report still NOT due (cycle started 2026-09-21, due ~2026-10-19). No GSC/GA4 connector →
  output 读不到 when due.
- **Do not publish again until the operator supplies a new keyword batch.**

## Run #22 (2026-10-10) — NO PUBLISH, batch exhausted (2nd consecutive day)
- Re-read content-log.md: all 20 approved words still used (2026-09-21 → 2026-10-08). No word left in the
  batch, so per the operator's rule: stop publishing, output 「本批词用完，请给下一批」. Did not invent a
  word or estimate a volume.
- Verified live state only: sitemap.xml HTTP 200 with 44 `<loc>` entries (unchanged); /body-mass-scale
  HTTP 200 with its title rendered; homepage HTTP 200.
- Committed the two outstanding content-log.md entries (2026-10-09, 2026-10-10) and pushed to main so the
  remote is back in sync. No page, no sitemap change.
- 28-day GSC/GA4 report still NOT due (cycle started 2026-09-21, due ~2026-10-19). No GSC/GA4 connector →
  output 读不到 when due.
- **Do not publish again until the operator supplies a new keyword batch.**

## Run #21 (2026-10-09) — NO PUBLISH, batch exhausted
- Read content-log.md: all 20 approved words used (2026-09-21 → 2026-10-08). Followed the operator's
  batch rule: stop publishing and output 「本批词用完，请给下一批」. Did not invent a word or estimate a volume.
- Verified live state only: sitemap.xml HTTP 200 with 44 `<loc>` entries (unchanged from run #20).
- 28-day GSC/GA4 still not due (cycle started 2026-09-21, due ~2026-10-19). No connector → 读不到 when due.
- No commit/push today. **Do not publish again until the operator supplies a new keyword batch.**
- Still-unconfirmed standing issue: 20 words mapped onto 10 gaps, so "one gap per page" and "never a
  zero-page day" are mutually unsatisfiable after word 10; runs #11–#20 used each word's own mapped gap
  with a fresh angle. Keep flagging until the operator rules.

## Batch progress (20 approved words, one per page, never reused)
0. **ALL 20 WORDS USED as of 2026-10-08.** Stop publishing; output "本批词用完，请给下一批" and wait for a
   new keyword batch from the operator. Do not invent words or estimate volumes.
1. body fat index (7.4万) → G7 → /body-fat-index → published 2026-09-21
2. scale bmi (5万) → G5 → /scale-bmi → published 2026-09-22
3. body fat percentage calculator (4万) → G8 → /body-fat-percentage-calculator → published 2026-09-22

4. weight loss percentage calculator (1.2万) → G4 → /weight-loss-percentage-calculator → published 2026-09-22
5. navy body fat calculator (6600) → G3 → /navy-body-fat-calculator → published 2026-09-23
6. body recomposition calculator (5400) → G2 → /body-recomposition-calculator → published 2026-09-24
7. army bmi calculator (2900) → G3 used → fell back to G1 → /army-bmi-calculator → published 2026-09-25

Words used so far (11 of 20): body fat index, scale bmi, body fat percentage calculator,
weight loss percentage calculator, navy body fat calculator, body recomposition calculator,
army bmi calculator, fat calculator, measure body fat, obese scale,
**visceral fat calculator (1900) → G1, 2026-09-29**.
12. **fat percentage calculator (1600) → G8, 2026-09-30** (see run #12).
Word 13 = **measure body fat percentage** (1300) → mapped gap G6.

**GAP-TABLE STATUS — decision taken on run #11 (2026-09-29), keep following it:**
All ten gaps (G1–G10) were consumed by the first ten pages, so from word 11 onward the
"fall back to the largest unused gap" rule has nothing left to fall back to. Two operator rules then
collide: "一个缺口只准写一篇" vs "不许一天零篇". The mapping table itself is impossible to satisfy
without reuse (it assigns 20 words to 10 gaps — G5 to five words, G6 to four), which means the
no-reuse clause cannot have been meant literally. Run #11 therefore used each word's **own mapped
gap** and published rather than stalling. Continue this way for words 12–20 unless the operator says
otherwise, and keep flagging the situation in every run's output until they confirm.
Word 12 = **fat percentage calculator** (1600) → mapped gap G8.

## Run #15 summary (2026-10-03)
- Word 15 = **ideal body fat percentage calculator** (1000) → mapped gap G9, reused per run-#11 decision
  (no unused gaps remain since word 10). New angle: **the band converted into kilograms of fat and into a
  range of scale readings**, deliberately distinct from /measure-body-fat (corridor position, crossover
  ages, noise-vs-band widths).
- Published /ideal-body-fat-percentage-calculator, "Ideal Body Fat Percentage Calculator — Your Band, in
  Kilograms and Scale Weight".
- Client calculator: units, sex, age, height, weight, BF%-source switch (Navy tape / own number / Deurenberg
  BMI), target %. Output = the age/sex band (lo–hi) + verdict and distance to the nearer edge + the band at
  age+10 + the **weight window** [L/(1−hi), L/(1−lo)] and its width + kg of fat to the target and ending
  weight and that as a share of current weight + fat mass at the target + kg per further point there + the
  share of remaining fat that point takes + the **BMI-frame ceiling** 100(1 − FFMI/24.9) with an explicit
  statement when the two frames cannot both be satisfied. Button sets the target to the band's top edge.
- Exclusive self-computed content: the band construction (Deurenberg at WHO BMI 18.5 and 24.9 → width
  exactly 1.20×6.4 = 7.68 pts at every age, drift 0.23 pts/yr, sex gap 10.80) tabulated by decade both
  sexes; W(t) = L/(1−t) turning each band into a weight window (7.68-pt band = 6.16 kg at the 15% top edge
  up to 10.27 kg at the 35% top edge on L=63.2, and linear in L: 4.39/5.57/7.32 on 45 kg vs 6.82/8.67/11.38
  on 70 kg); the 14-row ladder at L=63.2 (8% → 34%) with kg-per-point falling 1.43 → 0.74 while the
  **share of remaining fat rises 4.5% → 13.6%**, and the size-free closed form **1/(t(1−t))** (11.1% at
  10%, 6.25% at 20%, 4.76% at 30%, 4.17% at 40%); Δ = W(f−t)/(1−t) grids showing the gap cost is exactly
  proportional to body weight (shares 0.1765 / 0.1250 / 0.0667, so 10.59 kg at 60 kg vs 21.18 kg at 120 kg
  for the same 15-pt gap) plus per-point-by-weight tables; eight constructed bodies with band, kg to the top
  edge, ending weight and BMI-frame ceiling (the 95 kg/175 cm man's ceiling of 11.70% sits below his band's
  18.65% floor — no percentage satisfies both frames); and the drift table where one fixed 92 kg body's
  required kilograms fall 7.25 → 4.72 → 2.04 → inside across ages 30→70 purely because the band moved.
- Honesty guard kept: "Where this page's arithmetic stops being true" (band is this page's construction with
  no official standing; the age drift is a fitted coefficient not a health finding; lean-held-fixed is a
  modelling choice; prediction-equation error propagates; the BMI source is not independent; sensitivities
  are local; no health claim).
- Live confirmed: HTTP 200 / Server: Vercel / X-Matched-Path /ideal-body-fat-percentage-calculator, title +
  H1 + canonical present, answer card server-rendered ("16.3 – 24.0", "26.8%", "2.8 points above", weight
  window 80.5–88.6 kg), exclusive markers present; sitemap.xml 38 → 39 urls. Deploy ~90 s (3 polls of 404,
  then 200).
- Fixed before publishing: `windowWidth` was initially computed as wAtLow − wAtHigh (negative); corrected to
  wAtHigh − wAtLow. Also corrected a sentence that said the three above-band bodies sat "below" their
  BMI-frame ceiling (they sit above it).
- 28-day GSC/GA4 report still not due (cycle started 2026-09-21, due ~2026-10-19). No GSC/GA4 connector.
- Next: word 16 = **body fat calculator caliper** (1000) → mapped gap G6. Existing G6 pages: /fat-calculator
  (slip + error budget), /how-to-measure-body-fat-at-home (qualitative guide), /measure-body-fat-percentage
  (instrument resolution) — pick a fourth distinct angle.

## Run #14 summary (2026-10-02)
- Word 14 = **body composition calculator** (1300) → mapped gap G10, reused per run-#11 decision (no unused
  gaps remain since word 10). New angle: **the two-compartment identity W = F + L and its exact inversions** —
  deliberately distinct from /obese-scale (BMI-vs-body-fat cross-classification, FMI/FFMI grids), the only
  earlier G10 page.
- Published /body-composition-calculator, "Body Composition Calculator — Fat, Lean, and Four Routes to One
  Number".
- Client calculator: units, sex, age, height, weight, BF%-source switch (Navy tape / own number / Deurenberg
  BMI), target BF%. Output = BF% + fat kg + lean kg (kg and lb) + points-per-kg for fat and lean and their
  ratio + four routes to the target (cut / gain lean / constant-weight swap / recomp 2:1) with the ending
  weight of each + the 2 kg and 5 kg ambiguity ranges + the break-even fat share + required fat share for a
  1-pt drop at 2 kg and 5 kg + the weight at which current fat mass would read the target %. Button sets the
  target 5 points below the current reading.
- Exclusive self-computed content: sensitivity pair 100·L/W² and 100·F/W² whose ratio is exactly L/F
  (9.0× at 10% down to 1.5× at 40%; 3.76 on the reference body); points-per-fat-kg = 79/W by weight
  (1.317 at 60 kg → 0.658 at 120 kg) and the constant-weight swap always costing W/100 kg per point;
  four exact route inversions A = (F−tW)/(1−t), B = F/t−W, C = F−tW, D = (F−tW)/(1−t(1−r)) tabulated for
  1/2/3/5/10-pt drops (5 pts = 4.76 kg cut vs 25.03 kg lean gained vs 4.00 kg swap) and for 1-pt drops from
  10–35% (lean route 2.35 → 8.89 kg, swap flat at 0.800); the same table on the 65 kg / 30.7% female body;
  the ambiguity grid (same scale change read three ways — −2 kg = 18.95% to 21.52%, 2.56 pts; −5 kg spans
  6.67 pts) and its spread-by-weight table; the 5 kg composition ladder (100% → 15.71%, 21% → 20.98%,
  0% → 22.38%); the break-even proof p = BF plus the required-share table p = (F−t(W−Δ))/Δ (1 kg for 1 pt
  needs 100%; 2 pts in 1 kg is impossible at 179%); the ±1-pt weight windows (2.03 kg if fat moved,
  7.64 kg if lean moved, and the lean window runs backwards) with the width ratio reproducing L/F = 3.77.
- Kept the honesty guard: "Where this page's arithmetic stops being true" (two compartments is a model;
  routes are arithmetic not physiology; prediction-equation error propagates; the BMI source is not
  independent of W; sensitivities are local; no health claim).
- Live confirmed: HTTP 200 / Server: Vercel / X-Matched-Path /body-composition-calculator, title + H1 +
  canonical + exclusive markers server-rendered; sitemap.xml 37 → 38 urls. Deploy ~80 s (4 polls of 404,
  then 200).
- 28-day GSC/GA4 report still not due (cycle started 2026-09-21, due ~2026-10-19). No GSC/GA4 connector.
- Next: word 15 = **ideal body fat percentage calculator** (1000) → mapped gap G9.

## Run #13 summary (2026-10-01)
- Word 13 = **measure body fat percentage** (1300) → mapped gap G6, reused per run-#11 decision. New angle:
  **instrument resolution** — deliberately distinct from /fat-calculator (slip sizes + error budget) and
  /how-to-measure-body-fat-at-home (qualitative five-method guide), which are the two existing G6 pages.
- Published /measure-body-fat-percentage, "Measure Body Fat Percentage — The Smallest Change Your Tape Can See".
- Client calculator: units, sex, age, height, weight, waist, neck, hip (women), three skinfolds + two new
  selectors (tape graduation 1cm/0.5cm/1mm/1in/1-2in/1-4in; caliper graduation 5/2/1/0.5/0.1 mm). Output =
  tape BF% + the consistent band from rounding (bracket width = terms·u·sensitivity), resolution floor in
  points and kg of fat, rounding SD and 1.96·SD, readings needed for 0.5/0.25 pts, skinfold BF% + its band
  + floor, and a phantom-precision line when the entered waist is off the tape's grid. Button snaps all
  circumferences to the nearest mark.
- Exclusive self-computed content: closed-form sensitivity 37.35/a (men) and 70.89/S (women) points per cm
  from the log derivative; points-per-mark grids for six graduations x four arguments, both sexes; rounding
  bracket (men 2 readings → worst ±1 mark; women 3 readings → ±1.5 marks) with 1.96·SD from u·sqrt(n/12);
  output-grid enumerations (men waist 80–110: 31/61/301 readings, mean step 0.684/0.342/0.068; caliper
  Σ30–100: 15 readings at 5 mm vs 701 at 0.1 mm); kg-of-fat per mark from the exact inversion
  dF = ΔW/(1−bf+Δ) plus the constant-weight variant; landmark-displacement table (2 cm = 1.41 pts = 1.40 kg,
  i.e. twice the tape's own floor); caliper grids and brackets (5 mm → 4.18-pt band, 3.90 kg); readings-needed
  table; unit-mismatch table (inches-as-cm gives 49.4%, −14.0% and a believable-looking wrong 14.4%).
- Added `.chart-row-six` (6-col table grid + mobile collapse) to app/tool-pages.css.
- Live confirmed: HTTP 200 / Server: Vercel / X-Matched-Path, title + H1 + canonical + exclusive markers
  server-rendered; sitemap.xml 36 → 37 urls. Deploy ~90 s (2 polls of 404, then 200).
- 28-day GSC/GA4 report still not due (cycle started 2026-09-21, due ~2026-10-19). No GSC/GA4 connector.
- Next: word 14 = **body composition calculator** (1300) → mapped gap G10.

## Run #12 summary (2026-09-30)
- Published /fat-percentage-calculator ("Fat Percentage Calculator — Three Methods, One Honest Range"),
  word "fat percentage calculator" (1600), mapped gap G8 (method error bounds / cross-method comparison),
  reused per the run-#11 decision (no unused gaps remain). Treated G8 from a completely new angle — earlier
  G8 pages covered the two-method spread (run #3) and the per-site error budget (run #8); this one is about
  **inverting the equations to translate disagreement into measurement units**.
- Client calculator: units, sex, age, height, weight, waist, neck, hip (women), three skinfolds. Output =
  median BF% with min–max range and spread, the three per-method values, fat-mass kg range, the counterfactual
  "agreement waist / agreement weight / agreement skinfold sum" vs what was entered, between-method SD, and
  n-needed for ±1.0 / ±0.5 points. Button sets the waist to the value that makes tape and BMI agree.
- Exclusive self-computed content: the shared-input audit (Navy∩BMI = {height}, Navy∩skinfolds = {},
  BMI∩skinfolds = {age}); the weight-blindness table (fixed tape, 60→120 kg: Navy pinned at 21.0, BMI method
  13.4→36.1, a 22.7-pt swing); signed Navy−BMI disagreement grids for both sexes with the diagonal zero line;
  algebraic inverses — waist-for-BF via the Navy log, weight-for-BF via Deurenberg, and skinfold-sum-for-BF by
  solving the JP3 quadratic after Siri (smaller root, verified against the derivative: 3.26–5.28 mm/pt men,
  2.61–3.91 women); mm-per-point table by differencing; 8 constructed bodies with spread 0.8–7.7 pts and SD
  0.38–3.88; a rank-inversion pair (A leaner by tape and skinfold, B leaner by BMI); the methods-needed table
  n=(1.96·s/t)²; fat-mass spreads (2.0 kg on 80 kg, 2.2 kg on 65 kg, 6.0 kg at the widest).
- Corrections made before publishing: an initial "2.2 kg per cm of waist, steeper than the man's" claim was
  wrong — recomputed to 1.1 kg/cm and shallower (0.49 pts/cm × 2.27 kg/pt vs 0.70 × 2.64), and two unsourced
  "a month of fat loss" comparisons were replaced with arithmetic on this site's own numbers (5% of 80 kg = 4.0 kg).
  A stray "mid-diét" typo was fixed; file is ASCII-clean apart from normal typography.
- Live confirmed: HTTP 200 / Server: Vercel / X-Matched-Path /fat-percentage-calculator, title + H1 + canonical
  + exclusive markers present, answer card renders server-side; sitemap.xml now 36 urls (was 35). Deploy took
  ~3 min (6 polls of 404, then 200).
- 28-day GSC/GA4 report still not due (cycle started 2026-09-21, due ~2026-10-19). No GSC/GA4 connector exists.

## Run #11 summary (2026-09-29)
- Published /visceral-fat-calculator ("Visceral Fat Calculator — What Your Waist Can and Cannot Tell
  You"), word "visceral fat calculator" (1900), mapped gap G1 (visceral fat / fat distribution),
  reused because no unused gap remained (see status note above).
- Framing: the page opens by stating that no tape can separate visceral from subcutaneous fat, then
  grades central storage with three proxies (waist-to-height ≥0.500, waist-to-hip ≥0.90/0.85, absolute
  102/88 cm action level) and reports how many of the three fire.
- Client calculator: units, sex, age, height, weight, waist, hip. Output = WHtR + one of five
  central-storage bands + flag count/names + WHR + margin to the action level + the waist at which
  each proxy fires + cm to drop a band + cm per 0.01 WHtR + hip needed to clear WHR + the height at
  which this waist stops being flagged + circle cross-section area and cm²/% per cm + BMI class and
  Deurenberg BF% as labelled context.
- Exclusive self-computed content: the disagreement algebra — WHtR fires at 0.5·height and WHR at
  t·hip, so the waist cancels and hip-to-height alone decides which proxy is stricter (0.5556×height
  men / 0.5882×height women), with the disagreement band in cm of waist equal to t × hip-distance-from
  -crossover and independent of height (1.8/4.5/9.0/13.5/18.0 cm men, 1.7/4.2/8.5/12.8/17.0 women);
  crossover heights where a fixed cm threshold stops being stricter than the ratio (men 204.0 cm at
  0.50 / 185.5 cm at 0.55; women 176.0 / 160.0); WHtR value of the action level by height (men 0.680
  at 150 cm → 0.510 at 200 cm; women 0.587 → 0.440); circle geometry (area = w²/4π, dA/dw = w/2π,
  3.45× area from 130 → 70 cm while per-cm sensitivity runs 1.54% → 2.86%); per-cm sensitivity of both
  ratios (hip cm needed to cancel 1 cm of waist = hip/waist); ten computed bodies covering 0, 1, 2 and
  3 flags including both one-directional disagreements and an action-level-only case.
- Honesty guard kept: dedicated "Where this page's arithmetic stops being true" section (tape cannot
  read the depot; the five bands are this page's own construction with no official standing; WHO values
  are screening thresholds not diagnoses; Deurenberg BF% is not independent of BMI; circle geometry is
  idealised; single readings carry measurement error). A "does fat come off visceral first" FAQ
  explicitly declines to answer rather than cite a study.
- Live confirmed: HTTP 200 / Server: Vercel / X-Matched-Path /visceral-fat-calculator, title + H1 +
  canonical + exclusive markers present; sitemap.xml now 35 urls (was 34). Deploy took ~60 s
  (3 polls of 404, then 200).

## Run #10 summary (2026-09-28)
- Published /obese-scale ("Obese Scale: Why BMI Says Obese and Body Fat Says Something Else"),
  word "obese scale" (1900). Mapped gap G5 already used → fell back to the last unused gap, G10
  (body-composition overview + cross-index of this site's own pages).
- Client calculator: units, sex, age, height, weight + body-fat source switch (BMI-derived Deurenberg
  estimate / Navy tape / own number). Output = BMI + WHO class + the two-question verdict (obese by
  BMI? obese by body fat? → both / BMI only / fat only / neither) + fat kg / fat-free kg / FMI / FFMI
  + kg to leave the BMI-obese class and to reach the top of overweight + fat-only kg to land on the
  body-fat line (lean held fixed) + the BMI at which the body-fat obesity line sits at that age and its
  distance from the BMI-30 line + BMI points per kg at that height.
- Exclusive self-computed content: Deurenberg evaluated at BMI 30 by age/sex (men 24.4% at 20 → 38.2%
  at 80; women 35.2 → 49.0 — an 11.5-pt gap produced by age alone); inverted table of the BMI at which
  body fat crosses the obesity line (men 30.50 at 20 → 19.00 at 80; women 27.33 → 15.83) with the
  difference from the 30 line; the 0.1917 BMI-pts/year (1.92 per decade) drift and the crossover ages
  where the fat line drops inside the BMI "normal" band (≈32 women / ≈49 men); a 5×4 FMI grid showing
  FMI 7.50 recurring at BMI 30/25%, 25/30% and 22/34%; kg-per-BMI-point and class-line weights by
  height (155–190 cm); BMI points per 1 and 2 kg by height (2 kg = 0.58–0.83 pts); and an 8-profile
  four-quadrant cross-classification where BMI comes from weight/height and BF% from the Navy equation
  (which never sees weight) so the two verdicts are genuinely independent.
- Honesty guard kept: a dedicated "Where this page's arithmetic stops being true" section states that
  the two verdicts are algebraically tied when the BMI-derived estimate is used, that Navy is a
  population prediction equation, that 25%/32% are ACE chart bands and not clinical thresholds, that
  the age drift is an artefact of the Deurenberg model, and that FMI has no agreed cut-off.
- Live confirmed: HTTP 200 / Server: Vercel / X-Matched-Path /obese-scale, title + H1 + canonical +
  exclusive markers present; sitemap.xml now 34 urls (was 33). Deploy took ~45 s (1 poll of 404, then 200).

## Run #9 summary (2026-09-27)
- Published /measure-body-fat ("Measure Body Fat — and See Where You Fall for Your Age and Sex"),
  word "measure body fat" (1900), mapped gap G6 already used → fell back to G9 (age/sex ideal ranges).
- Client calculator: sex, age, height, weight, method switch (Navy tape vs Jackson-Pollock 3-site),
  per-site slip selector, readings-per-site selector. Output = BF% + the age/sex corridor + inside/
  above/below verdict + % of the way up the corridor + gap in points AND kg of fat AND noise-widths
  (gap/sigma) + BMI-implied BF% and the cross-method spread + inverted age window during which that
  number sits inside the corridor.
- Exclusive self-computed content: the "corridor" = Deurenberg (1991) 1.20·BMI + 0.23·age − 10.8·sex
  − 5.4 evaluated at WHO BMI 18.5 and 24.9, tabulated by decade both sexes; constant geometry proved
  (width 7.68 pts at every age, drift 2.30 pts/decade, sex gap exactly 10.80 pts at every age);
  crossover ages where an age-blind ACE chart breaks (men 49.2 / 52.2 / 82.6; women 32.7 / 35.7 / 66.1);
  held-constant trajectories for 4 profiles across ages 30-70; inverted age-window table (all windows
  33.4 yrs wide); kg-per-point and corridor-traversal table; noise-vs-band table (corridor = 4.5-5.6
  noise widths, ACE fitness band only 2.5-2.9).
- Provenance discipline: ACE category numbers were verified against a reproduction of the ACE chart
  before use; an unverified age-stratified "ACE/ACSM" table found on a third-party blog was deliberately
  NOT used. The page states plainly that the corridor is this site's own construction, not an official
  standard or clinical cut-off.
- Live confirmed: HTTP 200 / Server: Vercel / X-Matched-Path /measure-body-fat, title + H1 + canonical +
  exclusive markers + sitemap.xml entry (33 urls). Deploy took ~75 s (3 polls of 404, then 200).

## Run #8 summary (2026-09-26)
- Published /fat-calculator ("Fat Calculator — Body Fat From Tape or Caliper, With an Error Budget"),
  word "fat calculator" (2900), mapped gap G8 already used → fell back to G6 (at-home measurement
  technique / landmark protocol / error table).
- Client calculator: method switch (Navy tape vs Jackson-Pollock 3-site), sex, age, height, weight,
  per-site slip selector, readings-per-site selector. Output = BF% + fat/lean mass + error bar (RSS
  over sites, /sqrt(n) for averaged readings) + per-site points-per-cm or points-per-mm + one-point
  cost in cm/mm + minimum detectable change between two sessions.
- Exclusive self-computed content: exact partial derivatives of both published equations (tape per cm,
  caliper per mm, age per year, height per cm); per-site sensitivity for two worked profiles (male
  21.0% Navy, female 30.7% Navy); sensitivity-vs-circumference-difference table (men 1.49 → 0.62 pts/cm
  from 25 → 60 cm; women 0.71 → 0.42 from 100 → 170 cm) showing estimates get noisier as you lean out;
  caliper pts/mm vs sum (men 0.320 → 0.208, women 0.385 → 0.214); total error budget tables for both
  methods at 5 slip sizes; a 10-row mistakes table splitting bias vs noise; detectable-change table
  (1/2/3/5 readings) — 2.76 pts single-reading tape down to 0.60 pts at 5-reading caliper; waist sweep
  showing diminishing per-cm return.
- Verified Jackson-Pollock 3-site constants + Siri equation against a published reference before use;
  page states plainly that the ± band covers measurement error only, not the equations' own error.
- Live confirmed: HTTP 200 / Server: Vercel / X-Matched-Path /fat-calculator, title + H1 + canonical +
  exclusive markers + sitemap.xml entry (32 urls).

## Run #7 summary (2026-09-25)
- Published /army-bmi-calculator ("Army BMI Calculator — BMI, Waist-to-Height and Central Fat Zones"),
  word "army bmi calculator" (2900), gap G1 (visceral fat / fat distribution).
- Client calculator: height/weight/waist/hip → BMI + category, BMI-method BF% (site's own
  1.20·BMI + 0.23·age − 16.2 / −5.4), Army WHtR truncated to 3 dp vs the 0.550 line, waist margin to
  the line, the page's own 5-zone central-storage grade, WHR, cm-per-zone at that height.
- Exclusive self-computed content: a 5-zone WHtR scale whose Zone 4 starts exactly at the Army 0.550 line;
  zone-boundary waists by height (metric + inches, 150–200 cm / 60–76 in); a fixed 95 cm waist read across
  heights (Zone 5 at 150 cm → Zone 2 at 200 cm); the 102/88 cm action levels shown to be height-blind;
  a 4-profile cross-classification where BMI 22.1 sits in both Zone 1 and Zone 4 with identical BMI-derived
  BF% (17.2%); a 70→110 cm waist sweep at fixed 79.2 kg crossing four zones; WHR grid + hip-needed table;
  cm-per-zone and dWHtR-per-cm sensitivity; the structural point that BMI and WHtR are mathematically
  independent at fixed height.
- Care taken: no invented official Army BMI threshold — the page states plainly that BMI is not the current
  standard, links to /army-body-fat-calculator, and carries a "not an official assessment" disclaimer.
- Live confirmed: HTTP 200 / Server: Vercel, title + H1 + canonical + exclusive markers + sitemap entry.

## Run #5 summary (2026-09-23)
- Published /navy-body-fat-calculator ("Navy Body Fat Calculator"), gap G3, word "navy body fat calculator".
- Interactive client page: one tape-measure input set returns Navy BF% + Army WHtR verdict + waist margin to
  the 0.550 line + waist needed for a 25%/32% Navy reading + per-cm sensitivity.
- Exclusive content (all self-computed): algebraic inverse of the Navy equations giving the waist for each
  BF% (men 175/n38, men 180/n40, women 162/n33/hip98); "Navy BF at the Army 0.550 line" crosswalk by height
  (men 22.0 at 160 cm to 27.5 at 190 cm; women flat at 36.3 — the height term cancels the proportional waist
  rise); 8 profiles where the two methods disagree; cm-of-waist-per-BF-point sensitivity tables; Army limit
  waist by height plus WHtR change per cm.
- Deliberately did NOT state any service administrative pass/fail limit for the Navy (would have been
  unverifiable); page says so explicitly in a FAQ.
- Live confirmed: HTTP 200, Server: Vercel, title/H1/canonical correct, sitemap.xml entry present.

## Run #6 summary (2026-09-24)
- Published /body-recomposition-calculator, word "body recomposition calculator" (5400), gap G2.
- Client calculator: Mifflin–St Jeor TDEE + 7700 kcal/kg fat + per-tier lean gain rates. Headline output is
  the recomposition target intake; also shows entered-deficit verdict vs the window, macro split, and
  3/6/12-month BF projection. Button sets intake to the recomposition point.
- Exclusive self-computed content: the "recomposition point" (deficit where monthly fat loss = monthly lean
  gain) plus a ±0.15 kg/mo window — 43–119 kcal/day for a trained intermediate male, only 1.6–4.3% of TDEE;
  12-month month-by-month trajectory (BF 20.0 → 15.5% with +0.28 kg weight); tier tables both sexes;
  contribution decomposition (lean gain supplies only 20.8% of a 6-month BF drop at the recomp point,
  5.8% at 300 kcal/day); months-per-BF-point table; protein-by-lean-mass grid; macro split table; fat-store
  runway table.
- Tier rates and the 7700 constant labelled as modelling parameters; dedicated "Where this model is weak"
  section. No competitor text copied, no fabricated research numbers.
- Added CSS class `.chart-row-five` (5-col table grid + mobile collapse) to app/tool-pages.css.
- Live confirmed: HTTP 200 / Server: Vercel, title + H1 + canonical + exclusive markers + sitemap entry.
- 28-day GSC/GA4 report still not due (cycle started 2026-09-21, due ~2026-10-19). No GSC/GA4 connector
  exists; when due, output "读不到".

## Run #3 summary (2026-09-22, operator asked to continue same day)
- Published /body-fat-percentage-calculator, gap G8 (method error bounds + method comparison).
- Built as an interactive client page: runs U.S. Navy + BMI method simultaneously, shows the spread and a
  live error bar computed from exact partial derivatives of the site's own published constants.
- Exclusive content: cross-method spread table (avg 2.9 pts, max 6.2 on 8 computed profiles) and a
  sensitivity table (37.35/(waist-neck) pts per cm for Navy men, 70.88/(waist+hip-neck) for women,
  1.20/height^2 pts per kg for the BMI method).
- Live confirmed: HTTP 200 / Server: Vercel, title + H1 + exclusive markers present, sitemap entry present.

## Run #4 summary (2026-09-22, operator asked to continue)
- Published /weight-loss-percentage-calculator ("Weight Loss Percentage Calculator and Plateau Check"),
  gap G4. Interactive client page: computes loss %, % of goal banked, weekly rate in kg and % of start,
  weeks to goal, and compares the observed rate against the user's own noise floor (1.069 x sigma).
- Exclusive content: compounded weekly-rate trajectory table (0.50-1.25%/wk over 4-52 wks), milestone kg
  table for 5/10/15/20%, and a plateau-detection table derived from SE = sigma/sqrt(7) and a
  1.07 x sigma detection threshold (e.g. 0.25 kg/wk with a 1.0 kg daily swing needs >4 weeks of flat data).
- Live confirmed: HTTP 200 / Server: Vercel, title + H1 + markers present, sitemap entry present.

## Run #2 summary (2026-09-22)
- Published /scale-bmi ("BMI Scale Accuracy: What a Smart Scale Really Measures"), gap G5, word "scale bmi".
- Local build verified before push (33 routes, /scale-bmi prerendered static).
- Pushed to main; live confirmed: HTTP 200, Server: Vercel, canonical + sitemap.xml entry present.

## Operational notes learned
- Repo ships WITHOUT node_modules. `npm ci` takes ~2 min; `npm run build` takes ~2 min. Run build before pushing.
- Build output lists all routes — use it to confirm the new slug compiled.
- `/tmp/x.html` does not resolve in this Git Bash; write verification files into the repo dir instead.
- Deploy becomes live within ~2.5-3 min of push.
- **Local `next build` is NOT reliable here.** It succeeds through "Compiled successfully", "Finished
  TypeScript" and "Generating static pages (N/N)", then dies at "Collecting build traces" with
  `[safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED]` (sandbox caps file deletions per turn; 50 then 550).
  Clearing .next first does not help. Workaround: treat "Compiled successfully + Finished TypeScript +
  static pages generated" as the green light, optionally confirm with `npx tsc --noEmit` (exit 0), then
  push and verify live with curl. Vercel's own build is unaffected.
- Client pages need a separate `layout.tsx` for metadata ("use client" files cannot export metadata).
  Use `buildPageMetadata({title, description, path})` from app/site-metadata.
- CSS: `.chart-row` is 3 columns; for 4-column tables add `chart-row-wide`. `.formula-box` lives in
  `app/army-body-fat-calculator/army.css`, not tool-pages.css.
- 28-day GSC/GA4 report is NOT due until ~2026-10-19 (cycle started 2026-09-21). No GSC/GA4 connector exists — when due, output "读不到" unless a real connector is added.
- `npx tsc --noEmit` (exit 0) is a fast, reliable substitute for the locally broken `next build`.
- In this Git Bash, writing curl output to `/c/...` paths silently fails (HTTP 000). `cd` into the repo and
  use a relative filename instead; delete the scratch file afterwards.
- `.formula-box` was defined only in army.css, so tool pages using it rendered unstyled. Copied the rule
  into app/tool-pages.css (2026-09-23) so any tool page can use it.
- Navy constants used site-wide (inches): men 86.010·log10(waist−neck) − 70.041·log10(height) + 36.76;
  women 163.205·log10(waist+hip−neck) − 97.684·log10(height) − 78.387.

## Run #20 summary (2026-10-08) — LAST WORD OF THE BATCH
- Word 20 = **body mass scale** (590) → mapped gap G5, reused per run-#11 decision (no unused gaps remain
  since word 10). Fourth distinct G5 angle: **the daily weigh-in read as a time series, not as a reading**.
  Distinct from /scale-bmi (what a smart scale measures, hydration model), /best-bmi-scale (spec-sheet
  arithmetic, height entry vs load-cell tolerance) and /bmi-machine (auditing your own unit, gain vs
  offset, five home tests).
- Published /body-mass-scale, "Body Mass Scale: The Number Is Noise, the Trend Is Data".
- Client calculator: units, height, weight, scale-reported BF%, six scatter levels (0.1–1.0 kg), averaging
  window (1/3/7/14/28 days), display graduation (1/0.5/0.2/0.1/0.05 kg), entered weekly rate, days of
  daily data, EWMA alpha. Output = BMI + class + single-reading band and n-day-mean band in kg and BMI pts
  + clearance to the nearest WHO line + SE of the fitted slope + smallest detectable weekly rate + days
  needed for the entered rate + regression-vs-two-readings factor and its equivalent two-reading spacing +
  MDC on the chosen mean and the days of real loss it takes + total change over the window + the body-fat
  ambiguity interval + the graduation penalty + the EWMA/SMA equivalence line.
- Exclusive self-computed content: SE(mean) = sigma/sqrt(n) and SE(slope) = sigma*sqrt(12/(N(N^2-1))) from
  the exact deviations sum N(N^2-1)/12; the day-count grid (0.5 kg/wk needs 8/10/14/18/21 days at sigma
  0.2/0.3/0.5/0.8/1.0); smallest detectable weekly rate by window (7 d → 1.296 kg/wk, 28 d → 0.160,
  84 d → 0.031) with the total-change-over-window column *falling* 1.30 → 0.25 kg; **regression beats two
  readings by sqrt((N^2-1)/6N)** (1.07x at 7 d, 2.16x at 28 d, 3.74x at 84 d), equivalent two-reading
  spacing sqrt(N(N^2-1)/6) (28 daily readings = one comparison 60.4 days apart); a 28-day worked series
  generated here from a stated model (true -0.400 kg/wk, sigma 0.5) where regression recovers -0.394 kg/wk
  (SE 0.071) while the endpoint pair gives -0.156 kg/wk (SE 0.183, indistinguishable from zero); the
  **EWMA/SMA identity** — at equal variance n = (2-alpha)/alpha and both have mean age (1-alpha)/alpha, so
  no smoother is faster than a plain average of (2-alpha)/alpha days; the graduation table (1 kg display
  costs 10.1% more days, 0.1 kg costs 0.1%) using the sigma^(2/3) scaling; and **100*dW/W ambiguity width**
  (2.00 pts per kg at 50 kg → 0.91 at 110 kg; 1.28 pts on a 78 kg body) which is independent of BF% because
  the BF terms cancel.
- Honesty guard kept: "Where this page's arithmetic stops being true" — no device measured, no product
  named/ranked; independence of daily deviations assumed not established; straight line assumed;
  two-compartment conversion is a model; WHO classes are screening bands; the worked series is explicitly
  generated here. The "dropped 2 kg overnight" FAQ declines to give a physiological cause.
- Three numeric errors fixed before publishing: 1.8% → 1.3% (single-reading band as a share of a 78 kg
  body); 3.9–5.8% → 4.1–6.2% (7-day mean band as a share of the overweight band); and the weekly-vs-daily
  FAQ which first quoted 1.069 kg/wk (that is the N=7 ratio, not a rate) — recomputed to 5 weekly readings
  over 28 days resolving 0.310 kg/wk, 1.93x coarser than daily, i.e. sub-proportional in the count.
- tsc --noEmit exit 0 before push (one TS2774 fix: `bmiClass && ok` → `ok`).
- Live confirmed: HTTP 200 / Server: Vercel / X-Matched-Path /body-mass-scale, title + H1 + canonical
  present, answer card server-rendered (25.5, Overweight, 0.161, 16 days, 2.16, 2.05); sitemap.xml
  43 → 44 urls. Deploy ~150 s (5 polls of 404, then 200).
- **BATCH EXHAUSTED.** All 20 approved words are used (2026-09-21 → 2026-10-08). Next run must stop
  publishing and output "本批词用完，请给下一批" until the operator supplies a new keyword batch.
- 28-day GSC/GA4 report still not due (cycle started 2026-09-21, due ~2026-10-19). No GSC/GA4 connector.

## Run #19 summary (2026-10-07)
- Word 19 = **bmi machine** (590) → mapped gap G5, reused per run-#11 decision (no unused gaps remain since
  word 10). New angle: **auditing the unit you already own** — five home tests with computed detection
  thresholds. Deliberately distinct from /scale-bmi (what a smart scale measures; hydration model) and
  /best-bmi-scale (spec-sheet arithmetic; height entry vs load-cell tolerance).
- Published /bmi-machine, "BMI Machine: Five Tests for the One You Already Own".
- Client calculator: units, sex, age, height, weight, machine BF% + five test blocks — add-mass (known mass
  and reading while holding it), two known masses 5/20 kg with their readings, corner high/low, scatter
  (0.1–1.0) and readings averaged (1/3/7/14), reference-mass drift over N days. Output = slope k and
  intercept b, the error at your weight split into gain part (k−1)·W and offset part b, in kg and BMI points,
  honest BMI range, nearest WHO line clearance and safe/at-risk verdict against |error| + placement spread,
  the test's own noise ±1.96·√2·(σ/√n)·(W/m) with a resolvable/not-resolvable verdict and the minimum
  detectable gain %, placement spread as a share of the overweight band, MDC and readings needed for 0.5 /
  0.2 kg and days of real loss at 0.5 kg/wk, drift per day and years per BMI point and years to cross the
  nearest line, and the shared-sensor levers (per kg and per cm, for BMI and for BF%).
- Exclusive self-computed content: the straight-line model Reading = k·true + b with the gain/offset split
  (2% gain = 1.56 kg at 78 kg vs 0.98 at 49 kg; offset is person-independent); gain-error grids in kg and in
  BMI points at 1.70 m; **minimum detectable gain error 1.96√2σ/m** (5.54% at 5 kg down to 0.46% at 60 kg for
  0.1 kg scatter) showing the error you care about (0.5%) is smaller than the one you can see; the noise
  amplification √2·σ·W/m of the inferred error (2.26 kg per 0.1 kg of scatter at 80 kg with a 5 kg mass);
  the **extrapolation penalty** √((1−t)²+t²) with t=(W−5)/s (20.52× at 80 kg with a 5-to-10 kg pair); offset
  → BMI points by height and the kg-per-BMI-point conversion; placement spread as a share of the overweight
  band (2 kg = 13.8% at 170 cm); MDC tables and the days-of-real-loss tables (0.3 kg scatter: 11.6 days at one
  reading, 6.7 at three); drift → years per BMI point (0.5 kg/yr = 5.8 yr at 170 cm); and the **shared-sensor
  coupling** ΔBF/ΔBMI = 100(1−BF)/BMI (3.06 pts per BMI point at BMI 25.47 / 22%), with the per-cm height
  lever hitting BF% 3.06× harder than BMI (0.291 vs 0.891 at 175 cm).
- Honesty guard kept: "Where this page's arithmetic stops being true" — no device measured, no product named
  or ranked, and **no DEXA/underwater accuracy comparison quoted because none was measured**; straight-line
  model assumed; scatter figures are placeholders until the user measures them; independence assumed in the
  error arithmetic; the BIA sensitivities come from one stated model of the impedance chain, not any firmware;
  sensitivities are local; WHO classes are screening bands.
- Live confirmed: HTTP 200 / Server: Vercel / X-Matched-Path /bmi-machine, title + H1 + canonical present,
  exclusive markers (1.61, 0.53, 2.40, 1.87, 14.45, 3.06, 20.52, 1.0200, 13.8%) server-rendered; sitemap.xml
  42 → 43 urls. Deploy ~50 s (2 polls of 404, then 200).
- `npx tsc --noEmit` exit 0 before push.
- 28-day GSC/GA4 report still not due (cycle started 2026-09-21, due ~2026-10-19). No GSC/GA4 connector.
- Next: word 20 = **body mass scale** (590) → mapped gap G5, fourth G5 angle. That is the last word of the
  batch — after it, stop publishing and output "本批词用完，请给下一批".

## Run #18 summary (2026-10-06)
- Word 18 = **best way to measure body fat** (590) → mapped gap G6, reused per run-#11 decision (no unused
  gaps remain since word 10). New angle: **the reverse error budget** — target precision → how much slop you
  are allowed at each input — plus a computed **method-selection verdict** and the **break-even pinch**.
  Deliberately distinct from the four existing G6 pages: /fat-calculator (forward slip → error bar),
  /measure-body-fat-percentage (instrument resolution floor), /body-fat-calculator-caliper (3-vs-7
  equilibrium), /how-to-measure-body-fat-at-home (qualitative guide).
- Published /best-way-to-measure-body-fat, "Best Way to Measure Body Fat: Pick the Method You Can Repeat".
- Client calculator: units, sex, age, height, weight, waist, neck, hip (women), three skinfolds + six
  repeatability selectors (tape 0.3–2.0 cm, caliper 0.5–3 mm, weight 0.1–1.0 kg, height 0–2 cm, device
  0.5–3.5 pts, readings 1/2/3/5) + target change (0.5–3 pts) and expected rate (0.25–2 pts/month).
  Output = the repeat spread of tape / caliper 3-site / BMI equation / your device, ranked; the winner's
  smallest visible change 1.96·√2·σ/√n; the margin and how many readings erase it; the slop each method
  would need to match the other; the allowance per input for the target; readings needed per method; the
  months to detect at the entered rate; per-input variance shares and the gain from halving each.
- Exclusive self-computed content: the quadrature identity σ = √(Σ(∂BF/∂x·σ_x)²) with the closed-form
  derivatives (Navy men 37.35/(w−n) and women 70.88/S pts per cm, height 30.42/h and 42.42/h; JP3
  per-mm/site via the Siri chain −495/D²·dD/dΣ; BMI 1.2/H² per kg and 1.2·2·BMI/H per cm); the **allowance
  tables** (target ÷ (s·√k), k = 2 men / 3 women: 0.19–0.57 cm at ±0.5 pt, 0.38–1.14 cm at ±1 pt, and
  0.81–1.30 cm for women) showing the allowance collapses on lean bodies; the caliper allowance running the
  other way (looser as folds thicken, 0.93 → 1.17 mm for men); variance shares (men: waist 48.8 / neck 48.8
  / height 2.3, halving one circumference buys 20.4%; women: three circumferences 30.7 each, 12.3%; BMI
  equation: height 68.8%, halving it buys 30.4%); the **break-even pinch** (1.09 mm for a man and 0.80 mm
  for a woman at 0.5 cm of tape slop, 0.67 / 4.33 mm across the slop range) which is independent of the
  number of readings; the winner grids; the crossover in body size (tape takes over above w−n ≈ 49.7–58.6 cm
  for men and S ≈ 99.9–134.4 cm for women); detectable change and readings needed (tape 1.58 → 0.91 at
  3 readings; device 4.16, needing 18 readings for ±1 pt, 70 for ±0.5); the time-to-detect table (0.25
  pts/month needs 6.3 months on the tape at one reading, 3.6 at three, 16.6 on the device); and eight
  constructed bodies where the caliper wins 3 of 4 men and the tape wins all 4 women plus the largest man.
- Honesty guard kept: "Where this page's arithmetic stops being true" — repeatability only, never accuracy
  against a reference; the published equations carry their own un-quantified error; averaging shrinks random
  wobble only; the slop figures are placeholders until the user measures them; independence is assumed; the
  BMI equation's tiny spread is not a recommendation (it measures almost nothing); the device row is the
  user's number, no device tested. A soft physiological claim about breath-hold was removed before publish.
- Live confirmed: HTTP 200 / Server: Vercel / X-Matched-Path /best-way-to-measure-body-fat, title + H1 +
  canonical present, exclusive markers (1.09 mm, 1.44, 17.0, 13.2, 1.868, 49.7, 4.33 mm, 16.6 months,
  48.8) server-rendered; sitemap.xml 41 → 42 urls. Deploy ~120 s (4 polls of 404, then 200).
- Fixed before publishing: Navy constants must be fed **inches** (first run produced a 54% reading); the
  tape allowance table had to be switched from the single-input t/s convention to the all-circumferences
  t/(s·√k) convention to match the calculator; two wrong BMI "gain from halving" numbers (8.3/25.0) were
  recomputed to 12.5/30.4 and 14.5/28.0.
- 28-day GSC/GA4 report still not due (cycle started 2026-09-21, due ~2026-10-19). No GSC/GA4 connector.
- Next: word 19 = **bmi machine** (590) → mapped gap G5. Existing G5 pages: /scale-bmi, /best-bmi-scale —
  pick a third distinct angle. Then word 20 = body mass scale → G5 (fourth G5 angle).

## Run #17 summary (2026-10-05)
- Word 17 = **best bmi scale** (590) → mapped gap G5, reused per run-#11 decision (no unused gaps remain).
  New angle: **printed-spec arithmetic and the device's own constants** — deliberately distinct from
  /scale-bmi, which is about what a smart scale measures and how the *user's* hydration moves the reading.
  This one prices the *hardware and firmware* side.
- Published /best-bmi-scale, "Best BMI Scale: What the Spec Sheet Is Really Worth".
- Client calculator: units, sex, age, height, weight, the BF% the scale reports, plus five device specs
  (weight tolerance, display graduation, height-entry error, printed BF tolerance, electrode path) and two
  user inputs (own daily water noise, readings averaged). Output = BMI + class + uncertainty **split by
  source** (tolerance part vs height part) + kg-equivalent of the height error and its multiple of the
  tolerance + distance to the nearest WHO class line and a safe/at-risk flip verdict + on-scale detectable
  change (offset cancels) vs cross-device band (offset does not) and its floor + the gain from halving the
  device error + the three levers at that BF% + the BMI-method cross-check. Button resets to typical specs.
- Exclusive self-computed content: the identity pair ΔBMI = ΔW/H² and ΔBMI = 2·BMI·(ΔH/H), plus
  ΔBF = (1−BF)·(relative error in FFM); tolerance/H² grid over 7 heights × 5 tolerances (the whole prize
  for a better load cell is 0.029–0.042 BMI at ±0.1 kg); graduation rounding SD = u/√12 (0.1 kg → 0.010 BMI,
  1 lb → 0.045); **the headline finding** — 1 cm of height error is worth 0.640–1.080 kg of weight depending
  on size, i.e. 7.5–13.0× a ±0.1 kg tolerance and still 1.5–2.6× a ±0.5 kg one; required class-line
  clearance √(tol² + kgEquiv²) showing tolerance is nearly flat while height is steep (0.10 → 0.86 → 1.70 kg
  as height error goes 0 → 1 → 2 cm); band widths in kg (18.76 normal, 14.42 above, at 1.70 m) and kg per
  BMI point (2.56/2.89/3.24); the three BIA levers tabulated 10–40% BF (per 1% R, per 0.01 hydration
  constant, per 5% relative leg-share error, per 1 cm height) all scaling with (1−BF); cross-brand hydration
  constant 0.71–0.75 (a 20% reading spans 17.75–22.13, ±2.1 pts from a 0.02 change); the √(u²+d²) grid plus
  the halving ladder (3.0→1.5 pts buys 36.8%, 0.5→0.25 buys 3.8%) and the closed-form stop rule
  **d ≤ 0.4583·u gets you within 10% of a perfect device**; and the averaging-floor table (target ±t needs
  d < t/1.96, else "impossible" — e.g. ±0.5 pts with u=1.5 needs 41 readings at d=0.1 and is unreachable at
  d=0.3), plus a six-row use-case decision matrix with computed thresholds.
- Honesty guard kept: "Where this page's arithmetic stops being true" — no product named/ranked/reviewed and
  no device was measured; 0.73 and the H²/R form are this page's model, not anyone's firmware; the leg-share
  4.00-pt lever is explicitly an upper bound from the pure-ratio model, not a measured error; industry
  "tolerance" is not defined consistently; WHO classes are screening categories not diagnoses; the BMI-method
  BF% is not independent; user noise is assumed not measured.
- Live confirmed: HTTP 200 / Server: Vercel / X-Matched-Path /best-bmi-scale, title + H1 + canonical present,
  exclusive markers (0.294, 8.5×, 0.4583, 4.16, 6.86) server-rendered; sitemap.xml 40 → 41 urls. Deploy
  ~100 s (5 polls of 404, then 200).
- Fixed before publishing: the cross-device floor was first written with a stray √2 factor (1.96·√2·3.5 =
  9.70); corrected to the one-sample band 1.96·√(...), floor 1.96·d = 6.86, so the answer card, the section
  text and the FAQ all agree.
- 28-day GSC/GA4 report still not due (cycle started 2026-09-21, due ~2026-10-19). No GSC/GA4 connector.
- Next: word 18 = **best way to measure body fat** (590) → mapped gap G6. Existing G6 pages: /fat-calculator
  (slip + error budget), /how-to-measure-body-fat-at-home (qualitative guide), /measure-body-fat-percentage
  (instrument resolution), /body-fat-calculator-caliper (3-vs-7 equilibrium) — pick a fifth distinct angle.

## Run #16 summary (2026-10-04)
- Published /body-fat-calculator-caliper, word #16 "body fat calculator caliper" (1000), gap G6 (at-home
  measurement technique). Interactive client page: 7 skinfold inputs, runs Jackson-Pollock 7-site and
  3-site simultaneously, reports rho vs the solved equilibrium rho*, the 95% noise band and the smallest
  change that can be called real.
- Exclusive self-computed content: rho* equilibrium tables (men 0.451-0.500, women 0.466-0.504), 3-vs-7
  disagreement grid, sensitivity dBF/dSigma, random-noise vs technique-bias tables, drift, detection
  thresholds, repeat-set counts, Siri/Brozek crossover at density 1.0614.
- Angle guards against /fat-calculator (error budget), /measure-body-fat-percentage (resolution floor)
  and /how-to-measure-body-fat-at-home (qualitative guide).
- Added .chart-row-quad CSS class. tsc --noEmit exit 0. Live confirmed: HTTP 200 / Server: Vercel,
  title + H1 + canonical + markers + sitemap entry. Words left: 4 (best bmi scale, best way to measure
  body fat, bmi machine, body mass scale).
- 28-day GSC/GA4 report still not due (cycle started 2026-09-21, due ~2026-10-19). No connector -> "读不到".
