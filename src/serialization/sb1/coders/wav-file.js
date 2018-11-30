const {ByteStream} = require('./byte-stream');
const {WAVESignature, WAVEChunkStart, WAVEFMTChunkBody} = require('./wav-blocks');

class WAVFile {
    encode (intSamples, {channels = 1, sampleRate = 22050} = {}) {
        const samplesUint8 = new Uint8Array(intSamples.buffer, intSamples.byteOffset, intSamples.byteLength);
        const size = (
            WAVESignature.prototype.size +
            WAVEChunkStart.prototype.size +
            WAVEFMTChunkBody.prototype.size +
            WAVEChunkStart.prototype.size +
            samplesUint8.length
        );

        const stream = new ByteStream(new ArrayBuffer(size));

        stream.writeStruct(WAVESignature, {
            riff: 'RIFF',
            length: size - 8,
            wave: 'WAVE'
        });

        stream.writeStruct(WAVEChunkStart, {
            chunkType: 'fmt ',
            length: WAVEFMTChunkBody.prototype.size
        });

        stream.writeStruct(WAVEFMTChunkBody, {
            format: 1,
            channels: channels,
            sampleRate: sampleRate,
            bytesPerSec: sampleRate * 2 * channels,
            blockAlignment: channels * 2,
            bitsPerSample: 16
        });

        stream.writeStruct(WAVEChunkStart, {
            chunkType: 'data',
            length: size - stream.position - WAVEChunkStart.prototype.size
        });

        stream.writeBytes(samplesUint8);

        return stream.uint8;
    }

    static encode (intSamples, options) {
        return new WAVFile().encode(intSamples, options);
    }

    static samples (bytes) {
        const headerLength = new WAVEChunkStart(bytes, WAVESignature.prototype.size).length;
        const bodyLength = new WAVEChunkStart(bytes, WAVESignature.prototype.size + WAVEChunkStart.prototype.size + headerLength).length;
        return bodyLength / 2;
    }
}

exports.WAVFile = WAVFile;
