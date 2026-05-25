# Migration vers GitHub Pages

Votre portfolio était configuré pour fonctionner avec un **serveur Node.js Express** en local. Pour GitHub Pages, nous avons créé une **solution 100% statique** avec stockage côté client.

---

## 🔄 Avant vs Après

### Avant (Serveur Express)
```
┌─────────────────────┐
│   GitHub Pages      │
│  (site statique)    │
└─────────────────────┘
          ↓
┌─────────────────────┐
│   Serveur Node.js   │ ← Impossible sur GitHub Pages
│   (server.js)       │
│   - Commits GitHub  │
│   - Sauvegarde      │
└─────────────────────┘
```
❌ Ne fonctionne pas sur GitHub Pages

---

### Après (Stockage Client)
```
┌──────────────────────────────┐
│     GitHub Pages             │
│  ✓ HTML/CSS/JS statique      │
│  ✓ IndexedDB (client)        │
│  ✓ LocalStorage (client)     │
└──────────────────────────────┘
          ↓
┌─────────────────────────────────┐
│    Trois Options de Sync        │
├─────────────────────────────────┤
│ 1. GitHub API (token)           │ ← Git commits
│ 2. Supabase (cloud)             │ ← Real-time sync
│ 3. Export/Import (manuel)       │ ← Portable
└─────────────────────────────────┘
```
✅ Fonctionne sur GitHub Pages

---

## 📋 Étapes de Migration

### Étape 1: Arrêter le Serveur Express
```powershell
# Sur votre machine locale
Ctrl+C  # Arrêtez le serveur Node.js
```

Vous pouvez supprimer ou archiver:
- ❌ `server.js` (ne sert plus)
- ❌ `package.json` (package-lock.json aussi)
- ❌ `node_modules/` (si vous aviez)

**Gardez**: 
- ✅ `index.html`
- ✅ `rose_portfolio.css`
- ✅ `rose_portfolio.js`
- ✅ `database.js` (nouveau!)

---

### Étape 2: Vérifier les Nouveaux Fichiers
```
Portfolio/
├── index.html                 ✓ (mis à jour)
├── rose_portfolio.css
├── rose_portfolio.js          ✓ (mis à jour)
├── database.js                ✓ (NOUVEAU)
├── DATABASE-GUIDE.md          ✓ (NOUVEAU - documentation)
├── images/
│   └── image-library.json
└── (OPTIONNEL) server.js      ✗ Peut être supprimé
```

---

### Étape 3: Tester Localement

#### Option A: Serveur Web Simple (Recommandé)
```powershell
# Python 3.x
python -m http.server 8000

# Node.js (si installé)
npx http-server

# Puis allez à: http://localhost:8000
```

#### Option B: VS Code Live Server
1. Extension: **Live Server** (Ritwick Dey)
2. Clic droit `index.html` → **Open with Live Server**

#### Option C: Ouvrir directement
⚠️ Fichier local ne supporte **pas IndexedDB** en tant que `file://`

---

### Étape 4: Tester l'Admin Panel
1. Ouvrez l'URL: `http://localhost:8000#admin`
2. Mot de passe: `0000`
3. Vérifiez que l'onglet **💾 BDD** s'affiche
4. Testez **⬇ Télécharger (JSON)**

---

### Étape 5: Configurer Votre Stratégie

Choisissez parmi les 3 options:

#### A) GitHub (Recommandé pour vous)
```
1. Créez Personal Access Token sur GitHub
2. Configurez dans Admin → 💾 BDD
3. Utilisez "↑ Envoyer à GitHub" après changements
4. Fichier portfolio-data.json créé dans le repo
```

#### B) Supabase (Multi-appareils)
```
1. Créez compte https://supabase.com
2. Créez table portfolio_state
3. Configurez dans Admin → 💾 BDD
4. Sync automatique entre appareils
```

#### C) Export/Import (Simple)
```
1. Téléchargez régulièrement depuis Admin
2. Sauvegardez sur Dropbox/Drive
3. Chargez quand besoin de restaurer
```

Voir [DATABASE-GUIDE.md](./DATABASE-GUIDE.md) pour détails complets.

---

## 🚀 Déploiement GitHub Pages

### Cas 1: Dépôt Existant `Rosetiplouf/Portfolio`

```bash
# 1. Naviguez dans le dossier
cd c:\Users\Rose\Downloads\Portfolio

# 2. Initialisez le repo (si pas déjà fait)
git init

# 3. Ajoutez le remote GitHub
git remote add origin https://github.com/Rosetiplouf/Portfolio.git

# 4. Commitez tous les fichiers
git add .
git commit -m "Migrate to client-side database (GitHub Pages compatible)"

# 5. Poussez vers main
git push -u origin main

# 6. Configurez GitHub Pages
# Sur GitHub → Settings → Pages
# ✓ Source: Deploy from branch
# ✓ Branch: main, /root
# ✓ Cliquez Save
```

### Cas 2: Nouveau Dépôt

```bash
# Même procédure qu'au Cas 1
git init
git remote add origin https://github.com/USERNAME/Portfolio.git
git add .
git commit -m "Initial commit - portfolio with database"
git push -u origin main

# Configurez Pages comme au Cas 1
```

---

## ✅ Après Déploiement

### Vérifications

1. **Le site charge**: https://rosetiplouf.github.io/Portfolio
2. **L'admin fonctionne**: Ajoutez `#admin` à l'URL
3. **Stockage local**: Admin → 💾 BDD → Essayez d'exporter
4. **Synchronisation**: Configurez GitHub/Supabase si choisi

### Si Sync GitHub Est Activée
- Chaque "Envoyer à GitHub" crée un **commit**
- Le fichier `portfolio-data.json` s'affiche dans votre repo
- Vous pouvez voir l'historique des versions ✓

---

## ⚠️ Différences Importantes

### Avant (Express)
| Feature | Avant | Après |
|---------|--------|--------|
| Stockage | Disque serveur | NavigateuBrowser (IndexedDB) |
| Données partagées | Globales | Par navigateur/appareil |
| Déploiement | Serveur requis | GitHub Pages statique |
| Commits auto | ✓ Automatiques | ✓ À la demande (optionnel) |
| Sauvegarde | Backend | Client (vous responsable) |

### Important à Comprendre
1. **Chaque navigateur** a ses propres données dans IndexedDB
2. **Pas de partage automatique** entre appareils sauf si vous syncronisez
3. **Les changements admin** restent **local** tant que non synchronisés
4. **Supabase** offre la vraie synchronisation temps réel

---

## 🔐 Sécurité

### Avant
- Données sur serveur → Risque si serveur compromis
- Token GitHub caché côté serveur ✓

### Après
- Données dans navigateur → Seulement vous y accédez
- Token GitHub dans localStorage local ⚠️ (voir sécurité Token)
  - Uniquement sur **votre machine**
  - Jamais committé sur GitHub
  - À révoquer si appareil compromis

### Sécurité des Tokens
```
JAMAIS faire:
❌ git commit -a:*github*
❌ Pousser DATABASE-GUIDE.md si contient tokens
❌ Partager votre token

TOUJOURS:
✅ Révoquer token sur Settings → Developer Settings si risque
✅ Régénérer si dépôt public compromis
✅ Garder pour usage perso seulement
```

---

## 📱 Exemple: Travail sur 2 Appareils

### Scénario: Laptop + Téléphone

**Option 1: GitHub (simple)**
```
Laptop:
1. Modifiez portfolio dans admin
2. Cliquez "Envoyer à GitHub"
3. Fichier portfolio-data.json créé

Téléphone:
1. Ouvrez le site
2. Admin → Charger (JSON)
3. Sélectionnez portfolio-data.json depuis GitHub
   (ou téléchargez depuis votre Drive)
```

**Option 2: Supabase (automatique)**
```
Laptop:
1. Configurez Supabase une fois
2. Modifiez portfolio dans admin
3. Cliquez "Synchroniser" pour envoyer

Téléphone:
1. Configurez le même Supabase
2. Cliquez "Synchroniser" pour charger
3. Données identiques! ✓

(Les deux appareils ont la même version)
```

---

## 📚 Fichiers de Référence

| Fichier | Objectif |
|---------|----------|
| `database.js` | Module complet de persistance |
| `DATABASE-GUIDE.md` | Guide complet (celui-ci) |
| `index.html` | Interface admin + onglet 💾 BDD |
| `rose_portfolio.js` | Fonctions de sync (restauration sessions) |

---

## 🎯 Prochaines Étapes Recommandées

1. **Testez localement** d'abord
2. **Choisissez votre stratégie** (GitHub/Supabase/Export)
3. **Configurez l'admin panel**
4. **Faites un test de sync**
5. **Déployez sur GitHub Pages**
6. **Créez une sauvegarde** (export JSON)
7. **Lisez DATABASE-GUIDE.md** pour comprendre les limites

---

## ❓ FAQ Migration

**Q: Je perds mes données actuelles?**
A: Non. Les données existantes dans localStorage seront conservées. Vous pouvez aussi exporter avant toute changement majeure.

**Q: Et si je veux utiliser le serveur Express?**
A: Vous pouvez, mais GitHub Pages ne peut pas l'exécuter. Pour local+express, gardez `server.js`. Pour GitHub Pages, utilisez les 3 options ci-dessus.

**Q: Comment accéder aux anciennes données?**
A: Elles restent en localStorage sur votre navigateur. Exportez-les avant mise à jour importante.

**Q: Le portfolio fonctionne hors-ligne?**
A: **Oui** pour affichage (GitHub Pages peut être mis en cache). **Non** pour admin (sync requis online).

**Q: Mes images sont perdues?**
A: Non, elles sont en IndexedDB. Exportez pour les sauvegarder.

---

## 🆘 Problèmes Courants

### Le site affiche "Loading..." indéfiniment
- Vérifiez navigateur console (F12) pour erreurs
- IndexedDB peut être désactivé/plein
- Essayez un autre navigateur

### Admin bouton apparaît mais ne s'ouvre pas
- Console peut montrer erreurs
- Vérifiez `database.js` est chargé
- Effacez cache navigateur (Ctrl+Shift+Delete)

### Les données ne persistent pas après reload
- IndexedDB peut nécessiter permission
- Naviguez via `http://` pas `file://`
- Vérifiez localStorage pas plein (`LS.get('state')` dans console)

---

**Besoin d'aide? Consultez DATABASE-GUIDE.md ou dépannage section dans ce fichier.**

Bonne chance avec GitHub Pages! 🚀
