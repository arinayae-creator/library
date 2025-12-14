import React from 'react';
import { BarChart3, FileText, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'ม.ค.', borrow: 400, return: 240 },
  { name: 'ก.พ.', borrow: 300, return: 139 },
  { name: 'มี.ค.', borrow: 200, return: 980 },
  { name: 'เม.ย.', borrow: 278, return: 390 },
  { name: 'พ.ค.', borrow: 189, return: 480 },
  { name: 'มิ.ย.', borrow: 239, return: 380 },
];

const Reports: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">รายงานและสถิติ (Reports & Statistics)</h1>
        <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> ส่งออก Excel ทั้งหมด
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
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