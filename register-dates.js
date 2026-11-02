if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./service-worker.js', {updateViaCache:'none'}).then(r=>r.update()).catch(()=>{}); }
