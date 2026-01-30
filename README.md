# Cricket Auction Pro

Real-time global cricket auction management system with live bidding, squad management, and team synchronization.

## Features

- **Live Auction System**: Real-time player bidding with dynamic pricing
- **Multi-Team Management**: Support for multiple teams with budget tracking
- **Role-Based Players**: Batsman, Bowler, All-rounder, and Wicketkeeper roles
- **Squad Gallery**: View and manage player portfolios
- **Global Feed Sync**: Host broadcasting and viewer polling for live updates
- **Responsive UI**: Beautiful dark-themed interface with smooth animations

## Prerequisites

- Node.js (v16+)
- Supabase account (for backend)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Supabase in [.env.local](.env.local):
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Roles

- **Host**: Full control over auction, bidding, and configuration
- **Viewer**: Watch-only access to live auction feed

## Technology Stack

- React 19
- TypeScript
- Vite
- Framer Motion
- Lucide React Icons
- Supabase
- Tailwind CSS

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions on Vercel or Netlify.
