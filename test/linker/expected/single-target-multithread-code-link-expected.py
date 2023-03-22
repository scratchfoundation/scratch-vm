## -- target1 -- ##

async def target1_0(vm_proxy):
    goTo = vm_proxy.goTo
    goTo("target1")

async def target1_1(vm_proxy):
    move = vm_proxy.move
    move(10)

