## scratch-vm

## Installation
```bash
npm install scratch-vm
```

## Setup
```js
var VirtualMachine = require('scratch-vm');
var vm = new VirtualMachine();

// Block events

// UI events

// Listen for events
```

## Standalone Build
```bash
make build
```

```html
<script src="/path/to/vm.js"></script>
<script>
    var vm = new window.VirtualMachine();
    // do things
</script>
```

## Testing
```bash
make test
```

```bash
make coverage
```

```bash
make benchmark
```
