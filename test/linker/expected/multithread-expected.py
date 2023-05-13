async def thread_id_0(vm_proxy):
    move = vm_proxy.move
    move(10)

async def thread_id_1(vm_proxy):
    goToXY = vm_proxy.goToXY
    goToXY(10, 10)

async def thread_id_2(vm_proxy):
    goTo = vm_proxy.goTo
    goTo("target2")

async def thread_id_3(vm_proxy):
    turnRight = vm_proxy.turnRight
    turnRight(90)

