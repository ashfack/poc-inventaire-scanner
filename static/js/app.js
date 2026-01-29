import * as db from './storage.js';

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
document.getElementById('btn-scan').onclick = () => {
    Quagga.init({
        inputStream: { name: "Live", type: "LiveStream", target: document.querySelector('#interactive'), constraints: { facingMode: "environment" } },
        decoder: { readers: ["ean_reader", "ean_8_reader"] }
    }, (err) => { if(!err) Quagga.start(); });
};

Quagga.onDetected(async (data) => {
    console.log("onDetected ", data);
    const code = data.codeResult.code;
    document.getElementById('p-barcode').value = code;
    Quagga.stop();
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    const json = await res.json();
    if(json.status === 1) document.getElementById('p-name').value = json.product.product_name;
});

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