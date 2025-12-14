
import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  BookOpen, 
  Layers, 
  RefreshCw, 
  Search, 
  Settings, 
  BarChart3,
  Printer,
  Globe
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { publicPages } = useLibrary();
  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { name: 'แผงควบคุม', path: '/', icon: LayoutDashboard },
    { name: 'บริการยืม-คืน/สมาชิก', path: '/circulation', icon: RefreshCw },
    { name: 'วิเคราะห์ทรัพยากร', path: '/cataloging', icon: BookOpen },
    { name: 'จัดหาทรัพยากร', path: '/acquisitions', icon: ShoppingCart },
    { name: 'วารสาร/สิ่งพิมพ์', path: '/serials', icon: Layers },
    { name: 'สืบค้น (OPAC)', path: '/opac', icon: Search },
    { name: 'งานสนับสนุน (พิมพ์)', path: '/supporting', icon: Printer },
    { name: 'รายงานและสถิติ', path: '/reports', icon: BarChart3 },
    { name: 'ผู้ดูแลระบบ', path: '/admin', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-primary text-slate-300 h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800 z-20 hidden md:flex shadow-xl">
      <div className="p-6 flex flex-col items-center border-b border-slate-800 text-center bg-slate-900/50">
        <div className="mb-4 bg-white/10 p-2 rounded-lg w-full flex justify-center items-center min-h-[100px]">
             <img 
                src="https://img2.pic.in.th/pic/-967dce5e0a87198eb.png" 
                alt="IAB OBEC Logo" 
                className="max-w-[200px] h-auto object-contain"
             />
        </div>
        <div>
            <h1 className="text-white font-bold text-lg leading-tight mb-1">ระบบห้องสมุดอัตโนมัติ (IAB OBEC)</h1>
            <p className="text-xs text-slate-400 font-light">สำหรับห้องสมุดอิกเราะอฺ</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 no-scrollbar">
        <div className="px-2 mb-3 text-xs font-semibold uppercase text-slate-500 tracking-wider">
            เมนูหลัก (Main Menu)
        </div>
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              isActive(item.path)
                ? 'bg-accent text-white shadow-lg shadow-accent/20 font-medium'
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
            <span className="text-sm">{item.name}</span>
          </Link>
        ))}
        
        {publicPages && publicPages.length > 0 && (
            <>
                <div className="px-2 mt-6 mb-3 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    หน้าทั่วไป (Pages)
                </div>
                {publicPages.filter(p => p.isVisible).map((page) => (
                    <div
                        key={page.id}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800/50 cursor-pointer"
                        onClick={() => alert(`แสดงหน้า: ${page.title} (Feature Prototype)`)}
                    >
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">{page.title}</span>
                    </div>
                ))}
            </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/30">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm border-2 border-slate-700">
                AR
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">ariena.yn</p>
                <p className="text-xs text-slate-500 truncate">บรรณารักษ์</p>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
