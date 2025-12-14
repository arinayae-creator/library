
import React, { useState } from 'react';
import { Settings, Shield, Calendar, Database, Users, Save, RefreshCw, Book, Layout, Tags, ExternalLink, Plus, Edit2, Trash2, Globe, Bold, Italic, List, Type } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { MarcTagDefinition, PublicPage } from '../types';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('General');
  const { 
    resourceTypes, addResourceType, updateResourceType, deleteResourceType,
    locations, addLocation, updateLocation, deleteLocation,
    patronTypes, addPatronType, updatePatronType, deletePatronType,
    patronGroups, addPatronGroup, updatePatronGroup, deletePatronGroup,
    marcTags, addMarcTag, updateMarcTag, deleteMarcTag,
    publicPages, addPublicPage, updatePublicPage, deletePublicPage
  } = useLibrary();

  // State for forms
  const [editingItem, setEditingItem] = useState<{ type: string, oldVal: any, newVal: any } | null>(null);
  const [newItemInput, setNewItemInput] = useState('');
  const [newItemInput2, setNewItemInput2] = useState(''); // For secondary fields like MARC desc
  const [newItemInput3, setNewItemInput3] = useState(''); // For tertiary fields like MARC sub

  // Public Page Editor State
  const [pageEditorId, setPageEditorId] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageContent, setPageContent] = useState('');

  // Helper for simple list management
  const renderSimpleList = (
    title: string, 
    items: string[], 
    onAdd: (val: string) => void, 
    onEdit: (oldVal: string, newVal: string) => void, 
    onDelete: (val: string) => void,
    itemType: string
  ) => {
    return (
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
        <h3 className="font-bold text-slate-700 mb-4">{title}</h3>
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="เพิ่มรายการใหม่..." 
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
            value={editingItem?.type === itemType ? '' : newItemInput}
            onChange={(e) => {
                if (editingItem?.type !== itemType) setNewItemInput(e.target.value);
            }}
          />
          <button 
            onClick={() => {
                if (newItemInput.trim()) {
                    onAdd(newItemInput.trim());
                    setNewItemInput('');
                }
            }}
            className="bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> เพิ่ม
          </button>
        </div>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center group">
              {editingItem?.type === itemType && editingItem.oldVal === item ? (
                 <div className="flex gap-2 flex-1 mr-2">
                    <input 
                        autoFocus
                        className="flex-1 border rounded px-2 py-1 text-sm"
                        value={editingItem.newVal}
                        onChange={(e) => setEditingItem({ ...editingItem, newVal: e.target.value })}
                    />
                    <button onClick={() => { onEdit(item, editingItem.newVal); setEditingItem(null); }} className="text-green-600 hover:text-green-700"><Save className="w-4 h-4"/></button>
                 </div>
              ) : (
                 <span className="text-sm text-slate-700 font-medium">{item}</span>
              )}
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingItem({ type: itemType, oldVal: item, newVal: item })} className="p-1.5 text-slate-400 hover:text-accent hover:bg-slate-100 rounded">
                    <Edit2 className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => {
                        if (window.confirm(`ยืนยันการลบ "${item}" ?`)) {
                            onDelete(item);
                        }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const handlePageEdit = (page?: PublicPage) => {
      if (page) {
          setPageEditorId(page.id);
          setPageTitle(page.title);
          setPageContent(page.content);
      } else {
          setPageEditorId('new');
          setPageTitle('');
          setPageContent('');
      }
  };

  const savePage = () => {
      if (!pageTitle.trim()) return alert('กรุณาระบุชื่อหน้า');
      
      const newPage: PublicPage = {
          id: pageEditorId === 'new' ? Date.now().toString() : pageEditorId!,
          title: pageTitle,
          content: pageContent,
          isVisible: true
      };

      if (pageEditorId === 'new') {
          addPublicPage(newPage);
      } else {
          updatePublicPage(newPage);
      }
      setPageEditorId(null);
  };

  const insertTag = (tag: string) => {
      setPageContent(prev => prev + tag);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">ผู้ดูแลระบบ (System Administration)</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Settings Menu */}
        <div className="md:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
            <nav className="flex flex-col">
                <button onClick={() => setActiveTab('General')} className={`p-4 text-left text-sm font-medium border-l-4 hover:bg-slate-50 flex items-center gap-3 ${activeTab === 'General' ? 'border-accent text-accent bg-blue-50' : 'border-transparent text-slate-600'}`}>
                    <Settings className="w-4 h-4" /> ตั้งค่าทั่วไป
                </button>
                <button onClick={() => setActiveTab('Books')} className={`p-4 text-left text-sm font-medium border-l-4 hover:bg-slate-50 flex items-center gap-3 ${activeTab === 'Books' ? 'border-accent text-accent bg-blue-50' : 'border-transparent text-slate-600'}`}>
                    <Book className="w-4 h-4" /> จัดการหนังสือ
                </button>
                <button onClick={() => setActiveTab('Members')} className={`p-4 text-left text-sm font-medium border-l-4 hover:bg-slate-50 flex items-center gap-3 ${activeTab === 'Members' ? 'border-accent text-accent bg-blue-50' : 'border-transparent text-slate-600'}`}>
                    <Users className="w-4 h-4" /> จัดการสมาชิก
                </button>
                 <button onClick={() => setActiveTab('MARC')} className={`p-4 text-left text-sm font-medium border-l-4 hover:bg-slate-50 flex items-center gap-3 ${activeTab === 'MARC' ? 'border-accent text-accent bg-blue-50' : 'border-transparent text-slate-600'}`}>
                    <Tags className="w-4 h-4" /> จัดการบรรณานุกรม (MARC)
                </button>
                <button onClick={() => setActiveTab('PublicPages')} className={`p-4 text-left text-sm font-medium border-l-4 hover:bg-slate-50 flex items-center gap-3 ${activeTab === 'PublicPages' ? 'border-accent text-accent bg-blue-50' : 'border-transparent text-slate-600'}`}>
                    <Globe className="w-4 h-4" /> หน้าผู้ใช้ทั่วไป (Web)
                </button>
                <button onClick={() => setActiveTab('QuickTools')} className={`p-4 text-left text-sm font-medium border-l-4 hover:bg-slate-50 flex items-center gap-3 ${activeTab === 'QuickTools' ? 'border-accent text-accent bg-blue-50' : 'border-transparent text-slate-600'}`}>
                    <ExternalLink className="w-4 h-4" /> เครื่องมือด่วน
                </button>
            </nav>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[600px]">
            
            {activeTab === 'General' && (
                <div className="space-y-6 animate-fadeIn">
                    <h3 className="font-bold text-lg border-b pb-2">ข้อมูลทั่วไปห้องสมุด</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">ชื่อห้องสมุด (ไทย)</label><input type="text" className="w-full border rounded p-2" defaultValue="ห้องสมุดอิกเราะอฺ" /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">สังกัด/โรงเรียน</label><input type="text" className="w-full border rounded p-2" defaultValue="โรงเรียนอิบนูอัฟฟานบูรณวิทย์" /></div>
                        <div className="col-span-2"><button className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">บันทึกการเปลี่ยนแปลง</button></div>
                    </div>
                </div>
            )}

            {activeTab === 'Books' && (
                <div className="animate-fadeIn">
                    <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">จัดการข้อมูลหนังสือ</h2>
                    {renderSimpleList('ประเภททรัพยากร (Resource Types)', resourceTypes, addResourceType, updateResourceType, deleteResourceType, 'resourceType')}
                    {renderSimpleList('สถานที่จัดเก็บ (Locations)', locations, addLocation, updateLocation, deleteLocation, 'location')}
                </div>
            )}

            {activeTab === 'Members' && (
                <div className="animate-fadeIn">
                    <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">จัดการข้อมูลสมาชิก</h2>
                    {renderSimpleList('ประเภทสมาชิก (Patron Types)', patronTypes, addPatronType, updatePatronType, deletePatronType, 'patronType')}
                    {renderSimpleList('กลุ่ม/ชั้นเรียน (Groups/Classes)', patronGroups, addPatronGroup, updatePatronGroup, deletePatronGroup, 'patronGroup')}
                </div>
            )}

             {activeTab === 'MARC' && (
                <div className="animate-fadeIn">
                    <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">จัดการแท็กบรรณานุกรม (MARC Tags)</h2>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
                        <div className="flex gap-2 mb-4 items-end">
                            <div className="w-24"><label className="text-xs text-slate-500">Tag</label><input type="text" placeholder="000" className="w-full border rounded px-2 py-2" value={newItemInput} onChange={e => setNewItemInput(e.target.value)} /></div>
                            <div className="w-24"><label className="text-xs text-slate-500">Subfield</label><input type="text" placeholder="$a" className="w-full border rounded px-2 py-2" value={newItemInput3} onChange={e => setNewItemInput3(e.target.value)} /></div>
                            <div className="flex-1"><label className="text-xs text-slate-500">Description</label><input type="text" placeholder="คำอธิบาย..." className="w-full border rounded px-2 py-2" value={newItemInput2} onChange={e => setNewItemInput2(e.target.value)} /></div>
                            <button onClick={() => { if(newItemInput && newItemInput2) { addMarcTag({tag: newItemInput, sub: newItemInput3 || '$a', desc: newItemInput2}); setNewItemInput(''); setNewItemInput2(''); setNewItemInput3(''); } }} className="bg-accent text-white px-4 py-2 rounded hover:bg-blue-600 mb-px h-[42px]">เพิ่ม</button>
                        </div>
                        <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-200 text-slate-700"><tr><th className="p-2">Tag</th><th className="p-2">Sub</th><th className="p-2">Description</th><th className="p-2 text-right">Action</th></tr></thead>
                            <tbody className="divide-y divide-slate-200">
                                {marcTags.map((tag) => (
                                    <tr key={tag.tag} className="bg-white hover:bg-slate-50">
                                        <td className="p-2 font-mono font-bold text-slate-700">{tag.tag}</td>
                                        <td className="p-2 font-mono text-slate-500">{tag.sub}</td>
                                        <td className="p-2">{tag.desc}</td>
                                        <td className="p-2 text-right">
                                            <button onClick={() => { if(window.confirm(`ลบ Tag ${tag.tag}?`)) deleteMarcTag(tag.tag); }} className="text-red-500 hover:underline"><Trash2 className="w-4 h-4"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    </div>
                </div>
            )}

            {activeTab === 'PublicPages' && (
                 <div className="animate-fadeIn">
                     <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">จัดการหน้าผู้ใช้ทั่วไป (Front-end Pages)</h2>
                     {!pageEditorId ? (
                         <div>
                             <button onClick={() => handlePageEdit()} className="mb-4 bg-accent text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"><Plus className="w-4 h-4"/> สร้างหน้าใหม่</button>
                             <div className="space-y-3">
                                 {publicPages.map(page => (
                                     <div key={page.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center hover:shadow-md transition-shadow">
                                         <div>
                                             <h3 className="font-bold text-slate-800">{page.title}</h3>
                                             <p className="text-xs text-slate-500 mt-1">ID: {page.id} • {page.isVisible ? 'แสดงผล' : 'ซ่อน'}</p>
                                         </div>
                                         <div className="flex gap-2">
                                             <button onClick={() => handlePageEdit(page)} className="p-2 text-slate-500 hover:text-accent hover:bg-slate-100 rounded-lg"><Edit2 className="w-5 h-5"/></button>
                                             <button onClick={() => { if(window.confirm('ยืนยันการลบหน้านี้?')) deletePublicPage(page.id); }} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     ) : (
                         <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                             <div className="mb-4">
                                 <label className="block text-sm font-bold text-slate-700 mb-1">หัวข้อ (Title)</label>
                                 <input type="text" className="w-full border rounded-lg p-2" value={pageTitle} onChange={e => setPageTitle(e.target.value)} />
                             </div>
                             <div className="mb-4">
                                 <label className="block text-sm font-bold text-slate-700 mb-1">เนื้อหา (Block Editor)</label>
                                 <div className="bg-white border rounded-lg overflow-hidden">
                                     <div className="bg-slate-100 p-2 border-b flex gap-1">
                                         <button onClick={() => insertTag('<b></b>')} className="p-1 hover:bg-slate-200 rounded" title="Bold"><Bold className="w-4 h-4"/></button>
                                         <button onClick={() => insertTag('<i></i>')} className="p-1 hover:bg-slate-200 rounded" title="Italic"><Italic className="w-4 h-4"/></button>
                                         <button onClick={() => insertTag('<h3></h3>')} className="p-1 hover:bg-slate-200 rounded" title="Heading"><Type className="w-4 h-4"/></button>
                                         <button onClick={() => insertTag('<ul>\n<li></li>\n</ul>')} className="p-1 hover:bg-slate-200 rounded" title="List"><List className="w-4 h-4"/></button>
                                     </div>
                                     <textarea className="w-full p-4 h-64 outline-none font-mono text-sm" value={pageContent} onChange={e => setPageContent(e.target.value)} placeholder="เขียนเนื้อหาที่นี่ (รองรับ HTML พื้นฐาน)..."></textarea>
                                 </div>
                                 <p className="text-xs text-slate-500 mt-2">* รองรับการใช้ HTML Tag พื้นฐานสำหรับการจัดรูปแบบ</p>
                             </div>
                             <div className="flex gap-3 justify-end">
                                 <button onClick={() => setPageEditorId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">ยกเลิก</button>
                                 <button onClick={savePage} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"><Save className="w-4 h-4"/> บันทึก</button>
                             </div>
                         </div>
                     )}
                 </div>
            )}

            {activeTab === 'QuickTools' && (
                 <div className="animate-fadeIn">
                     <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">เครื่องมือด่วน (Quick Tools)</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer group" onClick={() => window.open('#/opac', '_blank')}>
                             <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                 <Globe className="w-7 h-7" />
                             </div>
                             <h3 className="text-xl font-bold mb-2">หน้าหลักห้องสมุด (Library Home)</h3>
                             <p className="text-blue-100 text-sm">เปิดหน้าสืบค้น (OPAC) และหน้าประชาสัมพันธ์สำหรับผู้ใช้ทั่วไปในแท็บใหม่</p>
                         </div>
                         <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer group" onClick={() => window.open('#/gate-entry', '_blank')}>
                             <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                 <Users className="w-7 h-7" />
                             </div>
                             <h3 className="text-xl font-bold mb-2">สถิติการเข้าใช้ (Gate Entry / Check-in)</h3>
                             <p className="text-purple-100 text-sm">เปิดหน้าจอสำหรับจุดเช็คอินเข้าห้องสมุด (Kiosk Mode) โดยไม่แสดงเมนูหลังบ้าน</p>
                         </div>
                     </div>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
