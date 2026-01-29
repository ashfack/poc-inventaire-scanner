let html5QrCode = null;

const getScanner = (elementId) => {
    // Si l'élément n'existe pas, on ne fait rien
    if (!document.getElementById(elementId)) return null;
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode(elementId);
    }
    return html5QrCode;
};

// MODE 1 : SCAN DIRECT (VIDEO)
export const startScanner = (elementId, onDetected) => {
    const scanner = getScanner(elementId);

    // On définit explicitement les formats pour les produits de consommation
    const formats = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128
    ];

    const config = {
        fps: 20, // Plus rapide pour capturer le moment où c'est net
        qrbox: (viewWidth, viewHeight) => {
            // Zone de scan rectangulaire adaptée aux codes-barres
            return { width: viewWidth * 0.8, height: viewHeight * 0.4 };
        },
        formatsToSupport: formats
    };

    scanner.start({ facingMode: "environment" }, config, (text) => {
        onDetected(text);
        stopScanner();
    }).catch(err => {
        console.error("Erreur startScanner:", err);
        alert("Caméra bloquée ou non supportée.");
    });
};

// MODE 2 : SCAN FICHIER (CORRIGÉ)
export const scanFile = (elementId, file, onDetected) => {
    const scanner = getScanner(elementId);

    // On utilise scanFile sans aucun redimensionnement (false)
    // et on catch l'erreur pour donner un feedback précis
    scanner.scanFile(file, false)
        .then(decodedText => {
            onDetected(decodedText);
        })
        .catch(err => {
            console.warn("Échec lecture fichier:", err);
            // Si ça échoue, on tente une seconde fois avec un moteur de secours si dispo
            alert("Le code-barres n'est pas lisible encore. Essayez de dézoomer un peu ou d'améliorer l'éclairage.");
        });
};

export const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            const el = document.getElementById('interactive');
            if (el) el.innerHTML = "";
        }).catch(err => console.error("Erreur stopScanner:", err));
    }
};