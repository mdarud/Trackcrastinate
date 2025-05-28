# Trackcrastinate Dashboard (Next.js)

A modern, Severance-inspired productivity dashboard built with Next.js, TypeScript, and Supabase.

## Features

- **Severance-Inspired Design**: Clean, corporate aesthetic with IBM Plex fonts
- **Real-time Analytics**: Track time spent on unproductive websites
- **Wellness Assessment**: Comprehensive productivity metrics and recommendations
- **Interactive Charts**: Visual category breakdown with Chart.js
- **Roast Generator**: Humorous productivity feedback
- **Report Generation**: Download detailed HTML reports
- **Authentication**: Secure user authentication with Supabase
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Severance-inspired design system
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Environment Setup

1. Copy the environment file:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
dashboard-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main dashboard page
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page (redirects to dashboard)
│   ├── components/
│   │   └── dashboard/         # Dashboard components
│   │       ├── DashboardContent.tsx
│   │       ├── DashboardHeader.tsx
│   │       ├── DailyStats.tsx
│   │       ├── TopSites.tsx
│   │       ├── CategoryBreakdown.tsx
│   │       ├── RoastGenerator.tsx
│   │       └── WellnessAssessment.tsx
│   ├── lib/
│   │   ├── supabase/          # Supabase configuration
│   │   │   ├── client.ts      # Client-side Supabase
│   │   │   ├── server.ts      # Server-side Supabase
│   │   │   └── database.ts    # Database operations
│   │   └── utils.ts           # Utility functions
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   └── middleware.ts          # Authentication middleware
├── public/                    # Static assets
├── .env.local                 # Environment variables
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## Key Components

### DashboardContent
Main dashboard container that orchestrates data loading and component rendering.

### DailyStats
Displays daily productivity statistics including total time, first/last deviations, and deviation count.

### TopSites
Shows the most time-consuming websites with visual indicators and category badges.

### CategoryBreakdown
Interactive doughnut chart showing time distribution across website categories.

### RoastGenerator
Displays humorous productivity feedback messages in Severance style.

### WellnessAssessment
Comprehensive productivity metrics with downloadable HTML reports.

## Database Schema

The dashboard expects the following Supabase tables:

- `time_entries`: Individual time tracking records
- `daily_summaries`: Aggregated daily data
- `user_settings`: User preferences and configuration

Refer to `supabase-schema.sql` in the project root for the complete schema.

## Styling

The dashboard uses a custom design system inspired by the TV show "Severance":

- **Colors**: Teal primary (#4A9D7C), dark teal (#1A535C), red accent (#E63946)
- **Typography**: IBM Plex Sans and IBM Plex Mono fonts
- **Layout**: Clean, corporate aesthetic with subtle gradients and borders

## Authentication

- Email/password authentication
- Google OAuth integration
- Protected routes with middleware
- Automatic redirects for unauthenticated users

## Data Flow

1. Extension tracks website usage and sends data to Supabase
2. Dashboard fetches user data on load
3. Components display real-time analytics and insights
4. Users can download detailed reports

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Code Style

- TypeScript for type safety
- ESLint and Prettier for code formatting
- Functional components with hooks
- Server and client components separation

## Deployment

The dashboard can be deployed to any platform that supports Next.js:

- **Vercel** (recommended)
- **Netlify**
- **Railway**
- **Self-hosted**

Make sure to set the environment variables in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the Trackcrastinate productivity suite.
