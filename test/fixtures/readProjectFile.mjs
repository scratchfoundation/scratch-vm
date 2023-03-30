import AdmZip from 'adm-zip';
import fs from 'fs';


export const readFileToBuffer  = (path) => {
    return Buffer.from(fs.readFileSync(path));
}
export const extractProjectJson = (path) => {
    const zip = new AdmZip(path);
    const projectEntry = zip.getEntries().find(item => item.entryName.match(/project\.json/));
    if (projectEntry) {
        return JSON.parse(zip.readAsText(projectEntry.entryName, 'utf8'));
    }
    return null;
}

export const extractAsset = (path, assetFileName) => {
    const zip = new AdmZip(path);
    const assetEntry = zip.getEntries().find(item => item.entryName.match(assetFileName));
    return assetEntry.getData();
}
