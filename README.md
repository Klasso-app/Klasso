# Klasso

Logiciel de gestion scolaire multi-établissement (maternelle à la terminale),
pensé pour l'Afrique de l'Ouest francophone.

## Stack technique

- **Frontend** : React + Vite
- **Style** : Tailwind CSS v4 (thème de marque défini dans `src/index.css`)
- **Backend / base de données** : Firebase (Auth + Firestore + Storage)
- **Typographies** : Sora (titres), Inter (corps de texte)

## Démarrer en local

```bash
npm install
npm run dev
```

L'application est disponible sur http://localhost:5173

## Construire pour la production

```bash
npm run build
```

Le dossier `dist/` généré peut être déployé sur Render, Firebase Hosting,
Vercel, ou tout hébergeur de sites statiques.

## Structure du projet

```
src/
  components/
    icons/        Icônes maison (aucune librairie externe)
    landing/       Sections de la landing page
    ui/            Composants réutilisables (logo, loader...)
  lib/
    firebase.js    Initialisation Firebase (Auth, Firestore, Storage)
  pages/
    LandingPage.jsx
  index.css         Thème de marque (couleurs, typographies)
  App.jsx
```

## Charte de design (à respecter dans tout le projet)

- Couleurs : indigo `#3B4FE0` (primaire), terracotta `#C6703B` (accent),
  marine `#1F2E4D` (fond foncé), pas de couleurs néon/pastel/arc-en-ciel.
- Pas d'emoji.
- Pas d'icônes Lucide — utiliser `src/components/icons`.
- Pas d'effets `hover`.
- Pas de `drop-shadow` — utiliser des bordures (`border-line`).
- Pas de fenêtres de terminal dans les visuels.

## Modèle de données Firestore (multi-établissement)

Chaque établissement est un document dans la collection `schools`.
Toutes ses données vivent dans des sous-collections, pour garantir qu'un
établissement ne voit jamais les données d'un autre :

```
schools/{schoolId}
  ├─ students/{studentId}
  ├─ teachers/{teacherId}
  ├─ classes/{classId}
  ├─ grades/{gradeId}
  └─ staff/{userId}          (rôles : directeur, secrétaire, enseignant)
```

Les comptes parents sont liés à un ou plusieurs `studentId` via un champ
`parentOf` sur leur profil utilisateur.
