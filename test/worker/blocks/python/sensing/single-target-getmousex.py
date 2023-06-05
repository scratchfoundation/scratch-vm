async def thread_id_0(vm_proxy):
    getMouseX = vm_proxy.getMouseX
    say = vm_proxy.say
    result = await getMouseX()
    await say(result)

