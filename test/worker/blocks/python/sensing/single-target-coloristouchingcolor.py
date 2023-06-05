async def thread_id_0(vm_proxy):
    isColorTouchingColor = vm_proxy.isColorTouchingColor
    say = vm_proxy.say
    result = await isColorTouchingColor('green', 'red')
    say(result)

