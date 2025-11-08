# VELOCITYAI

VelocityAI is a cutting-edge Next.js application designed to demonstrate the power of AI-driven tools in optimizing workflows, saving time, and generating measurable value. This project showcases interactive components, guided tours, and analytics integration to provide a seamless user experience.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) - React-based framework for server-side rendering and static site generation.
- **Language**: TypeScript - Ensures type safety and developer productivity.
- **Styling**: CSS - Custom styles defined in `app/globals.css`.
- **Analytics**: [Vercel Analytics](https://vercel.com/analytics) - Tracks page views and user interactions.
- **Node.js**: Version 18+ - Required runtime environment.
- **ESLint**: For code linting and maintaining code quality.
- **TailwindCSS**: Utility-first CSS framework for rapid UI development.

## Features

1. **Interactive Gantt Chart**:
   - Visualize tasks, dependencies, and timelines.
   - Allocate resources dynamically and track progress.
   - Critical path highlighting for better project management.

2. **Guided Tour**:
   - Step-by-step walkthrough of the app's features.
   - Highlights key components and their functionality.

3. **AI-Driven Insights**:
   - Simulate AI tools like RPA and AI Agents to free up capacity.
   - Calculate operational value, cost avoidance, and strategic growth.

4. **Analytics Integration**:
   - Tracks user interactions and page views using Vercel Analytics.

5. **Responsive Design**:
   - Optimized for various screen sizes and devices.

## Project Structure

```
velocityai-demo/
├── app/
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout with metadata and fonts
│   ├── page.tsx          # Main page with Gantt chart and guided tour
├── components/
│   ├── Gantt.tsx         # Gantt chart component
│   ├── Tour.tsx          # Guided tour component
│   ├── VercelAnalytics.tsx # Vercel Analytics integration
├── types/
│   ├── vercel-analytics.d.ts # Type declarations for analytics
├── public/               # Static assets
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vercel.json           # Vercel deployment configuration
```

## How It Works

1. **Task Management**:
   - Tasks are displayed in a Gantt chart with dependencies and timelines.
   - Users can allocate resources to tasks and mark them as complete.

2. **AI Simulation**:
   - Simulates the impact of AI tools on workflow efficiency.
   - Calculates time saved and translates it into monetary value.

3. **Guided Demo**:
   - Users can run a 30-second demo to see the app in action.
   - Highlights key features and their benefits.

4. **Analytics**:
   - Tracks user interactions to provide insights into app usage.

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or pnpm, yarn, bun).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lavansh1306/velocityai.git
   cd velocityai-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the app.

### Scripts

- `dev`: Start the development server.
- `build`: Create a production build.
- `start`: Run the production server locally.
- `lint`: Run ESLint to check for code quality.

## Deployment

### Vercel

1. Push your repository to GitHub.
2. Import the repository into Vercel.
3. Use the following settings:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Click Deploy.

### CLI Deployment

```bash
npm i -g vercel
vercel login
vercel
```

Subsequent deploys:
```bash
vercel --prod
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

Crafted with ❤️ by the VelocityAI team.
