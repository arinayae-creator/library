
import React, { useState, useRef } from 'react';
import { Save, PlusCircle, Tag, Database, Globe, Copy, Box, Search, ArrowRight, Trash2, Edit, History, Bookmark, Plus, X, Code, ScanLine, Image as ImageIcon, Upload, Check, BookOpen, User, FileText, Link as LinkIcon, File } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Book, Item, Subject, Transaction } from '../types';

// Declare Swal type
declare const Swal: any;

const Cataloging: React.FC = () => {
  const { books, patrons, subjects, addBook, updateBookDetails, deleteBook, addSubject, translateStatus, marcTags, resourceTypes, locations } = useLibrary();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'Search' | 'Bib' | 'Item' | 'Union'>('Search');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [searchType, setSearchType] = useState<'Basic' | 'Advanced'>('Basic');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Advanced Search Fields
  const [advTitle, setAdvTitle] = useState('');
  const [advAuthor, setAdvAuthor] = useState('');
  const [advISBN, setAdvISBN] = useState('');
  const [advSubject, setAdvSubject] = useState('');

  // --- Bibliographic Record Form State (Split into 3 parts) ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [formId, setFormId] = useState('');
  
  // Part 1: Resource Type & Location (Mandatory)
  const [resourceType, setResourceType] = useState(resourceTypes[0] || 'Book');
  const [location, setLocation] = useState('ชั้น 1 - ทั่วไป');
  
  // Part 2: Call Number (Mandatory)
  const [dewey, setDewey] = useState('');
  const [cutter, setCutter] = useState('');
  const [pubYearCall, setPubYearCall] = useState('');
  
  // Part 3: MARC 21 Fields (Expanded)
  const [tag020, setTag020] = useState(''); // ISBN
  const [tag041, setTag041] = useState('tha'); // Language
  // Tag 082 is Dewey (mapped from Part 2)
  const [tag100, setTag100] = useState(''); // Author Person
  const [tag110, setTag110] = useState(''); // Author Corp
  const [tag245a, setTag245a] = useState(''); // Title (Mandatory)
  const [tag245c, setTag245c] = useState(''); // Statement of responsibility
  const [tag246, setTag246] = useState(''); // Varying form of title
  const [tag250, setTag250] = useState(''); // Edition
  const [tag260, setTag260] = useState(''); // Pub: Place : Publisher : Year
  const [tag300, setTag300] = useState(''); // Physical Desc
  const [tag440, setTag440] = useState(''); // Series
  const [tag500, setTag500] = useState(''); // General Note
  const [tag520, setTag520] = useState(''); // Summary
  const [tag541, setTag541] = useState(''); // Price
  const [tag650, setTag650] = useState(''); // Subject (Authority)
  const [tag700, setTag700] = useState(''); // Added Entry Person
  const [tag710, setTag710] = useState(''); // Added Entry Corp
  const [tag856, setTag856] = useState(''); // E-book Link
  const [tag856File, setTag856File] = useState(''); // Uploaded E-book Filename
  const [tag902, setTag902] = useState(''); // Cover Image (Base64)
  const [tag990, setTag990] = useState(''); // Source
  
  // Custom MARC Fields
  const [extraMarc, setExtraMarc] = useState<{tag: string, sub: string, val: string, desc: string, inputType: string}[]>([]);
  const [showAddMarcFieldModal, setShowAddMarcFieldModal] = useState(false);
  const [newFieldData, setNewFieldData] = useState({
      resourceType: '',
      tag: '',
      subfield: '',
      desc: '',
      mandatory: false,
      inputType: 'single'
  });

  // Subject Authority State
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [suggestedSubjects, setSuggestedSubjects] = useState<Subject[]>([]);

  // --- Holdings State ---
  const [holdingsMode, setHoldingsMode] = useState<'Manual' | 'Auto'>('Auto');
  const [manualBarcode, setManualBarcode] = useState('');
  const [autoCopyCount, setAutoCopyCount] = useState(1);
  const [maxReservations, setMaxReservations] = useState(1);

  // Management Views
  const [showMarcModal, setShowMarcModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHoldsModal, setShowHoldsModal] = useState(false);

  // --- Helper: Get Global Max ID/Barcode ---
  const getGlobalMaxBarcode = () => {
      let maxVal = 0;
      books.forEach(b => {
          // Check Book ID
          const bId = parseInt(b.id, 10);
          if (!isNaN(bId) && bId > maxVal) maxVal = bId;
          
          // Check Item Barcodes
          if (b.items && Array.isArray(b.items)) {
              b.items.forEach(i => {
                   const val = parseInt(i.barcode, 10);
                   if (!isNaN(val) && val > maxVal) {
                       maxVal = val;
                   }
              });
          }
      });
      return maxVal;
  };

  // --- Search Logic ---
  const handleSearch = () => {
      let results = books;
      if (searchType === 'Basic') {
          if (searchBarcode) {
             results = books.filter(b => 
                String(b.id) === searchBarcode || 
                b.items?.some(i => i.barcode === searchBarcode) ||
                (b.isbn && String(b.isbn) === searchBarcode)
             );
          } else if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            results = books.filter(b => 
                (b.title && b.title.toLowerCase().includes(lowerQ)) ||
                (b.author && b.author.toLowerCase().includes(lowerQ)) ||
                (b.isbn && String(b.isbn).includes(lowerQ)) ||
                (b.subject && b.subject.toLowerCase().includes(lowerQ))
            );
          } else {
              results = [];
          }
      } else {
          // Advanced
          results = books.filter(b => 
            (advTitle ? (b.title && b.title.toLowerCase().includes(advTitle.toLowerCase())) : true) &&
            (advAuthor ? (b.author && b.author.toLowerCase().includes(advAuthor.toLowerCase())) : true) &&
            (advISBN ? (b.isbn && String(b.isbn).includes(advISBN)) : true) &&
            (advSubject ? (b.subject && b.subject.toLowerCase().includes(advSubject.toLowerCase())) : true)
          );
      }
      setSearchResults(results);
      setHasSearched(true);
      setSelectedBook(null);
      if(searchBarcode) setSearchBarcode('');
  };

  // --- Fill Form for Edit/Copy ---
  const populateForm = (book: Book, isCopy: boolean) => {
      setFormId(isCopy ? '' : book.id);
      setIsEditMode(!isCopy);
      
      // Part 1
      setResourceType(book.format);
      setLocation(book.items?.[0]?.location || 'ชั้น 1 - ทั่วไป');

      // Part 2 (Naive splitting of call number)
      const callParts = book.callNumber.split(' ');
      setDewey(callParts[0] || '');
      setCutter(callParts[1] || '');
      setPubYearCall(callParts[2] || book.pubYear || '');

      // Part 3
      setTag020(book.isbn);
      setTag100(book.author);
      setTag245a(isCopy ? book.title + ' (Copy)' : book.title);
      setTag260(` : ${book.publisher || ''} : ${book.pubYear || ''}`);
      setTag300(`${book.pages || ''} : : `);
      setTag520(book.description || '');
      setTag650(book.subject || '');
      setTag856(book.ebookUrl || '');
      setTag902(book.coverUrl || '');
      setMaxReservations(book.maxReservations || 1);

      // Restore Extra MARC Fields from marcData
      if (book.marcData && !isCopy) {
          const standardTags = ['020', '041', '082', '100', '110', '245', '246', '250', '260', '300', '440', '500', '520', '541', '650', '700', '710', '856', '902', '990'];
          const loadedExtra: typeof extraMarc = [];
          
          Object.entries(book.marcData).forEach(([tag, val]) => {
              if (!standardTags.includes(tag)) {
                  // Try to find description from marcTags definitions
                  const def = marcTags.find(t => t.tag === tag);
                  loadedExtra.push({
                      tag: tag,
                      sub: def?.sub || '$a',
                      val: val,
                      desc: def?.desc || 'Custom Field',
                      inputType: 'single'
                  });
              }
          });
          setExtraMarc(loadedExtra);
      } else {
          setExtraMarc([]);
      }
  };

  const handleEditBib = () => {
      if (!selectedBook) return;
      populateForm(selectedBook, false);
      setActiveTab('Bib');
  };

  const handleCopyBib = () => {
      if (!selectedBook) return;
      populateForm(selectedBook, true);
      setActiveTab('Bib');
  };

  // --- Bib Form Logic ---
  const handleSubjectChange = (val: string) => {
      setTag650(val);
      if (val.length > 1) {
          const matches = subjects.filter(s => s.heading.toLowerCase().includes(val.toLowerCase())).slice(0, 50);
          setSuggestedSubjects(matches);
          setShowSubjectSuggestions(true);
      } else {
          setShowSubjectSuggestions(false);
      }
  };

  const selectSubject = (sub: Subject) => {
      setTag650(sub.heading);
      setDewey(sub.dewey || dewey); // Auto-fill Dewey from Authority
      setShowSubjectSuggestions(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setTag902(reader.result as string);
          reader.readAsDataURL(file);
      }
  };
  
  const handleEbookUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setTag856File(file.name);
          // In a real app, upload logic here. For now we just mock it
          setTag856(`https://library.example.com/ebooks/${file.name}`);
      }
  };

  const generateAutoCallNumber = () => {
      if (!tag100) return;
      const cutterGen = tag100.charAt(0) + Math.floor(Math.random() * 99);
      setCutter(cutterGen);
      setPubYearCall(new Date().getFullYear().toString());
  };

  // --- Add MARC Field Modal Logic ---
  const handleTagSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedTag = marcTags.find(t => t.tag === e.target.value);
      if (selectedTag) {
          setNewFieldData({
              ...newFieldData,
              tag: selectedTag.tag,
              subfield: selectedTag.sub,
              desc: selectedTag.desc
          });
      } else {
          setNewFieldData({ ...newFieldData, tag: e.target.value });
      }
  };

  const saveNewMarcField = () => {
      if (!newFieldData.tag) return;
      setExtraMarc([...extraMarc, {
          tag: newFieldData.tag,
          sub: newFieldData.subfield,
          val: '',
          desc: newFieldData.desc,
          inputType: newFieldData.inputType
      }]);
      setShowAddMarcFieldModal(false);
      setNewFieldData({
          resourceType: resourceTypes[0] || '',
          tag: '',
          subfield: '',
          desc: '',
          mandatory: false,
          inputType: 'single'
      });
  };

  const handleRemoveExtraMarc = (index: number) => {
      const newExtra = [...extraMarc];
      newExtra.splice(index, 1);
      setExtraMarc(newExtra);
  };

  const handleSaveBib = async () => {
      // Validation
      if (!resourceType || !location || !dewey || !cutter || !tag245a) {
          Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลช่องที่มีเครื่องหมาย * ให้ครบถ้วน (ประเภท, สถานที่, เลขหมู่, เลขประจำหนังสือ, ชื่อเรื่อง)', 'warning');
          return;
      }

      const fullCallNumber = `${dewey} ${cutter} ${pubYearCall}`.trim();
      
      // Parsing specific fields for the Book object mockup
      const pub = tag260.split(':')[1]?.trim() || '';
      const pages = tag300.split(':')[0]?.trim() || '';

      // Compile MARC Data (Standard + Custom)
      const marcDataPayload: Record<string, string> = {
          '020': tag020,
          '041': tag041,
          '082': fullCallNumber,
          '100': tag100,
          '110': tag110,
          '245': `${tag245a} ${tag245c}`.trim(),
          '246': tag246,
          '250': tag250,
          '260': tag260,
          '300': tag300,
          '440': tag440,
          '500': tag500,
          '520': tag520,
          '541': tag541,
          '650': tag650,
          '700': tag700,
          '710': tag710,
          '856': tag856,
          '902': tag902,
          '990': tag990,
      };

      // Add extra/custom MARC fields
      extraMarc.forEach(field => {
          if (field.tag && field.val) {
              marcDataPayload[field.tag] = field.val;
          }
      });

      const bookData: Book = {
          // Use a temporary ID for Staging. 
          // IMPORTANT: This ID will be overwritten by the Barcode when "Add Holdings" is confirmed for new books.
          id: (isEditMode && formId) ? formId : `PENDING-${Date.now()}`, 
          title: tag245a,
          author: tag100 || tag110 || 'ไม่ระบุ',
          isbn: tag020 || 'N/A',
          callNumber: fullCallNumber,
          status: 'Available',
          format: resourceType as any,
          subject: tag650,
          pubYear: pubYearCall || tag260.split(':').pop()?.trim(),
          coverUrl: tag902,
          publisher: pub,
          pages: pages,
          description: tag520,
          ebookUrl: tag856,
          items: isEditMode ? (selectedBook?.items || []) : [], // Keep items if editing
          maxReservations: maxReservations,
          marcData: marcDataPayload // Save the full MARC data
      };

      if (isEditMode && formId) {
          // If editing an existing book, save immediately
          Swal.fire({
              title: 'กำลังบันทึกข้อมูล...',
              allowOutsideClick: false,
              didOpen: () => Swal.showLoading()
          });
          await new Promise(resolve => setTimeout(resolve, 800));
          updateBookDetails(bookData);
          Swal.fire('สำเร็จ', 'บันทึกการแก้ไขเรียบร้อย', 'success');
          setSelectedBook(bookData);
      } else {
          // If creating a NEW book, DO NOT SAVE to DB yet.
          // Stage the data and move to Holdings tab.
          setSelectedBook(bookData);
          setActiveTab('Item'); // Redirect to Holdings
          Swal.fire({
              icon: 'info',
              title: 'ขั้นตอนต่อไป',
              text: 'กรุณาเพิ่มข้อมูลตัวเล่ม (Holdings) และกดบันทึกเพื่อยืนยันการจัดเก็บข้อมูลลงฐานข้อมูล',
              confirmButtonText: 'รับทราบ'
          });
      }
  };

  const resetForm = () => {
      setIsEditMode(false);
      setFormId('');
      setResourceType('Book');
      setDewey(''); setCutter(''); setPubYearCall('');
      setTag020(''); setTag041('tha'); setTag100(''); setTag110('');
      setTag245a(''); setTag245c(''); setTag246(''); setTag250('');
      setTag260(''); setTag300(''); setTag440(''); setTag500('');
      setTag520(''); setTag541(''); setTag650(''); setTag700('');
      setTag710(''); setTag856(''); setTag902(''); setTag990('');
      setExtraMarc([]);
  };

  // --- Holdings Logic ---
  const handleAddHoldings = () => {
      if (!selectedBook) return;

      const newItems: Item[] = [];
      const maxGlobal = getGlobalMaxBarcode(); // Get current max ID from whole DB
      
      if (holdingsMode === 'Manual') {
          if (!manualBarcode) { Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุบาร์โค้ด', 'warning'); return; }
          // Check for duplicate
          const exists = books.some(b => b.items?.some(i => i.barcode === manualBarcode));
          if (exists) { Swal.fire('ซ้ำ', `บาร์โค้ด ${manualBarcode} มีอยู่ในระบบแล้ว`, 'error'); return; }

          newItems.push({ barcode: manualBarcode, status: 'Available', location });
      } else {
          // Auto - Sequential 7 digits starting 0000001
          const count = Math.max(1, Math.min(10, autoCopyCount)); 
          
          for (let i = 1; i <= count; i++) {
              const nextVal = maxGlobal + i;
              const autoCode = nextVal.toString().padStart(7, '0');
              newItems.push({ barcode: autoCode, status: 'Available', location });
          }
      }

      // CHECK: Is this a new book (not in DB yet) or an update?
      const isExistingBook = books.some(b => b.id === selectedBook.id);

      if (isExistingBook) {
          // If editing/adding items to existing book -> Update
          const updatedBook = {
              ...selectedBook,
              items: [...(selectedBook.items || []), ...newItems],
              maxReservations: maxReservations
          };
          updateBookDetails(updatedBook);
          setSelectedBook(updatedBook);
          Swal.fire('สำเร็จ', `เพิ่มตัวเล่มสำเร็จ ${newItems.length} รายการ`, 'success');
      } else {
          // If this was a staged new book -> Create (Add)
          // IMPORTANT: Overwrite the temporary Book ID with the FIRST Barcode generated
          // This ensures Book ID = Barcode (for the first copy)
          const primaryId = newItems[0].barcode;
          
          const finalizedBook: Book = {
              ...selectedBook,
              id: primaryId, // SYNC ID WITH BARCODE
              items: newItems,
              maxReservations: maxReservations
          };

          addBook(finalizedBook);
          setSelectedBook(finalizedBook);
          
          Swal.fire({
              icon: 'success',
              title: 'บันทึกสำเร็จ',
              text: `สร้างรายการใหม่ ID: ${primaryId} และตัวเล่ม ${newItems.length} รายการเรียบร้อยแล้ว`,
              timer: 2500
          });
      }
      
      setManualBarcode('');
  };

  // --- Helpers for Dashboard ---
  const getDetailedHolds = (book: Book) => {
      const holds: {patronName: string, date: string, status: string, dueDate: string}[] = [];
      
      // Find active transaction for this book to get Due Date if checked out
      let dueDate = '-';
      for (const p of patrons) {
          const activeTx = p.history.find(t => 
              t.status === 'Active' && 
              (t.barcode === book.id || book.items?.some(i => i.barcode === t.barcode))
          );
          if (activeTx) {
              dueDate = activeTx.dueDate;
              break; // Found one, use it
          }
      }

      patrons.forEach(p => {
          if (p.reservedItems?.some(b => b.id === book.id)) {
              holds.push({
                  patronName: p.name,
                  date: 'วันนี้', // Mock as real reservation date isn't in Patron schema yet
                  status: translateStatus(book.status),
                  dueDate: dueDate
              });
          }
      });
      return holds;
  };

  const getBookLoanHistory = (book: Book) => {
      let history: Transaction[] = [];
      patrons.forEach(p => {
          const matches = p.history.filter(t => 
               t.barcode === book.id || book.items?.some(i => i.barcode === t.barcode)
          );
          history = [...history, ...matches];
      });
      return history.reverse(); 
  };

  const getAllReservationHistory = (book: Book) => {
      const activeHolds = getDetailedHolds(book).map(h => ({
          patronName: h.patronName,
          date: h.date,
          status: 'กำลังจอง (Active)',
          actionDate: '-'
      }));

      const pastHolds = book.reservationHistory?.map(h => ({
          patronName: h.patronName,
          date: h.requestDate,
          status: h.status === 'Fulfilled' ? 'รับหนังสือแล้ว' : h.status === 'Cancelled' ? 'ยกเลิก' : 'หมดอายุ',
          actionDate: h.actionDate || '-'
      })) || [];

      return [...activeHolds, ...pastHolds];
  };

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">งานวิเคราะห์ทรัพยากร (Cataloging)</h1>
            <p className="text-slate-500 text-sm mt-1">สืบค้น, ลงรายการ, วิเคราะห์หมวดหมู่, และจัดการตัวเล่ม</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => { resetForm(); setActiveTab('Bib'); }}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600 shadow-sm flex items-center gap-2" 
            >
                <PlusCircle className="w-4 h-4" /> สร้างบรรณานุกรมใหม่
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
          <nav className="flex gap-6 overflow-x-auto">
            <button onClick={() => setActiveTab('Search')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'Search' ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Search className="w-4 h-4"/> สืบค้นรายการ (Search)
            </button>
            <button onClick={() => setActiveTab('Bib')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'Bib' ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Database className="w-4 h-4"/> ข้อมูลบรรณานุกรม (Bib Record)
            </button>
            <button onClick={() => setActiveTab('Item')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'Item' ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Box className="w-4 h-4"/> ข้อมูลตัวเล่ม (Holdings)
            </button>
            <button onClick={() => setActiveTab('Union')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'Union' ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Globe className="w-4 h-4"/> สหบรรณานุกรม (Union Catalog)
            </button>
          </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
          
          {/* --- TAB 1: SEARCH & MANAGE --- */}
          {activeTab === 'Search' && (
              <div className="flex flex-col lg:flex-row gap-6 h-full">
                  {/* Left: Search & Results */}
                  <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedBook ? 'lg:w-1/2' : 'w-full'}`}>
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                          {/* Search Inputs */}
                          <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={searchType === 'Basic'} onChange={() => setSearchType('Basic')} className="text-accent" />
                                        <span className="text-sm font-medium text-slate-700">ค้นหาแบบง่าย (Basic)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={searchType === 'Advanced'} onChange={() => setSearchType('Advanced')} className="text-accent" />
                                        <span className="text-sm font-medium text-slate-700">ค้นหาขั้นสูง (Advanced)</span>
                                    </label>
                                </div>
                          </div>
                          {searchType === 'Basic' ? (
                              <div className="flex flex-col md:flex-row gap-3">
                                  <div className="relative w-full md:w-1/3">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <ScanLine className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input type="text" className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none font-mono" placeholder="สแกนบาร์โค้ด" value={searchBarcode} onChange={(e) => setSearchBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} autoFocus />
                                  </div>
                                  <div className="relative flex-1">
                                      <input type="text" className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-accent outline-none" placeholder="ชื่อเรื่อง, ผู้แต่ง, ISBN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                                  </div>
                                  <button onClick={handleSearch} className="bg-accent text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
                                      <Search className="w-4 h-4" />
                                  </button>
                              </div>
                          ) : (
                              <div className="grid grid-cols-2 gap-3">
                                  <input type="text" placeholder="ชื่อเรื่อง" className="border p-2 rounded text-sm" value={advTitle} onChange={e => setAdvTitle(e.target.value)} />
                                  <input type="text" placeholder="ผู้แต่ง" className="border p-2 rounded text-sm" value={advAuthor} onChange={e => setAdvAuthor(e.target.value)} />
                                  <input type="text" placeholder="ISBN" className="border p-2 rounded text-sm" value={advISBN} onChange={e => setAdvISBN(e.target.value)} />
                                  <input type="text" placeholder="หัวเรื่อง" className="border p-2 rounded text-sm" value={advSubject} onChange={e => setAdvSubject(e.target.value)} />
                                  <button onClick={handleSearch} className="col-span-2 bg-accent text-white py-2 rounded text-sm">ค้นหา</button>
                              </div>
                          )}
                      </div>

                      {/* Results Table */}
                      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                           <div className="p-4 bg-slate-50 border-b"><h3 className="font-bold text-slate-700 text-sm">ผลการสืบค้น ({searchResults.length})</h3></div>
                           <div className="flex-1 overflow-y-auto">
                               <table className="w-full text-left text-sm">
                                   <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0 z-10 shadow-sm">
                                       <tr>
                                            <th className="px-4 py-3 w-16">ปก</th>
                                            <th className="px-4 py-3">ชื่อเรื่อง / ผู้แต่ง</th>
                                            <th className="px-4 py-3">ประเภท / ที่เก็บ</th>
                                            <th className="px-4 py-3">เลขเรียก / รหัสตัวเล่ม</th>
                                            <th className="px-4 py-3">สถานะ</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                       {searchResults.map((book) => (
                                           <tr key={book.id} className={`hover:bg-blue-50 cursor-pointer ${selectedBook?.id === book.id ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''}`} onClick={() => setSelectedBook(book)}>
                                               <td className="px-4 py-3"><div className="w-10 h-14 bg-slate-200 rounded overflow-hidden">{book.coverUrl && <img src={book.coverUrl} className="w-full h-full object-cover" />}</div></td>
                                               <td className="px-4 py-3">
                                                    <div className="font-bold text-slate-800">{book.title}</div>
                                                    <div className="text-xs text-slate-500">{book.author}</div>
                                               </td>
                                               <td className="px-4 py-3"><div className="text-slate-700">{book.format}</div><div className="text-xs text-slate-400 mt-1">{book.items?.[0]?.location || 'General'}</div></td>
                                               <td className="px-4 py-3">
                                                    <div className="font-medium">{book.callNumber}</div>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {book.items && book.items.length > 0 ? (
                                                            book.items.map(item => (
                                                                <span key={item.barcode} className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${item.status === 'Available' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                                                    {item.barcode}
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Available' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-slate-400">-</span>
                                                        )}
                                                    </div>
                                               </td>
                                               <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${book.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{translateStatus(book.status)}</span></td>
                                               <td className="px-4 py-3"><ArrowRight className="w-4 h-4 text-slate-400" /></td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                      </div>
                  </div>

                  {/* Right: Management Dashboard */}
                  {selectedBook && (
                      <div className="w-full lg:w-1/2 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-inner flex flex-col animate-fadeIn overflow-y-auto">
                           <div className="flex justify-between items-start mb-6">
                               <div className="flex gap-4 w-full">
                                   <img src={selectedBook.coverUrl || 'https://via.placeholder.com/150'} className="w-28 h-40 rounded shadow-md bg-white object-cover border" />
                                   <div className="flex-1">
                                       <h2 className="text-xl font-bold text-slate-800">{selectedBook.title}</h2>
                                       <p className="text-slate-600 text-sm mb-2">{selectedBook.author}</p>
                                       <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 bg-white p-2 rounded border border-slate-100">
                                           <div><span className="font-bold">ISBN:</span> {selectedBook.isbn}</div>
                                           <div><span className="font-bold">Call No:</span> {selectedBook.callNumber}</div>
                                           <div><span className="font-bold">Format:</span> {selectedBook.format}</div>
                                           <div><span className="font-bold">Loc:</span> {selectedBook.items?.[0]?.location}</div>
                                       </div>
                                   </div>
                               </div>
                               <button onClick={() => setSelectedBook(null)}><X className="w-5 h-5 text-slate-400" /></button>
                           </div>

                           {/* Actions Menu - Grouped as requested */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
                               <button onClick={handleEditBib} className="bg-white p-2 rounded border hover:border-blue-500 flex flex-col items-center gap-1 text-xs font-medium text-slate-700 hover:text-blue-600 transition-colors shadow-sm"><Edit className="w-4 h-4"/> แก้ไขบรรณานุกรม</button>
                               <button onClick={() => setShowMarcModal(true)} className="bg-white p-2 rounded border hover:border-purple-500 flex flex-col items-center gap-1 text-xs font-medium text-slate-700 hover:text-purple-600 transition-colors shadow-sm"><Code className="w-4 h-4"/> แก้ไขระเบียน MARC</button>
                               <button onClick={() => setShowHistoryModal(true)} className="bg-white p-2 rounded border hover:border-blue-500 flex flex-col items-center gap-1 text-xs font-medium text-slate-700 hover:text-blue-600 transition-colors shadow-sm"><History className="w-4 h-4"/> ประวัติยืม-คืน</button>
                               <button onClick={() => setShowHoldsModal(true)} className="bg-white p-2 rounded border hover:border-orange-500 flex flex-col items-center gap-1 text-xs font-medium text-slate-700 hover:text-orange-600 transition-colors shadow-sm"><Bookmark className="w-4 h-4"/> ประวัติรายการจอง</button>
                               <button onClick={handleCopyBib} className="bg-white p-2 rounded border hover:border-green-500 flex flex-col items-center gap-1 text-xs font-medium text-slate-700 hover:text-green-600 transition-colors shadow-sm"><Copy className="w-4 h-4"/> คัดลอกรายการ</button>
                               <button onClick={() => deleteBook(selectedBook.id)} className="bg-white p-2 rounded border hover:border-red-500 flex flex-col items-center gap-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm"><Trash2 className="w-4 h-4"/> ลบรายการ</button>
                           </div>
                           
                           {/* Add link to Holdings tab since "Manage Holdings" button is removed from main grid */}
                           <div className="text-right mb-2">
                               <button onClick={() => setActiveTab('Item')} className="text-xs text-blue-600 hover:underline flex items-center justify-end gap-1">ไปที่จัดการตัวเล่ม <ArrowRight className="w-3 h-3" /></button>
                           </div>

                           {/* Holdings Summary */}
                           <div className="mb-6">
                               <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-2">
                                   <Box className="w-4 h-4 text-slate-500"/> 
                                   รายการตัวเล่ม (Holdings Summary)
                                   {selectedBook.items && selectedBook.items.length > 0 && (
                                        <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                                            มีทั้งหมด {selectedBook.items.length} ฉบับ
                                        </span>
                                   )}
                               </h3>
                               <div className="bg-white rounded border border-slate-200 overflow-hidden max-h-56 overflow-y-auto shadow-sm">
                                   <table className="w-full text-xs text-left relative border-collapse">
                                       <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 shadow-sm">
                                           <tr>
                                               <th className="px-4 py-3 w-12 text-center border-b">ลำดับ</th>
                                               <th className="px-4 py-3 border-b">รหัสบาร์โค้ด (Barcode)</th>
                                               <th className="px-4 py-3 border-b">สถานะ</th>
                                               <th className="px-4 py-3 border-b">สถานที่</th>
                                           </tr>
                                       </thead>
                                       <tbody className="divide-y divide-slate-100">
                                           {selectedBook.items?.map((item, idx) => (
                                               <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                                   <td className="px-4 py-2.5 text-slate-500 text-center font-mono bg-slate-50/50">{idx + 1}</td>
                                                   <td className="px-4 py-2.5 font-mono font-bold text-slate-700 text-sm">{item.barcode}</td>
                                                   <td className="px-4 py-2.5">
                                                       <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border shadow-sm ${
                                                           item.status === 'Available' 
                                                           ? 'bg-green-50 border-green-200 text-green-700' 
                                                           : item.status === 'Checked Out'
                                                           ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                           : item.status === 'Reserved'
                                                           ? 'bg-orange-50 border-orange-200 text-orange-700'
                                                           : 'bg-red-50 border-red-200 text-red-700'
                                                       }`}>
                                                           {item.status === 'Available' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>}
                                                           {translateStatus(item.status)}
                                                       </span>
                                                   </td>
                                                   <td className="px-4 py-2.5 text-slate-600">{item.location}</td>
                                               </tr>
                                           ))}
                                           {(!selectedBook.items || selectedBook.items.length === 0) && (
                                               <tr><td colSpan={4} className="p-6 text-center text-slate-400 italic bg-slate-50/30">ยังไม่มีรายการตัวเล่มในระบบ</td></tr>
                                           )}
                                       </tbody>
                                   </table>
                               </div>
                           </div>

                           {/* Holds Management Preview */}
                           <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-6">
                               <h3 className="font-bold text-orange-800 text-sm flex items-center gap-2 mb-2"><Bookmark className="w-4 h-4" /> รายการจองปัจจุบัน (Active Holds)</h3>
                               <div className="bg-white rounded border border-orange-100 overflow-hidden">
                                   {getDetailedHolds(selectedBook).length > 0 ? (
                                       <table className="w-full text-xs text-left">
                                           <thead className="bg-orange-100/50 text-orange-800">
                                                <tr>
                                                    <th className="px-3 py-2">ชื่อผู้จอง</th>
                                                    <th className="px-3 py-2">วันที่จอง</th>
                                                    <th className="px-3 py-2">สถานะหนังสือ</th>
                                                    <th className="px-3 py-2">กำหนดคืน (Due)</th>
                                                </tr>
                                           </thead>
                                           <tbody className="divide-y divide-orange-100">
                                               {getDetailedHolds(selectedBook).map((h, i) => (
                                                   <tr key={i}>
                                                       <td className="px-3 py-2 font-medium text-slate-700">{h.patronName}</td>
                                                       <td className="px-3 py-2 text-slate-500">{h.date}</td>
                                                       <td className="px-3 py-2 text-slate-600">{h.status}</td>
                                                       <td className="px-3 py-2 font-mono text-orange-600">{h.dueDate}</td>
                                                   </tr>
                                               ))}
                                           </tbody>
                                       </table>
                                   ) : (
                                       <div className="p-3 text-center text-slate-400 text-xs">ไม่มีรายการจอง</div>
                                   )}
                               </div>
                           </div>
                      </div>
                  )}
              </div>
          )}

          {/* ... (rest of the file remains unchanged from previous state) ... */}
          {/* Note: I'm only including the updated parts above. The below XML block must contain the FULL content as per instructions. 
              The changes above cover logic within Cataloging component. 
              I will now output the full file content with the applied changes.
          */}
          {/* --- TAB 2: BIB RECORD (3 SECTIONS) --- */}
          {activeTab === 'Bib' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-y-auto animate-fadeIn flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Database className="w-5 h-5 text-accent" /> 
                        {isEditMode ? 'แก้ไขข้อมูลบรรณานุกรม' : 'สร้างบรรณานุกรมใหม่'}
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={resetForm} className="px-4 py-2 border rounded hover:bg-slate-100">ล้างค่า</button>
                        <button onClick={handleSaveBib} className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2">
                            {isEditMode ? <Save className="w-4 h-4"/> : <ArrowRight className="w-4 h-4"/>} 
                            {isEditMode ? 'บันทึก' : 'ถัดไป (ตัวเล่ม)'}
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Section 1: Resource Type & Location */}
                    <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                            <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                            ข้อมูลประเภทและสถานที่จัดเก็บ (Resource & Location)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">ประเภททรัพยากร (Resource Type) <span className="text-red-500">*</span></label>
                                <select className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent" value={resourceType} onChange={e => setResourceType(e.target.value)}>
                                    {resourceTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">สถานที่จัดเก็บ (Location) <span className="text-red-500">*</span></label>
                                <select className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent" value={location} onChange={e => setLocation(e.target.value)}>
                                    {locations.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Call Number */}
                    <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h4 className="text-md font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-200 pb-2">
                            <span className="bg-blue-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                            เลขเรียกหนังสือ (Call Number) - อิง Tag 082
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-1">เลขหมู่ (Dewey) <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full border rounded px-3 py-2" value={dewey} onChange={e => setDewey(e.target.value)} placeholder="000-999" />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-1">เลขประจำหนังสือ (Cutter) <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full border rounded px-3 py-2" value={cutter} onChange={e => setCutter(e.target.value)} placeholder="อ123" />
                            </div>
                             <div className="md:col-span-1">
                                <label className="block text-sm font-bold text-slate-700 mb-1">ปีที่พิมพ์</label>
                                <input type="text" className="w-full border rounded px-3 py-2" value={pubYearCall} onChange={e => setPubYearCall(e.target.value)} placeholder="2568" />
                            </div>
                            <div className="md:col-span-1">
                                <button onClick={generateAutoCallNumber} className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 text-sm flex items-center justify-center gap-2">
                                    <Tag className="w-4 h-4" /> สร้างอัตโนมัติ
                                </button>
                            </div>
                        </div>
                        <div className="mt-2 text-sm text-blue-700">
                            <strong>Preview:</strong> <span className="font-mono bg-white px-2 py-1 rounded border">{dewey} {cutter} {pubYearCall}</span>
                        </div>
                    </section>

                    {/* Section 3: MARC 21 */}
                    <section className="border border-slate-200 p-6 rounded-xl">
                        <h4 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                            <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                            การลงรายการ MARC 21 (Bibliographic Data)
                        </h4>
                        <div className="space-y-4">
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">ISBN (020)</label>
                                <input type="text" className="col-span-9 border rounded px-3 py-2 text-sm" value={tag020} onChange={e => setTag020(e.target.value)} placeholder="เลขมาตรฐานสากลประจำหนังสือ" />
                            </div>
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">รหัสภาษา (041)</label>
                                <input type="text" className="col-span-9 border rounded px-3 py-2 text-sm" value={tag041} onChange={e => setTag041(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">ผู้แต่ง - ชื่อบุคคล (100)</label>
                                <input type="text" className="col-span-9 border rounded px-3 py-2 text-sm" value={tag100} onChange={e => setTag100(e.target.value)} placeholder="ชื่อบุคคล" />
                            </div>
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">ผู้แต่ง - นิติบุคคล (110)</label>
                                <input type="text" className="col-span-9 border rounded px-3 py-2 text-sm" value={tag110} onChange={e => setTag110(e.target.value)} placeholder="ชื่อนิติบุคคล" />
                            </div>
                             <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">ชื่อเรื่อง (245) <span className="text-red-500">*</span></label>
                                <div className="col-span-9 flex gap-2">
                                    <input type="text" className="flex-1 border rounded px-3 py-2 text-sm" value={tag245a} onChange={e => setTag245a(e.target.value)} placeholder="ชื่อเรื่อง (หน้าปกใน)" />
                                    <input type="text" className="flex-1 border rounded px-3 py-2 text-sm" value={tag245c} onChange={e => setTag245c(e.target.value)} placeholder="ส่วนแจ้งความรับผิดชอบ" />
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">ชื่อเรื่องที่แตกต่าง (246)</label>
                                <input type="text" className="col-span-9 border rounded px-3 py-2 text-sm" value={tag246} onChange={e => setTag246(e.target.value)} placeholder="ชื่อเรื่อง (หน้าปกนอก)" />
                            </div>
                             <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">ครั้งที่พิมพ์ (250)</label>
                                <input type="text" className="col-span-9 border rounded px-3 py-2 text-sm" value={tag250} onChange={e => setTag250(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">พิมพลักษณ์ (260)</label>
                                <input type="text" className="col-span-9 border rounded px-3 py-2 text-sm" value={tag260} onChange={e => setTag260(e.target.value)} placeholder="สถานที่ : สำนักพิมพ์ : ปีที่พิมพ์" />
                            </div>
                             <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">ลักษณะทางกายภาพ (300)</label>
                                <input type="text" className="col-span-9 border rounded px-3 py-2 text-sm" value={tag300} onChange={e => setTag300(e.target.value)} placeholder="จำนวนหน้า : ภาพประกอบ : ขนาด ซม. : วัสดุประกอบ" />
                            </div>
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">ชื่อชุด (440)</label>
                                <input type="text" className="col-span-9 border rounded px-3 py-2 text-sm" value={tag440} onChange={e => setTag440(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">หมายเหตุทั่วไป (500)</label>
                                <textarea className="col-span-9 border rounded px-3 py-2 text-sm" value={tag500} onChange={e => setTag500(e.target.value)} rows={2}></textarea>
                            </div>
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">สาระสังเขป (520)</label>
                                <textarea className="col-span-9 border rounded px-3 py-2 text-sm" value={tag520} onChange={e => setTag520(e.target.value)} rows={3}></textarea>
                            </div>
                             <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">ราคาหนังสือ (541)</label>
                                <input type="text" className="col-span-9 border rounded px-3 py-2 text-sm" value={tag541} onChange={e => setTag541(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-12 gap-4 items-start relative">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600 pt-2">หัวเรื่อง (650)</label>
                                <div className="col-span-9 relative">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className="w-full border rounded px-3 py-2 text-sm" 
                                            value={tag650} 
                                            onChange={e => handleSubjectChange(e.target.value)} 
                                            placeholder="พิมพ์เพื่อค้นหาหัวเรื่องอัตโนมัติ..."
                                        />
                                        <button className="bg-slate-100 border px-3 py-2 rounded hover:bg-slate-200" title="คู่มือหัวเรื่อง"><BookOpen className="w-4 h-4"/></button>
                                    </div>
                                    {showSubjectSuggestions && (
                                        <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                                            {suggestedSubjects.map(sub => (
                                                <div key={sub.id} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm flex justify-between" onClick={() => selectSubject(sub)}>
                                                    <span>{sub.heading}</span>
                                                    <span className="text-slate-400 text-xs">{sub.dewey}</span>
                                                </div>
                                            ))}
                                            {suggestedSubjects.length === 0 && (
                                                <div className="px-4 py-2 text-slate-500 text-sm">ไม่พบหัวเรื่อง <button className="text-blue-600 hover:underline ml-2" onClick={() => {addSubject({id: Date.now().toString(), heading: tag650, dewey: dewey}); setShowSubjectSuggestions(false);}}>เพิ่มใหม่ (Authority)</button></div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">ผู้แต่งร่วม - บุคคล (700)</label>
                                <input type="text" className="col-span-9 border rounded px-3 py-2 text-sm" value={tag700} onChange={e => setTag700(e.target.value)} />
                            </div>
                             <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">ผู้แต่งร่วม - นิติบุคคล (710)</label>
                                <input type="text" className="col-span-9 border rounded px-3 py-2 text-sm" value={tag710} onChange={e => setTag710(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-12 gap-4 items-start">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600 pt-2">E-book / Multimedia (856)</label>
                                <div className="col-span-9 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <LinkIcon className="w-4 h-4 text-slate-400"/>
                                        <input type="text" className="flex-1 border rounded px-3 py-2 text-sm" value={tag856} onChange={e => setTag856(e.target.value)} placeholder="URL หรือ ลิงก์" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-400"/>
                                        <label className="flex-1 border border-dashed rounded px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 flex justify-between items-center">
                                             <span className="text-slate-500">{tag856File || 'อัปโหลดไฟล์ E-book'}</span>
                                             <input type="file" className="hidden" accept=".pdf,.epub" onChange={handleEbookUpload} />
                                             <span className="bg-slate-200 text-xs px-2 py-1 rounded">Browse</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                             <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">ภาพปก (902)</label>
                                <div className="col-span-9 flex items-center gap-4">
                                     <div className="w-16 h-20 bg-slate-100 border rounded flex items-center justify-center overflow-hidden">
                                         {tag902 ? <img src={tag902} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-300"/>}
                                     </div>
                                     <label className="cursor-pointer px-4 py-2 bg-white border rounded hover:bg-slate-50 text-sm flex items-center gap-2">
                                         <Upload className="w-4 h-4" /> อัปโหลดรูปภาพ
                                         <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                     </label>
                                     <span className="text-xs text-slate-400">ขนาดความสูงไม่เกิน 640px</span>
                                </div>
                            </div>
                             <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">แหล่งที่ได้รับ (990)</label>
                                <input type="text" className="col-span-9 border rounded px-3 py-2 text-sm" value={tag990} onChange={e => setTag990(e.target.value)} />
                            </div>
                            
                            {/* Dynamically Added Fields */}
                            {extraMarc.map((field, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-4 items-start animate-fadeIn">
                                    <label className="col-span-3 text-right text-sm font-bold text-blue-600 flex flex-col items-end">
                                        <span>{field.desc} ({field.tag})</span>
                                        <span className="text-xs text-slate-400 font-normal">Subfield: {field.sub}</span>
                                    </label>
                                    <div className="col-span-8">
                                        {field.inputType === 'multi' ? (
                                            <textarea className="w-full border rounded px-3 py-2 text-sm" value={field.val} onChange={(e) => {
                                                const newExtra = [...extraMarc];
                                                newExtra[idx].val = e.target.value;
                                                setExtraMarc(newExtra);
                                            }} rows={3} />
                                        ) : (
                                            <input type="text" className="w-full border rounded px-3 py-2 text-sm" value={field.val} onChange={(e) => {
                                                const newExtra = [...extraMarc];
                                                newExtra[idx].val = e.target.value;
                                                setExtraMarc(newExtra);
                                            }} />
                                        )}
                                    </div>
                                    <div className="col-span-1 flex items-center h-full">
                                        <button onClick={() => handleRemoveExtraMarc(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}

                             <div className="grid grid-cols-12 gap-4 items-center">
                                <label className="col-span-3 text-right text-sm font-bold text-slate-600">เพิ่มเติม</label>
                                <button onClick={() => setShowAddMarcFieldModal(true)} className="col-span-9 w-fit text-sm text-blue-600 hover:underline flex items-center gap-1">
                                    <PlusCircle className="w-4 h-4" /> เพิ่มฟิลด์ MARC
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            )}
            
            {/* --- TAB 3: HOLDINGS --- */}
            {activeTab === 'Item' && selectedBook && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-4 animate-fadeIn">
                     <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
                        <Box className="w-5 h-5" /> ข้อมูลตัวเล่ม (Holdings): {selectedBook.title}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-4">
                            <label className="font-bold text-slate-700 block mb-2">รูปแบบการกำหนดเลขทะเบียน (Barcode)</label>
                            <div className="flex gap-4">
                                <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${holdingsMode === 'Auto' ? 'border-accent bg-blue-50 ring-1 ring-accent' : 'hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" checked={holdingsMode === 'Auto'} onChange={() => setHoldingsMode('Auto')} className="w-4 h-4 text-accent" />
                                        <div>
                                            <span className="font-bold block text-slate-800">อัตโนมัติ (Auto)</span>
                                            <span className="text-xs text-slate-500">ระบบสร้างรหัส 7 หลักขึ้นไป</span>
                                        </div>
                                    </div>
                                </label>
                                <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${holdingsMode === 'Manual' ? 'border-accent bg-blue-50 ring-1 ring-accent' : 'hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" checked={holdingsMode === 'Manual'} onChange={() => setHoldingsMode('Manual')} className="w-4 h-4 text-accent" />
                                        <div>
                                            <span className="font-bold block text-slate-800">กำหนดเอง (Manual)</span>
                                            <span className="text-xs text-slate-500">ป้อนรหัสด้วยตนเอง</span>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {holdingsMode === 'Auto' ? (
                                <div className="bg-slate-50 p-4 rounded border animate-fadeIn">
                                    <label className="block text-sm font-bold mb-2">จำนวนเล่มที่ต้องการเพิ่ม (1-10)</label>
                                    <input type="number" min="1" max="10" value={autoCopyCount} onChange={e => setAutoCopyCount(parseInt(e.target.value))} className="w-full border rounded px-3 py-2" />
                                    <p className="text-xs text-slate-500 mt-2">รหัสจะเริ่มจาก {(() => {
                                        // Preview next ID from global max
                                        const maxGlobal = getGlobalMaxBarcode();
                                        return (maxGlobal + 1).toString().padStart(7, '0');
                                    })()}</p>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-4 rounded border animate-fadeIn">
                                    <label className="block text-sm font-bold mb-2">เลขทะเบียน (Barcode)</label>
                                    <input type="text" value={manualBarcode} onChange={e => setManualBarcode(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="ระบุเลขทะเบียน..." />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold mb-2 text-slate-700">จำนวนจองสูงสุด (Max Reservations)</label>
                                <input type="number" min="0" value={maxReservations} onChange={e => setMaxReservations(parseInt(e.target.value))} className="w-full border rounded px-3 py-2" />
                                <p className="text-xs text-slate-500 mt-1">จำกัดจำนวนคนที่สามารถจองต่อคิวหนังสือเล่มนี้ได้</p>
                            </div>

                            <button onClick={handleAddHoldings} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2">
                                <Plus className="w-5 h-5" /> บันทึกรายการตัวเล่ม
                            </button>
                        </div>

                        {/* Current Items List */}
                        <div className="border rounded-lg overflow-hidden flex flex-col">
                            <div className="bg-slate-100 p-3 font-bold text-slate-700 border-b">รายการตัวเล่มที่มีอยู่ ({selectedBook.items?.length || 0})</div>
                            <div className="flex-1 overflow-y-auto max-h-80 bg-white">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-2">Barcode</th><th className="px-4 py-2">สถานะ</th><th className="px-4 py-2">สถานที่</th></tr></thead>
                                    <tbody className="divide-y">
                                        {selectedBook.items?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 font-mono">{item.barcode}</td>
                                                <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${item.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{translateStatus(item.status)}</span></td>
                                                <td className="px-4 py-2 text-slate-500">{item.location}</td>
                                            </tr>
                                        ))}
                                        {(!selectedBook.items || selectedBook.items.length === 0) && <tr><td colSpan={3} className="p-4 text-center text-slate-400">ยังไม่มีตัวเล่ม</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!selectedBook && activeTab === 'Item' && (
                <div className="flex items-center justify-center h-full text-slate-400 flex-col">
                    <Box className="w-12 h-12 mb-2 opacity-50" />
                    <p>กรุณาเลือกหนังสือจากหน้าสืบค้น หรือสร้างบรรณานุกรมใหม่ก่อน</p>
                </div>
            )}

            {/* --- TAB 4: UNION --- */}
            {activeTab === 'Union' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-4 animate-fadeIn">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4" /> สืบค้นฐานข้อมูลสหบรรณานุกรม (Z39.50 Union Catalog)
                    </h3>
                    <div className="flex gap-2 mb-6">
                        <input type="text" className="flex-1 border border-slate-300 rounded px-4 py-2 text-sm" placeholder="ใส่ ISBN หรือ ชื่อเรื่อง เพื่อค้นหาจากห้องสมุดเครือข่าย..." />
                        <button className="bg-accent text-white px-6 py-2 rounded text-sm font-medium">ค้นหา</button>
                    </div>
                    <div className="text-center p-10 text-slate-400 border border-dashed rounded-lg">
                        ระบบจำลองการเชื่อมต่อ Z39.50
                    </div>
                </div>
            )}
      </div>

      {/* Add MARC Field Modal */}
      {showAddMarcFieldModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 animate-fadeIn">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2"><PlusCircle className="w-5 h-5 text-blue-600"/> เพิ่มฟิลด์ MARC</h3>
                      <button onClick={() => setShowAddMarcFieldModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-red-500"/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">ประเภททรัพยากร</label>
                          <select 
                              className="w-full border rounded px-3 py-2 text-sm bg-white"
                              value={newFieldData.resourceType}
                              onChange={e => setNewFieldData({...newFieldData, resourceType: e.target.value})}
                          >
                              {resourceTypes.map(type => (
                                  <option key={type} value={type}>{type}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">แท็ก (Tag)</label>
                          <select className="w-full border rounded px-3 py-2 text-sm font-mono" value={newFieldData.tag} onChange={handleTagSelect}>
                              <option value="">-- เลือก Tag --</option>
                              {marcTags.map(t => (
                                  <option key={t.tag} value={t.tag}>{t.tag} - {t.desc}</option>
                              ))}
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">รหัสฟิลด์ย่อย</label>
                              <input type="text" className="w-full border rounded px-3 py-2 text-sm font-mono bg-slate-50" value={newFieldData.subfield} readOnly />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">รายละเอียด</label>
                              <input type="text" className="w-full border rounded px-3 py-2 text-sm bg-slate-50" value={newFieldData.desc} readOnly />
                          </div>
                      </div>
                       <div className="flex items-center gap-2 mt-2">
                          <input type="checkbox" checked={newFieldData.mandatory} onChange={e => setNewFieldData({...newFieldData, mandatory: e.target.checked})} className="rounded text-blue-600" />
                          <label className="text-sm text-slate-700">ตั้งเป็นฟิลด์บังคับ</label>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">รูปแบบช่องกรอกข้อมูล</label>
                          <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="inputType" value="single" checked={newFieldData.inputType === 'single'} onChange={() => setNewFieldData({...newFieldData, inputType: 'single'})} />
                                  <span className="text-sm">บรรทัดเดียว</span>
                              </label>
                               <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="inputType" value="multi" checked={newFieldData.inputType === 'multi'} onChange={() => setNewFieldData({...newFieldData, inputType: 'multi'})} />
                                  <span className="text-sm">หลายบรรทัด</span>
                              </label>
                          </div>
                      </div>
                      <button onClick={saveNewMarcField} disabled={!newFieldData.tag} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 mt-4 disabled:bg-slate-300">เพิ่มฟิลด์</button>
                  </div>
              </div>
          </div>
      )}

      {/* MARC Modal (View/Edit Raw) */}
      {showMarcModal && selectedBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 animate-fadeIn h-3/4 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2"><Code className="w-5 h-5"/> แก้ไขระเบียน MARC (Edit MARC)</h3>
                      <button onClick={() => setShowMarcModal(false)}><X className="w-5 h-5"/></button>
                  </div>
                  <div className="flex-1 bg-slate-900 text-green-400 font-mono p-4 rounded-lg overflow-auto text-sm">
                      <p>LDR  00000nam a2200000 a 4500</p>
                      <p>001  {selectedBook.id}</p>
                      <p>008  250220s{selectedBook.pubYear || 'xxxx'}    th a     b    001 0 tha d</p>
                      <p>020  $a {selectedBook.isbn}</p>
                      <p>050  00 $a {selectedBook.callNumber}</p>
                      <p>100  1  $a {selectedBook.author}</p>
                      <p>245  10 $a {selectedBook.title}</p>
                      <p>260     $b {selectedBook.publisher} $c {selectedBook.pubYear}</p>
                      <p>300     $a {selectedBook.pages}</p>
                      <p>650   0 $a {selectedBook.subject}</p>
                      <p>990     $a {selectedBook.items?.length || 0} copies</p>
                  </div>
                  <div className="mt-4 flex justify-end"><button onClick={() => setShowMarcModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700">ปิด</button></div>
              </div>
          </div>
      )}
      
      {/* History Modal */}
      {showHistoryModal && selectedBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 animate-fadeIn flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2"><History className="w-5 h-5"/> ประวัติการยืม-คืน: {selectedBook.title}</h3>
                      <button onClick={() => setShowHistoryModal(false)}><X className="w-5 h-5"/></button>
                  </div>
                  <div className="flex-1 overflow-auto">
                      <table className="w-full text-sm text-left">
                           <thead className="bg-slate-100 text-slate-600">
                               <tr>
                                   <th className="px-4 py-2">วันที่ยืม</th>
                                   <th className="px-4 py-2">วันที่คืน</th>
                                   <th className="px-4 py-2">ผู้ยืม</th>
                                   <th className="px-4 py-2">สถานะ</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y">
                               {getBookLoanHistory(selectedBook).map((tx, i) => (
                                   <tr key={i} className="hover:bg-slate-50">
                                       <td className="px-4 py-2">{tx.checkoutDate}</td>
                                       <td className="px-4 py-2">{tx.returnDate || '-'}</td>
                                       <td className="px-4 py-2">{tx.patronName}</td>
                                       <td className="px-4 py-2">
                                           <span className={`px-2 py-1 rounded-full text-xs ${tx.status === 'Returned' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                               {translateStatus(tx.status)}
                                           </span>
                                       </td>
                                   </tr>
                               ))}
                               {getBookLoanHistory(selectedBook).length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">ไม่พบประวัติการยืม</td></tr>}
                           </tbody>
                      </table>
                  </div>
                  <div className="mt-4 flex justify-end"><button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700">ปิด</button></div>
              </div>
          </div>
      )}

      {/* Holds History Modal (Enhanced to show FULL History) */}
      {showHoldsModal && selectedBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 animate-fadeIn flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2"><Bookmark className="w-5 h-5"/> ประวัติรายการจองย้อนหลังทั้งหมด: {selectedBook.title}</h3>
                      <button onClick={() => setShowHoldsModal(false)}><X className="w-5 h-5"/></button>
                  </div>
                  <div className="flex-1 overflow-auto">
                       {getAllReservationHistory(selectedBook).length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-orange-100 text-orange-800 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-2">ชื่อผู้จอง</th>
                                        <th className="px-4 py-2">วันที่จอง</th>
                                        <th className="px-4 py-2">สถานะการจอง</th>
                                        <th className="px-4 py-2">วันที่ดำเนินการ (Action Date)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {getAllReservationHistory(selectedBook).map((h, i) => (
                                        <tr key={i} className="hover:bg-orange-50">
                                            <td className="px-4 py-2 font-medium text-slate-700">{h.patronName}</td>
                                            <td className="px-4 py-2 text-slate-500">{h.date}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    h.status.includes('Active') ? 'bg-blue-100 text-blue-700' :
                                                    h.status.includes('รับหนังสือแล้ว') ? 'bg-green-100 text-green-700' :
                                                    h.status.includes('ยกเลิก') ? 'bg-red-100 text-red-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {h.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-slate-500">{h.actionDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-10 text-center text-slate-400">
                                <Bookmark className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>ไม่มีประวัติการจองสำหรับหนังสือเล่มนี้</p>
                            </div>
                        )}
                  </div>
                  <div className="mt-4 flex justify-end"><button onClick={() => setShowHoldsModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700">ปิด</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Cataloging;
