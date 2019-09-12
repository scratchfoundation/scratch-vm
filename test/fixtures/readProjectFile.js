const AdmZip = require('adm-zip');
const fs = require('fs');

module.exports = {
    readFileToBuffer: function (path) {
        return new Buffer(fs.readFileSync(path));
    },
    extractProjectJson: function (path) {
        const zip = new AdmZip(path);
        const projectEntry = zip.getEntries().filter(item => item.entryName.match(/project\.json/))[0];
        if (projectEntry) {
            return JSON.parse(zip.readAsText(projectEntry.entryName, 'utf8'));
        }
        return null;
    }
};
