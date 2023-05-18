async def thread_id_0(vm_proxy):
    current = vm_proxy.current
    say = vm_proxy.say
    result = await current('hour')
    say(result)

