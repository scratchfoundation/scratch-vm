const AdmZip = require('adm-zip');
const fs = require('fs');

module.exports = {
    readFileToBuffer: function (path) {
        return new Buffer(fs.readFileSync(path));
    },
    extractProjectJson: function (path) {
        const zip = new AdmZip(path);
        return JSON.parse(zip.readAsText('project.json', 'utf8'));
    }
};
