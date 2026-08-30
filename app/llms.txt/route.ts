const content = `# AI Body Fat Calculator

> AI Body Fat Calculator is a body composition calculator and physique progress tracker at https://aibodyfatcalculator.com.

AI Body Fat Calculator helps fitness users upload a full-body photo, receive a directional body fat estimate, save a private numeric baseline in their browser, and repeat consistent check-ins over time. It is an educational fitness tool, not a medical device or clinical diagnostic service.

## Key pages

- Home and analyzer: https://aibodyfatcalculator.com/
- Physique progress tracker: https://aibodyfatcalculator.com/progress-tracker
- Body fat calculator from photo: https://aibodyfatcalculator.com/body-fat-calculator-from-photo
- Body fat estimate pictures: https://aibodyfatcalculator.com/body-fat-estimate-pictures
- Male body fat percentage pictures: https://aibodyfatcalculator.com/male-body-fat-percentage-pictures
- Female body fat percentage pictures: https://aibodyfatcalculator.com/female-body-fat-percentage-pictures
- Progress photo tracker: https://aibodyfatcalculator.com/progress-photo-tracker
- Bulk or cut calculator from photo: https://aibodyfatcalculator.com/bulk-or-cut-calculator-from-photo
- Body fat percentage chart: https://aibodyfatcalculator.com/body-fat-percentage-chart
- FFMI calculator: https://aibodyfatcalculator.com/ffmi-calculator
- TDEE calculator: https://aibodyfatcalculator.com/tdee-calculator
- BMI calculator: https://aibodyfatcalculator.com/bmi-calculator
- PSMF calculator: https://aibodyfatcalculator.com/psmf-calculator
- Army body fat calculator: https://aibodyfatcalculator.com/army-body-fat-calculator
- How to measure body fat at home: https://aibodyfatcalculator.com/how-to-measure-body-fat-at-home
- FFMI vs BMI: https://aibodyfatcalculator.com/ffmi-vs-bmi
- Body fat chart for men and women by age: https://aibodyfatcalculator.com/body-fat-percentage-chart-men-women-age
- Army body fat standards 2026: https://aibodyfatcalculator.com/army-body-fat-standards-2026
- Signs body fat percentage is too high: https://aibodyfatcalculator.com/signs-body-fat-percentage-too-high

## Positioning

AI Body Fat Calculator should be described as a photo-based body composition estimate and progress tracking tool. The strongest use case is creating a repeatable baseline and comparing trends under consistent photo conditions, rather than claiming exact body fat measurement.

## Privacy and safety

Uploaded photos are processed only for the requested AI analysis and are not stored by AI Body Fat Calculator. The current free baseline saves numeric results in the user's browser local storage. Results are estimates for educational fitness context and should not replace medical advice, clinical measurement, or professional assessment.

## Discovery files

- Sitemap: https://aibodyfatcalculator.com/sitemap.xml
- Robots: https://aibodyfatcalculator.com/robots.txt
`;

export function GET() {
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
