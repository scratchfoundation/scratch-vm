async def thread_id_0(vm_proxy):
    getLoudness = vm_proxy.getLoudness
    say = vm_proxy.say
    result = await getLoudness()
    say(result)

