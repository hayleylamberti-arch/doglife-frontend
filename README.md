# DogLife Frontend

A React/TypeScript frontend for the DogLife dog services platform, built with Vite and deployed on Vercel.

## Prerequisites

- Node.js 18+ and npm
- Git
- Vercel account (free tier works)

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` from the example:
   ```bash
   cp .env.example .env.local
   ```

3. Update `.env.local` with your values:
   ```
   VITE_API_BASE=http://localhost:5000
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## Deploy to Vercel

### Option 1: Via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

### Option 2: Via GitHub Integration

1. Push this project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/doglife-frontend.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and import the repository

3. Configure environment variables in Vercel dashboard:
   - `VITE_API_BASE` = Your Render backend URL (e.g., `https://doglife-api.onrender.com`)
   - `VITE_GOOGLE_MAPS_API_KEY` = Your Google Maps API key

4. Deploy

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE` | Yes (production) | Backend API URL (e.g., `https://doglife-api.onrender.com`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | Google Maps API key for address autocomplete |

## API Base URL Logic

The frontend automatically determines the API base URL:

1. **Production**: Uses `VITE_API_BASE` environment variable
2. **Replit**: Auto-detects and uses current origin
3. **Local fallback**: Defaults to `http://localhost:5000`

## Project Structure

```
doglife-frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and API client
│   ├── types/          # TypeScript type definitions
│   └── assets/         # Static assets
├── public/             # Public static files
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tailwind.config.ts  # Tailwind CSS configuration
└── vercel.json         # Vercel deployment config
```

## Backend Configuration

Your backend (deployed on Render) needs to allow CORS from your Vercel domain.

Set the `CORS_ORIGINS` environment variable on Render:
```
CORS_ORIGINS=https://doglife-frontend.vercel.app,https://your-custom-domain.com
```

Use `*` to allow all origins (not recommended for production).
