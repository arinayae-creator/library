
import React, { useState, useEffect, useRef } from 'react';
import { Save, PlusCircle, Search, Trash2, Edit, Plus, BookOpen, Copy, UploadCloud, Tag, GitMerge, AlertTriangle, Lock, ArrowLeft, Image as ImageIcon, Barcode, FolderOpen, Layout, Star, FileText, Check, X } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Book, AuthorityRecord, Worksheet, WorksheetField, Item } from '../types';

// Declare Swal type
declare const Swal: any;

const Cataloging: React.FC = () => {
  const { 
      books, addBook, updateBookDetails, deleteBook, translateStatus, mergeBooks, addItemsToBook,
      catalogingSession, updateCatalogingSession,
      resourceTypes, locations, 
      authorityRecords, addAuthorityRecord, updateAuthorityRecord, deleteAuthorityRecord,
      worksheets, addWorksheet, updateWorksheet, deleteWorksheet, toggleFavoriteWorksheet,
      generateCutter, marcTags
  } = useLibrary();
  
  // Restore State from Session
  const { 
      activeTab, searchQuery, searchResultsIds, selectedBookId, bibFormData, isEditMode, 
      viewMode, detailTab, searchType, advSearch, searchBarcode
  } = catalogingSession;

  const searchResults = books.filter(b => searchResultsIds.includes(b.id));
  const selectedBook = selectedBookId ? books.find(b => b.id === selectedBookId) || null : null;
  const savedForm = bibFormData || {};

  // -- MAIN BIBLIOGRAPHIC FORM STATE --
  const [resourceType, setResourceType] = useState(savedForm.resourceType || 'Book');
  const [location, setLocation] = useState(savedForm.location || 'ชั้น 1 - ทั่วไป');
  const [dewey, setDewey] = useState(savedForm.dewey || '');
  const [cutter, setCutter] = useState(savedForm.cutter || '');
  const [pubYearCall, setPubYearCall] = useState(savedForm.pubYearCall || '');
  
  // Dynamic Fields State (Stores values for tag+sub e.g., "245$a": "Harry Potter")
  const [dynamicTags, setDynamicTags] = useState<Record<string, string>>(savedForm.dynamicTags || {});

  // File Uploads State
  const [coverImage, setCoverImage] = useState<string>(savedForm.coverImage || '');
  const [ebookFile, setEbookFile] = useState<string>(savedForm.ebookFile || '');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const ebookInputRef = useRef<HTMLInputElement>(null);

  // Merge & Holdings State
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemBarcodeMode, setItemBarcodeMode] = useState<'Auto' | 'Manual'>('Auto');
  const [itemStartBarcode, setItemStartBarcode] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemLocation, setItemLocation] = useState('ชั้น 1 - ทั่วไป');
  const [maxReservations, setMaxReservations] = useState(3);
  
  // Authority Suggestions State
  const [tag100Suggestions, setTag100Suggestions] = useState<AuthorityRecord[]>([]);
  const [duplicateAuthorAlert, setDuplicateAuthorAlert] = useState<{name: string, cutter: string} | null>(null);

  // -- WORKSHEET MANAGEMENT STATE --
  const [wsFilterType, setWsFilterType] = useState<'Bibliographic' | 'Authority'>('Bibliographic');
  const [selectedWorksheetId, setSelectedWorksheetId] = useState<string | null>(null);
  const [editingWs, setEditingWs] = useState<Worksheet | null>(null);
  
  // -- BIB FORM CONFIG STATE --
  const [currentWorksheetId, setCurrentWorksheetId] = useState(savedForm.currentWorksheetId || 'default');
  const activeBibWorksheet = worksheets.find(w => w.id === currentWorksheetId) || worksheets[0];

  // Update session whenever form changes
  useEffect(() => {
     const newForm = { 
         resourceType, location, dewey, cutter, pubYearCall, 
         dynamicTags,
         coverImage, ebookFile, maxReservations,
         currentWorksheetId
     };
     updateCatalogingSession({ bibFormData: newForm });
  }, [resourceType, location, dewey, cutter, pubYearCall, dynamicTags, coverImage, ebookFile, maxReservations, currentWorksheetId]);

  // -- HANDLERS --

  const handleDynamicTagChange = (tagKey: string, value: string) => {
      setDynamicTags(prev => ({ ...prev, [tagKey]: value }));

      // Special Logic for Tag 100 (Author)
      if (tagKey === '100$a') {
          if (value.length > 1) {
              const matched = authorityRecords.filter(a => a.tag === '100' && a.heading.toLowerCase().includes(value.toLowerCase()));
              setTag100Suggestions(matched);
              const exact = authorityRecords.find(a => a.tag === '100' && a.heading === value);
              if (exact && exact.cutter) {
                  setDuplicateAuthorAlert({ name: exact.heading, cutter: exact.cutter });
                  if (!cutter) setCutter(exact.cutter); 
              } else {
                  setDuplicateAuthorAlert(null);
              }
          } else {
              setTag100Suggestions([]);
              setDuplicateAuthorAlert(null);
          }
      }
  };

  const handleSelectAuthority = (auth: AuthorityRecord) => {
      handleDynamicTagChange('100$a', auth.heading);
      if (auth.cutter) setCutter(auth.cutter);
      setTag100Suggestions([]);
  };

  const handleSearch = () => {
      let results: Book[] = [];
      if (searchType === 'Basic') {
          if (searchQuery) {
              results = books.filter(b => 
                  b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  b.isbn.includes(searchQuery) || 
                  b.id.includes(searchQuery)
              );
          }
      } else {
          results = books.filter(b => 
              (advSearch.title ? b.title.toLowerCase().includes(advSearch.title.toLowerCase()) : true) &&
              (advSearch.author ? b.author.toLowerCase().includes(advSearch.author.toLowerCase()) : true) &&
              (advSearch.isbn ? b.isbn.includes(advSearch.isbn) : true) &&
              (advSearch.callNo ? b.callNumber.includes(advSearch.callNo) : true)
          );
      }
      updateCatalogingSession({ searchResultsIds: results.map(b => b.id) });
  };

  const handleCreateNew = () => {
      resetForm();
      updateCatalogingSession({ selectedBookId: null, isEditMode: false, viewMode: 'Detail', detailTab: 'Edit', bibFormData: {} });
  };

  const resetForm = () => {
      setResourceType('Book');
      setLocation('ชั้น 1 - ทั่วไป');
      setDewey(''); setCutter(''); setPubYearCall('');
      setDynamicTags({});
      setCoverImage(''); setEbookFile('');
      setMaxReservations(3);
      setDuplicateAuthorAlert(null);
  };

  const handleSelectBook = (book: Book) => {
      updateCatalogingSession({ selectedBookId: book.id, isEditMode: true, viewMode: 'Detail', detailTab: 'Edit' });
      
      // Populate fields
      if (book.marcData) setDynamicTags(book.marcData);
      else {
          // Fallback for legacy data without marcData structure
          setDynamicTags({
              '245$a': book.title,
              '100$a': book.author,
              '020$a': book.isbn,
              '260$a': book.publisher || '',
              '520$a': book.description || '',
              '650$a': book.subject || ''
          });
      }

      const parts = book.callNumber.split(' ');
      setDewey(parts[0] || '');
      setCutter(parts[1] || '');
      setPubYearCall(parts.slice(2).join(' ') || '');
      
      setResourceType(book.format || 'Book');
      setLocation(book.items?.[0]?.location || 'ชั้น 1 - ทั่วไป');
      setCoverImage(book.coverUrl || '');
      setEbookFile(book.ebookUrl || '');
      setMaxReservations(book.maxReservations || 3);
  };

  const handleSave = async () => {
      const title = dynamicTags['245$a'];
      if (!title) return Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อเรื่อง (245 $a)', 'warning');

      // 1. Show Loading
      Swal.fire({
          title: 'กำลังบันทึก...',
          text: 'กรุณารอสักครู่ ข้อมูลกำลังถูกส่งไปยัง Google Sheets',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
      });

      // Authority Control Logic
      const author = dynamicTags['100$a'];
      if (author) {
          const existingAuth = authorityRecords.find(a => a.tag === '100' && a.heading === author);
          if (!existingAuth) {
              const newCutter = cutter || generateCutter(author);
              const newAuth: AuthorityRecord = {
                  id: Date.now().toString(),
                  heading: author,
                  type: 'Personal Name',
                  tag: '100',
                  cutter: newCutter
              };
              addAuthorityRecord(newAuth);
              if (!cutter) setCutter(newCutter);
          }
      }

      const newId = selectedBookId || Date.now().toString();
      const callNumber = `${dewey} ${cutter} ${pubYearCall}`.trim();

      const newBook: Book = {
          id: newId,
          title: title,
          author: author || '',
          isbn: dynamicTags['020$a'] || '',
          callNumber: callNumber,
          status: 'Available',
          format: (resourceType as any),
          pubYear: (dynamicTags['260$a'] || '').match(/\d{4}/)?.[0] || '',
          subject: dynamicTags['650$a'] || '',
          description: dynamicTags['520$a'] || '',
          publisher: dynamicTags['260$a'] || '',
          items: selectedBook?.items || [],
          reservationHistory: selectedBook?.reservationHistory || [],
          marcData: dynamicTags,
          coverUrl: coverImage,
          ebookUrl: ebookFile,
          maxReservations: maxReservations
      };

      if (isEditMode && selectedBookId) updateBookDetails(newBook);
      else {
          addBook(newBook);
          updateCatalogingSession({ selectedBookId: newId, isEditMode: true, viewMode: 'Detail' });
      }

      // 2. Success Alert (Assuming api call inside context handles async, we wait briefly or optimistically)
      // Since context methods are void, we assume optimistic UI but can show success here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated network delay for UX
      Swal.fire('บันทึกสำเร็จ', 'ข้อมูลบรรณานุกรมถูกบันทึกเรียบร้อยแล้ว', 'success');
  };

  const handleDeleteBook = () => {
      if(!selectedBookId) return;
      if (selectedBook?.items && selectedBook.items.length > 0) return Swal.fire('ลบไม่ได้', 'กรุณาลบตัวเล่มทั้งหมดก่อนลบระเบียน', 'error');
      
      Swal.fire({
          title: 'ยืนยันการลบ?',
          text: "คุณต้องการลบระเบียนนี้ใช่หรือไม่",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'ลบรายการ',
          cancelButtonText: 'ยกเลิก'
      }).then((result: any) => {
          if (result.isConfirmed) {
              deleteBook(selectedBookId);
              updateCatalogingSession({ selectedBookId: null, viewMode: 'List' });
              Swal.fire('ลบสำเร็จ!', 'ระเบียนถูกลบแล้ว', 'success');
          }
      });
  };

  const handleMerge = () => {
      if (!selectedBookId || !mergeTargetId) return;
      if (selectedBookId === mergeTargetId) return Swal.fire('Error', 'ไม่สามารถรวมระเบียนเดียวกันได้', 'error');
      
      Swal.fire({
          title: 'ยืนยันการรวมระเบียน?',
          text: `ข้อมูลจาก ID: ${mergeTargetId} จะถูกย้ายมาที่นี่และระเบียนเดิมจะถูกลบ`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'รวมระเบียน'
      }).then((result: any) => {
          if (result.isConfirmed) {
              mergeBooks(selectedBookId, mergeTargetId);
              setMergeTargetId('');
              Swal.fire('Success', 'รวมระเบียนเรียบร้อย', 'success');
          }
      });
  };

  const handleClone = () => {
      if(!selectedBookId) return;
      updateCatalogingSession({ selectedBookId: null, isEditMode: false });
      Swal.fire('Clone Success', 'คัดลอกข้อมูลเรียบร้อย กรุณาตรวจสอบและบันทึกเป็นรายการใหม่', 'info');
  };

  const handleAddItem = () => {
      if (!selectedBookId) return;
      if (itemQuantity > 10) return Swal.fire('Limit Exceeded', 'เพิ่มได้สูงสุด 10 เล่มต่อครั้ง', 'warning');
      const newItems: Item[] = [];
      const baseBarcode = itemStartBarcode || Date.now().toString().slice(-6);
      for (let i = 0; i < itemQuantity; i++) {
          let barcode = itemBarcodeMode === 'Auto' ? (Math.floor(Math.random() * 9000000) + 1000000).toString() : (parseInt(baseBarcode) + i).toString().padStart(baseBarcode.length, '0');
          newItems.push({ barcode, status: 'Available', location: itemLocation });
      }
      addItemsToBook(selectedBookId, newItems);
      setShowAddItemModal(false);
      Swal.fire('Added', `เพิ่มตัวเล่ม ${itemQuantity} รายการเรียบร้อย`, 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'ebook') => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => type === 'cover' ? setCoverImage(reader.result as string) : setEbookFile(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  // -- WORKSHEET TAB HELPERS --
  const saveWorksheet = () => {
      if (!editingWs) return;
      if (editingWs.id === 'new') {
          const newWs = { ...editingWs, id: Date.now().toString() };
          addWorksheet(newWs);
          setEditingWs(null);
      } else {
          updateWorksheet(editingWs);
          setEditingWs(null);
      }
      Swal.fire('Saved', 'Worksheet template saved', 'success');
  };

  const addFieldToWs = () => {
      if (!editingWs) return;
      const newField: WorksheetField = {
          id: Date.now().toString(),
          tag: '999',
          ind1: '',
          ind2: '',
          sub: '$a',
          desc: 'New Field',
          required: false
      };
      setEditingWs({ ...editingWs, fields: [...editingWs.fields, newField] });
  };

  const updateWsField = (index: number, field: Partial<WorksheetField>) => {
      if (!editingWs) return;
      const newFields = [...editingWs.fields];
      newFields[index] = { ...newFields[index], ...field };
      setEditingWs({ ...editingWs, fields: newFields });
  };

  const removeWsField = (index: number) => {
      if (!editingWs) return;
      const newFields = editingWs.fields.filter((_, i) => i !== index);
      setEditingWs({ ...editingWs, fields: newFields });
  };

  return (
    <div className="p-8 h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">วิเคราะห์ทรัพยากร (Cataloging)</h1>
            <div className="flex gap-2">
                <button onClick={() => updateCatalogingSession({ activeTab: 'Search', viewMode: 'List' })} className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeTab === 'Search' ? 'bg-white border-slate-300 shadow-sm text-slate-800' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}><Search className="w-4 h-4 inline mr-2"/> ค้นหา</button>
                <button onClick={() => updateCatalogingSession({ activeTab: 'Worksheet' })} className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeTab === 'Worksheet' ? 'bg-white border-slate-300 shadow-sm text-slate-800' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}><Layout className="w-4 h-4 inline mr-2"/> Worksheet</button>
                <button onClick={() => updateCatalogingSession({ activeTab: 'Authority' })} className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeTab === 'Authority' ? 'bg-white border-slate-300 shadow-sm text-slate-800' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}><Tag className="w-4 h-4 inline mr-2"/> Authority</button>
                <button onClick={() => updateCatalogingSession({ activeTab: 'Import' })} className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeTab === 'Import' ? 'bg-white border-slate-300 shadow-sm text-slate-800' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}><UploadCloud className="w-4 h-4 inline mr-2"/> Import</button>
            </div>
       </div>

       {/* --- SEARCH TAB --- */}
       {activeTab === 'Search' && viewMode === 'List' && (
           <div className="flex-1 flex flex-col space-y-4 animate-fadeIn">
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   {/* Search Inputs (Simplified for brevity) */}
                   <div className="flex gap-4">
                       <input type="text" value={searchQuery} onChange={(e) => updateCatalogingSession({ searchQuery: e.target.value })} placeholder="ค้นหาชื่อเรื่อง, ISBN..." className="flex-1 border rounded-lg px-4 py-2" />
                       <button onClick={handleSearch} className="bg-slate-800 text-white px-6 rounded-lg">ค้นหา</button>
                       <button onClick={handleCreateNew} className="bg-accent text-white px-6 rounded-lg flex items-center gap-2"><PlusCircle className="w-4 h-4" /> สร้างใหม่</button>
                   </div>
               </div>
               <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 text-slate-600 border-b"><tr><th className="p-4">Title</th><th className="p-4">Author</th><th className="p-4">Call No.</th><th className="p-4">Action</th></tr></thead>
                       <tbody>{searchResults.map(b => (
                           <tr key={b.id} className="hover:bg-slate-50 border-b cursor-pointer" onClick={() => handleSelectBook(b)}>
                               <td className="p-4 font-medium text-accent">{b.title}</td><td className="p-4">{b.author}</td><td className="p-4 font-mono">{b.callNumber}</td><td className="p-4"><Edit className="w-4 h-4 text-slate-400"/></td>
                           </tr>
                       ))}</tbody>
                   </table>
               </div>
           </div>
       )}

       {/* --- WORKSHEET MANAGEMENT TAB --- */}
       {activeTab === 'Worksheet' && (
           <div className="flex-1 flex gap-6 animate-fadeIn h-full overflow-hidden">
                {/* Left Panel: Lists */}
                <div className="w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="p-4 border-b">
                        <h3 className="font-bold text-slate-800 mb-4">จัดการ Worksheet</h3>
                        <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                             <button onClick={() => setWsFilterType('Bibliographic')} className={`flex-1 py-1 text-xs font-medium rounded ${wsFilterType === 'Bibliographic' ? 'bg-white shadow' : 'text-slate-500'}`}>Bibliographic</button>
                             <button onClick={() => setWsFilterType('Authority')} className={`flex-1 py-1 text-xs font-medium rounded ${wsFilterType === 'Authority' ? 'bg-white shadow' : 'text-slate-500'}`}>Authority</button>
                        </div>
                        <button onClick={() => { 
                            setEditingWs({ id: 'new', name: 'New Worksheet', type: wsFilterType, isFavorite: false, fields: [] }); 
                            setSelectedWorksheetId('new');
                        }} className="w-full py-2 bg-accent text-white rounded-lg text-sm flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> สร้าง Worksheet ใหม่</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">รายการโปรด (Favorites)</span>
                            {worksheets.filter(w => w.type === wsFilterType && w.isFavorite).map(w => (
                                <div key={w.id} onClick={() => { setSelectedWorksheetId(w.id); setEditingWs(w); }} className={`p-3 mt-2 rounded border cursor-pointer hover:border-accent ${selectedWorksheetId === w.id ? 'bg-blue-50 border-accent' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-center"><span className="font-medium text-sm">{w.name}</span><Star className="w-3 h-3 text-yellow-500 fill-current"/></div>
                                </div>
                            ))}
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">ทั้งหมด (All List)</span>
                            {worksheets.filter(w => w.type === wsFilterType && !w.isFavorite).map(w => (
                                <div key={w.id} onClick={() => { setSelectedWorksheetId(w.id); setEditingWs(w); }} className={`p-3 mt-2 rounded border cursor-pointer hover:border-accent ${selectedWorksheetId === w.id ? 'bg-blue-50 border-accent' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-center"><span className="font-medium text-sm">{w.name}</span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Editor */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    {editingWs ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                                <div className="flex gap-4 items-center">
                                    <input type="text" value={editingWs.name} onChange={e => setEditingWs({...editingWs, name: e.target.value})} className="font-bold text-lg bg-transparent border-b border-dashed border-slate-400 outline-none" />
                                    <button onClick={() => setEditingWs({...editingWs, isFavorite: !editingWs.isFavorite})}><Star className={`w-5 h-5 ${editingWs.isFavorite ? 'text-yellow-500 fill-current' : 'text-slate-300'}`} /></button>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { if(window.confirm('ลบ Worksheet?')) { if(editingWs.id !== 'new') deleteWorksheet(editingWs.id); setEditingWs(null); setSelectedWorksheetId(null); } }} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 className="w-5 h-5"/></button>
                                    <button onClick={saveWorksheet} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"><Save className="w-4 h-4"/> บันทึก</button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 text-slate-600 text-xs uppercase"><tr><th className="p-2 w-16">Tag</th><th className="p-2 w-10">I1</th><th className="p-2 w-10">I2</th><th className="p-2 w-16">Sub</th><th className="p-2">Description</th><th className="p-2 w-20">Req</th><th className="p-2 w-10"></th></tr></thead>
                                    <tbody className="divide-y">
                                        {editingWs.fields.map((field, idx) => (
                                            <tr key={idx}>
                                                <td className="p-2"><input className="w-full border rounded p-1 text-center font-mono" value={field.tag} onChange={e => updateWsField(idx, {tag: e.target.value})} /></td>
                                                <td className="p-2"><input className="w-full border rounded p-1 text-center font-mono" value={field.ind1} onChange={e => updateWsField(idx, {ind1: e.target.value})} /></td>
                                                <td className="p-2"><input className="w-full border rounded p-1 text-center font-mono" value={field.ind2} onChange={e => updateWsField(idx, {ind2: e.target.value})} /></td>
                                                <td className="p-2"><input className="w-full border rounded p-1 text-center font-mono" value={field.sub} onChange={e => updateWsField(idx, {sub: e.target.value})} /></td>
                                                <td className="p-2"><input className="w-full border rounded p-1" value={field.desc} onChange={e => updateWsField(idx, {desc: e.target.value})} /></td>
                                                <td className="p-2 text-center"><input type="checkbox" checked={field.required} onChange={e => updateWsField(idx, {required: e.target.checked})} /></td>
                                                <td className="p-2 text-center"><button onClick={() => removeWsField(idx)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button onClick={addFieldToWs} className="mt-4 w-full py-2 border-2 border-dashed border-slate-300 rounded text-slate-500 hover:border-accent hover:text-accent flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> เพิ่มฟิลด์ (Add Field)</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 flex-col">
                            <Layout className="w-12 h-12 mb-2 opacity-50"/>
                            <p>เลือก Worksheet เพื่อแก้ไข</p>
                        </div>
                    )}
                </div>
           </div>
       )}

       {/* --- BIBLIOGRAPHIC EDIT DETAIL VIEW --- */}
       {viewMode === 'Detail' && (
           <div className="flex-1 flex gap-6 h-full overflow-hidden animate-fadeIn">
                {/* Left Panel: Summary */}
                <div className="w-72 flex flex-col gap-4">
                    <button onClick={() => updateCatalogingSession({ viewMode: 'List' })} className="flex items-center text-slate-500 hover:text-slate-800 mb-2"><ArrowLeft className="w-4 h-4 mr-1"/> กลับสู่ผลการค้นหา</button>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                         <div className="w-24 h-36 bg-slate-100 mx-auto mb-4 rounded shadow-inner flex items-center justify-center overflow-hidden">
                             {coverImage ? <img src={coverImage} className="w-full h-full object-cover"/> : <ImageIcon className="w-8 h-8 text-slate-300"/>}
                         </div>
                         <h2 className="font-bold text-slate-800 mb-1 line-clamp-2">{dynamicTags['245$a'] || 'Untitled'}</h2>
                         <p className="text-xs text-slate-500 mb-4">{dynamicTags['100$a'] || 'Unknown'}</p>
                         <div className="text-left space-y-1 text-xs border-t pt-4">
                             <div className="flex justify-between"><span>ISBN:</span> <span className="font-mono text-slate-500">{dynamicTags['020$a']}</span></div>
                             <div className="flex justify-between"><span>Call No:</span> <span className="font-mono text-slate-500 bg-slate-100 px-1 rounded">{dewey} {cutter}</span></div>
                         </div>
                    </div>
                </div>

                {/* Right Panel: Tabs */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                    <div className="flex border-b bg-slate-50">
                        {['Edit', 'MARC', 'Holdings'].map(t => (
                            <button key={t} onClick={() => updateCatalogingSession({ detailTab: t as any })} className={`px-6 py-3 text-sm font-medium border-r ${detailTab === t ? 'bg-white text-accent border-t-2 border-t-accent' : 'text-slate-500'}`}>{t}</button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-white pb-20">
                        {detailTab === 'Edit' && (
                            <div className="space-y-8 max-w-4xl mx-auto">
                                {/* Section 1: Resource & Location */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-slate-800 border-b pb-2 flex items-center gap-2"><FolderOpen className="w-5 h-5"/> 1. ข้อมูลประเภทและสถานที่จัดเก็บ</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div><label className="block text-xs font-bold text-slate-600 mb-1">ประเภทวัสดุ</label><select value={resourceType} onChange={e => setResourceType(e.target.value)} className="w-full border rounded p-2 text-sm">{resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                        <div><label className="block text-xs font-bold text-slate-600 mb-1">สถานที่จัดเก็บ</label><select value={location} onChange={e => setLocation(e.target.value)} className="w-full border rounded p-2 text-sm">{locations.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                                    </div>
                                </div>

                                {/* Section 2: Call Number */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-slate-800 border-b pb-2 flex items-center gap-2"><Tag className="w-5 h-5"/> 2. เลขเรียกหนังสือ (Call Number)</h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Dewey</label><input className="w-full border rounded p-2 text-sm" value={dewey} onChange={e => setDewey(e.target.value)} placeholder="000" /></div>
                                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Cutter</label><input className="w-full border rounded p-2 text-sm" value={cutter} onChange={e => setCutter(e.target.value)} placeholder="A123" /></div>
                                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Year/Vol</label><input className="w-full border rounded p-2 text-sm" value={pubYearCall} onChange={e => setPubYearCall(e.target.value)} /></div>
                                    </div>
                                </div>

                                {/* Section 3: MARC 21 (Worksheet Driven) */}
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b pb-2">
                                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><BookOpen className="w-5 h-5"/> 3. การลงรายการ MARC 21</h3>
                                        <select className="border border-slate-300 rounded text-xs px-2 py-1" value={currentWorksheetId} onChange={e => setCurrentWorksheetId(e.target.value)}>
                                            {worksheets.filter(w => w.type === 'Bibliographic').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg border">
                                        {activeBibWorksheet.fields.map((field, idx) => {
                                            const key = `${field.tag}${field.sub}`;
                                            return (
                                                <div key={idx} className="mb-3">
                                                    <label className="text-xs font-bold text-slate-500 block mb-1">
                                                        {field.tag} {field.sub} - {field.desc} {field.required && <span className="text-red-500">*</span>}
                                                    </label>
                                                    <div className="relative">
                                                        <input 
                                                            className={`w-full border rounded p-2 text-sm focus:ring-2 focus:ring-accent outline-none ${duplicateAuthorAlert && field.tag === '100' ? 'border-blue-400 bg-blue-50' : ''}`} 
                                                            value={dynamicTags[key] || ''} 
                                                            onChange={e => handleDynamicTagChange(key, e.target.value)} 
                                                            placeholder={field.defaultValue}
                                                        />
                                                        {field.tag === '100' && tag100Suggestions.length > 0 && (
                                                            <ul className="absolute z-10 bg-white border shadow-lg w-full max-h-40 overflow-y-auto mt-1 rounded">
                                                                {tag100Suggestions.map(a => (
                                                                    <li key={a.id} onClick={() => handleSelectAuthority(a)} className="p-2 hover:bg-slate-50 text-xs cursor-pointer flex justify-between">
                                                                        <span>{a.heading}</span><span className="text-slate-400">{a.cutter}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                        {field.tag === '100' && duplicateAuthorAlert && (
                                                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> พบข้อมูลเดิมใน Authority Control (Cutter: {duplicateAuthorAlert.cutter})</div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        {/* File Uploads */}
                                        <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
                                             <div>
                                                 <label className="text-xs font-bold text-slate-500 block mb-1">ภาพปก (Cover)</label>
                                                 <div className="flex gap-2">
                                                     <button onClick={() => coverInputRef.current?.click()} className="px-3 py-2 bg-white border rounded text-xs flex items-center gap-2 hover:bg-slate-50"><UploadCloud className="w-3 h-3"/> Upload</button>
                                                     {coverImage && <span className="text-xs text-green-600 flex items-center"><Check className="w-3 h-3"/></span>}
                                                     <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'cover')} />
                                                 </div>
                                             </div>
                                             <div>
                                                 <label className="text-xs font-bold text-slate-500 block mb-1">ไฟล์ดิจิทัล (E-Book)</label>
                                                 <div className="flex gap-2">
                                                     <button onClick={() => ebookInputRef.current?.click()} className="px-3 py-2 bg-white border rounded text-xs flex items-center gap-2 hover:bg-slate-50"><UploadCloud className="w-3 h-3"/> Upload</button>
                                                     {ebookFile && <span className="text-xs text-green-600 flex items-center"><Check className="w-3 h-3"/></span>}
                                                     <input type="file" ref={ebookInputRef} className="hidden" accept=".pdf,.epub" onChange={e => handleFileUpload(e, 'ebook')} />
                                                 </div>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {detailTab === 'Holdings' && selectedBook && (
                             <div className="space-y-6">
                                 <div className="flex justify-between items-center">
                                     <h3 className="font-bold text-lg">รายการตัวเล่ม (Holdings)</h3>
                                     <button onClick={() => setShowAddItemModal(true)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"><Plus className="w-4 h-4"/> เพิ่มฉบับ (Add Item)</button>
                                 </div>
                                 <table className="w-full text-left text-sm border rounded-lg">
                                    <thead className="bg-slate-100"><tr><th className="p-3">Barcode</th><th className="p-3">Status</th><th className="p-3">Location</th></tr></thead>
                                    <tbody className="divide-y">{selectedBook.items?.map((item, i) => (<tr key={i}><td className="p-3 font-mono">{item.barcode}</td><td className="p-3">{translateStatus(item.status)}</td><td className="p-3">{item.location}</td></tr>))}</tbody>
                                </table>
                                {showAddItemModal && (
                                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                        <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                                            <h3 className="font-bold mb-4">เพิ่มตัวเล่ม</h3>
                                            <div className="space-y-3">
                                                <div className="flex gap-2"><button onClick={()=>setItemBarcodeMode('Auto')} className={`flex-1 py-1 text-xs border rounded ${itemBarcodeMode==='Auto'?'bg-blue-50 border-blue-500 text-blue-700':''}`}>Auto</button><button onClick={()=>setItemBarcodeMode('Manual')} className={`flex-1 py-1 text-xs border rounded ${itemBarcodeMode==='Manual'?'bg-blue-50 border-blue-500 text-blue-700':''}`}>Manual</button></div>
                                                {itemBarcodeMode==='Manual' && <input className="w-full border rounded p-2 text-sm" placeholder="Start Barcode" value={itemStartBarcode} onChange={e=>setItemStartBarcode(e.target.value)}/>}
                                                <input type="number" className="w-full border rounded p-2 text-sm" placeholder="Qty" value={itemQuantity} onChange={e=>setItemQuantity(parseInt(e.target.value))}/>
                                                <button onClick={handleAddItem} className="w-full bg-green-600 text-white py-2 rounded">ยืนยัน</button>
                                                <button onClick={()=>setShowAddItemModal(false)} className="w-full text-slate-500 py-2">ยกเลิก</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                             </div>
                        )}
                        
                        {detailTab === 'MARC' && (
                            <div className="font-mono text-sm p-4 bg-slate-50 rounded border">
                                <h3 className="font-bold mb-4">MARC Preview</h3>
                                <div className="space-y-1">
                                    <div className="flex"><span className="w-8 font-bold text-blue-600">LDR</span> <span>00000nam a2200000 a 4500</span></div>
                                    {Object.entries(dynamicTags).sort().map(([key, val]) => (
                                        <div key={key} className="flex">
                                            <span className="w-8 font-bold text-blue-600">{key.substring(0,3)}</span> 
                                            <span className="w-6 text-slate-400">##</span> 
                                            <span>{key.substring(3)} {val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Fixed Footer Actions */}
                    <div className="absolute bottom-0 w-full bg-white border-t p-4 flex justify-between items-center shadow-lg">
                        <div className="flex gap-2">
                             <button onClick={handleDeleteBook} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-5 h-5"/></button>
                             <button onClick={handleClone} className="text-slate-500 hover:bg-slate-50 p-2 rounded flex items-center gap-1"><Copy className="w-4 h-4"/> Clone</button>
                             <button onClick={() => { if(mergeTargetId) handleMerge(); else { const id = prompt('Enter Target ID to merge into current:'); if(id) setMergeTargetId(id); }}} className="text-slate-500 hover:bg-slate-50 p-2 rounded flex items-center gap-1"><GitMerge className="w-4 h-4"/> Merge</button>
                        </div>
                        <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded font-bold shadow hover:bg-green-700 flex items-center gap-2"><Save className="w-4 h-4"/> บันทึกข้อมูล</button>
                    </div>
                </div>
           </div>
       )}
       
       {activeTab === 'Authority' && (
           <div className="flex-1 p-6 bg-white rounded-xl border border-slate-200">
               <h2 className="text-xl font-bold mb-4">Authority Control</h2>
               <div className="overflow-auto h-[500px]">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-100"><tr><th className="p-3">Tag</th><th className="p-3">Heading</th><th className="p-3">Cutter</th><th className="p-3">Type</th></tr></thead>
                       <tbody>
                           {authorityRecords.map(a => (
                               <tr key={a.id} className="border-b">
                                   <td className="p-3 font-mono font-bold">{a.tag}</td>
                                   <td className="p-3">{a.heading}</td>
                                   <td className="p-3 font-mono text-blue-600">{a.cutter}</td>
                                   <td className="p-3 text-slate-500">{a.type}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>
       )}
       
       {activeTab === 'Import' && (
           <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-400">
               <UploadCloud className="w-16 h-16 mb-4 opacity-50"/>
               <h2 className="text-lg font-bold text-slate-600">Import MARC (ISO 2709)</h2>
               <p className="mb-6">Upload .mrc files to import records</p>
               <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Select File</button>
           </div>
       )}
    </div>
  );
};

export default Cataloging;
