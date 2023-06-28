async def thread_id_0(vm_proxy):
    say = vm_proxy.say
    mov(10)
    await say("Hello, world!")

