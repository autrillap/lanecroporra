# La Necroporra: El juego del destino 💀

The most controversial annual challenge. Do you have what it takes to predict the future?

**La Necroporra** is a social and technological experiment based on a popular internet tradition (sometimes known as a "death pool"). Create your list of celebrities before December 31st and compete with your friends. The platform automatically detects passings using the Wikidata API.

> [!WARNING]
> **Legal & Ethical Notice**  
> This project is a social and technological experiment based on an internet tradition. It does not intend to wish harm or show disrespect. All content is generated automatically through public data.

## 📖 About the Game

### Annual Tradition
Every December 31st, groups of friends across Spain lock in their lists. It's the "Draft" of real life. Once the group is activated, the lists are locked for the year.
- **Private lists until the deadline:** Keep your picks secret until the game starts.
- **Age-based point system:** Points are calculated based on the age of the celebrity.

### How to Participate
1. **Create your custom group**: Start a new league for the year.
2. **Invite your friends**: Share the magic link to let them easily join your group.
3. **Search for celebrities**: Use our built-in Wikidata search engine to build your roster.
4. **Relax**: We monitor the news and update statuses automatically.

---

## 🛠️ Tech Stack & Features

A modern web application built with [Next.js](https://nextjs.org), utilizing a [Supabase](https://supabase.com) backend for secure database management, authentication, and real-time capabilities.

- **Next.js App Router**: Leveraging the latest React features and server-side rendering.
- **Supabase Integration**: Robust PostgreSQL database with Row Level Security (RLS) and authentication.
- **Tailwind CSS**: Utility-first styling for beautiful and responsive UI design.
- **Wikidata API Integration**: Automated celebrity tracking and status updates.
- **TypeScript**: End-to-end type safety.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun
- A Supabase project (local or cloud)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd lanecroporra
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up your environment variables. Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application in action.

## 🗄️ Database Configuration

This project uses Supabase migrations located in the `supabase/migrations` folder to structure the database (e.g., users, groups, review records). Make sure to apply these migrations to your Supabase instance to ensure the application functions correctly.

## 🤝 Credits & Acknowledgements

This project is a fork of [La Necroporra](https://github.com/PabloRius/lanecroporra) created by [PabloRius](https://github.com/PabloRius). 

Special thanks to the original author for the foundational work and core concepts of this application.

