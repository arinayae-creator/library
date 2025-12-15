
import React, { useState } from 'react';
import { 
  Users, 
  Book, 
  AlertCircle, 
  DollarSign,
  Calendar,
  UserPlus,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import StatCard from '../components/StatCard';
import { useLibrary } from '../context/LibraryContext';

const loanData = [
  { name: 'จันทร์', loans: 120, returns: 100, visitors: 340 },
  { name: 'อังคาร', loans: 132, returns: 110, visitors: 320 },
  { name: 'พุธ', loans: 101, returns: 120, visitors: 450 },
  { name: 'พฤหัส', loans: 134, returns: 130, visitors: 380 },
  { name: 'ศุกร์', loans: 190, returns: 170, visitors: 500 },
  { name: 'เสาร์', loans: 50, returns: 40, visitors: 120 },
  { name: 'อาทิตย์', loans: 20, returns: 10, visitors: 80 },
];

const resourceData = [
  { name: 'หมวด 000', value: 400 },
  { name: 'หมวด 100', value: 300 },
  { name: 'หมวด 200', value: 300 },
  { name: 'หมวด 300', value: 200 },
  { name: 'หมวด 400', value: 278 },
  { name: 'หมวด 500', value: 189 },
  { name: 'หมวด อื่นๆ', value: 500 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const Dashboard: React.FC = () => {
  const { books, patrons, isLoading } = useLibrary();
  const [visitorCount, setVisitorCount] = useState(342);

  const incrementVisitor = () => {
    setVisitorCount(prev => prev + 1);
  };
  
  // Calculate dynamic stats from context
  const totalBooks = books.length;
  const totalPatrons = patrons.length;
  
  const overdueCount = patrons.reduce((acc, p) => {
      const history = Array.isArray(p.history) ? p.history : [];
      const count = history.filter(h => h.status === 'Active' && h.dueDate && new Date() > new Date(h.dueDate.split('/').reverse().join('-'))).length;
      return acc + count;
  }, 0);
  
  const totalFines = patrons.reduce((acc, p) => acc + (p.finesOwed || 0), 0);

  if (isLoading) {
      return (
          <div className="flex h-full items-center justify-center p-8">
              <div className="flex flex-col items-center gap-4 text-slate-500">
                  <Loader2 className="w-12 h-12 animate-spin text-accent" />
                  <p>กำลังเชื่อมต่อฐานข้อมูล Google Sheets...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="p-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">ภาพรวมระบบห้องสมุด (Dashboard)</h1>
            <p className="text-slate-500 text-sm mt-1">ห้องสมุดอิกเราะอฺ โรงเรียนอิบนูอัฟฟานบูรณวิทย์</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                 <div className="text-right">
                     <p className="text-xs text-slate-500">ผู้เข้าใช้บริการวันนี้</p>
                     <p className="text-xl font-bold text-accent">{visitorCount}</p>
                 </div>
                 <button 
                    onClick={incrementVisitor}
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-md transition-transform active:scale-95"
                    title="นับผู้เข้าใช้บริการ"
                 >
                     <UserPlus className="w-5 h-5" />
                 </button>
             </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm h-full">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="สมาชิกทั้งหมด" 
          value={totalPatrons} 
          change="+12 คน" 
          icon={Users} 
          trend="up"
          color="bg-accent text-accent"
        />
        <StatCard 
          title="ทรัพยากร (รายการ)" 
          value={totalBooks} 
          change="+5 รายการ" 
          icon={Book} 
          trend="up"
          color="bg-purple-500 text-purple-500"
        />
        <StatCard 
          title="รายการเกินกำหนด" 
          value={overdueCount} 
          change={overdueCount > 0 ? "มีรายการค้างส่ง" : "ไม่มีรายการค้างส่ง"} 
          icon={AlertCircle} 
          trend={overdueCount > 0 ? "down" : "neutral"}
          color="bg-danger text-danger"
        />
        <StatCard 
          title="ค่าปรับค้างชำระ" 
          value={`฿${totalFines.toFixed(2)}`} 
          change="ยอดรวมสมาชิก" 
          icon={DollarSign} 
          trend="up"
          color="bg-success text-success"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-500" />
              สถิติการยืม-คืน และผู้เข้าใช้ (รายสัปดาห์)
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loanData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} yAxisId="left" />
                <YAxis stroke="#64748b" fontSize={12} orientation="right" yAxisId="right" />
                <Tooltip 
                  contentStyle={{ fontFamily: 'Prompt', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontFamily: 'Prompt' }} />
                <Line yAxisId="left" name="ยืม (Loans)" type="monotone" dataKey="loans" stroke="#3b82f6" strokeWidth={2} activeDot={{r: 6}} />
                <Line yAxisId="left" name="คืน (Returns)" type="monotone" dataKey="returns" stroke="#10b981" strokeWidth={2} />
                <Line yAxisId="right" name="ผู้เข้าใช้ (Visitors)" type="monotone" dataKey="visitors" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">สัดส่วนทรัพยากรแยกตามหมวดหมู่</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {resourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: 'Prompt' }} />
                <Legend wrapperStyle={{ fontFamily: 'Prompt', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
