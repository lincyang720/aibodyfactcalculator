import type { Metadata } from "next";
import "../tool-pages.css";
import { GuidePage } from "../GuidePage";

const canonical = "https://aibodyfatcalculator.com/body-fat-index";
export const metadata: Metadata = {
  title: "Body Fat Index vs BMI: What Each Number Really Means",
  description: "Body fat index and BMI are not the same thing. See how a BMI-based body fat estimate is calculated, why age and sex shift the result, and a computed BMI-to-body-fat table for men and women.",
  alternates: { canonical },
  openGraph: {
    title: "Body Fat Index vs BMI: What Each Number Really Means",
    description: "How BMI and body fat index differ, the equation behind a BMI-based body fat estimate, and a computed reference table by BMI and age.",
    url: canonical,
    siteName: "AI Body Fat Calculator",
    type: "article",
  },
};

const sections = [
  {
    title: "The short answer: they measure different things",
    paragraphs: [
      "Body mass index is a ratio of weight to height, calculated as weight divided by height squared. It says nothing about what that weight is made of. A body fat index, or more plainly a body fat percentage, describes how much of your total mass is fat rather than lean tissue. That is why two people with the identical BMI can have very different body composition.",
      "The practical catch is that body fat index is not one single standardized formula the way BMI is. Most calculators, including this site, estimate it from BMI plus age and sex. That estimate is useful for tracking and for comparing broad categories, but it is a prediction built on population data, not a direct measurement of your tissue.",
    ],
    bullets: [
      "BMI uses only height and weight, so it cannot tell muscle from fat.",
      "Body fat percentage describes composition, which is what most people actually mean by body fat index.",
      "Age and sex both shift the estimate at the same BMI, because body composition changes across a lifetime.",
      "Only direct methods such as DEXA, hydrostatic weighing, or air displacement measure tissue rather than predict it.",
    ],
  },
  {
    title: "How a BMI-based body fat estimate is calculated",
    paragraphs: [
      "The equation used by this site's calculator is stated on the calculator page itself. For men it is 1.20 times BMI, plus 0.23 times age, minus 16.2. For women it is 1.20 times BMI, plus 0.23 times age, minus 5.4. The result is an estimated body fat percentage.",
      "Worked example for a man with a BMI of 25 at age 30: 1.20 multiplied by 25 is 30.0, plus 0.23 multiplied by 30 is 6.9, minus 16.2 gives 20.7 percent. The same BMI and age for a woman gives 1.20 times 25 equals 30.0, plus 6.9, minus 5.4, which is 31.5 percent. Same BMI, same age, an eleven point difference driven entirely by sex.",
    ],
    bullets: [
      "Men: estimated body fat % = 1.20 x BMI + 0.23 x age - 16.2.",
      "Women: estimated body fat % = 1.20 x BMI + 0.23 x age - 5.4.",
      "The age term means the estimate rises about 2.3 points per decade at a fixed BMI.",
    ],
  },
  {
    title: "Computed estimates for men, by BMI and age",
    paragraphs: [
      "The table below was computed from the equation above and then placed into the ACE adult reference categories used on this site. It shows how far a single BMI value can spread once age is taken into account.",
    ],
    bullets: [
      "BMI 20, age 20: 12.4% - Athletes",
      "BMI 20, age 30: 14.7% - Fitness",
      "BMI 20, age 40: 17.0% - Fitness",
      "BMI 20, age 50: 19.3% - Average",
      "BMI 25, age 20: 18.4% - Average",
      "BMI 25, age 30: 20.7% - Average",
      "BMI 25, age 40: 23.0% - Average",
      "BMI 25, age 50: 25.3% - Obese",
      "BMI 30, age 20: 24.4% - Average",
      "BMI 30, age 30: 26.7% - Obese",
      "BMI 30, age 40: 29.0% - Obese",
      "BMI 30, age 50: 31.3% - Obese",
      "BMI 35, age 20: 30.4% - Obese",
      "BMI 35, age 30: 32.7% - Obese",
      "BMI 35, age 40: 35.0% - Obese",
      "BMI 35, age 50: 37.3% - Obese",
    ],
  },
  {
    title: "Computed estimates for women, by BMI and age",
    paragraphs: [
      "Women carry more essential fat than men, so the same BMI maps to a higher estimated body fat percentage at every age. The category cutoffs are also different, which is why a direct comparison against the men's table would be misleading.",
    ],
    bullets: [
      "BMI 20, age 20: 23.2% - Fitness",
      "BMI 20, age 30: 25.5% - Average",
      "BMI 20, age 40: 27.8% - Average",
      "BMI 20, age 50: 30.1% - Average",
      "BMI 25, age 20: 29.2% - Average",
      "BMI 25, age 30: 31.5% - Average",
      "BMI 25, age 40: 33.8% - Obese",
      "BMI 25, age 50: 36.1% - Obese",
      "BMI 30, age 20: 35.2% - Obese",
      "BMI 30, age 30: 37.5% - Obese",
      "BMI 30, age 40: 39.8% - Obese",
      "BMI 30, age 50: 42.1% - Obese",
      "BMI 35, age 20: 41.2% - Obese",
      "BMI 35, age 30: 43.5% - Obese",
      "BMI 35, age 40: 45.8% - Obese",
      "BMI 35, age 50: 48.1% - Obese",
    ],
  },
  {
    title: "Why the same BMI gives different body fat",
    paragraphs: [
      "The age coefficient is the main reason a stable BMI still produces a rising body fat estimate. Body composition tends to shift toward a higher fat share as people get older, and the equation reflects that population-level pattern. It is a trend, not a verdict on any one person.",
      "Muscular builds are the other classic mismatch. A lifter with a high BMI because of muscle will still get a high estimated body fat number from a BMI-based equation, because the equation cannot see lean mass. For that person a circumference method such as the U.S. Navy tape method is usually a better starting point than any BMI-derived figure.",
    ],
    bullets: [
      "If your BMI is high mostly because of muscle, prefer a tape or Navy-method estimate.",
      "If you are tracking a cut or a recomposition, use one method consistently and read the trend, not the daily value.",
      "Hydration, meal timing, and training can move scale-based readings without any real change in tissue.",
    ],
  },
  {
    title: "Which number should you actually track",
    paragraphs: [
      "Use BMI when you want a quick population-level screening number that requires no equipment. Use a body fat estimate when the question is about composition rather than size. For most people the most useful habit is to record one consistent method every two to four weeks and look at the direction of travel.",
      "Treat any index as a starting point for a conversation or a training decision, not as a measurement of your body. If you need a precise figure for medical or performance reasons, a lab method is the right tool.",
    ],
    bullets: [
      "Screening and simplicity: BMI.",
      "Composition and physique goals: body fat percentage.",
      "Precision for clinical or athletic decisions: DEXA, hydrostatic weighing, or air displacement.",
    ],
  },
];

const faqs = [
  {
    question: "What is body fat index?",
    answer: "It is not one single standardized measure. In practice people use it to mean body fat percentage, the share of total mass that is fat. This site estimates it from BMI, age, and sex, and the equation is published on the calculator page.",
  },
  {
    question: "Is body fat index the same as BMI?",
    answer: "No. BMI is weight divided by height squared and ignores composition. Body fat percentage describes how much of the mass is fat. Two people with the same BMI can sit in different body fat categories.",
  },
  {
    question: "What is a good body fat index?",
    answer: "It depends on sex and goal. Using the ACE adult ranges shown on this site, men fall into the fitness band from 14.0 to 17.9 percent and women from 21.0 to 24.9 percent, with athletes below those bands and average or obese ranges above them.",
  },
  {
    question: "Why does my estimated body fat rise when my BMI stays the same?",
    answer: "The equation includes an age term of 0.23 per year, so at a fixed BMI the estimate climbs about 2.3 percentage points every decade. It reflects a population-level shift in composition, not a change you can see in the mirror week to week.",
  },
  {
    question: "Can I get my body fat index without a scan?",
    answer: "Yes, estimated. A BMI-based equation needs only height, weight, age, and sex. A tape-based method such as the U.S. Navy circumference method usually tracks muscular people better. Both give estimates, and the trend over several weeks is more informative than a single reading.",
  },
];

export default function Page() {
  return (
    <GuidePage
      eyebrow="BODY COMPOSITION GUIDE"
      title="Body Fat Index vs BMI: What Each Number Really Means"
      lede="Body fat index is not the same as BMI. BMI is weight divided by height squared; body fat index describes how much of your mass is fat. This site estimates it as 1.20 x BMI + 0.23 x age - 16.2 for men and - 5.4 for women, which is why two people with the same BMI can land in different categories."
      canonical={canonical}
      sections={sections}
      faqs={faqs}
      sources={[
        { label: "AI Body Fat Calculator: the BMI method equation and ACE reference ranges", href: "https://aibodyfatcalculator.com/body-fat-calculator" },
        { label: "CDC: About Body Mass Index", href: "https://www.cdc.gov/bmi/about/index.html" },
      ]}
      related={[
        { label: "Body Fat Percentage Chart", href: "/body-fat-percentage-chart" },
        { label: "BMI Calculator", href: "/bmi-calculator" },
        { label: "AI Body Fat Calculator", href: "/" },
      ]}
    />
  );
}
