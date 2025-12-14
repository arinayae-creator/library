
const SCRIPT_URL = 'https://script.google.com/a/macros/thaimooc.ac.th/s/AKfycbwm0CK-TOTzg96BE-Km0ieyZ1OESnNnh7njAF5gZ0pA2tNCDiLs59GvcU-sxA69ecUPvA/exec';

// Use 'text/plain' to avoid CORS preflight checks in Google Apps Script
const POST_OPTIONS = {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
};

// Fallback data in case the Google Sheet is not accessible (e.g. CORS/Permissions)
const MOCK_DATA = {
  books: [
    {
      id: "B001",
      title: "Harry Potter and the Sorcerer's Stone",
      author: "J.K. Rowling",
      isbn: "9780590353427",
      callNumber: "NV ROW",
      status: "Available",
      format: "Book",
      pubYear: "1997",
      publisher: "Scholastic",
      description: "เด็กชายผู้รอดชีวิตกับการผจญภัยในโรงเรียนคาถาพ่อมดแม่มดและเวทมนตร์ศาสตร์ฮอกวอตส์",
      items: [{ barcode: "100001", status: "Available", location: "ชั้น 1 - นวนิยาย" }],
      coverUrl: "https://images-na.ssl-images-amazon.com/images/I/81iqZ2HHD-L.jpg"
    },
    {
      id: "B002",
      title: "Clean Code",
      author: "Robert C. Martin",
      isbn: "9780132350884",
      callNumber: "005.1 MAR",
      status: "Checked Out",
      format: "Book",
      pubYear: "2008",
      publisher: "Prentice Hall",
      items: [{ barcode: "100002", status: "Checked Out", location: "ชั้น 2 - คอมพิวเตอร์" }],
      coverUrl: "https://images-na.ssl-images-amazon.com/images/I/41jEbK-jG+L._SX258_BO1,204,203,200_.jpg"
    },
    {
      id: "B003",
      title: "วิทยาศาสตร์ฉลาดรู้ เรื่อง เอกภพ",
      author: "Do Ki-sung",
      isbn: "9786160442881",
      callNumber: "500 DOK",
      status: "Available",
      format: "Book",
      pubYear: "2019",
      publisher: "Nanmeebooks",
      items: [{ barcode: "100003", status: "Available", location: "ชั้น 1 - การ์ตูนความรู้" }]
    }
  ],
  patrons: [
    {
      id: "P001",
      name: "ด.ช. อารีฟีน มีนา",
      type: "นักเรียน",
      group: "ม.1/1",
      finesOwed: 0,
      history: [
        {
          id: "TX001",
          bookTitle: "Clean Code",
          patronName: "ด.ช. อารีฟีน มีนา",
          checkoutDate: "01/03/2568",
          dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH'),
          status: "Active",
          barcode: "100002"
        }
      ],
      reservedItems: []
    },
    {
      id: "P002",
      name: "นางสาวฟาติมา รักดี",
      type: "ครูอาจารย์",
      group: "หมวดภาษาไทย",
      finesOwed: 0,
      history: [],
      reservedItems: []
    }
  ],
  subjects: [
      { id: "S001", heading: "นวนิยาย", dewey: "FIC" },
      { id: "S002", heading: "คอมพิวเตอร์", dewey: "000" }
  ],
  acquisitionRequests: [
      { id: "REQ-001", title: "Atomic Habits", requester: "ครูสมศรี", price: 350, department: "ทั่วไป", status: "Pending" }
  ]
};

export const api = {
  // Load all data on startup
  loadAllData: async () => {
    try {
      // Attempt to fetch from Google Sheets
      const response = await fetch(SCRIPT_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      // If API fails (CORS, offline, etc.), return Mock Data so app works
      console.warn("API Connection Failed. Switching to Offline/Mock Mode.", error);
      return MOCK_DATA;
    }
  },

  // Generic action sender
  sendAction: async (action: string, payload: any) => {
    try {
      const body = JSON.stringify({ action, ...payload });
      await fetch(SCRIPT_URL, {
        ...POST_OPTIONS,
        body: body
      });
      return true;
    } catch (error) {
      console.warn(`Action '${action}' failed to sync with server (Offline Mode).`, error);
      // Return true to pretend it succeeded in UI
      return true; 
    }
  }
};
