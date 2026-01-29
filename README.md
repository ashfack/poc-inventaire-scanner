# 📦 Inventaire Scanner - Ayisha & Ashfack

**Inventaire Scanner** est une application web moderne (PWA) conçue pour simplifier la gestion des stocks domestiques. Grâce au scan de codes-barres et à l'intégration d'OpenFoodFacts, suivez vos produits, réduisez le gaspillage et synchronisez vos données facilement.

---

## 🚀 Fonctionnalités Clés

* **Scanner de Code-barres :** Utilisation de la caméra via `QuaggaJS` pour identifier instantanément les produits.
* **Intelligence OpenFoodFacts :** Récupération automatique du nom des produits depuis la base de données mondiale.
* **Gestion du Cycle de Vie :**
    * **Stock :** Produits disponibles actuellement.
    * **Gaspillé :** Produits expirés non consommés.
    * **Archivé :** Historique des produits consommés.
* **PWA (Progressive Web App) :** Installable sur smartphone et consultable hors-ligne grâce au Service Worker.
* **Fusion Intelligente :** Importez et fusionnez deux fichiers JSON. En cas de doublon, l'application conserve la version avec le `updatedAt` le plus récent.
* **Design Responsive :** Interface moderne avec codes couleurs dynamiques :
    * 🟢 **Vert** : Produit OK.
    * 🟠 **Orange** : Expire dans moins de 5 jours.
    * 🔴 **Rouge** : Expiré.

---

## 🛠️ Technologies Utilisées

* **Backend :** Python 3 + Flask
* **Frontend :** HTML5, CSS3, JavaScript (ES6+ / Modules)
* **Bibliothèques :** QuaggaJS (Scanning), OpenFoodFacts API
* **Stockage :** LocalStorage (persistance locale) + Export/Import JSON
* **Déploiement :** Compatible Koyeb / Gunicorn

---

## 📂 Structure du Projet

```text
.
├── app.py              # Serveur Flask (API & Routage)
├── requirements.txt    # Dépendances Python
├── sw.js               # Service Worker (Gestion Offline)
├── static/
│   ├── css/style.css   # Styles & Thèmes colorés
│   ├── js/             
│   │   ├── app.js      # Contrôleur UI & Logique Scanner
│   │   └── storage.js  # Moteur de fusion & LocalStorage
│   └── manifest.json   # Configuration PWA
└── templates/
    └── index.html      # Structure HTML principale
