import type { Metadata } from "next";
import "../tool-pages.css";
import { GuidePage } from "../GuidePage";

const canonical = "https://aibodyfatcalculator.com/ffmi-vs-bmi";
export const metadata: Metadata = {
  title: "FFMI vs BMI: Which Metric Actually Matters?",
  description: "Understand the difference between FFMI and BMI, when each metric is useful, and why body fat percentage changes the interpretation.",
  alternates: { canonical },
  openGraph: { title: "FFMI vs BMI: Which Metric Actually Matters?", description: "Compare BMI and FFMI for fitness, muscle mass, fat loss, and body composition tracking.", url: canonical, siteName: "AI Body Fat Calculator", type: "article" },
};

const sections = [
  {
    title: "The short answer",
    paragraphs: [
      "BMI and FFMI answer different questions. BMI asks whether total body weight is high or low for height. FFMI asks how much fat-free mass you carry for your height. If you are a general adult screening weight status, BMI is quick and widely used. If you lift weights, track body composition, or want to separate muscle from fat, FFMI is often more informative.",
      "Neither number is a diagnosis. BMI is intentionally simple. That simplicity is why it works well at population scale and why it can mislead athletic individuals. FFMI is more specific, but it depends on the accuracy of your body fat estimate. If your body fat percentage is wrong, your FFMI will be wrong too.",
    ],
  },
  {
    title: "What BMI measures",
    paragraphs: [
      "BMI is body weight in kilograms divided by height in meters squared. It does not know whether the weight is fat, muscle, bone, water, or glycogen. That makes it fast and inexpensive, but blunt. A muscular person can land in an overweight BMI range while carrying a healthy or athletic body fat percentage.",
      "The CDC describes BMI as a screening measure, not a direct measure of body fat. It can be useful alongside blood pressure, cholesterol, medical history, waist measurements, and other factors. The mistake is treating BMI as a complete body composition report. It was never designed to do that job.",
    ],
  },
  {
    title: "What FFMI measures",
    paragraphs: [
      "FFMI stands for Fat-Free Mass Index. It uses your estimated lean mass instead of total weight. The formula is fat-free mass in kilograms divided by height in meters squared. Fat-free mass is calculated from body weight and body fat percentage: weight multiplied by one minus body fat percentage.",
      "This makes FFMI useful for lifters because it rewards lean mass rather than total mass. Two people can have the same BMI but very different FFMI scores if one carries more muscle and less fat. In a fitness context, that difference is often the whole point.",
    ],
  },
  {
    title: "The natural limit issue",
    paragraphs: [
      "The famous normalized FFMI 25 reference comes from Kouri and colleagues' 1995 study of male athletes. The paper reported that drug-free male athletes in that sample reached an upper normalized FFMI around 25, while many steroid users exceeded it. That made FFMI popular in bodybuilding discussions.",
      "But the threshold is not a drug test, a moral judgment, or a universal biological ceiling. The original research was limited, focused on men, and used estimated body composition. Genetics, sport, measurement method, height, and training history all matter. Use the 25 reference as context, not proof.",
    ],
  },
  {
    title: "Which one should you track?",
    paragraphs: [
      "If you are starting from scratch, track BMI, waist, body weight, and a body fat estimate. If you train seriously, add FFMI. BMI can still be useful when weight changes quickly, but FFMI gives a better view of whether you are preserving or gaining lean mass while body fat changes.",
      "A practical dashboard looks like this: body weight for scale trend, waist for abdominal change, body fat percentage for composition, FFMI for lean mass, and photos for visual reality. When all five point in the same direction, you can trust the trend. When they conflict, investigate before changing your plan.",
    ],
  },
];

const faqs = [
  { question: "Is FFMI better than BMI?", answer: "FFMI is better for understanding lean mass, especially for lifters. BMI is better as a quick, low-cost population screening measure. They are complementary, not interchangeable." },
  { question: "Can a muscular person have a high BMI?", answer: "Yes. BMI uses total weight, so high muscle mass can raise BMI even when body fat is not high." },
  { question: "What FFMI is considered natural?", answer: "A normalized FFMI around 25 is often cited from a 1995 male-athlete study, but it should be treated as historical context rather than proof of natural or enhanced status." },
  { question: "Do women use the same FFMI ranges?", answer: "Women generally have different lean mass distributions, and the Kouri normalized 25 threshold was derived from male athletes. Female results need separate context." },
];

export default function Page() {
  return <GuidePage eyebrow="FFMI GUIDE" title="FFMI vs BMI: Which Metric Actually Matters?" lede="BMI is fast but blunt. FFMI is more specific for lean mass. Here is how to use both without fooling yourself." canonical={canonical} sections={sections} faqs={faqs} sources={[{ label: "CDC: About Body Mass Index", href: "https://www.cdc.gov/bmi/about/index.html" }, { label: "Kouri et al. 1995: Fat-free mass index in users and nonusers", href: "https://pubmed.ncbi.nlm.nih.gov/7496846/" }]} related={[{ label: "FFMI Calculator", href: "/ffmi-calculator" }, { label: "BMI Calculator", href: "/bmi-calculator" }, { label: "AI Body Fat Calculator", href: "/" }]} />;
}
