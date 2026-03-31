# WhenWeGo 🗓✈️

Planifiez un voyage de groupe — chaque ami indique ses dispo sur un vrai calendrier, l'algo trouve la meilleure fenêtre commune.

---

## Déploiement en 15 minutes

### 1. Supabase (base de données) — ~5 min

1. Créer un compte gratuit sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet (choisir une région proche de vous)
3. Aller dans **SQL Editor** et coller le contenu de `supabase/schema.sql`, puis cliquer **Run**
4. Activer le **Realtime** sur la table `responses` :
   - Database → Replication → cocher `responses`
5. Récupérer vos clés dans **Settings → API** :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (**ne jamais exposer publiquement**)

### 2. Variables d'environnement

Copier `.env.local.example` en `.env.local` et remplir :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_JWT_SECRET=une-chaine-aleatoire-de-32-caracteres-minimum
```

> 💡 Générer un JWT secret : `openssl rand -base64 32`

### 3. Tester en local

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 4. Déployer sur Vercel — ~3 min

1. Push le code sur GitHub
2. Aller sur [vercel.com](https://vercel.com) → **New Project** → importer le repo
3. Dans **Environment Variables**, ajouter les 5 variables ci-dessus
4. Cliquer **Deploy**

C'est en ligne ! Partagez le lien `/form/VOTRESCODE` à vos amis.

---

## Architecture de sécurité

| Variable | Préfixe | Visible browser ? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ NEXT_PUBLIC_ | Oui (anon key, safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ NEXT_PUBLIC_ | Oui (RLS protège la DB) |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ pas NEXT_PUBLIC_ | **Non — server only** |
| `ANTHROPIC_API_KEY` | ❌ pas NEXT_PUBLIC_ | **Non — server only** |
| `ADMIN_JWT_SECRET` | ❌ pas NEXT_PUBLIC_ | **Non — server only** |

---

## Stack technique

- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL + Realtime)
- **Vercel** (hosting)
- **bcryptjs** (hash mot de passe admin)
- **jose** (JWT admin)
