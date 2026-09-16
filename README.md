# Sociedad 50/50 — Supabase
Versión preparada para GitHub + Vercel + Supabase.

1. Crea un proyecto Supabase independiente.
2. Ejecuta `supabase/migrations/001_initial_schema.sql` como migración.
3. Copia `.env.example` a `.env.local`.
4. Agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. `npm install` y `npm run dev`.

La migración crea y precarga las deudas, inversión, socios y regla de participación. Los pagos ya no usan localStorage: se guardan en PostgreSQL/Supabase.
