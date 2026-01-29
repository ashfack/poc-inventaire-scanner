// On initialise l'objet de scan globalement pour pouvoir l'arrêter proprement
let html5QrCode = null;

export const startScanner = (elementId, onDetected) => {
    // Si un scanner tourne déjà, on l'arrête avant d'en lancer un nouveau
    if (html5QrCode) {
        html5QrCode.stop().catch(err => console.error("Erreur stop:", err));
    }

    html5QrCode = new Html5Qrcode(elementId);

    const config = {
        fps: 15, // Plus d'images par seconde pour plus de réactivité
        qrbox: { width: 280, height: 150 }, // Zone de lecture adaptée aux codes-barres allongés
        aspectRatio: 1.777778 // Format 16:9 pour mieux voir sur mobile
    };

    html5QrCode.start(
        { facingMode: "environment" }, // Utilise la caméra arrière
        config,
        (decodedText) => {
            // En cas de succès
            console.log("Code détecté :", decodedText);
            onDetected(decodedText);
            stopScanner(); // Arrête la caméra après détection
        },
        (errorMessage) => {
            // On ne log pas les erreurs de lecture (trop fréquentes tant que le focus n'est pas fait)
        }
    ).catch(err => {
        alert("Impossible d'accéder à la caméra. Vérifiez les permissions HTTPS.");
        console.error(err);
    });
};

export const stopScanner = () => {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            console.log("Scanner arrêté.");
            // Optionnel : masquer le conteneur vidéo pour gagner de la place
            document.getElementById('interactive').innerHTML = "";
        }).catch(err => console.error("Erreur lors de l'arrêt:", err));
    }
};