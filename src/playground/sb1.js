Array.from(document.getElementsByClassName('file')).forEach(el => {
    let last = null;
    el.addEventListener('change', () => {
        Array.from(el.files).forEach(f => {
            const reader = new FileReader();
            reader.onload = function (event) {
                console.log(event.target.result);
                // console.log(Array.from(new Uint8Array(event.target.result)).map(String.fromCharCode));
                // console.log(Array.from(new SB1File(event.target.result).info()));
                // console.log((new SB1File(event.target.result).data()));
                if (last) {
                    last.forEach(document.body.removeChild, document.body);
                }
                // console.log(;
                // console.log(Array.from(new SB1Iterator(event.target.result).data()));
                last = [
                    new SB1View(Array.from(new SB1File(event.target.result).infoRaw()), 'raw - info').element,
                    new SB1View(Array.from(new SB1File(event.target.result).dataRaw()), 'raw - data').element,
                    new SB1View(Array.from(new SB1ObjectIterator(new SB1File(event.target.result).infoRaw())), 'table - info').element,
                    new SB1View(Array.from(new SB1ObjectIterator(new SB1File(event.target.result).dataRaw())), 'table - data').element,
                    new SB1View(new SB1File(event.target.result).info(), 'info').element,
                    new SB1View(new SB1File(event.target.result).data(), 'data').element,
                    new SB1View(new SB1File(event.target.result).images(), 'images').element,
                    new SB1View(new SB1File(event.target.result).sounds(), 'sounds').element
                ];
                last.forEach(document.body.appendChild, document.body);
            };
            reader.readAsArrayBuffer(f);
        });
    });
});
