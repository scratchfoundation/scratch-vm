## -- target1 -- ##

async def target1_0(vm_bridge):
    [say,move,think] = vm_bridge
    say("Hello World!")

async def target1_1(vm_bridge):
    [say,move,think] = vm_bridge
    move(10)

## -- target2 -- ##

async def target2_0(vm_bridge):
    [say,move,think] = vm_bridge
    think("Hello Universe!")

async def target2_1(vm_bridge):
    [say,move,think] = vm_bridge
    move(5)

