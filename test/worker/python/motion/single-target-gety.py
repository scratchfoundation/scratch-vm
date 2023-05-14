async def thread_id_0(vm_proxy):
    getY = vm_proxy.getY
    setY = vm_proxy.setY
    y = await getY()
    setY(y)

