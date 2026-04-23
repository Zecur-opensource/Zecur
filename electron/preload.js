const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Nanti kita tambahkan fungsi save/open file di sini
  ping: () => 'Zecur IDE is alive'
});
