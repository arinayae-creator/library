
// URL ของ Google Apps Script ที่ Deploy แล้ว
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyak0c-ZG6Q-qU4XMgc4C3Bp-Bt95TcUsro-VV4oDA4Qbq1kk_Hqc7pU5CIHSiUhBre/exec';

// ใช้ 'text/plain' เพื่อหลีกเลี่ยง CORS Preflight (OPTIONS request)
// Google Apps Script รองรับ Simple Request แบบนี้ได้ดีที่สุด
const POST_OPTIONS = {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
};

export const api = {
  // โหลดข้อมูลทั้งหมดเมื่อเปิดเว็บ
  loadAllData: async () => {
    try {
      const response = await fetch(SCRIPT_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn("API Connection Failed. Using offline mode/cache if available.", error);
      return null;
    }
  },

  // ส่งคำสั่งบันทึกข้อมูล (Save)
  sendAction: async (action: string, payload: any) => {
    try {
      // ห่อข้อมูลใน payload และแปลงเป็น JSON String
      const body = JSON.stringify({ action, ...payload });
      
      const response = await fetch(SCRIPT_URL, {
        ...POST_OPTIONS,
        body: body
      });
      
      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      console.error(`Action '${action}' failed to sync with server.`, error);
      return false; 
    }
  }
};
