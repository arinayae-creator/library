
const SCRIPT_URL = 'https://script.google.com/a/macros/thaimooc.ac.th/s/AKfycbwm0CK-TOTzg96BE-Km0ieyZ1OESnNnh7njAF5gZ0pA2tNCDiLs59GvcU-sxA69ecUPvA/exec';

// Use 'text/plain' to avoid CORS preflight checks in Google Apps Script
const POST_OPTIONS = {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
};

export const api = {
  // Load all data on startup
  loadAllData: async () => {
    try {
      const response = await fetch(SCRIPT_URL);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to load data from Google Sheets", error);
      return null;
    }
  },

  // Generic action sender
  sendAction: async (action: string, payload: any) => {
    try {
      const body = JSON.stringify({ action, ...payload });
      // We use fetch but don't strictly block UI on response for speed, 
      // though in a real app you might want to wait.
      await fetch(SCRIPT_URL, {
        ...POST_OPTIONS,
        body: body
      });
      return true;
    } catch (error) {
      console.error(`Failed to perform action: ${action}`, error);
      return false;
    }
  }
};
