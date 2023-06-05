async def thread_id_0(vm_proxy):
    distanceTo = vm_proxy.distanceTo
    say = vm_proxy.say
    result = await distanceTo('Cat')
    say(result)

