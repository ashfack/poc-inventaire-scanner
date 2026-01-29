let html5QrCode = null;

// Initialisation du scanner sur l'élément
const getScanner = (elementId) => {
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode(elementId);
    }
    return html5QrCode;
};

// MODE 1 : Scan vidéo en direct
export const startScanner = (elementId, onDetected) => {
    const scanner = getScanner(elementId);

    const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.77
    };

    scanner.start({ facingMode: "environment" }, config, (text) => {
        onDetected(text);
        stopScanner();
    }).catch(err => console.error("Erreur caméra:", err));
};

// MODE 2 : Scan depuis un fichier (Galerie) - VERSION CORRIGÉE
export const scanFile = (elementId, file, onDetected) => {
    const scanner = getScanner(elementId);

    // On désactive explicitement le redimensionnement (useBarCodeDetectorIfSupported)
    // et on traite l'image à sa résolution d'origine
    scanner.scanFile(file, false) // Le paramètre "false" évite l'affichage d'une image de preview qui peut ralentir le mobile
        .then(decodedText => {
            onDetected(decodedText);
        })
        .catch(err => {
            // Si l'échec persiste, c'est souvent un problème de contraste
            alert("Le code n'a pas été détecté. Assurez-vous que la photo est nette et bien éclairée.");
            console.error("Détails scanFile:", err);
        });
};

export const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            document.getElementById('interactive').innerHTML = "";
        });
    }
};