import React from 'react';
import { Printer, CreditCard, Barcode } from 'lucide-react';

const Supporting: React.FC = () => {
  return (
    <div className="p-8 space-y-6">
       <h1 className="text-2xl font-bold text-slate-800">งานสนับสนุน (Supporting Tasks)</h1>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* Card 1: Barcode Printing */}
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-3">
                   <Barcode className="w-5 h-5 text-slate-600" />
                   <h3 className="font-bold text-slate-700">พิมพ์บาร์โค้ด/สันหนังสือ</h3>
               </div>
               <div className="p-6 space-y-4">
                   <div>
                       <label className="block text-sm text-slate-500 mb-1">ช่วงเลขทะเบียน (Barcode Range)</label>
                       <div className="flex gap-2">
                           <input type="text" placeholder="เริ่ม" className="border rounded px-2 py-1 w-full text-sm" />
                           <input type="text" placeholder="ถึง" className="border rounded px-2 py-1 w-full text-sm" />
                       </div>
                   </div>
                   <div className="flex gap-2 pt-2">
                       <button className="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 flex justify-center gap-2 items-center">
                            <Printer className="w-4 h-4" /> พิมพ์ Barcode
                       </button>
                       <button className="flex-1 bg-slate-100 text-slate-700 py-2 rounded text-sm hover:bg-slate-200 flex justify-center gap-2 items-center">
                            <Printer className="w-4 h-4" /> พิมพ์สัน
                       </button>
                   </div>
               </div>
           </div>

           {/* Card 2: Member Cards */}
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-3">
                   <CreditCard className="w-5 h-5 text-slate-600" />
                   <h3 className="font-bold text-slate-700">พิมพ์บัตรสมาชิก</h3>
               </div>
               <div className="p-6 space-y-4">
                   <div>
                       <label className="block text-sm text-slate-500 mb-1">เลือกกลุ่ม/ชั้นเรียน</label>
                       <select className="w-full border rounded px-2 py-1 text-sm">
                           <option>ทั้งหมด</option>
                           <option>ม.1/1</option>
                           <option>ม.1/2</option>
                       </select>
                   </div>
                   <button className="w-full bg-accent text-white py-2 rounded text-sm hover:bg-blue-600 flex justify-center gap-2 items-center mt-4">
                        <Printer className="w-4 h-4" /> พิมพ์บัตรสมาชิก
                   </button>
               </div>
           </div>
       </div>
    </div>
  );
};

export default Supporting;
