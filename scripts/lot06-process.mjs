// A signal-terminated child can have exitCode=null AND signalCode='SIGTERM'.
// Waiting for its exit event a second time otherwise leaves an unsettled await.
export async function terminateWorker(child) {
  if(!child || child.exitCode!==null || child.signalCode!==null)return;
  await new Promise((done,reject)=>{
    const timer=setTimeout(()=>{child.off('exit',exit);reject(Error('Worker did not terminate within 2 seconds'));},2000);
    const exit=()=>{clearTimeout(timer);done();};
    child.once('exit',exit);
    child.kill();
  });
}
