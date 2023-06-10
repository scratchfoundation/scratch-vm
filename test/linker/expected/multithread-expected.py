def throw_interrupt_error():
    raise RuntimeError("Thread Interrupted")

async def thread_id_0(vm_proxy):
    move = vm_proxy.move
    await move(10)

async def thread_id_1(vm_proxy):
    goToXY = vm_proxy.goToXY
    await goToXY(10, 10)

async def thread_id_2(vm_proxy):
    goTo = vm_proxy.goTo
    await goTo("target2")

async def thread_id_3(vm_proxy):
    turnRight = vm_proxy.turnRight
    await turnRight(90)

