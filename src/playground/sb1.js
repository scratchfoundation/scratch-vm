Array.from(document.getElementsByClassName('file')).forEach(el => {
    el.addEventListener('change', () => {
        Array.from(el.files).forEach(f => {
            const reader = new FileReader();
            reader.onload = function (event) {
                console.log(event.target.result);
                // console.log(Array.from(new Uint8Array(event.target.result)).map(String.fromCharCode));
                console.log(Array.from(new SB1File(event.target.result).info()));
                console.log(Array.from(new SB1File(event.target.result).data()));
            };
            reader.readAsArrayBuffer(f);
        });
    });
});
