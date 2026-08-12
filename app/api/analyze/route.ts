import { NextResponse } from "next/server";

type Analysis = {
  bodyFatPercentage:number;
  confidenceRange:[number,number];
  bodyFatLevel:"Essential Fat"|"Athletic"|"Fit"|"Average"|"Overweight";
  muscleAssessment:Record<"chest"|"shoulders"|"abs"|"arms"|"back"|"legs",number>;
  actionPlan:{dailyCalories:number;proteinGrams:number;cardioRecommendation:string;strengthRecommendation:string;estimatedWeeksToTarget:number};
  summary:string;
};

const globalRateLimit = globalThis as typeof globalThis & { bodyLensRequests?:Map<string,number[]> };
const requests = globalRateLimit.bodyLensRequests ??= new Map<string,number[]>();

function isValidAnalysis(value:unknown):value is Analysis {
  if (!value || typeof value!=="object") return false;
  const data=value as Partial<Analysis>;
  const levels=["Essential Fat","Athletic","Fit","Average","Overweight"];
  const muscles=data.muscleAssessment;
  const plan=data.actionPlan;
  return typeof data.bodyFatPercentage==="number" && data.bodyFatPercentage>=2 && data.bodyFatPercentage<=70 &&
    Array.isArray(data.confidenceRange) && data.confidenceRange.length===2 && data.confidenceRange.every(n=>typeof n==="number"&&n>=1&&n<=75) && data.confidenceRange[0]<=data.bodyFatPercentage && data.confidenceRange[1]>=data.bodyFatPercentage &&
    levels.includes(data.bodyFatLevel||"") && !!muscles && ["chest","shoulders","abs","arms","back","legs"].every(key=>Number.isInteger(muscles[key as keyof typeof muscles])&&muscles[key as keyof typeof muscles]>=1&&muscles[key as keyof typeof muscles]<=10) &&
    !!plan && Number.isFinite(plan.dailyCalories) && plan.dailyCalories>=800 && plan.dailyCalories<=6000 && Number.isFinite(plan.proteinGrams) && plan.proteinGrams>=20 && plan.proteinGrams<=400 && typeof plan.cardioRecommendation==="string" && typeof plan.strengthRecommendation==="string" && Number.isFinite(plan.estimatedWeeksToTarget) && plan.estimatedWeeksToTarget>=1 && plan.estimatedWeeksToTarget<=104 &&
    typeof data.summary==="string" && data.summary.length>0 && data.summary.length<=500;
}

function isRateLimited(request:Request){
  const ip=request.headers.get("cf-connecting-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
  const now=Date.now(), windowStart=now-24*60*60*1000;
  const recent=(requests.get(ip)||[]).filter(time=>time>windowStart);
  if(recent.length>=10){requests.set(ip,recent);return true}
  recent.push(now);requests.set(ip,recent);
  if(requests.size>5000) for(const [key,times] of requests) if(!times.some(time=>time>windowStart)) requests.delete(key);
  return false;
}

const PROMPT = `You are a professional fitness and body composition analyst
with 15 years of experience. Analyze this full-body photo and return ONLY
valid JSON, no markdown, no explanations.

Use visual cues such as muscle definition, vascularity, and fat distribution.
If the image quality or pose is unclear, widen the confidence range instead of
giving false precision. Never diagnose medical conditions. Always include
actionable fitness advice.

Return this exact structure:
{
  "bodyFatPercentage": number,
  "confidenceRange": [number, number],
  "bodyFatLevel": "Essential Fat" | "Athletic" | "Fit" | "Average" | "Overweight",
  "muscleAssessment": {
    "chest": number,
    "shoulders": number,
    "abs": number,
    "arms": number,
    "back": number,
    "legs": number
  },
  "actionPlan": {
    "dailyCalories": number,
    "proteinGrams": number,
    "cardioRecommendation": string,
    "strengthRecommendation": string,
    "estimatedWeeksToTarget": number
  },
  "summary": "one encouraging sentence"
}

Every muscle score must be an integer from 1 to 10.`;

export async function POST(request: Request) {
  try {
    if(isRateLimited(request)) return NextResponse.json({error:"Daily request limit reached. Please try again tomorrow."},{status:429});
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "The AI service is not configured yet. Add OPENAI_API_KEY to the server environment." },
        { status: 503 },
      );
    }

    const form = await request.formData();
    const photo = form.get("photo");
    const sex = form.get("sex");

    if (!(photo instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a full-body photo of a person" },
        { status: 400 },
      );
    }

    if (!/^image\/(jpeg|png|webp)$/.test(photo.type) || photo.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Please upload a JPG, PNG or WebP photo under 10MB" },
        { status: 400 },
      );
    }

    const base64Image = Buffer.from(await photo.arrayBuffer()).toString("base64");
    const profileContext =
      sex === "male" || sex === "female"
        ? `\nThe user selected ${sex} as the reference profile.`
        : "\nThe user skipped sex selection; do not infer it.";

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Return only valid JSON. Never provide a medical diagnosis." },
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT + profileContext },
              { type: "image_url", image_url: { url: `data:${photo.type};base64,${base64Image}`, detail: "low" } },
            ],
          },
        ],
      }),
    });

    if (openAIResponse.status === 429) {
      return NextResponse.json(
        { error: "Demand is high right now. Please wait about 30 seconds and try again." },
        { status: 429 },
      );
    }
    if (!openAIResponse.ok) throw new Error(`OpenAI request failed: ${openAIResponse.status}`);
    const payload = await openAIResponse.json() as {choices?:Array<{message?:{content?:string}}>};
    const responseText = payload.choices?.[0]?.message?.content;
    if (!responseText) throw new Error("Missing OpenAI response");
    const data:unknown=JSON.parse(responseText);
    if(!isValidAnalysis(data)) throw new Error("Invalid analysis response");
    return NextResponse.json(data,{headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/429|quota|rate.?limit/i.test(message)) {
      return NextResponse.json(
        { error: "Demand is high right now. Please wait about 30 seconds and try again." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "Please try again with a clearer photo" },
      { status: 500 },
    );
  }
}
