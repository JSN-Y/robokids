# RoboKids — Guide d'installation locale (Git Bash + Supabase)

## Prérequis

| Outil | Version minimale | Lien |
|-------|-----------------|------|
| Node.js | 20.x ou 24.x | https://nodejs.org |
| pnpm | 10.x | `npm install -g pnpm` |
| Git Bash | intégré Git for Windows | https://git-scm.com |
| PostgreSQL (local) **OU** compte Supabase | — | https://supabase.com |

---

## Option A – Base de données Supabase (recommandée)

### 1. Créer un projet Supabase

1. Va sur https://supabase.com et crée un compte gratuit.
2. Clique **New project**, choisis une région, définis un mot de passe fort.
3. Dans **Settings → Database**, copie la chaîne de connexion **Connection pooling (port 6543)** :
   ```
   postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
   ```

### 2. Cloner le dépôt

```bash
git clone https://github.com/TON_USER/robokids.git
cd robokids
```

### 3. Variables d'environnement

Crée un fichier `.env` à la racine du monorepo :

```bash
# .env (ne jamais committer ce fichier !)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
SESSION_SECRET=change_me_super_secret_32chars
```

> **Git Bash** : utilise `export DATABASE_URL="..."` si tu travailles dans le shell directement.

### 4. Installer les dépendances

```bash
pnpm install
```

### 5. Pousser le schéma de base de données

```bash
pnpm --filter @workspace/db run push
```

Cette commande lit `lib/db/src/schema/index.ts` et crée toutes les tables (users, chapters, levels, attempts, shop_items, inventory).

---

## Option B – PostgreSQL local

### 1. Créer la base de données

```bash
# Dans psql ou pgAdmin
CREATE DATABASE robokids;
```

### 2. Variables d'environnement

```bash
# .env
DATABASE_URL=postgresql://postgres:monpassword@localhost:5432/robokids
SESSION_SECRET=change_me_super_secret_32chars
```

### 3. Installer + pousser le schéma

```bash
pnpm install
pnpm --filter @workspace/db run push
```

---

## Seeder la base de données (comptes + 60 niveaux)

Exécute le script de seed SQL (ou copie-colle dans Supabase > SQL Editor) :

```sql
-- Voir le fichier scripts/seed.sql pour le script complet
```

Le script crée :
- **6 chapitres × 10 niveaux** (60 niveaux progressifs)
- **22 articles** dans la boutique (skins, mascottes, boosts, armes)
- **5 comptes** de test :

| Identifiant | Mot de passe | Rôle    | Catégorie | Pièces  |
|-------------|-------------|---------|-----------|---------|
| `admin`     | `admin`     | admin   | —         | 99 999  |
| `cat1`      | `password1` | student | 1 (CP–CE2)| 50      |
| `cat2`      | `password2` | student | 2 (CM1–6e)| 50      |
| `cat3`      | `password3` | student | 3 (5e–3e) | 50      |
| `test`      | `test`      | student | 1         | 999 999 |

---

## Lancer le projet en développement

Ouvre **deux terminaux Git Bash** dans le dossier du projet :

```bash
# Terminal 1 – API backend (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 – Frontend React (port 25651)
PORT=25651 BASE_PATH=/ pnpm --filter @workspace/robokids run dev
```

Ouvre ton navigateur sur : **http://localhost:25651**

---

## Architecture du projet

```
robokids/
├── artifacts/
│   ├── api-server/          # Express 5 + Drizzle ORM
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── auth.ts        # POST /api/auth/login, logout
│   │       │   ├── user.ts        # GET /api/me, /me/progress, /me/inventory
│   │       │   ├── chapters.ts    # GET /api/chapters, /levels/:id, POST /attempts
│   │       │   ├── shop.ts        # GET /api/shop/items, POST /shop/purchase
│   │       │   ├── leaderboard.ts # GET /api/leaderboard
│   │       │   └── admin.ts       # CRUD admin /api/admin/...
│   └── robokids/            # React + Vite frontend
│       └── src/
│           ├── pages/
│           │   ├── login.tsx
│           │   ├── student/       # dashboard, chapters, play, shop, leaderboard
│           │   └── admin/         # stats, students, student-detail, student-form
│           └── components/
│               ├── arena.tsx      # Grille de jeu
│               ├── drag-blocks.tsx# Éditeur Scratch-like
│               └── mascots.tsx    # Personnages SVG animés
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 spec (source de vérité)
│   ├── api-client-react/    # Hooks React Query générés (Orval)
│   ├── api-zod/             # Schémas Zod générés (validation serveur)
│   └── db/                  # Drizzle ORM (schéma + client PostgreSQL)
└── .env                     # Variables d'environnement (ne pas committer)
```

---

## Commandes utiles

```bash
# Regénérer les hooks API après modification de openapi.yaml
pnpm --filter @workspace/api-spec run codegen

# Vérification TypeScript complète
pnpm run typecheck

# Pousser les changements de schéma DB
pnpm --filter @workspace/db run push

# Construire pour la production
pnpm run build
```

---

## Mécaniques de jeu

### Commandes disponibles

| Bloc | Python | Action |
|------|--------|--------|
| ➡️ Avancer | `robot.drive(forward=N)` | Déplace N cases à droite |
| ⬅️ Reculer | `robot.drive(backward=N)` | Déplace N cases à gauche |
| ⬆️ Monter | `robot.drive(up=N)` | Déplace N cases en haut |
| ⬇️ Descendre | `robot.drive(down=N)` | Déplace N cases en bas |
| ⚔️ Attaquer | `robot.attack()` | Attaque un ennemi adjacent |

### Progression des ennemis

| Chapitre | Type d'ennemis | Comportement |
|----------|----------------|-------------|
| 1–2 | Aucun | Obstacles (murs) uniquement |
| 3 | Monstres (M) | Immobiles — peut attaquer ou contourner |
| 4 | Monstres (M) | Immobiles — bloquent le chemin (attaque obligatoire) |
| 5 | Monstres (M) | **Se déplacent** vers toi après chaque mouvement |
| 6 | Boss (B) | **Se déplacent** + plus résistants |

### Système de récompenses

- ✅ Victoire : +`coinReward` pièces (10–200 selon le niveau)
- ❌ Défaite : -1 cœur
- 🪙 Pièces : utilisables dans la boutique (skins, mascottes, boosts)
