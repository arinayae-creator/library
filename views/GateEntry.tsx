
import React, { useState, useEffect } from 'react';
import { UserCheck, Clock, Users, LogIn } from 'lucide-react';
import { api } from '../services/api';

// Declare Swal type globally for TypeScript since it's loaded via CDN
declare const Swal: any;

const GateEntry: React.FC = () => {
  const [count, setCount] = useState(0);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = async () => {
      // 1. Show Loading
      Swal.fire({
          title: 'กำลังบันทึกข้อมูล...',
          text: 'กรุณารอสักครู่',
          allowOutsideClick: false,
          didOpen: () => {
              Swal.showLoading();
          }
      });

      // 2. Call API
      try {
          // Send 'gateEntry' action to Google Sheets
          const success = await api.sendAction('gateEntry', { 
              note: 'Kiosk Check-in',
              timestamp: new Date().toISOString()
          });

          if (success) {
              // 3. Success Update UI & Alert
              setCount(prev => prev + 1);
              setLastCheckIn(new Date().toLocaleTimeString('th-TH'));
              
              Swal.fire({
                  icon: 'success',
                  title: 'เช็คอินสำเร็จ!',
                  text: 'ยินดีต้อนรับสู่ห้องสมุดอิกเราะอฺ',
                  timer: 2000,
                  showConfirmButton: false
              });
          } else {
              throw new Error("Save failed");
          }
      } catch (error) {
          // 4. Error Alert
          console.error("Check-in error:", error);
          Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาด',
              text: 'ไม่สามารถบันทึกข้อมูลไปยัง Google Sheets ได้ (อาจเกิดจากสิทธิ์การเข้าถึงหรืออินเทอร์เน็ต)',
              confirmButtonText: 'ตกลง'
          });
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px]">
          {/* Left Side: Clock & Info */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 p-10 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 p-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>
              
              <div className="relative z-10">
                  <h1 className="text-3xl font-bold mb-2">ยินดีต้อนรับ</h1>
                  <p className="text-blue-100 text-lg">ห้องสมุดอิกเราะอฺ โรงเรียนอิบนูอัฟฟานบูรณวิทย์</p>
              </div>

              <div className="text-center relative z-10">
                  <div className="text-6xl font-mono font-bold tracking-wider mb-2">
                      {time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xl text-blue-200">
                      {time.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
              </div>

              <div className="relative z-10 flex items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                  <Users className="w-8 h-8 text-blue-300" />
                  <div>
                      <p className="text-xs text-blue-200 uppercase tracking-wide">ผู้เข้าใช้บริการวันนี้</p>
                      <p className="text-2xl font-bold">{342 + count} คน</p>
                  </div>
              </div>
          </div>

          {/* Right Side: Action */}
          <div className="w-full md:w-1/2 p-10 flex flex-col items-center justify-center bg-slate-50">
              <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold text-slate-800">ลงชื่อเข้าใช้ (Check In)</h2>
                  <p className="text-slate-500">กรุณากดปุ่มหรือสแกนบัตรเพื่อเข้าใช้บริการ</p>
              </div>

              <button 
                onClick={handleCheckIn}
                className="w-64 h-64 bg-white rounded-full shadow-xl border-8 border-slate-100 flex flex-col items-center justify-center gap-4 hover:scale-105 hover:border-blue-100 hover:shadow-blue-200/50 transition-all active:scale-95 group"
              >
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover:bg-blue-500 transition-colors">
                      <LogIn className="w-10 h-10 ml-1" />
                  </div>
                  <span className="text-xl font-bold text-slate-700 group-hover:text-blue-600">กดเพื่อเช็คอิน</span>
              </button>

              {lastCheckIn && (
                  <div className="mt-8 animate-fadeIn flex items-center gap-2 text-green-600 bg-green-50 px-6 py-3 rounded-full font-medium">
                      <UserCheck className="w-5 h-5" />
                      ลงชื่อสำเร็จเมื่อ {lastCheckIn} น.
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default GateEntry;
