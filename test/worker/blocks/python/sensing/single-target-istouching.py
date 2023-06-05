async def thread_id_0(vm_proxy):
    isTouching = vm_proxy.isTouching
    say = vm_proxy.say
    result = await isTouching('Cat')
    say(result)

