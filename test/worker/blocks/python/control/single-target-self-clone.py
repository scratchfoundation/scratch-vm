async def thread_id_0(vm_proxy):
    createClone = vm_proxy.createClone
    await createClone('myself')

