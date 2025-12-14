
const SCRIPT_URL = 'https://script.google.com/a/macros/thaimooc.ac.th/s/AKfycbwm0CK-TOTzg96BE-Km0ieyZ1OESnNnh7njAF5gZ0pA2tNCDiLs59GvcU-sxA69ecUPvA/exec';

// Use 'text/plain' to avoid CORS preflight checks (OPTIONS request) in Google Apps Script.
const POST_OPTIONS = {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
};

export const api = {
  // Load all data on startup
  loadAllData: async () => {
    try {
      const response = await fetch(SCRIPT_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn("API Connection Failed. Using offline mode.", error);
      // Return empty structure or local storage if implemented, for now return null to let Context use defaults
      return null;
    }
  },

  // Generic action sender
  sendAction: async (action: string, payload: any) => {
    try {
      const body = JSON.stringify({ action, ...payload });
      const response = await fetch(SCRIPT_URL, {
        ...POST_OPTIONS,
        body: body
      });
      
      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      console.warn(`Action '${action}' failed to sync with server.`, error);
      return false; 
    }
  }
};
