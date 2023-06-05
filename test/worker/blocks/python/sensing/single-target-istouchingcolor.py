async def thread_id_0(vm_proxy):
    isTouchingColor = vm_proxy.isTouchingColor
    say = vm_proxy.say
    result = await isTouchingColor('green')
    await say(result)

