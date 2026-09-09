This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:
Maison douce
```
Première étape de l'application de gestion familiale : un dashboard responsive, pensé mobile-first, pour suivre la journée de la nounou, les heures du mois et les tâches à venir.

## Lancer le projet
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
```bash
 npm install
 npm run dev
```

Ouvrir ensuite [http://localhost:3000](http://localhost:3000).
You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
Les commandes de vérification disponibles sont :

```bash
 npm run lint
 npm run build
```
This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
## État actuel

- Next.js 16 avec App Router, React 19 et TypeScript strict
- Tailwind CSS 4 via PostCSS
- Lucide React pour les icônes
- Dashboard desktop et mobile avec navigation adaptée
- Données de démonstration isolées dans `lib/demo/dashboard.ts`
## Learn More
Les données sont temporairement locales pour cette première étape. La suite configurera Prisma, PostgreSQL, l'authentification et les validations serveur avant de brancher les écrans métier sur la base de données.

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
