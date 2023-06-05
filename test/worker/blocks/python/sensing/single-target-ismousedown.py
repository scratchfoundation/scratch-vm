async def thread_id_0(vm_proxy):
    isMouseDown = vm_proxy.isMouseDown
    say = vm_proxy.say
    result = await isMouseDown()
    say(result)

