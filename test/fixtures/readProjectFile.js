const AdmZip = require('adm-zip');
const fs = require('fs');

module.exports = {
    readAsBuffer: function (path) {
        return new Buffer(fs.readFileSync(path));
    },
    readAsString: function (path) {
        const zip = new AdmZip(path);
        return zip.readAsText('project.json', 'utf8');
    }
};
