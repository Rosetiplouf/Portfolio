# Guide BDD - Système de Stockage du Portfolio

Votre portfolio utilise maintenant une **base de données 100% compatible GitHub Pages** avec plusieurs options de synchronisation.

---

## 🗂️ Architecture de Stockage

### Local (Automatique)
- **IndexedDB**: Stockage robuste des images (navigateur)
- **LocalStorage**: Stockage JSON de tous les paramètres (préfixe `rp8_`)
- **Persistance**: Automatique et immédiate
- **Limitation**: Données stockées uniquement sur **1 navigateur/appareil**

### Options de Synchronisation

---

## 💾 Option 1: Export/Import Manuel (Simple)

La méthode la plus simple, **sans serveur requis**.

### Procédure
1. **Admin panel** → Onglet **💾 BDD**
2. **Télécharger (JSON)** → Un fichier `portfolio-export-YYYY-MM-DD.json` est créé
3. Sauvegardez ce fichier en sécurité (Dropbox, Drive, USB, etc.)

### Pour Restaurer
1. **Admin panel** → Onglet **💾 BDD**
2. **Charger (JSON)** → Sélectionnez votre fichier précédent
3. Le site recharge avec vos données restaurées

### Avantages
✅ Zéro configuration  
✅ Fonctionne sur GitHub Pages  
✅ Sauvegarde portative  

### Inconvénients
❌ Manuel, besoin de télécharger régulièrement  
❌ Une seule version sauvegardée à la fois  

---

## 🔗 Option 2: GitHub (GitHub Pages Natif)

Synchronise directement avec votre **dépôt GitHub** en temps réel.

### Configuration

#### Étape 1: Créer un Personal Access Token
1. Allez sur **GitHub.com** → **Settings** (compte)
2. **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token (classic)**
4. Nom: `portfolio-admin`
5. **Scopes requis**: ☑️ **repo** (tout accès dépôt)
6. **Generate token** → **Copiez le token** (⚠️ visible une seule fois!)

#### Étape 2: Configurer dans le Site
1. **Admin panel** → Onglet **💾 BDD**
2. **GitHub (GitHub Pages)**
3. Collez le token dans le champ **Token GitHub**
4. Confirmez votre dépôt: `Rosetiplouf/Portfolio` (format: `user/repo`)
5. Branche: `main` (ou votre branche cible)
6. Bouton **🔗 Configurer GitHub**

#### Étape 3: Envoyer des Données
- Après chaque modification importante, cliquez **↑ Envoyer à GitHub**
- Un commit automatique est créé: `Update portfolio data - HH:MM:SS`
- Le fichier `portfolio-data.json` est créé/mis à jour dans le dépôt

### Avantages
✅ Sauvegarde centralisée sur GitHub  
✅ Historique des versions (commits)  
✅ Partage facile avec collaborateurs  
✅ Intégration native au workflow Git  

### Inconvénients
❌ Nécessite un token personnel  
❌ Les données sont en plain text sur GitHub (⚠️ sécurité)  
❌ Actualisé à la demande (pas auto-sync)  

### Sécurité
⚠️ **Le token a accès complet à votre dépôt!**
- Ne le partagez jamais
- Si compromis, **révoquez-le immédiatement** (Settings → Tokens → Delete)
- Créez un nouveau dépôt privé si données sensibles

---

## ☁️ Option 3: Supabase (Cloud Multi-Dispositifs)

Synchronise vos données **dans le cloud** et **partage automatique** entre tous les appareils.

### Configuration

#### Étape 1: Créer un Compte Supabase
1. Allez sur **[supabase.com](https://supabase.com)** → **Sign Up**
2. Connectez-vous avec GitHub (facile!)
3. Créez un nouveau **Project**
4. Attendez l'initialisation (~1 min)

#### Étape 2: Créer la Table
1. Dans Supabase, allez à **SQL Editor** (ou **Tables**)
2. Créez une table `portfolio_state`:
```sql
create table portfolio_state (
  id bigint primary key generated always as identity,
  data jsonb not null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

3. Allez à **Settings** → **API** → Copiez:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (première clé API)

#### Étape 3: Configurer dans le Site
1. **Admin panel** → Onglet **💾 BDD**
2. **Supabase (Sync cloud optionnel)**
3. Collez l'**URL Supabase**
4. Collez la **Clé Supabase (public)**
5. Bouton **☁ Configurer Supabase**

#### Étape 4: Synchroniser
- **⇅ Synchroniser**: 
  - Si données en cloud → demande confirmation pour les charger
  - Si aucune donnée cloud → envoie vos données actuelles

### Avantages
✅ Données synchronisées en temps réel  
✅ Multi-dispositifs automatiquement  
✅ Cloud sécurisé (Supabase maintient)  
✅ Gratuit pour petit usage  
✅ Interface web pour gérer les données  

### Inconvénients
❌ Nécessite création compte Supabase  
❌ Sync à la demande (pas push automatique)  
❌ Données dans le cloud (confidentialité)  

### Limites Gratuites Supabase
- 500 MB storage gratuit
- Suffisant pour ~1000 images + données
- Très extensible si besoin

---

## 🔄 Stratégies Recommandées

### Solo (Simple)
```
Utiliser: Export/Import Manuel
Fréquence: Après chaque gros changement
Sauvegarde: Sur votre Dropbox/Drive
```

### Solo (Automatisé)
```
Utiliser: GitHub (si dépôt public ok)
Fréquence: Après modifications importantes
Avantage: Historique + sauvegarde
```

### Multi-Appareils
```
Utiliser: Supabase
Fréquence: Une sync au démarrage admin
Avantage: Synchronisation automatique partout
```

### Ultra-Sécurisé (Données Sensibles)
```
Utiliser: Export/Import + Drive privé
Ne pas utiliser: GitHub (public si dépôt public)
Alternative: Supabase + Private key (non public)
```

### Combo Idéal
```
1. Supabase pour sync quotidien entre appareils
2. GitHub pour historique + backup
3. Export manuel mensuel en sécurité
```

---

## ⚙️ Configuration Avancée

### Charger les Données au Démarrage Admin
Les configurations GitHub et Supabase se **restaurent automatiquement** si vous avez configuré avant.
- Pas besoin de re-saisir le token/clé
- Stocké localement et sécurisé

### Format du Fichier Export
```json
{
  "version": "1.0",
  "exported": "2024-05-25T14:32:00.000Z",
  "data": {
    "hero": {...},
    "about": {...},
    "projects": [...],
    "carousel": {...},
    ...
  },
  "images": {
    "about_avatar": "data:image/png;base64,...",
    "proj_p1": "data:image/...",
    ...
  }
}
```

Tous vos paramètres + images en **un seul fichier portable**.

### GitHub Data File
Sur votre repo, un fichier `portfolio-data.json` est créé avec le même format.
Vous pouvez l'éditer manuellement via l'interface GitHub si besoin.

### Supabase RLS (Sécurité)
Si vous avez des données vraiment sensibles:
1. Supabase → **Authentication** → Créez des users
2. **Settings** → **RLS** → Activez les politiques
3. Les données ne seront accessibles que par les comptes autorisés

---

## 🆘 Dépannage

### "⚠ Stockage plein"
- IndexedDB est plein (limite ~50MB par site)
- **Solution**: Supprimez des images anciennes, exécutez l'export

### Commit GitHub échoue
- ❌ Token expiré ou révoké
- ❌ Pas d'accès `repo` dans le token
- ✅ **Solution**: Créez un nouveau token avec les droits corrects

### Sync Supabase ne fonctionne pas
- ❌ URL ou clé incorrecte
- ❌ Table `portfolio_state` n'existe pas
- ✅ **Solution**: Revérifiez dans Supabase SQL Editor

### Je veux changer de méthode
1. **Téléchargez un export** de vos données actuelles
2. Reconfigurez la nouvelle méthode
3. Chargez l'export dans la nouvelle méthode

---

## 🚀 Mise en Production (GitHub Pages)

Si vous publiez sur GitHub Pages:

### Avec GitHub Option
1. Le `portfolio-data.json` sera versioned sur GitHub
2. Quand vous chargez le site, il récupère les dernières données
3. ✅ **Fonctionne parfaitement**

### Avec Supabase Option
1. Votre site récupère les données depuis le cloud Supabase
2. Même sur GitHub Pages, c'est transparent
3. ✅ **Fonctionne avec CORS**

### Avec Export/Import
1. Vous téléchargez régulièrement
2. Vous commitez manuellement les fichiers
3. ✅ **Fonctionne**

---

## 📋 Checklist Déploiement

- [ ] Choisir une stratégie (GitHub / Supabase / Export)
- [ ] Configurer dans l'admin panel
- [ ] Faire un premier test de synchronisation
- [ ] Faire un export de sauvegarde ("just in case")
- [ ] Documenter votre approche (pour mémoire future)

---

## 💡 Conseils

1. **Testez d'abord localement** sur votre machine
2. **Faites des exports réguliers** même avec sync automatique
3. **Ne commettez jamais le token** sur GitHub (✅ déjà en localStorage, pas commité)
4. **Versionnez votre HTML/CSS/JS** normalement sur GitHub
5. **Les données**, c'est la vraie valeur → **sauvegardez-les!**

---

## 📞 Problèmes Avancés?

Consultez:
- [GitHub API Docs](https://docs.github.com/en/rest)
- [Supabase Docs](https://supabase.com/docs)
- [IndexedDB MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

Bon développement! 🚀
