# 🚀 Démarrage en 5 Minutes

## ⚡ Vous êtes pressé? Lisez ceci en premier!

---

## Étape 1: Tester (2 min)
```powershell
cd c:\Users\Rose\Downloads\Portfolio
python -m http.server 8000
# Ouvrez: http://localhost:8000
```

## Étape 2: Allez à l'Admin (30 sec)
Cliquez sur **⚙ Admin** en haut à droite  
Mot de passe: `0000`  
Vous voyez un nouvel onglet **💾 BDD**? ✓ Ça marche!

## Étape 3: Choisir (1 min)

### Je change juste mon site local
```
Admin → 💾 BDD → ⬇ Télécharger
(Sauvegardez le fichier)
```

### Je veux un backup sur GitHub
```
1. GitHub.com → Settings → Developer settings
2. Personal access tokens → Generate new token
3. Cochez "repo"
4. Copiez le token
5. Admin → 💾 BDD → Collez le token
6. Cliquez "🔗 Configurer GitHub"
7. Après changements: "↑ Envoyer à GitHub"
```

### Je travaille sur 2 appareils
```
1. Supabase.com → Sign up
2. Créez un projet (gratuit)
3. SQL Editor → Créez table:
   create table portfolio_state (
     id bigint primary key generated always as identity,
     data jsonb not null
   );
4. Settings → API → Copiez URL + clé
5. Admin → 💾 BDD → Collez URL + clé
6. Cliquez "☁ Configurer Supabase"
7. "⇅ Synchroniser" pour sync
```

## Étape 4: Déployer (1 min)
```bash
git add .
git commit -m "Portfolio with database"
git push
# Puis Settings → Pages → Deploy from branch main
```

---

## ❓ Questions Rapides

**Q: Mes données vont où?**  
A: Dans votre navigateur (IndexedDB). Si sync: GitHub/Supabase.

**Q: Je peux utiliser plusieurs options?**  
A: Oui! Configurez les 3 si vous voulez.

**Q: Mes images?**  
A: Stockées dans IndexedDB (50MB max). Exportez pour sauvegarder.

**Q: Je perds tout si je efface cache?**  
A: Oui. Exportez régulièrement!

**Q: Ça fonctionne sur GitHub Pages?**  
A: Oui, 100% statique. Aucun serveur Node requis.

---

## 📚 Pour Plus de Détails

1. **GITHUB-PAGES-MIGRATION.md** - Architecture complète
2. **DATABASE-GUIDE.md** - Options détaillées
3. **README_SUMMARY.md** - Vue d'ensemble

---

**Besoin d'aide? Consultez la section Dépannage du guide approprié.**

Bon développement! 🎉
