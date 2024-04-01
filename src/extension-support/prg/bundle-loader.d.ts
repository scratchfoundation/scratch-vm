export function tryInitExtension(extension: Extension): Promise<any>;
export function tryGetExtensionConstructorFromBundle(id: string): Constructor<Extension>;
export function tryGetAuxiliaryObjectFromLoadedBundle(id: any, name: any): any;
