function startScanner() {
    Quagga.init({
        inputStream: { name: "Live", type: "LiveStream", target: document.querySelector('#interactive') },
        decoder: { readers: ["ean_reader", "ean_8_reader"] }
    }, function(err) {
        if (err) return console.error(err);
        Quagga.start();
    });

    Quagga.onDetected((data) => {
        console.log("onDetected", data);
        const code = data.codeResult.code;
        fetchProductInfo(code);
        Quagga.stop();
    });
}

async function fetchProductInfo(barcode) {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const json = await res.json();
    if (json.status === 1) {
        document.getElementById('p-name').value = json.product.product_name;
        document.getElementById('p-barcode').value = barcode;
    }
}