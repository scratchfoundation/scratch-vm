async def thread_id_0(vm_proxy):
    getMouseY = vm_proxy.getMouseY
    say = vm_proxy.say
    result = await getMouseY()
    await say(result)

