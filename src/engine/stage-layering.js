class StageLayering {
    static get BACKGROUND_LAYER () {
        return 'background';
    }

    static get EXTENSION_LAYER () {
        return 'extensions';
    }

    static get SPRITE_LAYER () {
        return 'sprite';
    }

    static get BUBBLE_LAYER () {
        return 'bubble';
    }

    static get BACKGROUND_ORDER () {
        return 0;
    }

    // Video should be in the back of the extension group
    static get VIDEO_ORDER () {
        return 0;
    }

    static get PEN_ORDER () {
        return 1;
    }

    // Order of layer groups relative to each other,
    // and ordering style of each
    // Currently extensions are the only layer group
    // that have an explicit ordering (e.g. video must be behind pen).
    // All other groups here are ordered based on when they get added
    static get LAYER_GROUPS () {
        return [
            {
                group: StageLayering.BACKGROUND_LAYER,
                // This is a weird use case for a layer group ordering style,
                // because in the main Scratch use case, this group has only one item,
                // so ordering of the items doesn't really matter.
                explicitOrdering: false

            },
            {
                group: StageLayering.EXTENSION_LAYER,
                explicitOrdering: true
            },
            {
                group: StageLayering.SPRITE_LAYER,
                explicitOrdering: false
            },
            {
                group: StageLayering.BUBBLE_LAYER,
                explicitOrdering: false
            }

        ];
    }
}

module.exports = StageLayering;
