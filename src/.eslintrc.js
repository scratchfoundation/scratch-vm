module.exports = {
    root: true,
    extends: ['scratch', 'scratch/es6'],
    env: {
        browser: true
    },
    rules: {
        // Override our default settings just for this directory
        "max-len": "off"
    }
};
