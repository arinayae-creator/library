
import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Acquisitions from './views/Acquisitions';
import Cataloging from './views/Cataloging';
import Circulation from './views/Circulation';
import OPAC from './views/OPAC';
import Admin from './views/Admin';
import Reports from './views/Reports';
import Supporting from './views/Supporting';
import GateEntry from './views/GateEntry';
import { LibraryProvider } from './context/LibraryContext';

// Placeholder components for modules not fully implemented in prototype
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8 flex flex-col items-center justify-center h-full text-slate-400">
    <div className="bg-white p-12 rounded-2xl shadow-sm text-center max-w-lg">
        <h2 className="text-2xl font-bold mb-4 text-slate-700">{title}</h2>
        <p className="mb-6 text-slate-500">โมดูลนี้อยู่ระหว่างการพัฒนา</p>
        <button className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 text-sm transition-colors">
            ย้อนกลับไปหน้าหลัก
        </button>
    </div>
  </div>
);

const Footer = () => (
  <footer className="p-6 text-center text-slate-500 text-sm border-t border-slate-200 mt-auto bg-white">
    <p>© 2025 ระบบห้องสมุดอัตโนมัติ (IAB OBEC) ห้องสมุดอิกเราะอฺ โรงเรียนอิบนูอัฟฟานบูรณวิทย์</p>
    <p className="text-xs mt-1 text-slate-400">โดย ariena.yn (บรรรณารักษ์)</p>
  </footer>
);

const MainLayout: React.FC = () => {
    const location = useLocation();
    const isFullScreen = location.pathname === '/gate-entry';

    if (isFullScreen) {
        return (
            <Routes>
                <Route path="/gate-entry" element={<GateEntry />} />
            </Routes>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Sidebar />
            <div className="flex-1 md:ml-72 transition-all duration-300 flex flex-col min-h-screen">
                <main className="flex-1">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/acquisitions" element={<Acquisitions />} />
                        <Route path="/cataloging" element={<Cataloging />} />
                        <Route path="/circulation" element={<Circulation />} />
                        <Route path="/opac" element={<OPAC />} />
                        <Route path="/serials" element={<Placeholder title="ระบบจัดการวารสาร (Serials Control)" />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/supporting" element={<Supporting />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </div>
    );
}

const App: React.FC = () => {
  return (
    <LibraryProvider>
        <Router>
            <MainLayout />
        </Router>
    </LibraryProvider>
  );
};

export default App;
