Array.from(document.getElementsByClassName('file')).forEach(el => {
    let last = null;
    el.addEventListener('change', () => {
        Array.from(el.files).forEach(f => {
            const reader = new FileReader();
            reader.onload = function (event) {
                console.log(event.target.result);
                // console.log(Array.from(new Uint8Array(event.target.result)).map(String.fromCharCode));
                console.log(Array.from(new SB1File(event.target.result).info()));
                console.log((new SB1File(event.target.result).data()));
                if (last) {
                    last.forEach(document.body.removeChild, document.body);
                }
                last = [
                    new SB1View(new SB1File(event.target.result).info(), 'info').element,
                    new SB1View(new SB1File(event.target.result).data(), 'data').element
                ];
                last.forEach(document.body.appendChild, document.body);
            };
            reader.readAsArrayBuffer(f);
        });
    });
});
