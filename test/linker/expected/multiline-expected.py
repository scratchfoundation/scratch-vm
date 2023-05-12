async def thread_id_0(vm_proxy):
    move = vm_proxy.move
    goTo = vm_proxy.goTo
    goTo("target1")
    move(10)

