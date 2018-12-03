class ProxyStream {
    constructor (stream) {
        this.stream = stream;
    }

    get uint8 () {
        return this.stream.uint8;
    }

    set uint8 (value) {
        this.stream.uint8 = value;
        return this.stream.uint8;
    }

    get position () {
        return this.stream.position;
    }

    set position (value) {
        this.stream.position = value;
        return this.stream.position;
    }

    writeStruct (StructType, data) {
        return this.stream.writeStruct(StructType, data);
    }

    writeBytes (bytes, start = 0, end = bytes.length) {
        return this.stream.writeBytes(bytes, start, end);
    }
}

exports.ProxyStream = ProxyStream;
