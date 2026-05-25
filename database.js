// ════════════════════════════════
// CLOUD DATABASE (Supabase - Optionnel)
// ════════════════════════════════
const CLOUD = {
  enabled: false,
  supabaseUrl: '',
  supabaseKey: '',
  initialized: false,

  async init(url, key) {
    if (!url || !key) return;
    this.supabaseUrl = url;
    this.supabaseKey = key;
    this.initialized = true;
    this.enabled = true;
  },

  async pull() {
    if (!this.enabled) return null;
    try {
      const res = await fetch(`${this.supabaseUrl}/rest/v1/portfolio_state?select=data&order=created_at.desc&limit=1`, {
        headers: { 'apikey': this.supabaseKey, 'Accept': 'application/json' }
      });
      const data = await res.json();
      return data?.[0]?.data || null;
    } catch (e) {
      console.error('Cloud pull failed:', e);
      return null;
    }
  },

  async push(state) {
    if (!this.enabled) return false;
    try {
      await fetch(`${this.supabaseUrl}/rest/v1/portfolio_state`, {
        method: 'POST',
        headers: { 'apikey': this.supabaseKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: state, updated_at: new Date().toISOString() })
      });
      return true;
    } catch (e) {
      console.error('Cloud push failed:', e);
      return false;
    }
  }
};

// ════════════════════════════════
// EXPORT / IMPORT
// ════════════════════════════════
const EXPORT_IMPORT = {
  async exportState() {
    const state = {
      version: '1.0',
      exported: new Date().toISOString(),
      data: deepClone(S),
      images: {}
    };

    // Export toutes les images stockées
    const allImages = await IDB.getAll();
    state.images = allImages;

    return state;
  },

  async importState(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.data) throw new Error('Format invalide: manque data');

      // Vider complètement S
      Object.keys(S).forEach(key => delete S[key]);
      
      // Copier tous les paramètres depuis l'export
      const imported = deepClone(data.data);
      Object.assign(S, imported);

      // IMPORTANT: Nettoyer localStorage avant d'importer
      // Récupérer toutes les clés avec le préfixe rp8_
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('rp8_')) {
          localStorage.removeItem(key);
        }
      }

      // Attendre que les images soient chargées dans IndexedDB
      const imagePromises = [];
      if (data.images && typeof data.images === 'object') {
        for (const [key, value] of Object.entries(data.images)) {
          imagePromises.push(
            new Promise(resolve => {
              IDB.set(key, value);
              setTimeout(resolve, 10);
            })
          );
        }
      }
      
      await Promise.all(imagePromises);
      
      // Sauvegarder TOUS les paramètres dans localStorage
      Object.keys(S).forEach(key => {
        LS.set(key, S[key]);
      });
      
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  download() {
    this.exportState().then(state => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  },

  upload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        
        // Confirmation avant d'écraser
        if (!confirm('⚠️ Cela va remplacer TOUTES vos données actuelles.\n\nÊtes-vous sûr?')) {
          return;
        }
        
        const success = await this.importState(text);
        if (success) {
          flash('✓ Données importées! Rechargement...');
          // Attendre un peu que tout soit sauvegardé
          await new Promise(resolve => setTimeout(resolve, 800));
          // Recharger le site
          location.reload();
        } else {
          flash('✗ Erreur lors de l\'import');
        }
      } catch (e) {
        console.error('Import error:', e);
        flash('✗ Fichier invalide');
      }
    };
    input.click();
  }
};

// ════════════════════════════════
// GITHUB API (Direct from browser)
// ════════════════════════════════
const GITHUB = {
  token: null,
  repo: null,
  branch: 'main',
  initialized: false,

  init(token, repo, branch = 'main') {
    this.token = token;
    this.repo = repo;
    this.branch = branch;
    this.initialized = this.token && this.repo;
  },

  async getFileSha(path) {
    const url = `https://api.github.com/repos/${this.repo}/contents/${encodeURIComponent(path)}`;
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.token}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (res.status === 404) return null;
      const data = await res.json();
      return data.sha;
    } catch {
      return null;
    }
  },

  async updateFile(path, content, message) {
    if (!this.initialized) return false;
    try {
      const sha = await this.getFileSha(path);
      const encoded = btoa(unescape(encodeURIComponent(content)));
      const url = `https://api.github.com/repos/${this.repo}/contents/${encodeURIComponent(path)}`;
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message || `Update ${path}`,
          content: encoded,
          branch: this.branch,
          sha: sha || undefined
        })
      });

      return res.ok;
    } catch (e) {
      console.error('GitHub update failed:', e);
      return false;
    }
  },

  async commitState(state) {
    const content = JSON.stringify(state, null, 2);
    return await this.updateFile(
      'portfolio-data.json',
      content,
      `Update portfolio data - ${new Date().toLocaleString('fr-FR')}`
    );
  }
};
