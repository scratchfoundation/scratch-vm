async def thread_id_0(vm_proxy):
    getDirection = vm_proxy.getDirection
    pointInDirection = vm_proxy.pointInDirection
    direction = await getDirection()
    pointInDirection(direction)

