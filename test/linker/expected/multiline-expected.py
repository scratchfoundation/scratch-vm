def throw_interrupt_error():
    raise RuntimeError("Thread Interrupted")

async def thread_id_0(vm_proxy):
    move = vm_proxy.move
    goTo = vm_proxy.goTo
    await goTo("target1")
    await move(10)

