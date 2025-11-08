This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## What’s inside

- App Router (`app/`)
- Interactive demo components: `components/Gantt.tsx` and `components/Tour.tsx`
- Styling in `app/globals.css` (no Tailwind required)

## Prerequisites

- Node.js 18+ and npm (or pnpm, yarn, bun)

If npm isn’t installed on your system, install it from nodejs.org or use your OS package manager. On Linux, you can install Node with nvm:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
. "$HOME/.nvm/nvm.sh"
nvm install --lts
nvm use --lts
```

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file. The Gantt view and guided tour are interactive; try the “Start guided demo” and “Run 30‑sec demo” buttons.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

There is a minimal `vercel.json` checked in to ensure correct defaults.

### One‑click (recommended)

1. Push your repo to GitHub.
2. Go to https://vercel.com/new and import the repository.
3. Framework: Next.js. Build command: `npm run build`. Output: `.next` (defaults are fine).
4. Click Deploy.

### From the CLI

```bash
npm i -g vercel
vercel login
vercel
```

Subsequent deploys: `vercel --prod`.

### Troubleshooting

- If the build fails due to Node/npm not found locally, use `nvm` (see above) or build directly on Vercel.
- If ESLint or TypeScript errors appear, run `npm run build` locally to see the exact messages and report them as issues.

## Scripts

- `dev` – start the dev server
- `build` – production build
- `start` – run the production server locally
- `lint` – run ESLint
