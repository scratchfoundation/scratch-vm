def throw_interrupt_error():
    raise RuntimeError("Thread Interrupted")

async def thread_id_0(vm_proxy):
    move = vm_proxy.move
    import asyncio
    await move(10)
    await asyncio.sleep(0.1)
    await move(10)
