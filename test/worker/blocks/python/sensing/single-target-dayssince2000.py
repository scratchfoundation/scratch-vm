async def thread_id_0(vm_proxy):
    daysSince2000 = vm_proxy.daysSince2000
    say = vm_proxy.say
    result = await daysSince2000()
    say(result)

