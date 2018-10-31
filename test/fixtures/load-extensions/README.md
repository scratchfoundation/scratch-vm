Tests in this folder are run in scratch by integration/load-extensions.js to determine whether an extension can load properly. The test projects in this folder are examples of non-core extensions usage. Read integration/load-extensions.js for more.

### Adding new extensions

When extending Scratch with non-core extensions, save an example project to this directory with the naming convention:

`[extensionID]-rest-of-file-name.[file type sb3 or sb2]`

The load-extensions.js test will automatically test this new project file since it gets a list of all files in this directory for testing and extracts the extension id from the first section of the file same separated by a dash.

Each of the `[extensionID]-simple-project` test files have been made as the simplest possible cases for loading the extension. This means that only one block has been added to the project and that block is from the relevant extension.

### Adding more example projects

Sometimes we need to test more complex projects to catch cases and contexts where an extension should load and doesn't. We can save those project files using the convention [extensionID]-project-name. For example, the Dolphins 3D project (#115870836) had a pen extension that wouldn't load, whereas `pen-simple-project.sb2` and `pen-simple-project.sb3` did pass these tests. For this reason, `pen-dolphin-3d.sb2` and `pen-dolphin-3d.sb3` are now part of the test examples.

### // TO DO
The translation and videoSensing extensions don't have test projects added for them yet since they need a little more infrastructure stubbed out in the test.



