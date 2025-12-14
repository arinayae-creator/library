
import React, { useState } from 'react';
import { Plus, Filter, Download, Search, CheckCircle, Clock, XCircle, FileText, Truck, Save, X, Trash2 } from 'lucide-react';
import { AcquisitionRequest } from '../types';
import { useLibrary } from '../context/LibraryContext';

// Declare Swal type
declare const Swal: any;

const Acquisitions: React.FC = () => {
  const { acquisitionRequests, addAcquisition, updateAcquisition, deleteAcquisition } = useLibrary();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AcquisitionRequest>>({
      title: '', requester: '', price: 0, department: 'ทั่วไป', status: 'Pending'
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> อนุมัติแล้ว</span>;
      case 'Pending': return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> รอพิจารณา</span>;
      case 'Ordered': return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center gap-1 w-fit"><Truck className="w-3 h-3" /> สั่งซื้อแล้ว</span>;
      case 'Received': return <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium flex items-center gap-1 w-fit"><FileText className="w-3 h-3" /> ตรวจรับแล้ว</span>;
      default: return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">ไม่ระบุ</span>;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title || !formData.requester) return Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุข้อมูลให้ครบถ้วน', 'warning');
      
      const newReq: AcquisitionRequest = {
          id: `REQ-${Date.now().toString().slice(-4)}`,
          title: formData.title!,
          requester: formData.requester!,
          price: Number(formData.price) || 0,
          department: formData.department || 'ทั่วไป',
          status: 'Pending'
      };
      
      // 1. Loading
      Swal.fire({
          title: 'กำลังบันทึก...',
          didOpen: () => Swal.showLoading()
      });

      addAcquisition(newReq);

      // 2. Success (Optimistic)
      await new Promise(resolve => setTimeout(resolve, 800));
      Swal.fire('สำเร็จ', 'บันทึกรายการเสนอแนะเรียบร้อย', 'success');

      setIsModalOpen(false);
      setFormData({ title: '', requester: '', price: 0, department: 'ทั่วไป', status: 'Pending' });
  };

  const cycleStatus = (req: AcquisitionRequest) => {
      const statuses: AcquisitionRequest['status'][] = ['Pending', 'Approved', 'Ordered', 'Received'];
      const currentIndex = statuses.indexOf(req.status);
      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
      updateAcquisition({ ...req, status: nextStatus });
  };
  
  const filteredRequests = acquisitionRequests.filter(req => 
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalBudget = 120000;
  const approvedAmount = acquisitionRequests.filter(r => r.status === 'Approved' || r.status === 'Ordered').reduce((acc, r) => acc + r.price, 0);
  const pendingAmount = acquisitionRequests.filter(r => r.status === 'Pending').reduce((acc, r) => acc + r.price, 0);
  const remainingBudget = totalBudget - approvedAmount;

  return (
    <div className="p-8 space-y-6 relative">
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                  <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                      <h3 className="font-bold text-slate-700">สร้างรายการเสนอแนะใหม่</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5"/></button>
                  </div>
                  <form onSubmit={handleCreate} className="p-6 space-y-4">
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">ชื่อเรื่อง / รายการ</label><input autoFocus required type="text" className="w-full border rounded-lg px-3 py-2" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">ผู้เสนอแนะ</label><input required type="text" className="w-full border rounded-lg px-3 py-2" value={formData.requester} onChange={e => setFormData({...formData, requester: e.target.value})} /></div>
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-sm font-medium text-slate-700 mb-1">ราคาโดยประมาณ</label><input type="number" className="w-full border rounded-lg px-3 py-2" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} /></div>
                          <div><label className="block text-sm font-medium text-slate-700 mb-1">หมวด/ฝ่าย</label><select className="w-full border rounded-lg px-3 py-2" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}><option>ทั่วไป</option><option>ภาษาไทย</option><option>คณิตศาสตร์</option><option>วิทยาศาสตร์</option><option>สังคมศึกษา</option><option>ภาษาต่างประเทศ</option><option>อิสลามศึกษา</option></select></div>
                      </div>
                      <button type="submit" className="w-full bg-accent text-white py-2 rounded-lg font-medium hover:bg-blue-600 flex justify-center gap-2"><Save className="w-4 h-4"/> บันทึกรายการ</button>
                  </form>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">งานจัดหาทรัพยากร (Acquisitions)</h1>
            <p className="text-slate-500 text-sm mt-1">จัดการคำเสนอแนะ, สั่งซื้อ, และบริหารงบประมาณ</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> ส่งออกรายงาน
          </button>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600 shadow-sm flex items-center gap-2">
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
                placeholder="ค้นหาชื่อเรื่อง, ID, หรือผู้เสนอแนะ..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20 text-sm font-sans"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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
              <th className="px-6 py-4">สถานะ (คลิกเพื่อเปลี่ยน)</th>
              <th className="px-6 py-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">ไม่พบรายการ</td></tr>
            ) : filteredRequests.map((req) => (
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
                <td className="px-6 py-4 cursor-pointer select-none" onClick={() => cycleStatus(req)} title="คลิกเพื่อเปลี่ยนสถานะ">
                    {getStatusBadge(req.status)}
                </td>
                <td className="px-6 py-4 text-right">
                    <button onClick={() => { if(window.confirm('ลบรายการนี้?')) deleteAcquisition(req.id); }} className="text-slate-400 hover:text-red-600 font-medium"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
              <h3 className="text-indigo-800 font-bold text-sm uppercase mb-1">งบประมาณทั้งหมด</h3>
              <p className="text-2xl font-bold text-indigo-900">฿{totalBudget.toLocaleString()}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg">
              <h3 className="text-orange-800 font-bold text-sm uppercase mb-1">รอการอนุมัติ (Pending)</h3>
              <p className="text-2xl font-bold text-orange-900">฿{pendingAmount.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
              <h3 className="text-green-800 font-bold text-sm uppercase mb-1">คงเหลือ (จากที่อนุมัติแล้ว)</h3>
              <p className="text-2xl font-bold text-green-900">฿{remainingBudget.toLocaleString()}</p>
          </div>
      </div>
    </div>
  );
};

export default Acquisitions;
