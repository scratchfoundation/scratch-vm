const {ByteStream} = require('./byte-stream');
const {WAVESignature, WAVEChunkStart, WAVEFMTChunkBody} = require('./wav-blocks');

class WAVFile {
    encode (intSamples, {channels = 1, sampleRate = 22050} = {}) {
        const samplesUint8 = new Uint8Array(intSamples.buffer, intSamples.byteOffset, intSamples.byteLength);
        const size = (
            WAVESignature.size +
            WAVEChunkStart.size +
            WAVEFMTChunkBody.size +
            WAVEChunkStart.size +
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
            length: WAVEFMTChunkBody.size
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
            length: size - stream.position - WAVEChunkStart.size
        });

        stream.writeBytes(samplesUint8);

        return stream.uint8;
    }

    static encode (intSamples, options) {
        return new WAVFile().encode(intSamples, options);
    }

    static samples (bytes) {
        const headerLength = new WAVEChunkStart(bytes, WAVESignature.size).length;
        const bodyLength = new WAVEChunkStart(bytes, WAVESignature.size + WAVEChunkStart.size + headerLength).length;
        return bodyLength / 2;
    }
}

exports.WAVFile = WAVFile;
