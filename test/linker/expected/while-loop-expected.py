async def thread_id_0(vm_proxy):
    move = vm_proxy.move
    while True:
        await move(10)
        await move(10)

