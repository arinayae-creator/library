
import React from 'react';
import { BarChart3, FileText, Download, RefreshCw, Printer, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLibrary } from '../context/LibraryContext';

// Declare Swal type
declare const Swal: any;

const data = [
  { name: 'ม.ค.', borrow: 400, return: 240 },
  { name: 'ก.พ.', borrow: 300, return: 139 },
  { name: 'มี.ค.', borrow: 200, return: 980 },
  { name: 'เม.ย.', borrow: 278, return: 390 },
  { name: 'พ.ค.', borrow: 189, return: 480 },
  { name: 'มิ.ย.', borrow: 239, return: 380 },
];

const Reports: React.FC = () => {
  const { books, patrons, refreshData, isLoading } = useLibrary();

  // Helper to escape CSV fields
  const escapeCsv = (text: string | number | undefined) => {
      if (text === undefined || text === null) return '';
      const str = String(text);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
  };

  const handleExportBooks = () => {
      const headers = ['ID', 'ISBN', 'Title', 'Author', 'CallNumber', 'Status', 'Format', 'Location'];
      const rows = books.map(b => [
          b.id,
          b.isbn,
          b.title,
          b.author,
          b.callNumber,
          b.status,
          b.format,
          b.items?.[0]?.location || ''
      ].map(escapeCsv).join(','));
      
      // BOM for Excel Thai support
      const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `books_export_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
  };

  const handleExportPatrons = () => {
      const headers = ['ID', 'Name', 'Type', 'Group', 'Status', 'FinesOwed'];
      const rows = patrons.map(p => [
          p.id,
          p.name,
          p.type,
          p.group,
          p.status,
          p.finesOwed
      ].map(escapeCsv).join(','));
      
      const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `patrons_export_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
  };

  const handleRefresh = async () => {
      Swal.fire({
          title: 'กำลังอัปเดตข้อมูล...',
          didOpen: () => Swal.showLoading()
      });
      await refreshData();
      Swal.close();
      const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
      });
      Toast.fire({
          icon: 'success',
          title: 'อัปเดตข้อมูลสำเร็จ'
      });
  };

  return (
    <div className="p-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">รายงานและสถิติ (Reports & Statistics)</h1>
            <p className="text-slate-500 text-sm mt-1">เรียกดูข้อมูลสถิติและส่งออกรายงานประจำเดือน</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-bold text-blue-700 hover:bg-blue-100 flex items-center gap-2 transition-colors"
            >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> 
                {isLoading ? 'กำลังโหลด...' : 'อัปเดตข้อมูล (Refresh)'}
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <Printer className="w-4 h-4" /> พิมพ์หน้านี้
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-yellow-50/50 p-6 rounded-xl border border-yellow-100">
          <div>
              <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-green-600"/> ส่งออกข้อมูล (Export Data)</h3>
              <p className="text-sm text-slate-500 mb-4">ดาวน์โหลดข้อมูลในรูปแบบ CSV เพื่อนำไปใช้งานต่อใน Excel</p>
              <div className="flex gap-3">
                  <button onClick={handleExportBooks} className="bg-white border border-slate-300 hover:border-green-500 hover:text-green-700 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                      <Download className="w-4 h-4"/> ข้อมูลหนังสือ ({books.length})
                  </button>
                  <button onClick={handleExportPatrons} className="bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-700 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                      <Download className="w-4 h-4"/> ข้อมูลสมาชิก ({patrons.length})
                  </button>
              </div>
          </div>
          <div className="border-l border-yellow-200 pl-6">
               <h3 className="font-bold text-slate-700 mb-2">สรุปภาพรวมปัจจุบัน</h3>
               <ul className="text-sm space-y-2 text-slate-600">
                   <li className="flex justify-between"><span>จำนวนหนังสือทั้งหมด:</span> <span className="font-bold">{books.length} เล่ม</span></li>
                   <li className="flex justify-between"><span>สมาชิกทั้งหมด:</span> <span className="font-bold">{patrons.length} คน</span></li>
                   <li className="flex justify-between"><span>ยอดค่าปรับค้างชำระ:</span> <span className="font-bold text-red-600">฿{patrons.reduce((a,b) => a + (b.finesOwed||0), 0).toLocaleString()}</span></li>
               </ul>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 printable-area">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">รายเดือน</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">รายงานการยืม-คืน</h3>
              <p className="text-sm text-slate-500 mt-2">สถิติการหมุนเวียนทรัพยากรประจำเดือน แยกตามหมวดหมู่</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">สถิติ</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">10 อันดับหนังสือยอดนิยม</h3>
              <p className="text-sm text-slate-500 mt-2">รายการทรัพยากรที่มีการยืมสูงสุดประจำปีการศึกษา</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8 text-purple-500 group-hover:scale-110 transition-transform" />
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">การเงิน</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">รายงานค่าปรับ</h3>
              <p className="text-sm text-slate-500 mt-2">สรุปยอดค่าปรับและค่าธรรมเนียมต่างๆ</p>
          </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm printable-area">
          <h2 className="text-lg font-bold text-slate-800 mb-6">สถิติการให้บริการรอบ 6 เดือน</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ fontFamily: 'Prompt', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontFamily: 'Prompt' }} />
                <Bar dataKey="borrow" name="ยืม" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="return" name="คืน" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default Reports;
