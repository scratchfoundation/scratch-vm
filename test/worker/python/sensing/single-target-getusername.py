async def thread_id_0(vm_proxy):
    getUsername = vm_proxy.getUsername
    say = vm_proxy.say
    result = await getUsername()
    say(result)

