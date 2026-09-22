import type { Metadata } from "next";
import "../tool-pages.css";
import { GuidePage } from "../GuidePage";

const canonical = "https://aibodyfatcalculator.com/scale-bmi";
export const metadata: Metadata = {
  title: "BMI Scale Accuracy: What a Smart Scale Really Measures",
  description: "A BMI scale computes BMI from weight and the height you enter, so that part is arithmetic. The body fat number comes from bioelectrical impedance and is an estimate. See computed error math and how to pick one.",
  alternates: { canonical },
  openGraph: {
    title: "BMI Scale Accuracy: What a Smart Scale Really Measures",
    description: "Why a BMI scale's BMI number is reliable but its body fat number drifts with hydration, a computed model of how far one litre of water moves the reading, and a practical buying checklist.",
    url: canonical,
    siteName: "AI Body Fat Calculator",
    type: "article",
  },
};

const sections = [
  {
    title: "The short answer",
    paragraphs: [
      "A BMI scale does two completely different jobs, and they deserve different levels of trust. The BMI number is arithmetic: the scale weighs you, you typed your height in once, and it divides weight by height squared. If the load cells are decent and the floor is level, that number is fine.",
      "The body fat number is a different story. It comes from bioelectrical impedance, a small current passed through your feet that measures how much your tissues resist it. Water conducts and fat does not, so the scale turns resistance into an estimated water volume, then into an estimated fat-free mass, then into a body fat percentage. Every step in that chain is a population-level assumption wearing a decimal point.",
      "Practical verdict: trust the weight and the BMI. Treat the body fat reading as a trend line with a noise band of roughly one to three percentage points, and never as a single-day truth.",
    ],
    bullets: [
      "BMI on a scale = weight divided by your entered height squared. Arithmetic, not measurement.",
      "Body fat on a scale = bioelectrical impedance converted through assumptions about hydration.",
      "A single reading can move one to three points overnight without any change in actual tissue.",
      "The number becomes useful only when you average it over one to two weeks under the same conditions.",
    ],
  },
  {
    title: "What the scale actually computes, step by step",
    paragraphs: [
      "Understanding the chain explains why the number wobbles. First, four load cells estimate your mass. Second, the scale reads the height you entered at setup and calculates BMI as weight in kilograms divided by height in metres squared. Third, it sends a painless alternating current, usually through electrodes under each foot, and measures impedance.",
      "Fourth, it converts that impedance into total body water, using a relationship where water volume scales with height squared divided by resistance. Fifth, it divides body water by an assumed hydration fraction of fat-free tissue, close to 0.73, to get fat-free mass. Sixth, it subtracts that from your body weight and calls the remainder fat.",
      "Compare that with the BMI-based estimate used elsewhere on this site, which is 1.20 times BMI plus 0.23 times age minus 16.2 for men, or minus 5.4 for women. That equation never touches your tissues at all; it predicts a typical value for someone of your BMI, age, and sex. A scale at least responds to your body, but it responds through water.",
    ],
    bullets: [
      "Step 1: weight from load cells.",
      "Step 2: BMI from weight and stored height.",
      "Step 3: impedance from a foot-to-foot current.",
      "Step 4: total body water from impedance and height.",
      "Step 5: fat-free mass from body water divided by about 0.73.",
      "Step 6: fat mass = body weight minus fat-free mass.",
    ],
  },
  {
    title: "Computed: how far one litre of water moves the reading",
    paragraphs: [
      "The hydration assumption is where the error enters, so it is worth pricing. The model below was built and computed by this site. Assumptions: fat-free tissue holds 73 percent water, the scale estimates total body water correctly for your true state, and any deviation in water is read by the scale as a change in fat-free mass rather than as water.",
      "Take a man weighing 80 kilograms at a true 20 percent body fat. His fat mass is 16 kilograms, fat-free mass 64 kilograms, and body water about 46.7 kilograms. If he is one kilogram of water down after a hot training session, the scale divides 45.7 by 0.73 and gets 62.6 kilograms of fat-free mass, so it reports 21.7 percent fat. His real body fat has not moved. The reading has moved 1.7 points.",
      "The same one kilogram swing hits a lighter person harder, because it is a larger fraction of a smaller body. The table below is computed from the same model across three body sizes.",
    ],
    bullets: [
      "80 kg, true 20.0%: water -2 kg reads 23.4%, -1 kg reads 21.7%, +1 kg reads 18.3%, +2 kg reads 16.6%.",
      "60 kg, true 12.0%: water -2 kg reads 16.6%, -1 kg reads 14.3%, +1 kg reads 9.7%, +2 kg reads 7.4%.",
      "95 kg, true 30.0%: water -2 kg reads 32.9%, -1 kg reads 31.4%, +1 kg reads 28.6%, +2 kg reads 27.1%.",
      "Computed rule of thumb: one kilogram of water is worth about 1.4 to 2.3 body fat points, and the smaller you are, the bigger the swing.",
    ],
  },
  {
    title: "Compiled method comparison: what each method is actually measuring",
    paragraphs: [
      "The table below was compiled by this site as a practical planning reference. It is a working summary of what each method measures and how much tolerance we build into our own tracking, not a set of figures quoted from a published study. Use it to choose a method, not to argue about decimals.",
    ],
    bullets: [
      "Foot-to-foot bioelectrical impedance (consumer scale): measures lower-body impedance. Typical planning tolerance we use: 3 to 5 points. Cheap, instant, very sensitive to hydration and time of day.",
      "Hand-to-foot bioelectrical impedance (segmental): measures arms, legs, and trunk separately. Planning tolerance: 2 to 4 points. Better for people who carry fat centrally.",
      "Multi-frequency impedance: measures at several frequencies to separate intracellular from extracellular water. Planning tolerance: 2 to 3 points. Usually found in clinic-grade devices.",
      "Skinfold calipers: measures subcutaneous fat thickness at defined sites. Planning tolerance: 3 to 5 points, heavily dependent on the skill of whoever is pinching.",
      "Navy circumference (tape): measures neck and waist, or neck, waist, and hip. Planning tolerance: 2 to 4 points. Fast, free, and behaves well on muscular builds.",
      "Hydrostatic weighing: measures body density by underwater weight. Planning tolerance: 1.5 to 2.5 points. Requires full exhalation and a tank.",
      "Air displacement plethysmography: measures body volume in a sealed chamber. Planning tolerance: 1.5 to 2.5 points. Sensitive to clothing and breathing.",
      "DEXA: measures tissue attenuation from a low-dose X-ray. Planning tolerance: 1 to 2 points. The usual reference standard, and the only one that reports where the fat sits.",
    ],
  },
  {
    title: "Computed: how many readings before a change is real",
    paragraphs: [
      "If a single scale reading carries about 1.5 points of noise, then averaging is the cheapest accuracy upgrade available. The standard error of a mean falls as the noise divided by the square root of the number of readings. The figures below were computed from that relationship with a 1.5 point single-reading noise assumption.",
      "The practical consequence: one reading tells you almost nothing, a week of daily readings tells you a fair amount, and two to four weeks tells you whether a diet or training block is actually working.",
    ],
    bullets: [
      "1 reading: uncertainty about plus or minus 2.9 points at 95 percent confidence.",
      "3 readings: plus or minus 1.7 points.",
      "7 readings: plus or minus 1.1 points.",
      "14 readings: plus or minus 0.8 points.",
      "28 readings: plus or minus 0.6 points.",
      "Rule of thumb: do not believe a change smaller than one point until you have at least a week of readings behind it.",
    ],
  },
  {
    title: "How to choose a BMI scale",
    paragraphs: [
      "Every smart scale on the market shows roughly the same set of numbers, because most of them buy the same chips and the same body-composition equations. The difference is not accuracy at the sensor, it is whether the device lets you control the variables that cause the error. The checklist below was compiled by this site from what actually changes the usefulness of a reading.",
    ],
    bullets: [
      "Electrode layout: four foot pads only is the entry level. A handheld bar with hand electrodes gives a hand-to-foot path, which behaves better for people who carry most of their fat on the trunk.",
      "Segmental output: reporting each limb and the trunk separately is worth more than a single whole-body figure, because it lets you see whether a change is real or just hydration shifting.",
      "Raw data export: any scale that lets you export weight, impedance, and body fat to a file beats one that locks your history inside an app.",
      "Consistent units and one decimal: a scale that rounds body fat to whole numbers throws away most of the signal you are paying for.",
      "Profile handling: it must store height and age per user, because the height term feeds the impedance-to-water conversion directly.",
      "Hard floor only: place it on tile or concrete, never on carpet, and never move it between readings.",
      "Ignore: visceral fat scores, metabolic age, and body scores. They are derived from the same estimate with extra layers of assumption on top.",
    ],
  },
  {
    title: "A protocol that makes the readings usable",
    paragraphs: [
      "Most of the disappointment people report with BMI scales is really a protocol problem. The device is consistent enough to track a trend, provided you stop feeding it different conditions every morning. This is the routine we recommend, compiled from the error sources described above.",
      "Pick one time slot and keep it. First thing after waking, after using the bathroom, before any food or drink, is the most repeatable state most people have. Stand still, feet dry and centred on the electrodes, and let the scale finish its full cycle rather than stepping off early.",
    ],
    bullets: [
      "Same time every day, ideally within a half hour window.",
      "After the bathroom, before breakfast, before coffee.",
      "No weighing within four hours of hard training or a sauna, because sweat shifts water.",
      "No weighing the morning after a very salty meal or a long flight.",
      "Hard level floor, scale never moved between readings.",
      "Record the reading, but only make decisions from the seven-day average.",
      "Re-run your height entry once a year; a stale height corrupts both BMI and the impedance conversion.",
    ],
  },
  {
    title: "When a scale is the wrong tool",
    paragraphs: [
      "There are builds and situations where foot-to-foot impedance is simply the wrong instrument. If your legs are heavily muscled, the current path through the lower body is unrepresentative of the whole, and the estimate will drift. If you are pregnant, have an implanted electronic device, or have significant oedema, skip it entirely.",
      "If you need a number for a medical decision, a military body composition assessment, or an athletic weigh-in, use the method the organisation specifies. A consumer scale is a habit-tracking tool, not a compliance instrument.",
    ],
    bullets: [
      "Very muscular legs, or a large lower-body to upper-body difference: prefer tape or a segmental device.",
      "Pregnancy, pacemaker, or implanted electronic device: do not use impedance.",
      "Oedema, kidney or heart conditions affecting fluid: readings will be unreliable.",
      "Under about 18 years old: adult equations and adult hydration assumptions do not apply.",
      "Official or clinical requirement: use the specified method, not a bathroom scale.",
    ],
  },
];

const faqs = [
  {
    question: "Is the BMI number on a smart scale accurate?",
    answer: "Yes, within the quality of its weight sensor. BMI is only weight divided by height squared, and you supply the height. If the scale weighs you correctly on a hard level floor and your stored height is right, the BMI figure is as accurate as any calculator would give you.",
  },
  {
    question: "Why is the body fat number on my scale different from my friend's scale?",
    answer: "Because the body fat figure is not measured, it is estimated. Each manufacturer picks its own equation, its own hydration assumption, and its own electrode layout. Two scales can disagree by several points on the same person in the same minute without either of them malfunctioning.",
  },
  {
    question: "Why does my body fat reading go up when I lose weight?",
    answer: "Usually water. If you lose water faster than fat, the scale reads less fat-free mass and therefore more fat, even though you have lost tissue. This is why a single day's reading is a poor signal and a one to two week average is a much better one.",
  },
  {
    question: "Do I need to spend more to get a more accurate scale?",
    answer: "Not necessarily. Accuracy of the body fat estimate is dominated by hydration, electrode path, and consistency, not by price. Pay for hand-to-foot electrodes, segmental output, data export, and one decimal place. Ignore visceral fat scores and body age numbers, which are derived from the same estimate.",
  },
  {
    question: "How often should I weigh myself on a BMI scale?",
    answer: "Daily is fine if you use it correctly, because daily data is what lets averaging work. Weigh once each morning under the same conditions, then read the seven-day average rather than today's number.",
  },
  {
    question: "Can a BMI scale measure visceral fat?",
    answer: "It cannot. Visceral fat sits inside the abdominal cavity around the organs, and impedance through the feet cannot separate it from subcutaneous fat. Any visceral rating a consumer scale shows is a score derived from the same estimated body fat number, not an additional measurement. A tape measure at the waist is more honest.",
  },
];

export default function Page() {
  return (
    <GuidePage
      eyebrow="SMART SCALE GUIDE"
      title="BMI Scale Accuracy: What a Smart Scale Really Measures"
      lede="A BMI scale gives you two numbers of very different quality. The BMI figure is simple arithmetic on your weight and stored height, so it is trustworthy. The body fat figure comes from bioelectrical impedance, and our computed model shows one kilogram of water shifts it by roughly 1.4 to 2.3 percentage points. Use the weight and BMI; average the body fat over seven days before believing a change."
      canonical={canonical}
      sections={sections}
      faqs={faqs}
      sources={[
        { label: "AI Body Fat Calculator: the BMI method equation and reference ranges", href: "https://aibodyfatcalculator.com/body-fat-calculator" },
        { label: "CDC: About Body Mass Index", href: "https://www.cdc.gov/bmi/about/index.html" },
      ]}
      related={[
        { label: "BMI Calculator", href: "/bmi-calculator" },
        { label: "How to Measure Body Fat at Home", href: "/how-to-measure-body-fat-at-home" },
        { label: "Body Fat Percentage Chart", href: "/body-fat-percentage-chart" },
      ]}
    />
  );
}
