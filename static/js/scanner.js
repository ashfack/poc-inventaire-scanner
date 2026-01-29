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

// MODE 2 : Scan depuis un fichier (Galerie)
export const scanFile = (elementId, file, onDetected) => {
    const scanner = getScanner(elementId);

    scanner.scanFile(file, true)
        .then(decodedText => {
            onDetected(decodedText);
        })
        .catch(err => {
            alert("Impossible de lire le code sur cette photo. Essayez de la prendre de plus près.");
            console.error(err);
        });
};

export const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            document.getElementById('interactive').innerHTML = "";
        });
    }
};