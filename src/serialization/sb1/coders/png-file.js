class PNGFile {
    encode (width, height, pixelsUint8) {
        const rowSize = width * 4 + PNGFilterMethodByte.prototype.size;
        const bodySize = rowSize * height;
        let bodyRemaining = bodySize;
        const blocks = Math.ceil(bodySize / DEFLATE_BLOCK_SIZE_MAX);
        const idatSize = (
            DeflateHeader.prototype.size +
            blocks * DeflateChunkStart.prototype.size +
            DeflateEnd.prototype.size +
            bodySize
        );
        const size = (
            PNGSignature.prototype.size +
            // IHDR
            PNGChunkStart.prototype.size +
            PNGIHDRChunkBody.prototype.size +
            PNGChunkEnd.prototype.size +
            // IDAT
            PNGChunkStart.prototype.size +
            idatSize +
            PNGChunkEnd.prototype.size +
            // IEND
            PNGChunkStart.prototype.size +
            PNGChunkEnd.prototype.size
        );
        const buffer = new ArrayBuffer(size);
        const uint8 = new Uint8Array(buffer);

        const stream = new ByteStream(new ArrayBuffer(size));

        let position = 0;

        stream.writeStruct(PNGSignature, {
            support8Bit: 0x89,
            png: 'PNG',
            dosLineEnding: '\r\n',
            dosEndOfFile: '\x1a',
            unixLineEnding: '\n'
        });

        stream.writeStruct(PNGChunkStart, {
            length: PNGIHDRChunkBody.prototype.size,
            chunkType: 'IHDR'
        });

        const ihdrBlockPosition = stream.position;
        stream.writeStruct(PNGIHDRChunkBody, {
            width,
            height,
            bitDepth: 8,
            colorType: 6,
            compressionMethod: 0,
            filterMethod: 0,
            interlaceMethod: 0
        });

        stream.writeStruct(PNGChunkEnd, {
            checksum: new CRC32()
            .update(stream.uint8, ihdrBlockPosition - 4, PNGIHDRChunkBody.prototype.size + 4)
            .digest
        });

        stream.writeStruct(PNGChunkStart, {
            length: idatSize,
            chunkType: 'IDAT'
        });

        stream.writeStruct(DeflateHeader, {
            cmf: 0b00001000,
            flag: 0b00011101
        });

        const deflateAdler = new Adler32();
        const pngCrc = new CRC32();

        pngCrc.update(stream.uint8, stream.position - Uint32BE.size - DeflateHeader.prototype.size, Uint32BE.size + DeflateHeader.prototype.size);

        let deflateIndex = 0;

        let rowIndex = 0;
        let y = 0;
        let pixelsIndex = 0;
        while (pixelsIndex < pixelsUint8.length) {
            if (deflateIndex === 0) {
                const deflateChunkSize = Math.min(bodyRemaining, DEFLATE_BLOCK_SIZE_MAX);
                const deflateChunkPosition = stream.position;
                stream.writeStruct(DeflateChunkStart, {
                    lastBlock: deflateChunkSize === bodyRemaining ? 1 : 0,
                    length: deflateChunkSize,
                    lengthCheck: deflateChunkSize ^ 0xffff
                });

                pngCrc.update(stream.uint8, deflateChunkPosition, DeflateChunkStart.prototype.size);
            }

            if (rowIndex === 0) {
                const filterBytePosition = stream.position;
                stream.writeStruct(PNGFilterMethodByte, {
                    method: 0
                });

                deflateAdler.update(stream.uint8, filterBytePosition, PNGFilterMethodByte.prototype.size);
                pngCrc.update(stream.uint8, filterBytePosition, PNGFilterMethodByte.prototype.size);

                rowIndex += PNGFilterMethodByte.prototype.size;
                bodyRemaining -= PNGFilterMethodByte.prototype.size;
                deflateIndex += PNGFilterMethodByte.prototype.size;
            } else {
                const rowPartialSize = Math.min(
                    pixelsUint8.length - pixelsIndex,
                    rowSize - rowIndex,
                    DEFLATE_BLOCK_SIZE_MAX - deflateIndex
                );

                const bytesPosition = stream.position;
                stream.writeBytes(pixelsUint8, pixelsIndex, pixelsIndex + rowPartialSize);

                deflateAdler.update(stream.uint8, bytesPosition, rowPartialSize);
                pngCrc.update(stream.uint8, bytesPosition, rowPartialSize);

                pixelsIndex += rowPartialSize;
                rowIndex += rowPartialSize;
                bodyRemaining -= rowPartialSize;
                deflateIndex += rowPartialSize;
            }

            if (deflateIndex >= DEFLATE_BLOCK_SIZE_MAX) {
                deflateIndex = 0;
            }

            if (rowIndex === rowSize) {
                rowIndex = 0;
                y += 1;
            }
        }

        stream.writeStruct(DeflateEnd, {
            checksum: deflateAdler.digest
        });

        pngCrc.update(stream.uint8, stream.position - DeflateEnd.prototype.size, DeflateEnd.prototype.size);

        stream.writeStruct(PNGChunkEnd, {
            checksum: pngCrc.digest
        });

        stream.writeStruct(PNGChunkStart, {
            length: 0,
            chunkType: 'IEND'
        });

        stream.writeStruct(PNGChunkEnd, {
            checksum: 0xae426082
        });

        return stream.buffer;
    }

    static encode (width, height, pixels) {
        return new PNGFile().encode(width, height, pixels);
    }
}
