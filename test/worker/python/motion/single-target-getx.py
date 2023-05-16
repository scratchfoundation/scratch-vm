async def thread_id_0(vm_proxy):
    getX = vm_proxy.getX
    setX = vm_proxy.setX
    x = await getX()
    setX(x)

