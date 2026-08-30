# AI Body Fat Calculator

AI Body Fat Calculator powers [aibodyfatcalculator.com](https://aibodyfatcalculator.com/): a privacy-conscious AI body-fat photo estimator and early physique progress tracker built with Next.js.

## Product shape

- Free photo-based directional body-fat estimate
- Six-group muscle assessment and practical next-step guidance
- Optional numeric baseline stored only in the visitor's browser
- Dedicated Army WHtR, FFMI, TDEE, BMI, PSMF, and body-fat reference tools
- Progress-tracker interest test for guided repeat scans and photo comparisons

AI Body Fat Calculator is an educational fitness tool, not a medical device.

## Local setup

Requirements:

- Node.js 22.x
- A DashScope-compatible vision model API key

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

```text
DASHSCOPE_API_KEY=
DASHSCOPE_BASE_URL=
DASHSCOPE_MODEL=qwen3-vl-flash
```

The production privacy policy must match the processing region and retention controls configured for the selected AI service.

## Quality checks

```bash
npm run lint
npm run build
npm test
```

`npm test` builds the production app and verifies important routes, SEO metadata, structured data, and the current Army WHtR calculation.

## Important implementation notes

- Uploaded photos are sent directly to the configured DashScope-compatible endpoint for analysis. The application does not persist them in its own database.
- The optional baseline feature stores numeric results and a date in `localStorage`; it does not store the uploaded photo.
- Page metadata is generated through `app/site-metadata.ts` so every indexable route has its own canonical, Open Graph, and Twitter metadata.
- The root `app/opengraph-image.tsx` generates the social sharing image at build time.
