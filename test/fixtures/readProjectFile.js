const AdmZip = require('adm-zip');
const fs = require('fs');

module.exports = {
    readFileToBuffer: function (path) {
        return Buffer.from(fs.readFileSync(path));
    },
    extractProjectJson: function (path) {
        const zip = new AdmZip(path);
        const projectEntry = zip.getEntries().find(item => item.entryName.match(/project\.json/));
        if (projectEntry) {
            return JSON.parse(zip.readAsText(projectEntry.entryName, 'utf8'));
        }
        return null;
    },
    extractAsset: function (path, assetFileName) {
        const zip = new AdmZip(path);
        const assetEntry = zip.getEntries().find(item => item.entryName.match(assetFileName));
        return assetEntry.getData();
    }
};
