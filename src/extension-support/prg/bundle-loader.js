import { FrameworkID, AuxiliaryExtensionInfo } from "../../dist/globals";

/**
 * Initialize an extension (if it supports the PRG Framework strategy of initialization)
 * @param {Extension} extension 
 * @returns 
 */
export const tryInitExtension = (extension) =>
  extensionInit in extension
    ? Promise.resolve(extension[extensionInit]())
    : Promise.resolve();

/**
 * Try to retrieve the constructor of an Extension loaded from an external bundle
 * @param {string} id ID of Extension (bundle) to load
 * @returns {Constructor<Extension>}
 */
export const tryGetExtensionConstructorFromBundle = async (id) => {
  if (constructors.has(id)) return constructors.get(id);

  const success = await tryImportExtensionBundle(id,
    {
      onLoad: function () {
        const { Extension, ...aux } = window[id];
        constructors.set(id, class extends Extension {
          constructor(runtime) { super(runtime, ...window[AuxiliaryExtensionInfo][id]) }
        });
        auxiliarObjects.set(id, aux);
      },
      onError: () => console.log(`Unable to load bundle for ${id}`)
    }
  );

  return success ? constructors.get(id) : undefined;
}

/**
 * Try to retrieve external objects loaded with a given Extension bundle
 * @param {*} id 
 * @param {*} name 
 * @returns 
 */
export const tryGetAuxiliaryObjectFromLoadedBundle = (id, name) => {
  if (!auxiliarObjects.has(id)) return notLoadedError();
  const auxiliarContainer = auxiliarObjects.get(id);
  return (name in auxiliarContainer) ? auxiliarContainer[name] : unknownPropertyError();
}

const extensionInit = "internal_init";
const constructors = new Map();
const auxiliarObjects = new Map();

const untilScriptLoaded = (endpoint, { onLoad, onError }) => {
  var scriptTag = document.createElement('script');
  scriptTag.src = `${location.href.split("?")[0]}/static/${endpoint}`;
  return new Promise((resolve, reject) => {
    scriptTag.onload = () => resolve(onLoad());
    scriptTag.onerror = () => reject(onError())
    document.body.appendChild(scriptTag);
  });
}

const getEndPoint = (filename) => `extension-bundles/${filename}.js`;

const getCommonObject = (id) => window[id];

const validateCommonObject = (id) => getCommonObject(id)
  ? console.log(`'${id}' succesfully loaded!`)
  : console.error(`Could not find '${id}' object after loading script`);

const untilCommonObjects = (...IDs) => Promise.all(
  IDs.map(id => getCommonObject(id)
    ? Promise.resolve()
    : untilScriptLoaded(getEndPoint(id),
      {
        onLoad: () => validateCommonObject(id),
        onError: () => { throw new Error(`Could not load ${id}`) }
      }
    ))
);

const tryImportExtensionBundle = async (id, callbacks) => {
  try {
    await untilCommonObjects(FrameworkID, AuxiliaryExtensionInfo);
    await untilScriptLoaded(getEndPoint(id), callbacks);
    return true;
  }
  catch (e) {
    console.error(e);
    return false;
  }
}

const notLoadedError = () => console.error("Tried to access auxiliar constructor of an extension bundle that wasn't already loaded.");
const unknownPropertyError = (name, id) => console.error(`The requested object '${name}' was not loaded with extension ${id}`);