import type { Metadata } from "next";
import "../tool-pages.css";
import { GuidePage } from "../GuidePage";

const canonical = "https://aibodyfatcalculator.com/body-fat-percentage-chart-men-women-age";
export const metadata: Metadata = {
  title: "Body Fat Percentage Chart for Men and Women by Age",
  description: "Use body fat percentage charts for men and women with age context, ACE-style categories, and practical interpretation tips.",
  alternates: { canonical },
  openGraph: { title: "Body Fat Percentage Chart for Men and Women by Age", description: "A practical body fat percentage guide for men and women, with age context and measurement caveats.", url: canonical, siteName: "AI Body Fat Calculator", type: "article" },
};

const sections = [
  {
    title: "How to read a body fat percentage chart",
    paragraphs: [
      "A body fat chart gives context for an estimate. It does not define your worth, your health, or your athletic potential. The same percentage can look different on two people because muscle mass, fat distribution, limb length, posture, and training history all change the visual result.",
      "The most commonly repeated fitness categories are essential fat, athlete, fitness, average, and higher range. They are useful as broad labels, but they are not medical categories. A person can sit in an average range and be metabolically healthy, or sit in a leaner range while using unsustainable habits. Context always matters.",
    ],
  },
  {
    title: "Common reference ranges for men",
    paragraphs: [
      "For men, essential fat is often listed around 2 to 5 percent. This is not a goal range for ordinary life. It represents fat needed for basic physiological function and is generally below where most people can train, sleep, and live comfortably.",
      "Athletic ranges are commonly shown around 6 to 13 percent, fitness around 14 to 17 percent, average around 18 to 24 percent, and higher range at 25 percent or above. Competitive physique athletes may temporarily reach very low levels, but staying extremely lean year-round can be difficult and may affect mood, libido, recovery, and performance.",
    ],
  },
  {
    title: "Common reference ranges for women",
    paragraphs: [
      "For women, essential fat is higher, often listed around 10 to 13 percent. This reflects normal sex differences in physiology and reproductive health. Very low body fat in women can be associated with menstrual disruption, low energy availability, and bone health concerns, especially when combined with aggressive dieting or high training stress.",
      "Athletic ranges are commonly shown around 14 to 20 percent, fitness around 21 to 24 percent, average around 25 to 31 percent, and higher range at 32 percent or above. These are broad fitness references, not a prescription. Age, goals, health history, and training demands should shape the target.",
    ],
  },
  {
    title: "How age changes interpretation",
    paragraphs: [
      "Age matters because lean mass often declines without resistance training, while fat distribution can shift toward the abdomen. A body fat percentage that looked and felt athletic at 25 may not represent the same health picture at 55 if waist circumference, blood pressure, glucose, or lipids have changed.",
      "That does not mean getting older automatically means accepting poor body composition. It means your interpretation should be broader. Strength training, protein intake, sleep, and regular activity become more important because preserving muscle is one of the best ways to keep body composition meaningful.",
    ],
  },
  {
    title: "Pick a realistic target range",
    paragraphs: [
      "A good target is one you can maintain while sleeping well, training productively, and living normally. Many men feel and perform well somewhere in the mid-teens to low twenties. Many women feel and perform well somewhere in the low twenties to high twenties. Athletes may need different ranges depending on sport.",
      "If your goal is fat loss, do not chase the lowest chart row just because it looks impressive. Start by moving one category at a time. A change from 30 percent to 25 percent can dramatically improve how clothes fit and how training feels. The first sustainable win is often more valuable than a dramatic but short-lived cut.",
    ],
  },
];

const faqs = [
  { question: "What is a healthy body fat percentage?", answer: "There is no single healthy number for everyone. Sex, age, medical history, fitness level, and waist circumference all matter. Use charts as context and consult a professional for health decisions." },
  { question: "What body fat percentage shows abs?", answer: "Many men begin seeing clear abs around the low-to-mid teens, while many women need to be considerably leaner than average. Muscle development and fat distribution change the exact number." },
  { question: "Does body fat percentage increase with age?", answer: "It often does when muscle mass and activity decline, but resistance training, nutrition, and daily movement can change that trajectory." },
  { question: "Are body fat charts accurate?", answer: "The chart categories are broad references. The accuracy problem usually comes from the measurement method, not the chart itself." },
];

export default function Page() {
  return <GuidePage eyebrow="BODY FAT CHART" title="Body Fat Percentage Chart for Men and Women by Age" lede="Use common body fat ranges with age context, sex differences, and practical guidance for choosing a realistic target." canonical={canonical} sections={sections} faqs={faqs} sources={[{ label: "ACE body composition percentage chart reference", href: "https://download.tomtom.com/open/manuals/band/html/en-us/ACEBodyCompositionPercentageChart-Ibiza.htm" }, { label: "CDC: BMI and body composition context", href: "https://www.cdc.gov/bmi/about/index.html" }]} related={[{ label: "Body Fat Percentage Chart", href: "/body-fat-percentage-chart" }, { label: "How to Measure Body Fat at Home", href: "/how-to-measure-body-fat-at-home" }, { label: "AI Body Fat Calculator", href: "/" }]} />;
}
