const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const MathUtil = require('../../util/math-util');
const log = require('../../util/log');
const formatMessage = require('format-message');
const blockIconURI = 'data:image/png;base64,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';

const Message = {
    image_classification_model_url: {
        'ja': '画像分類モデルURL[URL]',
        'ja-Hira': 'がぞうぶんるいモデル[URL]',
        'en': 'image classification model URL [URL]',
        'ko': '이미지 분류 모델 URL [URL]',
        'zh-tw': '影像分類模型網址[URL]',
        'de': 'Bildklassifikationsmodell-URL [URL]'
    },
    image_classification_sample_model_url: {
        'ja': 'https://teachablemachine.withgoogle.com/models/0rX_3hoH/',
        'ja-Hira': 'https://teachablemachine.withgoogle.com/models/0rX_3hoH/',
        'en': 'https://teachablemachine.withgoogle.com/models/0rX_3hoH/',
        'ko': 'https://teachablemachine.withgoogle.com/models/0rX_3hoH/',
        'zh-tw': 'https://teachablemachine.withgoogle.com/models/0rX_3hoH/',
        'de': 'https://teachablemachine.withgoogle.com/models/0rX_3hoH/'
    },
    sound_classification_model_url: {
        'ja': '音声分類モデルURL[URL]',
        'ja-Hira': 'おんせいぶんるいモデル[URL]',
        'en': 'sound classification model URL [URL]',
        'ko': '소리 분류 모델 URL [URL]',
        'zh-tw': '聲音分類模型網址[URL]',
        'de': 'Audioklassifikationsmodell-URL [URL]'
    },
    sound_classification_sample_model_url: {
        'ja': 'https://teachablemachine.withgoogle.com/models/xP0spGSB/',
        'ja-Hira': 'https://teachablemachine.withgoogle.com/models/xP0spGSB/',
        'en': 'https://teachablemachine.withgoogle.com/models/xP0spGSB/',
        'ko': 'https://teachablemachine.withgoogle.com/models/xP0spGSB/',
        'zh-tw': 'https://teachablemachine.withgoogle.com/models/xP0spGSB/',
        'de': 'https://teachablemachine.withgoogle.com/models/xP0spGSB/'
    },
    classify_image: {
        'ja': '画像を分類する',
        'ja-Hira': 'がぞうをぶんるいする',
        'en': 'classify image',
        'ko': '이미지 분류하기',
        'zh-tw': '影像分類',
        'de': 'Bild klassifizieren'
    },
    image_label: {
        'ja': '画像ラベル',
        'ja-Hira': 'がぞうラベル',
        'en': 'image label',
        'ko': '이미지 라벨',
        'zh-tw': '影像標籤',
        'de': 'Bildklasse'
    },
    sound_label: {
        'ja': '音声ラベル',
        'ja-Hira': 'おんせいラベル',
        'en': 'sound label',
        'ko': '소리 라벨',
        'zh-tw': '聲音標籤',
        'de': 'Audioklasse'
    },
    when_received_block: {
        'ja': '画像ラベル[LABEL]を受け取ったとき',
        'ja-Hira': 'がぞうラベル[LABEL]をうけとったとき',
        'en': 'when received image label:[LABEL]',
        'ko': '[LABEL] 이미지 라벨을 받았을 때:',
        'zh-cn': '接收到类别[LABEL]时',
        'zh-tw': '接收到影像標籤:[LABEL]時',
        'de': 'Wenn ich die Bildklasse [LABEL] erkenne'
    },
    is_image_label_detected: {
        'ja': '[LABEL]の画像が見つかった',
        'ja-Hira': '[LABEL]のがぞうがみつかった',
        'en': 'image [LABEL] detected',
        'ko': '[LABEL] 이미지가 감지됨',
        'zh-tw': '影像[LABEL]被偵測？',
        'de': 'Bildklasse [LABEL] erkannt'
    },
    is_sound_label_detected: {
        'ja': '[LABEL]の音声が聞こえた',
        'ja-Hira': '[LABEL]のおんせいがきこえた',
        'en': 'sound [LABEL] detected',
        'ko': '[LABEL] 소리가 감지됨',
        'zh-tw': '聲音[LABEL]被偵測？',
        'de': 'Audioklasse [LABEL] erkannt'
    },
    image_label_confidence: {
        'ja': '画像ラベル[LABEL]の確度',
        'ja-Hira': 'がぞうラベル[LABEL]のかくど',
        'en': 'confidence of image [LABEL]',
        'ko': '[LABEL] 이미지 신뢰도',
        'zh-tw': '影像置信度[LABEL]',
        'de': 'Konfidenz der Bildklasse [LABEL]'
    },
    sound_label_confidence: {
        'ja': '音声ラベル[LABEL]の確度',
        'ja-Hira': 'おんせいラベル[LABEL]のかくど',
        'en': 'confidence of sound [LABEL]',
        'ko': '[LABEL] 소리 신뢰도',
        'zh-tw': '聲音置信度[LABEL]',
        'de': 'Konfidenz der Audioklasse [LABEL]'
    },
    when_received_sound_label_block: {
        'ja': '音声ラベル[LABEL]を受け取ったとき',
        'ja-Hira': '音声ラベル[LABEL]をうけとったとき',
        'en': 'when received sound label:[LABEL]',
        'zh-cn': '接收到声音类别[LABEL]时',
        'ko': '[LABEL] 소리 라벨을 받았을 때:',
        'zh-tw': '接收到聲音標籤[LABEL]時',
        'de': 'Wenn ich die Soundklasse [LABEL] erkenne'
    },
    label_block: {
        'ja': 'ラベル',
        'ja-Hira': 'ラベル',
        'en': 'label',
        'zh-cn': '标签',
        'ko': '라벨',
        'zh-tw': '標籤',
        'de': 'Klasse'
    },
    any: {
        'ja': 'のどれか',
        'ja-Hira': 'のどれか',
        'en': 'any',
        'zh-cn': '任何',
        'ko': '어떤',
        'zh-tw': '任何',
        'de': 'irgendeine'
    },
    any_without_of: {
        'ja': 'どれか',
        'ja-Hira': 'どれか',
        'en': 'any',
        'ko': '어떤',
        'zh-cn': '任何',
        'zh-tw': '任何',
        'de': 'irgendeine'
    },
    all: {
        'ja': 'の全て',
        'ja-Hira': 'のすべて',
        'en': 'all',
        'ko': '모든',
        'zh-cn': '所有',
        'zh-tw': '全部',
        'de': 'Alle'
    },
    toggle_classification: {
        'ja': 'ラベル付けを[CLASSIFICATION_STATE]にする',
        'ja-Hira': 'ラベルづけを[CLASSIFICATION_STATE]にする',
        'en': 'turn classification [CLASSIFICATION_STATE]',
        'ko': '라벨 분류 [CLASSIFICATION_STATE]',
        'zh-cn': '[CLASSIFICATION_STATE]分类',
        'zh-tw': '[CLASSIFICATION_STATE]分類',
        'de': 'Klassifizierung umschalten: [CLASSIFICATION_STATE]'
    },
    set_confidence_threshold: {
        'ja': '確度のしきい値を[CONFIDENCE_THRESHOLD]にする',
        'ja-Hira': 'かくどのしきいちを[CONFIDENCE_THRESHOLD]にする',
        'en': 'set confidence threshold [CONFIDENCE_THRESHOLD]',
        'ko': '신뢰도 기준 설정 [CONFIDENCE_THRESHOLD]',
        'zh-tw': '設定置信度閾值[CONFIDENCE_THRESHOLD]',
        'de': 'Setze die Konfidenzschwelle auf [CONFIDENCE_THRESHOLD]'
        
    },
    get_confidence_threshold: {
        'ja': '確度のしきい値',
        'ja-Hira': 'かくどのしきいち',
        'en': 'confidence threshold',
        'ko': '신뢰도 기준',
        'zh-tw': '置信度閾值',
        'de': 'Konfidenzschwelle'
    },
    set_classification_interval: {
        'ja': 'ラベル付けを[CLASSIFICATION_INTERVAL]秒間に1回行う',
        'ja-Hira': 'ラベルづけを[CLASSIFICATION_INTERVAL]びょうかんに1かいおこなう',
        'en': 'Label once every [CLASSIFICATION_INTERVAL] seconds',
        'zh-cn': '每隔[CLASSIFICATION_INTERVAL]秒标记一次',
        'ko': '매 [CLASSIFICATION_INTERVAL]초마다 라벨 분류하기',
        'zh-tw': '每隔[CLASSIFICATION_INTERVAL]秒標記一次',
        'de': 'Klassifiziere alle [CLASSIFICATION_INTERVAL] Sekunden'
    },
    video_toggle: {
        'ja': 'ビデオを[VIDEO_STATE]にする',
        'ja-Hira': 'ビデオを[VIDEO_STATE]にする',
        'en': 'turn video [VIDEO_STATE]',
        'zh-cn': '[VIDEO_STATE]摄像头',
        'ko': '비디오 화면 [VIDEO_STATE]',
        'zh-tw': '視訊設為[VIDEO_STATE]',
        'de': 'Video umschalten: [VIDEO_STATE]'
    },
    on: {
        'ja': '入',
        'ja-Hira': 'いり',
        'en': 'on',
        'ko': '켜기',
        'zh-cn': '开启',
        'zh-tw': '開啟',
        'de': 'an'
    },
    off: {
        'ja': '切',
        'ja-Hira': 'きり',
        'en': 'off',
        'ko': '멈추기',
        'zh-cn': '关闭',
        'zh-tw': '關閉',
        'de': 'aus'
    },
    video_on_flipped: {
        'ja': '左右反転',
        'ja-Hira': 'さゆうはんてん',
        'en': 'on flipped',
        'ko': '좌우 뒤집기',
        'zh-cn': '镜像开启',
        'zh-tw': '翻轉',
        'de': 'an (gespiegelt)'
    },
    switch_webcam: {
        'ja': 'カメラを[DEVICE]に切り替える',
        'ja-Hira': 'カメラを[DEVICE]にきりかえる',
        'en': 'switch webcam to [DEVICE]',
        'zh-cn': '网络摄像头切换到[DEVICE]',
        'zh-tw': '網路攝影機切換到[DEVICE]',
        'de': 'Wechsle Webcam zu [DEVICE]'
    }
};

const AvailableLocales = ['en', 'ja', 'ja-Hira', 'ko', 'zh-cn', 'zh-tw', 'de'];

class Scratch3TM2ScratchBlocks {
    constructor(runtime) {
        this.runtime = runtime;
        this.locale = this.setLocale();

        this.video = document.createElement('video');
        this.video.autoplay = true;

        this.interval = 1000;
        this.minInterval = 100;

        const media = navigator.mediaDevices.getUserMedia({
            video: {
                width: 360,
                height: 360
            },
            audio: false
        });

        media.then(stream => {
            this.video.srcObject = stream;
        });

        this.timer = setInterval(() => {
            this.classifyVideoImage();
        }, this.minInterval);

        this.imageModelUrl = null;
        this.imageMetadata = null;
        this.imageClassifier = null;
        this.initImageProbableLabels();
        this.confidenceThreshold = 0.5;

        this.soundModelUrl = null;
        this.soundMetadata = null;
        this.soundClassifier = null;
        this.soundClassifierEnabled = false;
        this.initSoundProbableLabels();

        this.runtime.ioDevices.video.enableVideo();

        this.devices = [{ text: 'default', value: '' }];
        try {
            navigator.mediaDevices.enumerateDevices().then(media => {
                for (const device of media) {
                    if (device.kind === 'videoinput') {
                        this.devices.push({
                            text: device.label,
                            value: device.deviceId
                        });
                    }
                }
            });
        } catch {
            console.error('failed to load media devices!');
        }

        let script = document.createElement('script');
        script.src = 'https://stretch3.github.io/ml5-library/ml5.min.js';
        document.head.appendChild(script);
    }

    /**
     * Initialize the result of image classification.
     */
    initImageProbableLabels() {
        this.imageProbableLabels = [];
    }

    initSoundProbableLabels() {
        this.soundProbableLabels = [];
    }

    getInfo() {
        this.locale = this.setLocale();

        return {
            id: 'tm2scratch',
            name: 'TM2Scratch',
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'whenReceived',
                    text: Message.when_received_block[this.locale],
                    blockType: BlockType.HAT,
                    arguments: {
                        LABEL: {
                            type: ArgumentType.STRING,
                            menu: 'received_menu',
                            defaultValue: Message.any[this.locale]
                        }
                    }
                },
                {
                    opcode: 'isImageLabelDetected',
                    text: Message.is_image_label_detected[this.locale],
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        LABEL: {
                            type: ArgumentType.STRING,
                            menu: 'image_labels_menu',
                            defaultValue: Message.any_without_of[this.locale]
                        }
                    }
                },
                {
                    opcode: 'imageLabelConfidence',
                    text: Message.image_label_confidence[this.locale],
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    arguments: {
                        LABEL: {
                            type: ArgumentType.STRING,
                            menu: 'image_labels_without_any_menu',
                            defaultValue: ''
                        }
                    }
                },
                {
                    opcode: 'setImageClassificationModelURL',
                    text: Message.image_classification_model_url[this.locale],
                    blockType: BlockType.COMMAND,
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: Message.image_classification_sample_model_url[this.locale]
                        }
                    }
                },
                {
                    opcode: 'classifyVideoImageBlock',
                    text: Message.classify_image[this.locale],
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'getImageLabel',
                    text: Message.image_label[this.locale],
                    blockType: BlockType.REPORTER
                },
                '---',
                {
                    opcode: 'whenReceivedSoundLabel',
                    text: Message.when_received_sound_label_block[this.locale],
                    blockType: BlockType.HAT,
                    arguments: {
                        LABEL: {
                            type: ArgumentType.STRING,
                            menu: 'received_sound_label_menu',
                            defaultValue: Message.any[this.locale]
                        }
                    }
                },
                {
                    opcode: 'isSoundLabelDetected',
                    text: Message.is_sound_label_detected[this.locale],
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        LABEL: {
                            type: ArgumentType.STRING,
                            menu: 'sound_labels_menu',
                            defaultValue: Message.any_without_of[this.locale]
                        }
                    }
                },
                {
                    opcode: 'soundLabelConfidence',
                    text: Message.sound_label_confidence[this.locale],
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    arguments: {
                        LABEL: {
                            type: ArgumentType.STRING,
                            menu: 'sound_labels_without_any_menu',
                            defaultValue: ''
                        }
                    }
                },
                {
                    opcode: 'setSoundClassificationModelURL',
                    text: Message.sound_classification_model_url[this.locale],
                    blockType: BlockType.COMMAND,
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: Message.sound_classification_sample_model_url[this.locale]
                        }
                    }
                },
                {
                    opcode: 'getSoundLabel',
                    text: Message.sound_label[this.locale],
                    blockType: BlockType.REPORTER
                },
                '---',
                {
                    opcode: 'toggleClassification',
                    text: Message.toggle_classification[this.locale],
                    blockType: BlockType.COMMAND,
                    arguments: {
                        CLASSIFICATION_STATE: {
                            type: ArgumentType.STRING,
                            menu: 'classification_menu',
                            defaultValue: 'off'
                        }
                    }
                },
                {
                    opcode: 'setClassificationInterval',
                    text: Message.set_classification_interval[this.locale],
                    blockType: BlockType.COMMAND,
                    arguments: {
                        CLASSIFICATION_INTERVAL: {
                            type: ArgumentType.STRING,
                            menu: 'classification_interval_menu',
                            defaultValue: '1'
                        }
                    }
                },
                {
                    opcode: 'setConfidenceThreshold',
                    text: Message.set_confidence_threshold[this.locale],
                    blockType: BlockType.COMMAND,
                    arguments: {
                        CONFIDENCE_THRESHOLD: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.5
                        }
                    }
                },
                {
                    opcode: 'getConfidenceThreshold',
                    text: Message.get_confidence_threshold[this.locale],
                    blockType: BlockType.REPORTER,
                    disableMonitor: true
                },
                {
                    opcode: 'videoToggle',
                    text: Message.video_toggle[this.locale],
                    blockType: BlockType.COMMAND,
                    arguments: {
                        VIDEO_STATE: {
                            type: ArgumentType.STRING,
                            menu: 'video_menu',
                            defaultValue: 'off'
                        }
                    }
                },
                {
                    opcode: 'switchCamera',
                    blockType: BlockType.COMMAND,
                    text: Message.switch_webcam[this.locale],
                    arguments: {
                        DEVICE: {
                            type: ArgumentType.STRING,
                            defaultValue: '',
                            menu: 'mediadevices'
                        }
                    }
                }
            ],
            menus: {
                received_menu: {
                    acceptReporters: true,
                    items: 'getLabelsMenu'
                },
                image_labels_menu: {
                    acceptReporters: true,
                    items: 'getLabelsWithAnyWithoutOfMenu'
                },
                image_labels_without_any_menu: {
                    acceptReporters: true,
                    items: 'getLabelsWithoutAnyMenu'
                },
                received_sound_label_menu: {
                    acceptReporters: true,
                    items: 'getSoundLabelsWithoutBackgroundMenu'
                },
                sound_labels_menu: {
                    acceptReporters: true,
                    items: 'getSoundLabelsWithoutBackgroundWithAnyWithoutOfMenu'
                },
                sound_labels_without_any_menu: {
                    acceptReporters: true,
                    items: 'getSoundLabelsWithoutAnyMenu'
                },
                video_menu: this.getVideoMenu(),
                classification_interval_menu: this.getClassificationIntervalMenu(),
                classification_menu: this.getClassificationMenu(),
                mediadevices: {
                    acceptReporters: true,
                    items: 'getDevices'
                }
            }
        };
    }

    /**
     * Detect change of the selected image label is the most probable one or not.
     * @param {object} args - The block's arguments.
     * @property {string} LABEL - The label to detect.
     * @return {boolean} - Whether the label is most probable or not.
     */
    whenReceived(args) {
        const label = this.getImageLabel();
        if (args.LABEL === Message.any[this.locale]) {
            return label !== '';
        }
        return label === args.LABEL;
    }

    /**
     * Detect change of the selected sound label is the most probable one or not.
     * @param {object} args - The block's arguments.
     * @property {string} LABEL - The label to detect.
     * @return {boolean} - Whether the label is most probable or not.
     */
    whenReceivedSoundLabel(args) {
        if (!this.soundClassifierEnabled) {
            return;
        }

        const label = this.getSoundLabel();
        if (args.LABEL === Message.any[this.locale]) {
            return label !== '';
        }
        return label === args.LABEL;
    }

    /**
     * Return whether the most probable image label is the selected one or not.
     * @param {object} args - The block's arguments.
     * @property {string} LABEL - The label to detect.
     * @return {boolean} - Whether the label is most probable or not.
     */
    isImageLabelDetected(args) {
        const label = this.getImageLabel();
        if (args.LABEL === Message.any[this.locale]) {
            return label !== '';
        }
        return label === args.LABEL;
    }

    /**
     * Return whether the most probable sound label is the selected one or not.
     * @param {object} args - The block's arguments.
     * @property {string} LABEL - The label to detect.
     * @return {boolean} - Whether the label is most probable or not.
     */
    isSoundLabelDetected(args) {
        const label = this.getSoundLabel();
        if (args.LABEL === Message.any[this.locale]) {
            return label !== '';
        }
        return label === args.LABEL;
    }

    /**
     * Return confidence of the image label.
     * @param {object} args - The block's arguments.
     * @property {string} LABEL - Selected label.
     * @return {number} - Confidence of the label.
     */
    imageLabelConfidence(args) {
        if (args.LABEL === '') {
            return 0;
        }
        const entry = this.imageProbableLabels.find(element => element.label === args.LABEL);
        return (entry ? entry.confidence : 0);
    }

    /**
     * Return confidence of the sound label.
     * @param {object} args - The block's arguments.
     * @property {string} LABEL - Selected label.
     * @return {number} - Confidence of the label.
     */
    soundLabelConfidence(args) {
        if (!this.soundProbableLabels || this.soundProbableLabels.length === 0) return 0;

        if (args.LABEL === '') {
            return 0;
        }
        const entry = this.soundProbableLabels.find(element => element.label === args.LABEL);
        return (entry ? entry.confidence : 0);
    }

    /**
     * Set a model for image classification from URL.
     * @param {object} args - the block's arguments.
     * @property {string} URL - URL of model to be loaded.
     * @return {Promise} - A Promise that resolve after loaded.
     */
    setImageClassificationModelURL(args) {
        return this.loadImageClassificationModelFromURL(args.URL);
    }

    /**
     * Set a model for sound classification from URL.
     * @param {object} args - the block's arguments.
     * @property {string} URL - URL of model to be loaded.
     * @return {Promise} - A Promise that resolve after loaded.
     */
    setSoundClassificationModelURL(args) {
        return this.loadSoundClassificationModelFromURL(args.URL);
    }

    /**
     * Load a model from URL for image classification.
     * @param {string} url - URL of model to be loaded.
     * @return {Promise} - A Promise that resolves after loaded.
     */
    loadImageClassificationModelFromURL(url) {
        return new Promise(resolve => {
            const timestamp = new Date().getTime();
            fetch(`${url}metadata.json?${timestamp}`)
                .then(res => res.json())
                .then(metadata => {
                    if (url === this.imageModelUrl &&
                        (new Date(metadata.timeStamp).getTime() === new Date(this.imageMetadata.timeStamp).getTime())) {
                        log.info(`image model already loaded: ${url}`);
                        resolve();
                    } else {
                        ml5.imageClassifier(`${url}model.json?${timestamp}`)
                            .then(classifier => {
                                this.imageModelUrl = url;
                                this.imageMetadata = metadata;
                                this.imageClassifier = classifier;
                                this.initImageProbableLabels();
                                log.info(`image model loaded from: ${url}`);
                            })
                            .catch(error => {
                                log.warn(error);
                            })
                            .finally(() => resolve());
                    }
                })
                .catch(error => {
                    log.warn(error);
                    resolve();
                });
        });
    }

    /**
     * Load a model from URL for sound classification.
     * @param {string} url - URL of model to be loaded.
     * @return {Promise} - A Promise that resolves after loaded.
     */
    loadSoundClassificationModelFromURL(url) {
        return new Promise(resolve => {
            const timestamp = new Date().getTime();
            fetch(`${url}metadata.json?${timestamp}`)
                .then(res => res.json())
                .then(metadata => {
                    if (url === this.soundModelUrl &&
                        (new Date(metadata.timeStamp).getTime() === new Date(this.soundMetadata.timeStamp).getTime())) {
                        log.info(`sound model already loaded: ${url}`);
                        resolve();
                    } else {
                        ml5.soundClassifier(`${url}model.json`)
                            .then(classifier => {
                                this.soundModelUrl = url;
                                this.soundMetadata = metadata;
                                this.soundClassifier = classifier;
                                this.initSoundProbableLabels();
                                this.soundClassifierEnabled = true;
                                this.classifySound();
                                log.info(`sound model loaded from: ${url}`);
                            })
                            .catch(error => {
                                log.warn(error);
                            })
                            .finally(() => resolve());
                    }
                })
                .catch(error => {
                    log.warn(error);
                    resolve();
                });
        });
    }

    /**
     * Return menu items to detect label in the image.
     * @return {Array} - Menu items with 'any'.
     */
    getLabelsMenu() {
        let items = [Message.any[this.locale]];
        if (!this.imageMetadata) return items;
        items = items.concat(this.imageMetadata.labels);
        return items;
    }

    /**
     * Return menu items to detect label in the image.
     * @return {Array} - Menu items with 'any without of'.
     */
    getLabelsWithAnyWithoutOfMenu() {
        let items = [Message.any_without_of[this.locale]];
        if (!this.imageMetadata) return items;
        items = items.concat(this.imageMetadata.labels);
        return items;
    }

    /**
     * Return menu items to detect label in the image.
     * @return {Array} - Menu items with 'any'.
     */
    getSoundLabelsMenu() {
        let items = [Message.any[this.locale]];
        if (!this.soundMetadata) return items;
        items = items.concat(this.soundMetadata.wordLabels);
        return items;
    }

    /**
     * Return menu itmes to get properties of the image label.
     * @return {Array} - Menu items with ''.
     */
    getLabelsWithoutAnyMenu() {
        let items = [''];
        if (this.imageMetadata) {
            items = items.concat(this.imageMetadata.labels);
        }
        return items;
    }

    /**
     * Return menu itmes to get properties of the sound label.
     * @return {Array} - Menu items with ''.
     */
    getSoundLabelsWithoutAnyMenu() {
        if (this.soundMetadata) {
            return this.soundMetadata.wordLabels;
        } else {
            return [''];
        }
    }

    /**
     * Return menu itmes to get properties of the sound label.
     * @return {Array} - Menu items without '_background_noise_'.
     */
    getSoundLabelsWithoutBackgroundMenu() {
        let items = [Message.any[this.locale]];
        if (!this.soundMetadata) return items;
        let arr = this.soundMetadata.wordLabels;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] !== '_background_noise_') {
                items.push(arr[i]);
            }
        }
        return items;
    }

    /**
     * Return menu itmes to get properties of the sound label.
     * @return {Array} - Menu items without '_background_noise_' and with 'any without of'.
     */
    getSoundLabelsWithoutBackgroundWithAnyWithoutOfMenu() {
        let items = [Message.any_without_of[this.locale]];
        if (!this.soundMetadata) return items;
        let arr = this.soundMetadata.wordLabels;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] !== '_background_noise_') {
                items.push(arr[i]);
            }
        }
        return items;
    }

    /**
     * Pick a probability which has highest confidence.
     * @param {Array} probabilities - An Array of probabilities.
     * @property {number} probabilities.confidence - Probability of the label.
     * @return {object} - One of the highest confidence probability.
     */
    getMostProbableOne(probabilities) {
        if (probabilities.length === 0) return null;
        let mostOne = probabilities[0];
        probabilities.forEach(clss => {
            if (clss.confidence > mostOne.confidence) {
                mostOne = clss;
            }
        });
        return mostOne;
    }

    /**
     * Classify image from the video input.
     * Call stack will wait until the previous classification was done.
     *
     * @param {object} _args - the block's arguments.
     * @param {object} util - utility object provided by the runtime.
     * @return {Promise} - a Promise that resolves after classification.
     */
    classifyVideoImageBlock(_args, util) {
        if (this._isImageClassifying) {
            if (util) util.yield();
            return;
        }
        return new Promise(resolve => {
            this.classifyImage(this.video)
                .then(result => {
                    resolve(JSON.stringify(result));
                });
        });
    }

    /**
     * Classyfy image from input data source.
     *
     * @param {HTMLImageElement | ImageData | HTMLCanvasElement | HTMLVideoElement} input
     *  - Data source for classification.
     * @return {Promise} - A Promise that resolves the result of classification.
     *  The result will be empty when the imageClassifier was not set.
     */
    classifyImage(input) {
        if (!this.imageMetadata || !this.imageClassifier) {
            this._isImageClassifying = false;
            return Promise.resolve([]);
        }
        this._isImageClassifying = true;
        return this.imageClassifier.classify(input)
            .then(result => {
                this.imageProbableLabels = result.slice();
                this.imageProbableLabelsUpdated = true;
                return result;
            })
            .finally(() => {
                setTimeout(() => {
                    // Initialize probabilities to reset whenReceived blocks.
                    this.initImageProbableLabels();
                    this._isImageClassifying = false;
                }, this.interval);
            });
    }

    /**
     * Classify sound.
     */
    classifySound() {
        this.soundClassifier.classify((err, result) => {
            if (this.soundClassifierEnabled && result) {
                this.soundProbableLabels = result.slice();
                setTimeout(() => {
                    // Initialize probabilities to reset whenReceivedSoundLabel blocks.
                    this.initSoundProbableLabels();
                }, this.interval);
            }
            if (err) {
                console.error(err);
            }
        });
    }

    /**
     * Get the most probable label in the image.
     * Retrun the last classification result or '' when the first classification was not done.
     * @return {string} label
    */
    getImageLabel() {
        if (!this.imageProbableLabels || this.imageProbableLabels.length === 0) return '';
        const mostOne = this.getMostProbableOne(this.imageProbableLabels);
        return (mostOne.confidence >= this.confidenceThreshold) ? mostOne.label : '';
    }

    /**
     * Get the most probable label in the sound.
     * Retrun the last classification result or '' when the first classification was not done.
     * @return {string} label
    */
    getSoundLabel() {
        if (!this.soundProbableLabels || this.soundProbableLabels.length === 0) return '';
        const mostOne = this.getMostProbableOne(this.soundProbableLabels);
        return (mostOne.confidence >= this.confidenceThreshold) ? mostOne.label : '';
    }

    /**
     * Set confidence threshold which should be over for detected label.
     * @param {object} args - the block's arguments.
     * @property {number} CONFIDENCE_THRESHOLD - Value of confidence threshold.
     */
    setConfidenceThreshold(args) {
        let threshold = Cast.toNumber(args.CONFIDENCE_THRESHOLD);
        threshold = MathUtil.clamp(threshold, 0, 1);
        this.confidenceThreshold = threshold;
    }

    /**
     * Get confidence threshold which should be over for detected label.
     * @param {object} args - the block's arguments.
     * @return {number} - Value of confidence threshold.
     */
    getConfidenceThreshold() {
        return this.confidenceThreshold;
    }

    /**
     * Set state of the continuous classification.
     * @param {object} args - the block's arguments.
     * @property {string} CLASSIFICATION_STATE - State to be ['on'|'off'].
     */
    toggleClassification(args) {
        const state = args.CLASSIFICATION_STATE;
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.soundClassifierEnabled = false;
        if (state === 'on') {
            this.timer = setInterval(() => {
                this.classifyVideoImage();
            }, this.minInterval);
            this.soundClassifierEnabled = true;
        }
    }

    /**
     * Set interval time of the continuous classification.
     * @param {object} args - the block's arguments.
     * @property {number} CLASSIFICATION_INTERVAL - Interval time (seconds).
     */
    setClassificationInterval(args) {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.interval = args.CLASSIFICATION_INTERVAL * 1000;
        this.timer = setInterval(() => {
            this.classifyVideoImage();
        }, this.minInterval);
    }

    /**
     * Show video image on the stage or not.
     * @param {object} args - the block's arguments.
     * @property {string} VIDEO_STATE - Show or not ['on'|'off'].
     */
    videoToggle(args) {
        const state = args.VIDEO_STATE;
        if (state === 'off') {
            this.runtime.ioDevices.video.disableVideo();
        } else {
            this.runtime.ioDevices.video.enableVideo();
            this.runtime.ioDevices.video.mirror = state === 'on';
        }
    }

    /**
     * Classify video image.
     * @return {Promise} - A Promise that resolves the result of classification.
     *  The result will be empty when another classification was under going.
     */
    classifyVideoImage() {
        if (this._isImageClassifying) return Promise.resolve([]);
        return this.classifyImage(this.video);
    }

    /**
     * Return menu for video showing state.
     * @return {Array} - Menu items.
     */
    getVideoMenu() {
        return [
            {
                text: Message.off[this.locale],
                value: 'off'
            },
            {
                text: Message.on[this.locale],
                value: 'on'
            },
            {
                text: Message.video_on_flipped[this.locale],
                value: 'on-flipped'
            }
        ];
    }

    /**
     * Return menu for classification interval setting.
     * @return {object} - Menu.
     */
    getClassificationIntervalMenu() {
        return {
            acceptReporters: true,
            items: [
                {
                    text: '1',
                    value: '1'
                },
                {
                    text: '0.5',
                    value: '0.5'
                },
                {
                    text: '0.2',
                    value: '0.2'
                },
                {
                    text: '0.1',
                    value: '0.1'
                }
            ]
        };
    }

    /**
     * Return menu for continuous classification state.
     * @return {Array} - Menu items.
     */
    getClassificationMenu() {
        return [
            {
                text: Message.off[this.locale],
                value: 'off'
            },
            {
                text: Message.on[this.locale],
                value: 'on'
            }
        ];
    }

    /**
     * Get locale for message text.
     * @return {string} - Locale of this editor.
     */
    setLocale() {
        const locale = formatMessage.setup().locale;
        if (AvailableLocales.includes(locale)) {
            return locale;
        }
        return 'en';

    }
    switchCamera(args) {
        if (args.DEVICE !== '') {
            if (this.runtime.ioDevices.video.provider._track !== null) {
                this.runtime.ioDevices.video.provider._track.stop();
                const deviceId = args.DEVICE;
                navigator.mediaDevices.getUserMedia({ audio: false, video: { deviceId } }).then(
                    stream => {
                        try {
                            this.runtime.ioDevices.video.provider._video.srcObject = stream;
                        } catch (error) {
                            this.runtime.ioDevices.video.provider._video.src = window.URL.createObjectURL(stream);
                        }
                        // Needed for Safari/Firefox, Chrome auto-plays.
                        this.runtime.ioDevices.video.provider._video.play();
                        this.runtime.ioDevices.video.provider._track = stream.getTracks()[0];
                    }
                );
            }
        }
    }

    getDevices() {
        return this.devices;
    }

    getBasename (url) {
        url = url.replace(/\/+$/, '');
        return url.split('/').pop();
    }
}

module.exports = Scratch3TM2ScratchBlocks;
