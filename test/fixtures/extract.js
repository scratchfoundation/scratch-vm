var AdmZip = require('adm-zip');

module.exports = function (path) {
    var zip = new AdmZip(path);
    return zip.readAsText('project.json', 'utf8');
};
