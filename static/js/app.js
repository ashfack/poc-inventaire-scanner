import * as db from './storage.js';
import * as scanner from './scanner.js';
let currentTab = 'stock';

// --- VALIDATION ---
const isValidBarcode = (code) => !code || /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(code);

// --- BROUILLON AUTO ---
const inputs = ['p-name', 'p-barcode', 'p-expiry'];
inputs.forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        const draft = {};
        inputs.forEach(k => draft[k] = document.getElementById(k).value);
        db.saveDraft(draft);
    });
});

// --- SCANNER ---
// Bouton Scan Direct
document.getElementById('btn-scan').onclick = () => {
    scanner.startScanner('interactive', handleDetection);
};

// Bouton Galerie (on déclenche le clic sur l'input caché)
document.getElementById('btn-browse').onclick = () => {
    document.getElementById('qr-input-file').click();
};

// Événement quand une photo est choisie
const showLoading = (show) => {
    const container = document.getElementById('interactive');
    const existing = document.querySelector('.scanner-overlay');

    if (show && !existing) {
        const overlay = document.createElement('div');
        overlay.className = 'scanner-overlay';
        overlay.innerHTML = '<div class="spinner"></div><p>Analyse de l\'image...</p>';
        container.appendChild(overlay);
    } else if (!show && existing) {
        existing.remove();
    }
};

// Modifie l'événement onchange pour inclure l'indicateur
document.getElementById('qr-input-file').onchange = (e) => {
    console.log("qr-input-file onChange");
    const file = e.target.files[0];
    if (!file) return;

    showLoading(true); // ON LANCE L'ANIMATION
    console.log("qr-input-file onChange should show Loading");
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const maxSide = 1500;
            let width = img.width;
            let height = img.height;

            if (width > maxSide || height > maxSide) {
                const canvas = document.createElement('canvas');
                if (width > height) {
                    height *= maxSide / width;
                    width = maxSide;
                } else {
                    width *= maxSide / height;
                    height = maxSide;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    executeScan(blob);
                }, 'image/jpeg', 0.8);
            } else {
                executeScan(file);
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

// Fonction de scan isolée pour mieux gérer le "showLoading"
async function executeScan(source) {
    try {
        console.log("executeScan");
        await scanner.scanFile('interactive', source, (code) => {
            handleDetection(code);
            showLoading(false); // ARRÊT SI SUCCÈS
        });
    } catch (err) {
        showLoading(false); // ARRÊT SI ÉCHEC
    }
}

// Fonction commune de traitement du code détecté
async function handleDetection(code) {
    document.getElementById('p-barcode').value = code;

    // Feedback visuel (vibration si supporté)
    if (navigator.vibrate) navigator.vibrate(100);

    try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
        const json = await res.json();
        if (json.status === 1) {
            console.log("1",json);
            console.log("2",json.product);
             console.log("3",json.product.product_name);
            document.getElementById('p-name').value = json.product.product_name;
        }
    } catch (err) {
        console.error("Erreur OpenFoodFacts:", err);
    }
}

// --- RENDU & STATS ---
window.updateView = () => {
    const data = db.getDB();
    const container = document.getElementById('list-container');
    const items = data[currentTab] || [];
    const today = new Date().setHours(0,0,0,0);

    // Stats
    const total = data.stock.length;
    const expired = data.stock.filter(i => new Date(i.expiryDate).getTime() < today).length;
    const watch = data.stock.filter(i => {
        const d = (new Date(i.expiryDate) - today) / 86400000;
        return d >= 0 && d <= 5;
    }).length;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-watch').textContent = watch;
    document.getElementById('stat-expired').textContent = expired;

    container.innerHTML = items.map(item => {
        const diff = (new Date(item.expiryDate) - today) / 86400000;
        let color = 'ok';
        if(currentTab === 'stock') {
            if(diff < 0) color = 'expired';
            else if(diff <= 5) color = 'soon';
        } else { color = 'archived'; }

        return `
            <div class="card ${color}">
                <strong>${item.name}</strong><br>
                <small>Expire: ${item.expiryDate}</small>
                <div class="card-btns">
                    ${currentTab === 'stock' ? `
                        <button onclick="moveItem('${item.id}', 'archived')">✅</button>
                        <button onclick="moveItem('${item.id}', 'wasted')">🗑️</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
};

window.switchTab = (tab) => {
    currentTab = tab;
    document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    updateView();
};

window.moveItem = (id, targetTab) => {
    const data = db.getDB();

    // 1. Chercher le produit dans tous les groupes possibles
    let item = null;
    let sourceTab = '';

    ['stock', 'archived', 'wasted'].forEach(tab => {
        const idx = data[tab].findIndex(i => i.id === id);
        if (idx > -1) {
            item = data[tab].splice(idx, 1)[0];
            sourceTab = tab;
        }
    });

    // 2. Si on a trouvé le produit, on le déplace
    if (item) {
        item.status = targetTab;
        item.updatedAt = Date.now();
        data[targetTab].push(item);
        db.saveDB(data);

        // 3. Rafraîchir l'affichage
        updateView();
        console.log(`Déplacé de ${sourceTab} vers ${targetTab}`);
    }
};

// --- FORMULAIRE ---
document.getElementById('product-form').onsubmit = (e) => {
    e.preventDefault();
    const barcode = document.getElementById('p-barcode').value;
    if(!isValidBarcode(barcode)) return alert("Code-barres invalide (8, 12, 13 ou 14 chiffres)");

    const data = db.getDB();
    data.stock.push({
        id: Date.now().toString(),
        name: document.getElementById('p-name').value,
        barcode: barcode,
        expiryDate: document.getElementById('p-expiry').value,
        updatedAt: Date.now()
    });
    db.saveDB(data);
    db.saveDraft({}); // Vide le brouillon
    e.target.reset();
    updateView();
};

// Initialisation
window.onload = () => {
    const draft = db.getDraft();
    inputs.forEach(k => { if(draft[k]) document.getElementById(k).value = draft[k]; });
    updateView();
};

window.exportData = () => {
    const blob = new Blob([JSON.stringify(db.getDB())], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'inventaire.json';
    a.click();
};

window.importAndMerge = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
        const imported = JSON.parse(ev.target.result);
        const merged = db.mergeLogic(db.getDB(), imported);
        db.saveDB(merged);
        updateView();
    };
    reader.readAsText(e.target.files[0]);
};