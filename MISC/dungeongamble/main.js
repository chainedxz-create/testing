const originalFetch = window.fetch;

function mergeFiles(fileParts) {
    return new Promise((resolve, reject) => {
        let buffers = [];

        function fetchPart(gamble) {
            if (gamble >= fileParts.length) {
                let mergedBlob = new Blob(buffers);
                let mergedFileUrl = URL.createObjectURL(mergedBlob);
                resolve(mergedFileUrl);
                return;
            }
            fetch(fileParts[gamble]).then((response) => {
                if (!response.ok) throw new Error("Missing part: " + fileParts[gamble]);
                return response.arrayBuffer();
            }).then((data) => {
                buffers.push(data);
                fetchPart(gamble + 1);
            }).catch(reject);
        }
        fetchPart(0);
    });
}

function getParts(file, start, end) {
    let parts = [];
    for (let i = start; i <= end; i++) {
        parts.push(file + ".part" + i);
    }
    return parts;
}
Promise.all([
    mergeFiles(getParts("gamble.pck", 1, 5)),
    mergeFiles(getParts("gamble.wasm", 1, 2))
]).then(([pckUrl, wasmUrl]) => {
    window.fetch = async function (url, ...args) {
        if (url.endsWith("gamble.pck")) {
            return originalFetch(pckUrl, ...args);
        } else if (url.endsWith("gamble.wasm")) {
            return originalFetch(wasmUrl, ...args);
        } else {
            return originalFetch(url, ...args);
        }
    };
    window.godotRunStart();
});