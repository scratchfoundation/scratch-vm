## scratch-vm
#### Scratch VM is a library for representing, running, and maintaining the state of computer programs written using [Scratch Blocks](https://github.com/LLK/scratch-blocks).

[![Build Status](https://travis-ci.org/LLK/scratch-vm.svg?branch=master)](https://travis-ci.org/LLK/scratch-vm)

## Installation
```bash
npm install scratch-vm
```

## Setup
```js
var VirtualMachine = require('scratch-vm');
var vm = new VirtualMachine();

// Block events
workspace.addChangeListener(function(e) {
    // Handle "tapping" a block
    if (e instanceof Blockly.Events.Ui && e.element === 'click') {
        var stackBlock = workspace.getBlockById(e.blockId).getRootBlock().id;
        vm.runtime.toggleStack(stackBlock);
    // Otherwise, pass along to the block listener
    } else {
        vm.blockListener(e);
    }
});

// Run threads
vm.runtime.start();
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

## Abstract Syntax Tree

#### Overview
The Virtual Machine constructs and maintains the state of an [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (AST) by listening to events emitted by the [scratch-blocks](https://github.com/LLK/scratch-blocks) workspace via the `blockListener`. At any time, the current state of the AST can be viewed by inspecting the `vm.runtime.blocks` object.

#### Anatomy of a Block
```json
{
    "id": "^1r~63Gdl7;Dh?I*OP3_",
    "opcode": "wedo_motorclockwise",
    "next": null,
    "fields": {
        "DURATION": {
            "name": "DURATION",
            "value": null,
            "blocks": {
                "1?P=eV(OiDY3vMk!24Ip": {
                    "id": "1?P=eV(OiDY3vMk!24Ip",
                    "opcode": "math_number",
                    "next": null,
                    "fields": {
                        "NUM": {
                            "name": "NUM",
                            "value": "10",
                            "blocks": null
                        }
                    }
                }
            }
        },
        "SUBSTACK": {
            "name": "SUBSTACK",
            "value": "@1ln(HsUO4!]*2*%BrE|",
            "blocks": null
        }
    }
}
```

## Testing
```bash
make test
```

```bash
make coverage
```

## Donate
We provide [Scratch](https://scratch.mit.edu) free of charge, and want to keep it that way! Please consider making a [donation](https://secure.donationpay.org/scratchfoundation/) to support our continued engineering, design, community, and resource development efforts. Donations of any size are appreciated. Thank you!
