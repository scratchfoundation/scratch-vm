async def thread_id_0(vm_proxy):
    move = vm_proxy.move
    async def move2(steps):
        await move(steps)
        await move(steps)
    
    await move2(10)

