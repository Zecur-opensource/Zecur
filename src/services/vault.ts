export const Vault = {
  // Simpan API Key
  saveKey: (key: string) => localStorage.setItem('ZECUR_API_KEY', key),
  
  // Ambil API Key
  getKey: () => localStorage.getItem('ZECUR_API_KEY'),
  
  // Simpan Model yang dipilih
  saveModel: (model: string) => localStorage.setItem('ZECUR_MODEL', model),
  
  // Ambil Model (Default: gemini-1.5-flash)
  getModel: () => localStorage.getItem('ZECUR_MODEL') || 'gemini-1.5-flash',
};
