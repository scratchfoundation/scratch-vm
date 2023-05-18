async def thread_id_0(vm_proxy):
    getAttributeOf = vm_proxy.getAttributeOf
    say = vm_proxy.say
    result = await getAttributeOf("Cat", "size")
    say(result)

