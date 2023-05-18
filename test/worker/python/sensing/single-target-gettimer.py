async def thread_id_0(vm_proxy):
    getTimer = vm_proxy.getTimer
    say = vm_proxy.say
    result = await getTimer()
    say(result)

