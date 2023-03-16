## -- target1 -- ##

async def target1_0(vm_bridge):
    [say,move,think] = vm_bridge
    say("Hello World!")

async def target1_1(vm_bridge):
    [say,move,think] = vm_bridge
    move(10)

