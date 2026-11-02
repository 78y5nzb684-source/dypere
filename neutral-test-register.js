if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./service-worker.js').then(r => r.update()).catch(() => {}); }
