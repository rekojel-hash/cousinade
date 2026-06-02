# 🌻 Cousinade App — PWA

Application web progressive pour organiser votre cousinade en famille.

## 📁 Structure des fichiers

```
cousinade-pwa/
├── index.html        ← Page principale
├── app.js            ← Logique de l'application
├── style.css         ← Styles
├── sw.js             ← Service Worker (mode offline)
├── manifest.json     ← Config PWA (installable sur mobile)
├── icons/
│   ├── icon-192.png  ← Icône mobile
│   └── icon-512.png  ← Icône splash
└── README.md
```

---

## 🚀 Déploiement sur GitHub Pages

### Étape 1 — Créer le dépôt GitHub

1. Va sur [github.com](https://github.com) → **New repository**
2. Nom : `cousinade` (ou `cousinade2027`)
3. Visibilité : **Public** (requis pour GitHub Pages gratuit)
4. Clique **Create repository**

### Étape 2 — Uploader les fichiers

**Option A — Via l'interface web (plus simple) :**
1. Dans ton dépôt → **Add file** → **Upload files**
2. Glisse tous les fichiers du dossier `cousinade-pwa/`
3. N'oublie pas le dossier `icons/` avec les deux PNG
4. Commit → **Commit changes**

**Option B — Via Git :**
```bash
git init
git add .
git commit -m "🌻 Cousinade app v1"
git remote add origin https://github.com/TON_USERNAME/cousinade.git
git push -u origin main
```

### Étape 3 — Activer GitHub Pages

1. Dans ton dépôt → **Settings** → **Pages**
2. Source : **Deploy from a branch**
3. Branch : `main` → `/root`
4. **Save**
5. Attends 2 minutes → ton URL sera : `https://TON_USERNAME.github.io/cousinade`

---

## 🔥 Configuration Firebase (synchronisation multi-appareils)

Sans Firebase, l'app fonctionne mais les données restent locales à chaque appareil.  
Avec Firebase, toutes les modifications sont synchronisées en temps réel sur tous les mobiles.

### Créer le projet Firebase (gratuit)

1. Va sur [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → nom : `cousinade2027` → Continue
3. Désactive Google Analytics si demandé → **Create project**

### Ajouter une app Web

1. Dans ton projet → icône **</>** (Web)
2. App nickname : `cousinade-pwa` → **Register app**
3. Copie l'objet `firebaseConfig` qui ressemble à :
```json
{
  "apiKey": "AIza...",
  "authDomain": "cousinade2027.firebaseapp.com",
  "projectId": "cousinade2027",
  "storageBucket": "cousinade2027.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc123"
}
```

### Activer Firestore

1. Dans Firebase → **Firestore Database** → **Create database**
2. Choisis **Start in test mode** (données publiques pendant 30 jours)
3. Sélectionne une région proche (ex: `europe-west3`) → **Done**

> ⚠️ Après 30 jours, configure les règles de sécurité ou repasse en test mode.

### Première connexion

Au premier lancement de l'app, un écran de configuration apparaît.  
Colle ton `firebaseConfig` JSON et clique **Connecter Firebase**.

---

## 🔐 Codes d'accès

| Code | Rôle | Accès |
|------|------|-------|
| `cousi2027` | **Admin** | Lecture + écriture sur tous les modules |
| `famille2027` | **Famille** | Lecture seule (annonces, programme, participants) |

> Pour changer les codes, modifie les lignes en haut de `app.js` :
> ```js
> const ADMIN_CODE = "cousi2027";
> const VISITOR_CODE = "famille2027";
> ```

---

## 📱 Installer sur mobile

Une fois l'URL ouverte dans le navigateur :

- **iPhone/iPad** : Safari → bouton Partager → **Sur l'écran d'accueil**
- **Android** : Chrome → menu ⋮ → **Installer l'application**

L'app s'ouvre alors comme une vraie application, sans barre d'adresse.

---

## 🔄 Nouvelle édition

1. Exporte un backup JSON depuis **Réglages → Backup**
2. L'année suivante, importe ce backup
3. Change la date et le nom de l'édition dans **Réglages**
4. Remets les tâches à zéro si besoin

---

## 🛠️ Personnalisation

Pour modifier les codes d'accès par défaut ou les données de démarrage,  
édite les constantes en haut du fichier `app.js`.
