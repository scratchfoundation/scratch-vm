async def thread_id_0(vm_proxy):
    broadcastAndWait = vm_proxy.broadcastAndWait
    broadcastAndWait('message1')

