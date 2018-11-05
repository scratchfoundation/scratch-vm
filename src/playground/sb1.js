Array.from(document.getElementsByClassName('file')).forEach(el => {
    el.addEventListener('change', () => {
        Array.from(el.files).forEach(f => {
            const reader = new FileReader();
            reader.onload = function (event) {
                console.log(Array.from(new SB1Iterator(event.target.result)));
            };
            reader.readAsArrayBuffer(f);
        });
    });
});
