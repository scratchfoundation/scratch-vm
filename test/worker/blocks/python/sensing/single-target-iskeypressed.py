async def thread_id_0(vm_proxy):
    isKeyPressed = vm_proxy.isKeyPressed
    say = vm_proxy.say
    result = await isKeyPressed('g')
    say(result)

