import React, { useState } from 'react';
import { Plus, Filter, Download, Search, CheckCircle, Clock, XCircle, FileText, Truck } from 'lucide-react';
import { AcquisitionRequest } from '../types';

const mockRequests: AcquisitionRequest[] = [
  { id: 'REQ-001', title: 'คู่มือการสอนอิสลามศึกษาเบื้องต้น', requester: 'อ.สมชาย (หมวดอิสลามศึกษา)', status: 'Approved', price: 250.00, department: 'อิสลามศึกษา' },
  { id: 'REQ-002', title: 'วิทยาศาสตร์เพื่อชีวิต ม.ปลาย', requester: 'ครูวิภา (วิทยาศาสตร์)', status: 'Ordered', price: 180.00, department: 'วิทยาศาสตร์' },
  { id: 'REQ-003', title: 'ประวัติศาสตร์ตะวันออกกลาง', requester: 'ครูอารี (สังคม)', status: 'Received', price: 350.00, department: 'สังคมศึกษา' },
  { id: 'REQ-004', title: 'Advanced English Grammar', requester: 'Teacher John', status: 'Pending', price: 450.00, department: 'ภาษาต่างประเทศ' },
  { id: 'REQ-005', title: 'การเขียนโปรแกรม Python เบื้องต้น', requester: 'งานห้องสมุด', status: 'Pending', price: 199.00, department: 'คอมพิวเตอร์' },
];

const Acquisitions: React.FC = () => {
  const [requests, setRequests] = useState<AcquisitionRequest[]>(mockRequests);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> อนุมัติแล้ว</span>;
      case 'Pending': return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> รอพิจารณา</span>;
      case 'Ordered': return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center gap-1 w-fit"><Truck className="w-3 h-3" /> สั่งซื้อแล้ว</span>;
      case 'Received': return <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium flex items-center gap-1 w-fit"><FileText className="w-3 h-3" /> ตรวจรับแล้ว</span>;
      default: return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">ไม่ระบุ</span>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">งานจัดหาทรัพยากร (Acquisitions)</h1>
            <p className="text-slate-500 text-sm mt-1">จัดการคำเสนอแนะ, สั่งซื้อ, และบริหารงบประมาณ</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> ส่งออกรายงาน
          </button>
          <button className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600 shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> สร้างรายการใหม่
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
                type="text" 
                placeholder="ค้นหาชื่อเรื่อง, ISBN, หรือผู้เสนอแนะ..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20 text-sm font-sans"
            />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-2">
                <Filter className="w-4 h-4" /> กรองสถานะ
            </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">รหัส (ID)</th>
              <th className="px-6 py-4">ชื่อเรื่อง / รายละเอียด</th>
              <th className="px-6 py-4">ผู้เสนอแนะ / หน่วยงาน</th>
              <th className="px-6 py-4">ราคา (บาท)</th>
              <th className="px-6 py-4">สถานะ</th>
              <th className="px-6 py-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-500">{req.id}</td>
                <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">{req.title}</p>
                </td>
                <td className="px-6 py-4 text-slate-600">
                    <p>{req.requester}</p>
                    <p className="text-xs text-slate-400">{req.department}</p>
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">฿{req.price.toFixed(2)}</td>
                <td className="px-6 py-4">
                    {getStatusBadge(req.status)}
                </td>
                <td className="px-6 py-4 text-right">
                    <button className="text-accent hover:text-blue-700 font-medium">รายละเอียด</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
              <h3 className="text-indigo-800 font-bold text-sm uppercase mb-1">งบประมาณทั้งหมด</h3>
              <p className="text-2xl font-bold text-indigo-900">฿120,000.00</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg">
              <h3 className="text-orange-800 font-bold text-sm uppercase mb-1">รอการอนุมัติ</h3>
              <p className="text-2xl font-bold text-orange-900">฿4,250.00</p>
          </div>
          <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
              <h3 className="text-green-800 font-bold text-sm uppercase mb-1">คงเหลือ</h3>
              <p className="text-2xl font-bold text-green-900">฿45,340.00</p>
          </div>
      </div>
    </div>
  );
};

export default Acquisitions;