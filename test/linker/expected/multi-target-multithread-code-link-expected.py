## -- target1 -- ##

async def target1_0(vm_proxy):
    move = vm_proxy.move
    move(10)

async def target1_1(vm_proxy):
    goToXY = vm_proxy.goToXY
    goToXY(10, 10)

## -- target2 -- ##

async def target2_0(vm_proxy):
    goTo = vm_proxy.goTo
    goTo("target2")

async def target2_1(vm_proxy):
    turnRight = vm_proxy.turnRight
    turnRight(90)

