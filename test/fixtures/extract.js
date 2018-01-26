const AdmZip = require('adm-zip');

module.exports = function (path) {
    const zip = new AdmZip(path);
    return zip.readAsText('project.json', 'utf8');
};
