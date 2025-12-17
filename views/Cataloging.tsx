
import React, { useState, useRef } from 'react';
import { Save, PlusCircle, Tag, Database, Globe, Copy, Box, Search, ArrowRight, ArrowLeft, Trash2, Edit, History, Bookmark, Plus, X, Code, ScanLine, Image as ImageIcon, Upload, Check, BookOpen, User, FileText, Link as LinkIcon, File, FileSpreadsheet, Download, RefreshCw, AlertTriangle, LayoutList, LayoutGrid, Filter, Barcode, Calendar, Users, Building2, Library, Hash, Key } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Book, Item, Subject, Transaction, Patron } from '../types';

// Declare Swal & XLSX type
declare const Swal: any;
declare const XLSX: any;

const Cataloging: React.FC = () => {
  const { books, patrons, subjects, addBook, updateBookDetails, deleteBook, addSubject, translateStatus, marcTags, resourceTypes, locations, updatePatron } = useLibrary();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'Search' | 'Bib' | 'Item' | 'Authority' | 'Import'>('Search');
  
  // Search State
  const [searchMode, setSearchMode] = useState<'Barcode' | 'Basic' | 'Advanced'>('Barcode');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'List' | 'Table'>('Table');

  // Advanced Search Fields
  const [advTitle, setAdvTitle] = useState('');
  const [advAuthor, setAdvAuthor] = useState('');
  const [advISBN, setAdvISBN] = useState('');
  const [advSubject, setAdvSubject] = useState('');
  const [advPubYear, setAdvPubYear] = useState('');
  const [advLanguage, setAdvLanguage] = useState('');
  const [advResourceType, setAdvResourceType] = useState('');
  const [advLocation, setAdvLocation] = useState('');

  // --- Bibliographic Record Form State ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [formId, setFormId] = useState('');
  
  // Part 1: Resource Type & Location (Mandatory)
  const [resourceType, setResourceType] = useState(resourceTypes[0] || 'Book');
  const [location, setLocation] = useState('ชั้น 1 - ทั่วไป');
  
  // Part 2: Call Number (Mandatory)
  const [dewey, setDewey] = useState('');
  const [cutter, setCutter] = useState('');
  const [pubYearCall, setPubYearCall] = useState('');
  
  // Part 3: MARC 21 Fields
  const [tag020, setTag020] = useState(''); // ISBN
  const [tag100, setTag100] = useState(''); // Author Person
  const [tag110, setTag110] = useState(''); // Author Corp
  const [tag245a, setTag245a] = useState(''); // Title (Mandatory)
  const [tag245c, setTag245c] = useState(''); // Statement of responsibility
  const [tag246, setTag246] = useState(''); // Varying form of title
  const [tag250, setTag250] = useState(''); // Edition
  
  // 260 Imprint
  const [tag260a, setTag260a] = useState(''); // Place
  const [tag260b, setTag260b] = useState(''); // Publisher
  const [tag260c, setTag260c] = useState(''); // Year
  
  // 300 Physical
  const [tag300a, setTag300a] = useState(''); // Pages/Extent
  const [tag300b, setTag300b] = useState(''); // Other/Illus
  
  const [tag440, setTag440] = useState(''); // Series
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

  // Import State
  const [importText, setImportText] = useState('');
  const [previewBooks, setPreviewBooks] = useState<Book[]>([]);
  const [importConfig, setImportConfig] = useState({
      location: locations[0] || 'ชั้น 1 - ทั่วไป',
      resourceType: resourceTypes[0] || 'Book',
      showInOpac: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Auto-Complete / Authority Logic State ---
  // Subject
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [suggestedSubjects, setSuggestedSubjects] = useState<{heading: string, dewey: string}[]>([]);
  
  // Author
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [suggestedAuthors, setSuggestedAuthors] = useState<{name: string, cutter: string}[]>([]);

  // Publisher
  const [showPublisherSuggestions, setShowPublisherSuggestions] = useState(false);
  const [suggestedPublishers, setSuggestedPublishers] = useState<{name: string, place: string}[]>([]);

  // Series
  const [showSeriesSuggestions, setShowSeriesSuggestions] = useState(false);
  const [suggestedSeries, setSuggestedSeries] = useState<string[]>([]);


  // --- Holdings State ---
  const [holdingsMode, setHoldingsMode] = useState<'Manual' | 'Auto'>('Auto');
  const [manualBarcode, setManualBarcode] = useState('');
  const [autoCopyCount, setAutoCopyCount] = useState(1);
  const [maxReservations, setMaxReservations] = useState(1);
  
  // Holdings Edit/Delete State
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [tempEditBarcode, setTempEditBarcode] = useState('');
  const [tempEditStatus, setTempEditStatus] = useState('');

  // Management Views (Modals)
  const [showMarcModal, setShowMarcModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHoldsModal, setShowHoldsModal] = useState(false);

  // --- Authority Control State ---
  const [authorityType, setAuthorityType] = useState<'Author' | 'Publisher' | 'Series' | 'Subject'>('Author');
  const [authoritySearch, setAuthoritySearch] = useState('');
  const [selectedAuthority, setSelectedAuthority] = useState<{ type: string, name: string } | null>(null);

  // --- Helper: Status Display ---
  const getStatusLabel = (status: string) => {
      switch (status) {
          case 'Available': return 'อยู่บนชั้น';
          case 'Checked Out': return 'ถูกยืมออก';
          case 'Shelving Cart': return 'อยู่บนรถเข็น (รอขึ้นชั้น)';
          case 'Lost': return 'สูญหาย';
          case 'Repair': return 'ชำรุด/รอซ่อม';
          case 'Processing': return 'รอติด QR code';
          case 'Reserved': return 'ถูกจอง';
          default: return status;
      }
  };

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'Available': return 'bg-green-100 text-green-700 border-green-200';
          case 'Shelving Cart': return 'bg-teal-100 text-teal-700 border-teal-200';
          case 'Checked Out': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'Reserved': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'Lost': return 'bg-red-100 text-red-700 border-red-200';
          case 'Repair': return 'bg-slate-200 text-slate-600 border-slate-300';
          case 'Processing': return 'bg-purple-100 text-purple-700 border-purple-200';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

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

  const resetForm = () => {
      setSelectedBook(null);
      setFormId('');
      setIsEditMode(false);
      
      setResourceType(resourceTypes[0] || 'Book');
      setLocation(locations[0] || 'ชั้น 1 - ทั่วไป');
      
      setDewey('');
      setCutter('');
      setPubYearCall('');
      
      setTag020('');
      setTag100('');
      setTag110('');
      setTag245a('');
      setTag245c('');
      setTag246('');
      setTag250('');
      setTag260a('');
      setTag260b('');
      setTag260c('');
      setTag300a('');
      setTag300b('');
      setTag440('');
      setTag520('');
      setTag541('');
      setTag650('');
      setTag700('');
      setTag710('');
      setTag856('');
      setTag856File('');
      setTag902('');
      setTag990('');
      
      setExtraMarc([]);
      setMaxReservations(1);
      setHoldingsMode('Auto');
      setManualBarcode('');
      setAutoCopyCount(1);
  };

  // --- Search Logic ---
  const handleSearch = () => {
      let results = books;
      if (searchMode === 'Barcode') {
          if (searchBarcode) {
             results = books.filter(b => 
                String(b.id) === searchBarcode || 
                b.items?.some(i => i.barcode === searchBarcode)
             );
          } else {
              results = [];
          }
      } else if (searchMode === 'Basic') {
          if (searchQuery) {
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
          results = books.filter(b => {
            const matchTitle = advTitle ? (b.title && b.title.toLowerCase().includes(advTitle.toLowerCase())) : true;
            const matchAuthor = advAuthor ? (b.author && b.author.toLowerCase().includes(advAuthor.toLowerCase())) : true;
            const matchISBN = advISBN ? (b.isbn && String(b.isbn).includes(advISBN)) : true;
            const matchSubject = advSubject ? (b.subject && b.subject.toLowerCase().includes(advSubject.toLowerCase())) : true;
            
            const matchYear = advPubYear ? (b.pubYear && b.pubYear.includes(advPubYear)) : true;
            const matchType = advResourceType ? (b.format === advResourceType) : true;
            const matchLocation = advLocation ? (b.items?.some(i => i.location === advLocation)) : true;
            // Language logic is tricky as it's not in standard props, usually in MARC 008/041. 
            // For prototype, we skip strict language check or assume Thai if not specified.
            const matchLang = true; 

            return matchTitle && matchAuthor && matchISBN && matchSubject && matchYear && matchType && matchLocation && matchLang;
          });
      }
      setSearchResults(results);
      setHasSearched(true);
      setSelectedBook(null);
      if (searchMode === 'Barcode') setSearchBarcode('');
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
      // Try to find Corp Author if 100 is empty, or from marcData
      setTag110(book.marcData?.['110'] || '');
      
      setTag245a(isCopy ? book.title + ' (Copy)' : book.title);
      // Try to extract subfield c from marcData if available
      setTag245c(book.marcData?.['245']?.split('$c')?.[1]?.trim() || '');
      
      setTag246(book.marcData?.['246'] || '');
      setTag250(book.marcData?.['250'] || '');
      
      // 260
      setTag260a(book.marcData?.['260']?.split('$a')?.[1]?.split('$')?.[0]?.trim() || '');
      setTag260b(book.publisher || '');
      setTag260c(book.pubYear || '');
      
      // 300
      setTag300a(book.pages || '');
      setTag300b(book.marcData?.['300']?.split('$b')?.[1]?.split('$')?.[0]?.trim() || '');
      
      setTag440(book.marcData?.['440'] || '');
      setTag520(book.description || '');
      setTag541(book.marcData?.['541'] || '');
      setTag650(book.subject || '');
      
      setTag700(book.marcData?.['700'] || '');
      setTag710(book.marcData?.['710'] || '');
      
      setTag856(book.ebookUrl || '');
      setTag902(book.coverUrl || '');
      setTag990(book.marcData?.['990'] || '');
      
      setMaxReservations(book.maxReservations || 1);

      // Restore Extra MARC Fields from marcData
      if (book.marcData && !isCopy) {
          const standardTags = ['020', '082', '100', '110', '245', '246', '250', '260', '300', '440', '520', '541', '650', '700', '710', '856', '902', '990'];
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

  const handleDeleteBook = async (id: string) => {
      const result = await Swal.fire({
          title: 'ยืนยันการลบรายการ?',
          text: "ข้อมูลบรรณานุกรมและตัวเล่มทั้งหมดจะถูกลบถาวร",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#cbd5e1',
          confirmButtonText: 'ยืนยันลบ',
          cancelButtonText: 'ยกเลิก'
      });

      if (result.isConfirmed) {
          await deleteBook(id);
          setSelectedBook(null);
          Swal.fire('ลบสำเร็จ', 'ลบรายการเรียบร้อยแล้ว', 'success');
      }
  };

  // --- Bib Form Logic (Suggestions & Auto-fill) ---
  
  // 1. SUBJECT Logic
  const handleSubjectChange = (val: string) => {
      setTag650(val);
      if (val.length > 0) {
          const uniqueSubjects = new Map<string, string>();
          // Combine preset subjects and existing books subjects
          subjects.forEach(s => uniqueSubjects.set(s.heading, s.dewey || ''));
          books.forEach(b => {
              if (b.subject && b.subject.toLowerCase().includes(val.toLowerCase())) {
                  const dewey = b.callNumber.split(' ')[0] || '';
                  if (!uniqueSubjects.has(b.subject)) {
                      uniqueSubjects.set(b.subject, dewey);
                  }
              }
          });
          
          const matches = Array.from(uniqueSubjects.entries())
              .filter(([heading]) => heading.toLowerCase().includes(val.toLowerCase()))
              .map(([heading, dewey]) => ({ heading, dewey }))
              .slice(0, 10);
              
          setSuggestedSubjects(matches);
          setShowSubjectSuggestions(true);
      } else {
          setShowSubjectSuggestions(false);
      }
  };

  const selectSubject = (sub: {heading: string, dewey: string}) => {
      setTag650(sub.heading);
      if (sub.dewey && !dewey) setDewey(sub.dewey); // Auto-fill Dewey if empty
      setShowSubjectSuggestions(false);
  };

  // 2. AUTHOR Logic (With Cutter Auto-fill)
  const handleAuthorChange = (val: string) => {
      setTag100(val);
      if (val.length > 0) {
          const uniqueAuthors = new Map<string, string>();
          books.forEach(b => {
              if (b.author && b.author.toLowerCase().includes(val.toLowerCase())) {
                  // Extract cutter from existing call number (Assuming format: Dewey Cutter Year)
                  const parts = b.callNumber.split(' ');
                  // Try to find the part that looks like a Cutter (alphanumeric, usually index 1)
                  const existingCutter = parts.length > 1 ? parts[1] : '';
                  
                  if (!uniqueAuthors.has(b.author) || (uniqueAuthors.get(b.author) === '' && existingCutter !== '')) {
                      uniqueAuthors.set(b.author, existingCutter);
                  }
              }
          });
          const matches = Array.from(uniqueAuthors.entries())
              .map(([name, cutter]) => ({ name, cutter }))
              .slice(0, 10);
          
          setSuggestedAuthors(matches);
          setShowAuthorSuggestions(true);
      } else {
          setShowAuthorSuggestions(false);
      }
  };

  const selectAuthor = (item: {name: string, cutter: string}) => {
      setTag100(item.name);
      if (item.cutter) setCutter(item.cutter); // Auto-fill Cutter!
      setShowAuthorSuggestions(false);
  };

  // 3. PUBLISHER Logic (With Place Auto-fill)
  const handlePublisherChange = (val: string) => {
      setTag260b(val);
      if (val.length > 0) {
          const uniquePubs = new Map<string, string>(); // Map Publisher Name -> Place
          
          books.forEach(b => {
              if (b.publisher && b.publisher.toLowerCase().includes(val.toLowerCase())) {
                  // Try extract place from MARC 260 $a
                  let place = '';
                  // Check explicit MARC data first
                  if (b.marcData && b.marcData['260']) {
                       // Assuming format: $aBangkok $bPublisher $c2024
                       const parts = b.marcData['260'].split('$a');
                       if (parts.length > 1) {
                           place = parts[1].split('$')[0].trim();
                       }
                  } 
                  
                  // If not in MARC, can't reliably get it from flattened fields easily unless we stored it.
                  // But existing logic in populateForm extracts it: 
                  // tag260a = book.marcData?.['260']?.split('$a')?.[1]?.split('$')?.[0]?.trim() || '';
                  
                  // Store if unique, prefer entries with place
                  if (!uniquePubs.has(b.publisher) || (uniquePubs.get(b.publisher) === '' && place !== '')) {
                      uniquePubs.set(b.publisher, place);
                  }
              }
          });
          
          const matches = Array.from(uniquePubs.entries())
              .map(([name, place]) => ({ name, place }))
              .slice(0, 10);

          setSuggestedPublishers(matches);
          setShowPublisherSuggestions(true);
      } else {
          setShowPublisherSuggestions(false);
      }
  };

  const selectPublisher = (item: {name: string, place: string}) => {
      setTag260b(item.name);
      if (item.place) setTag260a(item.place); // Auto-fill Place!
      setShowPublisherSuggestions(false);
  };

  // 4. SERIES Logic
  const handleSeriesChange = (val: string) => {
      setTag440(val);
      if (val.length > 0) {
          const uniqueSeries = new Set<string>();
          books.forEach(b => {
              if (b.marcData?.['440'] && b.marcData['440'].toLowerCase().includes(val.toLowerCase())) {
                  uniqueSeries.add(b.marcData['440']);
              }
          });
          setSuggestedSeries(Array.from(uniqueSeries).slice(0, 10));
          setShowSeriesSuggestions(true);
      } else {
          setShowSeriesSuggestions(false);
      }
  };

  const selectSeries = (val: string) => {
      setTag440(val);
      setShowSeriesSuggestions(false);
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
      
      // Combine split fields
      const tag260 = `$a${tag260a} $b${tag260b} $c${tag260c}`.trim();
      const tag300 = `$a${tag300a} $b${tag300b}`.trim();
      const tag245Full = `${tag245a} $c${tag245c}`.trim();

      // Compile MARC Data (Standard + Custom)
      const marcDataPayload: Record<string, string> = {
          '020': tag020,
          '082': fullCallNumber,
          '100': tag100,
          '110': tag110,
          '245': tag245Full,
          '246': tag246,
          '250': tag250,
          '260': tag260,
          '300': tag300,
          '440': tag440,
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
          id: (isEditMode && formId) ? formId : `PENDING-${Date.now()}`, 
          title: tag245a,
          author: tag100 || tag110 || 'ไม่ระบุ',
          isbn: tag020 || 'N/A',
          callNumber: fullCallNumber,
          status: 'Available',
          format: resourceType as any,
          subject: tag650,
          pubYear: tag260c,
          coverUrl: tag902,
          publisher: tag260b,
          pages: tag300a,
          description: tag520,
          ebookUrl: tag856,
          items: isEditMode ? (selectedBook?.items || []) : [], // Keep items if editing
          maxReservations: maxReservations,
          marcData: marcDataPayload // Save the full MARC data
      };

      if (isEditMode && formId) {
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
          setSelectedBook(bookData);
          setActiveTab('Item');
          Swal.fire({
              icon: 'info',
              title: 'ขั้นตอนต่อไป',
              text: 'กรุณาเพิ่มข้อมูลตัวเล่ม (Holdings) และกดบันทึกเพื่อยืนยันการจัดเก็บข้อมูลลงฐานข้อมูล',
              confirmButtonText: 'รับทราบ'
          });
      }
  };

  // --- Holdings Logic (Manage Item Barcodes) ---
  const handleAddHoldings = () => {
      if (!selectedBook) return;

      const newItems: Item[] = [];
      const maxGlobal = getGlobalMaxBarcode(); 
      
      if (holdingsMode === 'Manual') {
          if (!manualBarcode) { Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุบาร์โค้ด', 'warning'); return; }
          const exists = books.some(b => b.items?.some(i => i.barcode === manualBarcode));
          if (exists) { Swal.fire('ซ้ำ', `บาร์โค้ด ${manualBarcode} มีอยู่ในระบบแล้ว`, 'error'); return; }

          newItems.push({ barcode: manualBarcode, status: 'Available', location });
      } else {
          // Auto - Sequential 10 digits starting 0000000001
          const count = Math.max(1, Math.min(10, autoCopyCount)); 
          for (let i = 1; i <= count; i++) {
              const nextVal = maxGlobal + i;
              const autoCode = nextVal.toString().padStart(10, '0'); // Changed to 10 chars
              newItems.push({ barcode: autoCode, status: 'Available', location });
          }
      }

      const isExistingBook = books.some(b => b.id === selectedBook.id);

      if (isExistingBook) {
          const updatedBook = {
              ...selectedBook,
              items: [...(selectedBook.items || []), ...newItems],
              maxReservations: maxReservations
          };
          updateBookDetails(updatedBook);
          setSelectedBook(updatedBook);
          Swal.fire('สำเร็จ', `เพิ่มตัวเล่มสำเร็จ ${newItems.length} รายการ`, 'success');
      } else {
          const primaryId = newItems[0].barcode;
          const finalizedBook: Book = {
              ...selectedBook,
              id: primaryId, 
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

  const handleEditItem = (index: number, item: Item) => {
      setEditingItemIndex(index);
      setTempEditBarcode(item.barcode);
      setTempEditStatus(item.status);
  };

  const handleSaveEditItem = (index: number) => {
      if (!selectedBook || !selectedBook.items) return;
      if (!tempEditBarcode) { Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุบาร์โค้ด', 'warning'); return; }
      
      // Check Duplicate (excluding itself)
      const currentBarcode = selectedBook.items[index].barcode;
      if (tempEditBarcode !== currentBarcode) {
          const exists = books.some(b => b.items?.some(i => i.barcode === tempEditBarcode));
          if (exists) { Swal.fire('ซ้ำ', `บาร์โค้ด ${tempEditBarcode} มีอยู่ในระบบแล้ว`, 'error'); return; }
      }

      const newItems = [...selectedBook.items];
      newItems[index] = { 
          ...newItems[index], 
          barcode: tempEditBarcode,
          status: tempEditStatus 
      };
      
      const updatedBook = { ...selectedBook, items: newItems };
      updateBookDetails(updatedBook);
      setSelectedBook(updatedBook);
      
      setEditingItemIndex(null);
      setTempEditBarcode('');
      setTempEditStatus('');
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
      Toast.fire({ icon: 'success', title: 'แก้ไขเรียบร้อย' });
  };

  const handleDeleteItem = async (index: number) => {
      if (!selectedBook || !selectedBook.items) return;
      
      const itemToDelete = selectedBook.items[index];
      
      const result = await Swal.fire({
          title: 'ยืนยันการลบตัวเล่ม?',
          text: `ต้องการลบรายการบาร์โค้ด: ${itemToDelete.barcode} ใช่หรือไม่?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#cbd5e1',
          confirmButtonText: 'ยืนยันลบ',
          cancelButtonText: 'ยกเลิก'
      });

      if (result.isConfirmed) {
          const newItems = selectedBook.items.filter((_, i) => i !== index);
          const updatedBook = { ...selectedBook, items: newItems };
          
          updateBookDetails(updatedBook);
          setSelectedBook(updatedBook);
          
          Swal.fire('ลบสำเร็จ', 'ลบรายการตัวเล่มเรียบร้อยแล้ว', 'success');
      }
  };

  // --- Import / Excel Logic (Updated with Duplicate Check) ---
  const handleDownloadTemplate = () => {
      const headers = [
          "เลขทะเบียน (ID)", "ISBN (020)", "ผู้แต่ง - ชื่อบุคคล (100)", "ผู้แต่ง - นิติบุคคล (110)",
          "ชื่อเรื่อง (245)", "$c ส่วนแจ้งความรับผิดชอบ", "ชื่อเรื่องที่แตกต่าง (246)", "ครั้งที่พิมพ์ (250)",
          "เลขหมู่ (Dewey) (082)", "เลขประจำหนังสือ (Cutter) (082)", "ปีที่พิมพ์ (082)",
          "สถานที่พิมพ์ (260$a)", "สำนักพิมพ์ (260$b)", "ปีที่พิมพ์ (260$c)",
          "จำนวนหน้า (300$a)", "ภาพประกอบ (300$b)", "ชื่อชุด (440)", "สาระสังเขป (520)",
          "ราคาหนังสือ (541)", "หัวเรื่อง (650)", "จำนวนเล่ม", "ผู้แต่งร่วม - บุคคล (700)",
          "ผู้แต่งร่วม - นิติบุคคล (710)", "E-book / Multimedia (856)", "ภาพปก (902)", "แหล่งที่ได้รับ (990)"
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bib_Import_Template");
      XLSX.writeFile(wb, "Library_Bibliographic_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
          if (data.length > 1) {
              processExcelData(data.slice(1)); 
          } else {
              Swal.fire('ไฟล์ว่างเปล่า', 'ไม่พบข้อมูลในไฟล์ Excel', 'warning');
          }
      };
      reader.readAsBinaryString(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processExcelData = (rows: any[][]) => {
      const parsed: Book[] = [];
      rows.forEach((cols) => {
          if (!cols || cols.length === 0) return;
          const id = cols[0] ? String(cols[0]).trim() : '';
          const qty = parseInt(cols[20]) || 1;
          if (!id) return; 

          const isbn = cols[1] ? String(cols[1]).trim() : '';
          const author = cols[2] ? String(cols[2]).trim() : (cols[3] ? String(cols[3]).trim() : 'ไม่ระบุ');
          const title = cols[4] ? String(cols[4]).trim() : 'ไม่มีชื่อเรื่อง';
          const dewey = cols[8] ? String(cols[8]).trim() : '';
          const cutter = cols[9] ? String(cols[9]).trim() : '';
          const pubYearCall = cols[10] ? String(cols[10]).trim() : '';
          const callNumber = `${dewey} ${cutter} ${pubYearCall}`.trim();
          
          const newItems: Item[] = [];
          const startBarcodeVal = parseInt(id, 10);
          for(let i=0; i<qty; i++) {
              let barcode = id;
              if (qty > 1 && !isNaN(startBarcodeVal)) {
                  barcode = (startBarcodeVal + i).toString().padStart(10, '0'); // Updated to 10 digits
              } else if (qty > 1) {
                  barcode = `${id}-${i+1}`;
              }
              newItems.push({ barcode: barcode, status: 'Available', location: importConfig.location });
          }

          const marcData: Record<string, string> = {
              '020': isbn,
              '100': cols[2] ? String(cols[2]).trim() : '',
              '110': cols[3] ? String(cols[3]).trim() : '',
              '245': `${title} ${cols[5] ? String(cols[5]).trim() : ''}`.trim(),
              '246': cols[6] ? String(cols[6]).trim() : '',
              '250': cols[7] ? String(cols[7]).trim() : '',
              '082': callNumber,
              '260': `${cols[11] || ''} : ${cols[12] || ''} : ${cols[13] || ''}`,
              '300': `${cols[14] || ''} : ${cols[15] || ''}`,
              '440': cols[16] ? String(cols[16]).trim() : '',
              '520': cols[17] ? String(cols[17]).trim() : '',
              '541': cols[18] ? String(cols[18]).trim() : '',
              '650': cols[19] ? String(cols[19]).trim() : '',
              '700': cols[21] ? String(cols[21]).trim() : '',
              '710': cols[22] ? String(cols[22]).trim() : '',
              '856': cols[23] ? String(cols[23]).trim() : '',
              '902': cols[24] ? String(cols[24]).trim() : '',
              '990': cols[25] ? String(cols[25]).trim() : ''
          };

          parsed.push({
              id: newItems[0]?.barcode || id,
              title,
              author,
              isbn,
              callNumber,
              status: 'Available',
              format: importConfig.resourceType as any,
              subject: cols[19] ? String(cols[19]).trim() : '',
              pubYear: cols[13] ? String(cols[13]).trim() : pubYearCall,
              coverUrl: cols[24] ? String(cols[24]).trim() : '',
              publisher: cols[12] ? String(cols[12]).trim() : '',
              pages: cols[14] ? String(cols[14]).trim() : '',
              description: cols[17] ? String(cols[17]).trim() : '',
              ebookUrl: cols[23] ? String(cols[23]).trim() : '',
              items: newItems,
              maxReservations: 1,
              marcData: marcData
          });
      });
      setPreviewBooks(parsed);
      setImportText('');
  };

  const handleImportParse = () => {
      if (!importText.trim()) return;
      const rows = importText.split('\n').map(row => row.trim()).filter(row => row);
      const data = rows.map(row => row.split('\t'));
      processExcelData(data);
  };

  const handleUpdatePreview = (idx: number, field: keyof Book, value: string) => {
      const updated = [...previewBooks];
      updated[idx] = { ...updated[idx], [field]: value };
      setPreviewBooks(updated);
  };

  const handleDeletePreviewRow = (idx: number) => {
      const updated = [...previewBooks];
      updated.splice(idx, 1);
      setPreviewBooks(updated);
  };

  const handleConfirmImport = async () => {
      if (previewBooks.length === 0) return;
      
      let successCount = 0;
      let mergedCount = 0;
      let failedItems: { title: string, reason: string }[] = [];
      
      Swal.fire({ title: 'กำลังนำเข้าข้อมูล...', didOpen: () => Swal.showLoading() });
      
      for (const book of previewBooks) {
          try {
              // 1. Check if same ISBN already exists (Merge logic)
              const existingBook = books.find(b => b.isbn === book.isbn && b.isbn !== '' && b.isbn !== 'N/A');
              
              if (existingBook) {
                  // MERGE: Add new items to existing book
                  const newItems = book.items || [];
                  // Filter out any duplicates (same barcode) to be safe
                  const uniqueNewItems = newItems.filter(newItem => 
                      !existingBook.items?.some(existingItem => existingItem.barcode === newItem.barcode)
                  );

                  if (uniqueNewItems.length > 0) {
                      const updatedBook = {
                          ...existingBook,
                          items: [...(existingBook.items || []), ...uniqueNewItems]
                      };
                      await updateBookDetails(updatedBook);
                      mergedCount++;
                  } else {
                      failedItems.push({ title: book.title, reason: `ข้าม (มี ISBN และ Barcode นี้แล้ว)` });
                  }
              } else {
                  // CREATE NEW: Check Duplicate ID/Barcode globally first
                  const duplicateId = books.find(b => b.id === book.id || b.items?.some(i => i.barcode === book.id));
                  if (duplicateId) {
                      failedItems.push({ title: book.title, reason: `รหัสซ้ำ (ID: ${book.id})` });
                      continue;
                  }
                  await addBook(book);
                  successCount++;
              }
          } catch (error) {
              failedItems.push({ title: book.title, reason: 'เกิดข้อผิดพลาดในการบันทึก' });
          }
      }
      
      let reportHtml = `<div class="text-left space-y-2">
          <p class="text-green-600"><Check className="inline w-4 h-4"/> สร้างรายการใหม่: <b>${successCount}</b> รายการ</p>
          <p class="text-blue-600"><Plus className="inline w-4 h-4"/> เพิ่มตัวเล่ม (Merge): <b>${mergedCount}</b> รายการ</p>
      </div>`;
      
      if (failedItems.length > 0) {
          reportHtml += `<div class="mt-3 text-left bg-red-50 p-3 rounded border border-red-200 text-sm max-h-40 overflow-y-auto">
              <p class="font-bold text-red-700 mb-1">รายการที่ไม่สำเร็จ (${failedItems.length}):</p>
              <ul class="list-disc pl-4 text-red-600">${failedItems.map(f => `<li>${f.title} <span class="text-xs text-red-400">(${f.reason})</span></li>`).join('')}</ul>
          </div>`;
      }
      
      Swal.fire({ 
          icon: failedItems.length === 0 ? 'success' : 'warning', 
          title: 'ผลการนำเข้าข้อมูล', 
          html: reportHtml,
          confirmButtonText: 'ตกลง'
      });
      
      setPreviewBooks([]);
  };

  // --- Dashboard Helpers (Same) ---
  const getLoanInfo = (barcode: string) => {
      // Find which patron has this barcode active
      for (const p of patrons) {
          const tx = p.history.find(t => t.barcode === barcode && t.status === 'Active');
          if (tx) return { patronName: p.name, dueDate: tx.dueDate, patronId: p.id };
      }
      return { patronName: '-', dueDate: '-', patronId: null };
  };

  const getActiveHoldsForBook = (book: Book) => {
      const holds = [];
      // 1. Check Patrons who have this book in reservedItems
      for (const p of patrons) {
          if (p.reservedItems?.some(b => b.id === book.id)) {
              // Logic to find which copy they might be waiting for, or just the first due copy
              // For simplicity, we just look for *any* copy's due date if generic hold
              let bestDueDate = '-';
              // Find earliest due date among checked out copies
              const dueDates = book.items?.filter(i => i.status === 'Checked Out').map(i => {
                  const info = getLoanInfo(i.barcode);
                  return info.dueDate;
              }).filter(d => d !== '-') || [];
              if (dueDates.length > 0) bestDueDate = dueDates[0]; // Simplification

              holds.push({
                  barcode: book.id, // Usually title hold tracks book ID, but prompt requested barcode column
                  requestDate: 'วันนี้', // Missing field in Patron.reservedItems logic, assuming today for now or needs update
                  patronName: p.name,
                  patronId: p.id,
                  status: 'กำลังจอง (Active)',
                  dueDate: bestDueDate
              });
          }
      }
      return holds;
  };

  // Helper to cancel hold (Bib level)
  const handleCancelHold = async (patronId: string, bookId: string) => {
      const result = await Swal.fire({
          title: 'ยืนยันการลบรายการจอง?',
          text: "คุณต้องการยกเลิกการจองนี้ใช่หรือไม่",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#cbd5e1',
          confirmButtonText: 'ยืนยันลบ',
          cancelButtonText: 'ยกเลิก'
      });

      if (result.isConfirmed) {
          const patron = patrons.find(p => p.id === patronId);
          if (patron) {
              const updatedReserved = patron.reservedItems?.filter(b => b.id !== bookId) || [];
              updatePatron({ ...patron, reservedItems: updatedReserved });
              Swal.fire('ลบสำเร็จ', 'รายการจองถูกยกเลิกแล้ว', 'success');
          }
      }
  };

  // Helper to get combined history
  const getAllReservationHistory = (book: Book) => {
      const activeHolds = getActiveHoldsForBook(book).map(h => ({ 
          barcode: h.barcode, // Use the barcode from active holds
          patronName: h.patronName, 
          date: h.requestDate, 
          status: 'กำลังจอง (Active)', 
          actionDate: '-' 
      }));
      const pastHolds = book.reservationHistory?.map((h: any) => ({ 
          barcode: h.barcode || book.id, // Fallback to book ID if barcode not preserved in legacy logs
          patronName: h.patronName, 
          date: h.requestDate, 
          status: h.status, 
          actionDate: h.actionDate || '-' 
      })) || [];
      return [...activeHolds, ...pastHolds];
  };

  const getBookLoanHistory = (book: Book) => {
      let history: Transaction[] = [];
      patrons.forEach(p => {
          const matches = p.history.filter(t => t.barcode === book.id || book.items?.some(i => i.barcode === t.barcode));
          history = [...history, ...matches];
      });
      return history.reverse(); 
  };

  // --- Authority Control Logic ---
  const getAuthorityData = () => {
      const map = new Map<string, { name: string, count: number, info: string }>();
      
      const filteredBooks = authoritySearch 
        ? books.filter(b => 
            (b.title && b.title.includes(authoritySearch)) || 
            (b.author && b.author.includes(authoritySearch)) ||
            (b.subject && b.subject.includes(authoritySearch)) ||
            (b.publisher && b.publisher.includes(authoritySearch))
          ) 
        : books;

      filteredBooks.forEach(b => {
          if (authorityType === 'Author') {
              // Main Author
              const name = b.author?.trim();
              if (name && name !== 'ไม่ระบุ') {
                  const key = name.toLowerCase();
                  if (!map.has(key)) {
                      // Try to extract Cutter from Call Number (Dewey Cutter Year) -> "000 ก123 2567" -> "ก123"
                      const parts = b.callNumber.split(' ');
                      const cutter = parts.length > 1 ? parts[1] : '-';
                      map.set(key, { name: name, count: 0, info: cutter });
                  }
                  map.get(key)!.count++;
              }
              // Added Entry Author (700)
              if (b.marcData?.['700']) {
                  const addedName = b.marcData['700'].trim();
                  if (addedName) {
                      const key = addedName.toLowerCase();
                      if (!map.has(key)) map.set(key, { name: addedName, count: 0, info: '-' });
                      map.get(key)!.count++;
                  }
              }
          } else if (authorityType === 'Publisher') {
              const pub = b.publisher?.trim();
              if (pub) {
                  const key = pub.toLowerCase();
                  if (!map.has(key)) map.set(key, { name: pub, count: 0, info: b.marcData?.['260'] || '-' }); // Show full imprint as info
                  map.get(key)!.count++;
              }
          } else if (authorityType === 'Series') {
              const series = b.marcData?.['440']?.trim();
              if (series) {
                  const key = series.toLowerCase();
                  if (!map.has(key)) map.set(key, { name: series, count: 0, info: '-' });
                  map.get(key)!.count++;
              }
          } else if (authorityType === 'Subject') {
              const sub = b.subject?.trim();
              if (sub) {
                  const key = sub.toLowerCase();
                  if (!map.has(key)) map.set(key, { name: sub, count: 0, info: b.callNumber.split(' ')[0] || '-' }); // Show Dewey as info
                  map.get(key)!.count++;
              }
          }
      });
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'th'));
  };

  const getBooksByAuthority = (type: string, name: string) => {
      return books.filter(b => {
          if (type === 'Author') {
              return b.author === name || b.marcData?.['700'] === name;
          } else if (type === 'Publisher') {
              return b.publisher === name;
          } else if (type === 'Series') {
              return b.marcData?.['440'] === name;
          } else if (type === 'Subject') {
              return b.subject === name;
          }
          return false;
      });
  };

  const handleEditAuthority = async (type: string, oldName: string) => {
      const { value: newName } = await Swal.fire({
          title: `แก้ไข${type === 'Author' ? 'ชื่อผู้แต่ง' : type === 'Publisher' ? 'สำนักพิมพ์' : type === 'Series' ? 'ชื่อชุด' : 'หัวเรื่อง'}`,
          input: 'text',
          inputValue: oldName,
          showCancelButton: true,
          confirmButtonText: 'บันทึก',
          cancelButtonText: 'ยกเลิก',
          inputValidator: (value: string) => {
              if (!value) return 'กรุณาระบุข้อมูล';
          }
      });

      if (newName && newName !== oldName) {
          Swal.fire({ title: 'กำลังปรับปรุงข้อมูล...', didOpen: () => Swal.showLoading() });
          
          const booksToUpdate: Book[] = [];
          
          books.forEach(b => {
              let isModified = false;
              let updatedBook = { ...b, marcData: { ...b.marcData } };

              if (type === 'Author') {
                  if (b.author === oldName) { updatedBook.author = newName; updatedBook.marcData['100'] = newName; isModified = true; }
                  if (b.marcData?.['700'] === oldName) { updatedBook.marcData['700'] = newName; isModified = true; }
              } else if (type === 'Publisher') {
                  if (b.publisher === oldName) { 
                      updatedBook.publisher = newName; 
                      // Try to replace in 260 string if present
                      if (updatedBook.marcData['260']) {
                          updatedBook.marcData['260'] = updatedBook.marcData['260'].replace(oldName, newName);
                      }
                      isModified = true; 
                  }
              } else if (type === 'Series') {
                  if (b.marcData?.['440'] === oldName) { updatedBook.marcData['440'] = newName; isModified = true; }
              } else if (type === 'Subject') {
                  if (b.subject === oldName) { updatedBook.subject = newName; updatedBook.marcData['650'] = newName; isModified = true; }
              }

              if (isModified) booksToUpdate.push(updatedBook);
          });

          // Execute updates
          for (const book of booksToUpdate) {
              await updateBookDetails(book);
          }

          Swal.fire({
              title: 'สำเร็จ',
              text: `ปรับปรุงข้อมูล ${booksToUpdate.length} รายการเรียบร้อยแล้ว`,
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
          });
      }
  };

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
       {/* Header & Tabs code remains identical... */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">งานวิเคราะห์ทรัพยากร (Cataloging)</h1>
            <p className="text-slate-500 text-sm mt-1">สืบค้น, ลงรายการ, วิเคราะห์หมวดหมู่, และจัดการตัวเล่ม</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => { resetForm(); setActiveTab('Bib'); }} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600 shadow-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> สร้างบรรณานุกรมใหม่
            </button>
        </div>
      </div>
      <div className="border-b border-slate-200">
          <nav className="flex gap-6 overflow-x-auto">
            <button onClick={() => setActiveTab('Search')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'Search' ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Search className="w-4 h-4"/> สืบค้นรายการ (Search)</button>
            <button onClick={() => setActiveTab('Bib')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'Bib' ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Database className="w-4 h-4"/> ข้อมูลบรรณานุกรม (Bib Record)</button>
            <button onClick={() => setActiveTab('Item')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'Item' ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Box className="w-4 h-4"/> ข้อมูลตัวเล่ม (Holdings)</button>
            <button onClick={() => setActiveTab('Authority')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'Authority' ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Key className="w-4 h-4"/> การควบคุมรายการหลักฐาน (Authority Control)</button>
            <button onClick={() => setActiveTab('Import')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'Import' ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><FileSpreadsheet className="w-4 h-4"/> นำเข้าข้อมูล (Import)</button>
          </nav>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
          
          {/* --- TAB 1: SEARCH & MANAGE --- */}
          {activeTab === 'Search' && (
              <div className="flex flex-col lg:flex-row gap-6 h-full">
                  {/* ... Search Tab Content (unchanged) ... */}
                  <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedBook ? 'lg:w-1/2' : 'w-full'}`}>
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                          <div className="flex items-center justify-between mb-4">
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button onClick={() => setSearchMode('Barcode')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${searchMode === 'Barcode' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                                        <Barcode className="w-4 h-4 inline mr-1"/> สแกนบาร์โค้ด
                                    </button>
                                    <button onClick={() => setSearchMode('Basic')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${searchMode === 'Basic' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                                        <Search className="w-4 h-4 inline mr-1"/> ค้นหาแบบง่าย
                                    </button>
                                    <button onClick={() => setSearchMode('Advanced')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${searchMode === 'Advanced' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                                        <Filter className="w-4 h-4 inline mr-1"/> ค้นหาขั้นสูง
                                    </button>
                                </div>
                                {/* View Toggle */}
                                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button onClick={() => setViewMode('List')} className={`p-1.5 rounded ${viewMode === 'List' ? 'bg-white shadow-sm text-accent' : 'text-slate-400 hover:text-slate-600'}`} title="List View"><LayoutList className="w-4 h-4"/></button>
                                    <button onClick={() => setViewMode('Table')} className={`p-1.5 rounded ${viewMode === 'Table' ? 'bg-white shadow-sm text-accent' : 'text-slate-400 hover:text-slate-600'}`} title="Table View"><LayoutGrid className="w-4 h-4"/></button>
                                </div>
                          </div>
                          
                          <div className="relative">
                              {searchMode === 'Barcode' && (
                                  <div className="flex gap-2">
                                      <div className="relative flex-1">
                                          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                          <input 
                                              type="text" 
                                              autoFocus
                                              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none" 
                                              placeholder="สแกนบาร์โค้ด (Scan Barcode)..." 
                                              value={searchBarcode} 
                                              onChange={(e) => setSearchBarcode(e.target.value)} 
                                              onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                                          />
                                      </div>
                                      <button onClick={handleSearch} className="bg-accent text-white px-6 rounded-lg text-sm font-medium hover:bg-blue-600">ค้นหา</button>
                                  </div>
                              )}

                              {searchMode === 'Basic' && (
                                  <div className="flex gap-2">
                                      <input 
                                          type="text" 
                                          autoFocus
                                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none" 
                                          placeholder="ชื่อเรื่อง, ผู้แต่ง, ISBN, หัวเรื่อง..." 
                                          value={searchQuery} 
                                          onChange={(e) => setSearchQuery(e.target.value)} 
                                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                                      />
                                      <button onClick={handleSearch} className="bg-accent text-white px-6 rounded-lg text-sm font-medium hover:bg-blue-600"><Search className="w-4 h-4"/></button>
                                  </div>
                              )}

                              {searchMode === 'Advanced' && (
                                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                      <div className="grid grid-cols-2 gap-3">
                                          <input type="text" placeholder="ชื่อเรื่อง (Title)" className="border p-2 rounded text-sm" value={advTitle} onChange={e => setAdvTitle(e.target.value)} />
                                          <input type="text" placeholder="ผู้แต่ง (Author)" className="border p-2 rounded text-sm" value={advAuthor} onChange={e => setAdvAuthor(e.target.value)} />
                                          <input type="text" placeholder="ISBN" className="border p-2 rounded text-sm" value={advISBN} onChange={e => setAdvISBN(e.target.value)} />
                                          <input type="text" placeholder="หัวเรื่อง (Subject)" className="border p-2 rounded text-sm" value={advSubject} onChange={e => setAdvSubject(e.target.value)} />
                                      </div>
                                      <div className="grid grid-cols-4 gap-3">
                                          <input type="text" placeholder="ปีที่พิมพ์ (Year)" className="border p-2 rounded text-sm" value={advPubYear} onChange={e => setAdvPubYear(e.target.value)} />
                                          <input type="text" placeholder="ภาษา (Language)" className="border p-2 rounded text-sm" value={advLanguage} onChange={e => setAdvLanguage(e.target.value)} />
                                          <select className="border p-2 rounded text-sm" value={advResourceType} onChange={e => setAdvResourceType(e.target.value)}>
                                              <option value="">ทุกประเภททรัพยากร</option>
                                              {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                          </select>
                                          <select className="border p-2 rounded text-sm" value={advLocation} onChange={e => setAdvLocation(e.target.value)}>
                                              <option value="">ทุกสถานที่จัดเก็บ</option>
                                              {locations.map(l => <option key={l} value={l}>{l}</option>)}
                                          </select>
                                      </div>
                                      <div className="flex justify-end pt-2">
                                          <button onClick={handleSearch} className="bg-accent text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2">
                                              <Search className="w-4 h-4" /> ค้นหาขั้นสูง
                                          </button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                      
                      {/* Search Results */}
                      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                           <div className="flex-1 overflow-y-auto">
                               {viewMode === 'Table' ? (
                                   <table className="w-full text-left text-sm">
                                       <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0 z-10 shadow-sm">
                                           <tr>
                                               <th className="px-4 py-3 w-16">ภาพปก</th>
                                               <th className="px-4 py-3">ชื่อเรื่อง / ผู้แต่ง</th>
                                               <th className="px-4 py-3">รหัสตัวเล่ม</th>
                                               <th className="px-4 py-3">ประเภท / ที่เก็บ</th>
                                               <th className="px-4 py-3">เลขเรียก</th>
                                               <th className="px-4 py-3">สถานะ</th>
                                           </tr>
                                       </thead>
                                       <tbody className="divide-y divide-slate-100">
                                           {searchResults.map((book) => (
                                               <tr key={book.id} className={`hover:bg-blue-50 cursor-pointer ${selectedBook?.id === book.id ? 'bg-blue-50' : ''}`} onClick={() => setSelectedBook(book)}>
                                                   <td className="px-4 py-3">
                                                       <div className="w-10 h-14 bg-slate-200 rounded overflow-hidden shadow-sm">
                                                           {book.coverUrl ? <img src={book.coverUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-4 h-4"/></div>}
                                                       </div>
                                                   </td>
                                                   <td className="px-4 py-3">
                                                       <div className="font-bold text-slate-800">{book.title}</div>
                                                       <div className="text-xs text-slate-500">{book.author}</div>
                                                   </td>
                                                   <td className="px-4 py-3 font-mono text-slate-600">{book.id}</td>
                                                   <td className="px-4 py-3">
                                                       <div className="text-slate-700">{book.format}</div>
                                                       <div className="text-xs text-slate-400">{book.items?.[0]?.location || 'ทั่วไป'}</div>
                                                   </td>
                                                   <td className="px-4 py-3 font-medium text-slate-700">{book.callNumber}</td>
                                                   <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(book.status)}`}>{getStatusLabel(book.status)}</span></td>
                                               </tr>
                                           ))}
                                       </tbody>
                                   </table>
                               ) : (
                                   <div className="p-4 space-y-4">
                                       {searchResults.map((book) => (
                                           <div key={book.id} className={`flex gap-4 p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${selectedBook?.id === book.id ? 'border-accent bg-blue-50' : 'border-slate-200 bg-white'}`} onClick={() => setSelectedBook(book)}>
                                               <div className="w-20 h-28 bg-slate-200 rounded overflow-hidden flex-shrink-0 shadow-sm">
                                                   {book.coverUrl ? <img src={book.coverUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-8 h-8"/></div>}
                                               </div>
                                               <div className="flex-1 min-w-0">
                                                   <h4 className="font-bold text-slate-800 text-lg mb-1">{book.title}</h4>
                                                   <p className="text-slate-600 text-sm mb-2">โดย {book.author}</p>
                                                   <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                                                       <div><span className="font-bold">ID:</span> {book.id}</div>
                                                       <div><span className="font-bold">Call No:</span> {book.callNumber}</div>
                                                       <div><span className="font-bold">Type:</span> {book.format}</div>
                                                       <div><span className="font-bold">Loc:</span> {book.items?.[0]?.location || '-'}</div>
                                                   </div>
                                               </div>
                                               <div className="flex flex-col justify-between items-end">
                                                   <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(book.status)}`}>{getStatusLabel(book.status)}</span>
                                                   <ArrowRight className="w-5 h-5 text-slate-300" />
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               )}
                           </div>
                      </div>
                  </div>
                  {/* ... Selected Book Details (unchanged) ... */}
                  {selectedBook && (
                    <div className="w-full lg:w-1/2 bg-white p-8 rounded-xl border border-slate-200 shadow-xl flex flex-col animate-fadeIn overflow-y-auto relative">
                        {/* Close Button Top Right */}
                        <button onClick={() => setSelectedBook(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                            <X className="w-6 h-6" />
                        </button>

                        {/* Header Section: Image + Info */}
                        <div className="flex flex-col md:flex-row gap-8 mb-8">
                            {/* Cover Image */}
                            <div className="w-40 h-56 bg-white border border-slate-200 shadow-sm rounded-lg flex items-center justify-center flex-shrink-0 self-center md:self-start">
                                {selectedBook.coverUrl ? (
                                    <img src={selectedBook.coverUrl} className="w-full h-full object-contain p-1" />
                                ) : (
                                    <div className="text-slate-300">
                                        <div className="border-2 border-slate-300 rounded p-1 inline-block">
                                            <span className="font-bold text-lg">?</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Basic Info */}
                            <div className="flex-1 min-w-0 pt-2">
                                <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-2">{selectedBook.title}</h2>
                                <p className="text-slate-500 text-lg mb-6">{selectedBook.author}</p>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-y-2 gap-x-8 text-sm">
                                    <div className="flex gap-2">
                                        <span className="font-bold text-slate-700 w-16">ISBN:</span>
                                        <span className="text-slate-600 truncate">{selectedBook.isbn}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-slate-700 w-16">Call No:</span>
                                        <span className="text-slate-600">{selectedBook.callNumber}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-slate-700 w-16">Format:</span>
                                        <span className="text-slate-600">{selectedBook.format}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-slate-700 w-16">Loc:</span>
                                        <span className="text-slate-600">{selectedBook.items?.[0]?.location || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <button onClick={handleEditBib} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center gap-2 group">
                                <Edit className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                                <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600">แก้ไขบรรณานุกรม</span>
                            </button>
                            <button onClick={() => setShowMarcModal(true)} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center gap-2 group">
                                <Code className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                                <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600">แก้ไขระเบียน MARC</span>
                            </button>
                            <button onClick={() => setShowHistoryModal(true)} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center gap-2 group">
                                <History className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                                <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600">ประวัติยืม-คืน</span>
                            </button>
                            <button onClick={() => setShowHoldsModal(true)} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center gap-2 group">
                                <Bookmark className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                                <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600">ประวัติการจอง</span>
                            </button>
                            <button onClick={handleCopyBib} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center gap-2 group">
                                <Copy className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                                <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600">คัดลอกรายการ</span>
                            </button>
                            <button onClick={() => handleDeleteBook(selectedBook.id)} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-red-300 transition-all flex flex-col items-center gap-2 group">
                                <Trash2 className="w-5 h-5 text-red-500 group-hover:text-red-600" />
                                <span className="text-xs font-medium text-red-500 group-hover:text-red-600">ลบรายการ</span>
                            </button>
                        </div>

                        {/* Holdings Section */}
                        <div>
                            <button onClick={() => setActiveTab('Item')} className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 mb-4">
                                ไปที่จัดการตัวเล่ม <ArrowRight className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-2 mb-4">
                                <Box className="w-5 h-5 text-slate-500" />
                                <h3 className="font-bold text-slate-700">รายการตัวเล่ม (Holdings Summary)</h3>
                                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full border border-slate-200">
                                    มีทั้งหมด {selectedBook.items?.length || 0} ฉบับ
                                </span>
                            </div>

                            <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 w-16 text-center">ลำดับ</th>
                                            <th className="px-6 py-3">รหัสบาร์โค้ด (Barcode)</th>
                                            <th className="px-6 py-3">สถานะ</th>
                                            <th className="px-6 py-3">สถานที่</th>
                                            <th className="px-6 py-3">กำหนดส่ง</th>
                                            <th className="px-6 py-3">ชื่อผู้ยืม</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(selectedBook.items || []).slice(0, 5).map((item, idx) => {
                                            const loanInfo = item.status === 'Checked Out' ? getLoanInfo(item.barcode) : { patronName: '-', dueDate: '-' };
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-6 py-3 text-center text-slate-500">{idx + 1}</td>
                                                    <td className="px-6 py-3 font-mono font-bold text-slate-700">{item.barcode}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit border ${getStatusColor(item.status)}`}>
                                                            {item.status === 'Available' && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                                                            {getStatusLabel(item.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-slate-500">{item.location}</td>
                                                    <td className="px-6 py-3 text-slate-600">{loanInfo.dueDate}</td>
                                                    <td className="px-6 py-3 text-slate-600">{loanInfo.patronName}</td>
                                                </tr>
                                            );
                                        })}
                                        {(!selectedBook.items || selectedBook.items.length === 0) && (
                                            <tr><td colSpan={6} className="p-6 text-center text-slate-400">ยังไม่มีข้อมูลตัวเล่ม</td></tr>
                                        )}
                                        {(selectedBook.items?.length || 0) > 5 && (
                                            <tr><td colSpan={6} className="p-2 text-center text-xs text-slate-400 bg-slate-50">แสดง 5 รายการแรก จากทั้งหมด {selectedBook.items?.length}</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Active Holds Section */}
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 mb-6">
                                <div className="flex items-center gap-2 mb-4 text-orange-800">
                                    <Bookmark className="w-5 h-5" />
                                    <h3 className="font-bold">รายการจองปัจจุบัน (Active Holds)</h3>
                                </div>
                                
                                {getActiveHoldsForBook(selectedBook).length > 0 ? (
                                    <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-orange-100 text-orange-800">
                                                <tr>
                                                    <th className="p-3 text-left">รหัสบาร์โค้ด (Barcode)</th>
                                                    <th className="p-3 text-left">วันที่จอง</th>
                                                    <th className="p-3 text-left">สมาชิก</th>
                                                    <th className="p-3 text-left">สถานภาพ</th>
                                                    <th className="p-3 text-left">กำหนดคืน</th>
                                                    <th className="p-3 text-center">ลบ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-orange-100">
                                                {getActiveHoldsForBook(selectedBook).map((h, i) => (
                                                    <tr key={i}>
                                                        <td className="p-3 font-mono">{h.barcode}</td>
                                                        <td className="p-3">{h.requestDate}</td>
                                                        <td className="p-3">{h.patronName}</td>
                                                        <td className="p-3"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">{h.status}</span></td>
                                                        <td className="p-3">{h.dueDate}</td>
                                                        <td className="p-3 text-center">
                                                            <button onClick={() => handleCancelHold(h.patronId, selectedBook.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg border border-orange-200 p-8 text-center text-slate-400 text-sm">
                                        ไม่มีรายการจอง
                                    </div>
                                )}
                            </div>

                            {/* Detailed Bibliographic Info */}
                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-slate-500" /> ข้อมูลบรรณานุกรมโดยละเอียด
                                </h3>
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-sm space-y-3">
                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-3 font-bold text-slate-500 text-right">ชื่อเรื่อง (Title):</div>
                                        <div className="col-span-9 text-slate-800 font-medium">{selectedBook.title}</div>
                                    </div>
                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-3 font-bold text-slate-500 text-right">ผู้แต่ง (Author):</div>
                                        <div className="col-span-9 text-slate-800">{selectedBook.author}</div>
                                    </div>
                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-3 font-bold text-slate-500 text-right">พิมพลักษณ์ (Imprint):</div>
                                        <div className="col-span-9 text-slate-800">
                                            {selectedBook.publisher ? `${selectedBook.publisher}` : ''}
                                            {selectedBook.pubYear ? `, ${selectedBook.pubYear}` : ''}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-3 font-bold text-slate-500 text-right">ลักษณะทางกายภาพ:</div>
                                        <div className="col-span-9 text-slate-800">{selectedBook.pages || '-'}</div>
                                    </div>
                                    {selectedBook.description && (
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-3 font-bold text-slate-500 text-right">สาระสังเขป:</div>
                                            <div className="col-span-9 text-slate-800">{selectedBook.description}</div>
                                        </div>
                                    )}
                                    {selectedBook.subject && (
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-3 font-bold text-slate-500 text-right">หัวเรื่อง (Subject):</div>
                                            <div className="col-span-9 text-blue-600 underline cursor-pointer">{selectedBook.subject}</div>
                                        </div>
                                    )}
                                    {selectedBook.marcData?.['440'] && (
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-3 font-bold text-slate-500 text-right">ชื่อชุด (Series):</div>
                                            <div className="col-span-9 text-slate-800">{selectedBook.marcData['440']}</div>
                                        </div>
                                    )}
                                    {selectedBook.marcData?.['700'] && (
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-3 font-bold text-slate-500 text-right">ผู้แต่งร่วม:</div>
                                            <div className="col-span-9 text-slate-800">{selectedBook.marcData['700']}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                  )}
              </div>
          )}

          {/* --- TAB 2: BIB RECORD --- */}
          {activeTab === 'Bib' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fadeIn h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Database className="w-6 h-6 text-accent"/>
                        {isEditMode ? 'แก้ไขบรรณานุกรม (Edit Bibliographic Record)' : 'เพิ่มบรรณานุกรมใหม่ (New Bibliographic Record)'}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => { populateForm(selectedBook || {} as Book, true); setActiveTab('Bib'); }} className="px-3 py-1.5 border border-slate-300 rounded text-sm hover:bg-slate-50 flex items-center gap-1"><RefreshCw className="w-4 h-4"/> รีเซ็ต</button>
                        <button onClick={handleSaveBib} className="px-6 py-1.5 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 shadow flex items-center gap-2"><Save className="w-4 h-4"/> บันทึกข้อมูล</button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Left Column - Main Form */}
                    <div className="col-span-9 space-y-6">
                        {/* 1. Leader & Control Fields */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase">ส่วนข้อมูลควบคุม (Control Fields)</h3>
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-4">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ประเภทวัสดุ (Format)</label>
                                    <select className="w-full border rounded p-2 text-sm" value={resourceType} onChange={e => setResourceType(e.target.value)}>
                                        {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-4">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">สถานที่จัดเก็บ (Location)</label>
                                    <select className="w-full border rounded p-2 text-sm" value={location} onChange={e => setLocation(e.target.value)}>
                                        {locations.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-4">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ISBN (020)</label>
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 border rounded p-2 text-sm" placeholder="978-..." value={tag020} onChange={e => setTag020(e.target.value)} />
                                        <button onClick={() => alert('Search ISBN from External DB...')} className="bg-white border p-2 rounded hover:bg-slate-100" title="ค้นหาปก/ข้อมูล"><Search className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-4 mt-3">
                                <div className="col-span-3">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">เลขหมู่ Dewey (082 $a)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm font-mono" placeholder="000" value={dewey} onChange={e => setDewey(e.target.value)} />
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">เลขผู้แต่ง Cutter (082 $b)</label>
                                    <div className="flex gap-1">
                                        <input type="text" className="w-full border rounded p-2 text-sm font-mono" placeholder="ก111" value={cutter} onChange={e => setCutter(e.target.value)} />
                                        <button onClick={generateAutoCallNumber} className="bg-slate-200 px-2 rounded hover:bg-slate-300 text-xs" title="Auto Generate"><RefreshCw className="w-3 h-3"/></button>
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ปีพิมพ์ (Year)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm font-mono" placeholder="2567" value={pubYearCall} onChange={e => setPubYearCall(e.target.value)} />
                                </div>
                                <div className="col-span-3 bg-blue-50 p-2 rounded flex flex-col justify-center items-center">
                                    <span className="text-[10px] text-blue-500 font-bold">Call Number Preview</span>
                                    <span className="text-sm font-bold font-mono text-blue-800">{dewey} {cutter} {pubYearCall}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Title & Author */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase">ชื่อเรื่องและผู้แต่ง (Title & Author)</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อเรื่อง (245 $a) <span className="text-red-500">*</span></label>
                                    <input type="text" className="w-full border rounded p-2 text-sm font-bold" placeholder="ระบุชื่อเรื่อง..." value={tag245a} onChange={e => setTag245a(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">ผู้แต่ง - บุคคล (100 $a)</label>
                                        <input type="text" className="w-full border rounded p-2 text-sm" placeholder="ชื่อ-นามสกุล..." value={tag100} onChange={e => handleAuthorChange(e.target.value)} onFocus={() => setShowAuthorSuggestions(!!tag100)} />
                                        {showAuthorSuggestions && (
                                            <div className="absolute z-10 w-full bg-white border shadow-lg max-h-40 overflow-y-auto mt-1 rounded">
                                                {suggestedAuthors.map((item, idx) => (
                                                    <div key={idx} className="p-2 hover:bg-blue-50 cursor-pointer text-sm flex justify-between" onClick={() => selectAuthor(item)}>
                                                        <span>{item.name}</span>
                                                        {item.cutter && <span className="text-xs text-slate-400 bg-slate-100 px-1 rounded">{item.cutter}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">ผู้แต่ง - นิติบุคคล (110 $a)</label>
                                        <input type="text" className="w-full border rounded p-2 text-sm" placeholder="หน่วยงาน/องค์กร..." value={tag110} onChange={e => setTag110(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ส่วนแจ้งความรับผิดชอบ (245 $c)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm" placeholder="เช่น เรื่องโดย..., ภาพโดย..." value={tag245c} onChange={e => setTag245c(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อเรื่องที่แตกต่าง (246)</label>
                                        <input type="text" className="w-full border rounded p-2 text-sm" value={tag246} onChange={e => setTag246(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">ครั้งที่พิมพ์ (250)</label>
                                        <input type="text" className="w-full border rounded p-2 text-sm" placeholder="พิมพ์ครั้งที่..." value={tag250} onChange={e => setTag250(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Imprint & Physical */}
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase">พิมพลักษณ์และลักษณะทางกายภาพ (Imprint & Physical)</h3>
                            <div className="grid grid-cols-3 gap-4 mb-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">สถานที่พิมพ์ (260 $a)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm" value={tag260a} onChange={e => setTag260a(e.target.value)} />
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">สำนักพิมพ์ (260 $b)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm" value={tag260b} onChange={e => handlePublisherChange(e.target.value)} onFocus={() => setShowPublisherSuggestions(!!tag260b)} />
                                    {showPublisherSuggestions && (
                                        <div className="absolute z-10 w-full bg-white border shadow-lg max-h-40 overflow-y-auto mt-1 rounded">
                                            {suggestedPublishers.map((pub, idx) => (
                                                <div key={idx} className="p-2 hover:bg-blue-50 cursor-pointer text-sm flex justify-between" onClick={() => selectPublisher(pub)}>
                                                    <span>{pub.name}</span>
                                                    {pub.place && <span className="text-xs text-slate-400 bg-slate-100 px-1 rounded">{pub.place}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ปีที่พิมพ์ (260 $c)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm" value={tag260c} onChange={e => setTag260c(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">จำนวนหน้า (300 $a)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm" placeholder="300 หน้า" value={tag300a} onChange={e => setTag300a(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ภาพประกอบ (300 $b)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm" placeholder="ภาพประกอบ" value={tag300b} onChange={e => setTag300b(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ขนาด (300 $c)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm" placeholder="21 ซม." />
                                </div>
                            </div>
                        </div>

                        {/* 4. Subject & Notes */}
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase">หัวเรื่องและหมายเหตุ (Subject & Notes)</h3>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">หัวเรื่อง (650)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm" placeholder="ระบุหัวเรื่อง..." value={tag650} onChange={e => handleSubjectChange(e.target.value)} onFocus={() => setShowSubjectSuggestions(!!tag650)}/>
                                    {showSubjectSuggestions && (
                                        <div className="absolute z-10 w-full bg-white border shadow-lg max-h-40 overflow-y-auto mt-1 rounded">
                                            {suggestedSubjects.map((s, idx) => (
                                                <div key={idx} className="p-2 hover:bg-blue-50 cursor-pointer text-sm" onClick={() => selectSubject(s)}>
                                                    {s.heading} <span className="text-xs text-slate-400">({s.dewey})</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อชุด (440)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm" value={tag440} onChange={e => handleSeriesChange(e.target.value)} onFocus={() => setShowSeriesSuggestions(!!tag440)}/>
                                    {showSeriesSuggestions && (
                                        <div className="absolute z-10 w-full bg-white border shadow-lg max-h-40 overflow-y-auto mt-1 rounded">
                                            {suggestedSeries.map((s, idx) => (
                                                <div key={idx} className="p-2 hover:bg-blue-50 cursor-pointer text-sm" onClick={() => selectSeries(s)}>
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="block text-xs font-bold text-slate-500 mb-1">สาระสังเขป (520)</label>
                                <textarea className="w-full border rounded p-2 text-sm h-20" value={tag520} onChange={e => setTag520(e.target.value)}></textarea>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ราคา (541)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm" placeholder="บาท" value={tag541} onChange={e => setTag541(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">ผู้แต่งร่วม (700)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm" value={tag700} onChange={e => setTag700(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">แหล่งที่มา (990)</label>
                                    <input type="text" className="w-full border rounded p-2 text-sm" value={tag990} onChange={e => setTag990(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* 5. Custom Fields */}
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-slate-700 text-sm uppercase">ข้อมูลเพิ่มเติม (Custom MARC Fields)</h3>
                                <button onClick={() => setShowAddMarcFieldModal(true)} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><PlusCircle className="w-3 h-3"/> เพิ่มฟิลด์</button>
                            </div>
                            {extraMarc.map((field, idx) => (
                                <div key={idx} className="flex gap-2 mb-2 items-center">
                                    <span className="w-10 text-xs font-mono text-slate-500 bg-slate-100 p-1 text-center rounded">{field.tag}</span>
                                    <span className="w-8 text-xs font-mono text-slate-400 text-center">{field.sub}</span>
                                    {field.inputType === 'multi' ? (
                                        <textarea className="flex-1 border rounded p-2 text-sm" value={field.val} onChange={e => {const newExtra = [...extraMarc]; newExtra[idx].val = e.target.value; setExtraMarc(newExtra);}} placeholder={field.desc}></textarea>
                                    ) : (
                                        <input type="text" className="flex-1 border rounded p-2 text-sm" value={field.val} onChange={e => {const newExtra = [...extraMarc]; newExtra[idx].val = e.target.value; setExtraMarc(newExtra);}} placeholder={field.desc} />
                                    )}
                                    <button onClick={() => handleRemoveExtraMarc(idx)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                                </div>
                            ))}
                            {extraMarc.length === 0 && <p className="text-xs text-slate-400 italic">ไม่มีฟิลด์เพิ่มเติม</p>}
                        </div>
                    </div>

                    {/* Right Column - Media & Files */}
                    <div className="col-span-3 space-y-6">
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase">รูปภาพปก (Cover Image)</h3>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg h-48 flex flex-col items-center justify-center bg-slate-50 mb-3 overflow-hidden relative group">
                                {tag902 ? (
                                    <>
                                        <img src={tag902} className="w-full h-full object-contain" />
                                        <button onClick={() => setTag902('')} className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-red-500 hover:bg-white"><Trash2 className="w-4 h-4"/></button>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                                        <span className="text-xs text-slate-400">ลากไฟล์มาวาง หรือ คลิกเพื่ออัปโหลด</span>
                                    </>
                                )}
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                            </div>
                            <input type="text" className="w-full border rounded p-2 text-xs mb-2" placeholder="หรือระบุ URL ของรูปภาพ..." value={tag902} onChange={e => setTag902(e.target.value)} />
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase">ไฟล์ดิจิทัล (E-book/PDF)</h3>
                            <div className="border border-slate-200 rounded p-3 bg-slate-50 mb-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <LinkIcon className="w-4 h-4 text-slate-400" />
                                    <input type="text" className="flex-1 bg-transparent text-sm outline-none" placeholder="ลิงก์ภายนอก (External URL)" value={tag856} onChange={e => setTag856(e.target.value)} />
                                </div>
                            </div>
                            <div className="relative">
                                <button className="w-full bg-blue-50 text-blue-600 border border-blue-200 py-2 rounded text-sm hover:bg-blue-100 flex items-center justify-center gap-2">
                                    <Upload className="w-4 h-4" /> อัปโหลดไฟล์ PDF
                                </button>
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.epub" onChange={handleEbookUpload} />
                            </div>
                            {tag856File && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><FileText className="w-3 h-3"/> {tag856File}</p>}
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase">การตั้งค่าอื่นๆ</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">จำกัดการจอง (Max Reservations)</label>
                                    <input type="number" className="w-full border rounded p-2 text-sm" value={maxReservations} onChange={e => setMaxReservations(Number(e.target.value))} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="opac-visible" defaultChecked className="rounded text-blue-600" />
                                    <label htmlFor="opac-visible" className="text-sm text-slate-700">แสดงในหน้า OPAC</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'Item' && (
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col animate-fadeIn">
                {!selectedBook ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-70">
                        <Database className="w-16 h-16 mb-4 stroke-1"/>
                        <p className="text-lg font-medium">กรุณาบันทึกข้อมูลบรรณานุกรมก่อนจัดการตัวเล่ม</p>
                        <p className="text-sm">หรือเลือกรายการจากหน้าสืบค้น (Search)</p>
                        <button onClick={() => setActiveTab('Search')} className="mt-4 px-4 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">กลับไปค้นหา</button>
                    </div>
                ) : (
                    <>
                        <div className="border-b pb-4 mb-4 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Box className="w-6 h-6 text-accent"/> จัดการข้อมูลตัวเล่ม (Item Holdings)
                                </h2>
                                <p className="text-slate-500 text-sm mt-1 ml-8">สำหรับ: <span className="font-bold text-slate-700">{selectedBook.title}</span> ({selectedBook.isbn})</p>
                            </div>
                            <div className="bg-blue-50 px-3 py-1 rounded text-blue-800 text-sm font-medium">
                                จำนวนทั้งหมด: {selectedBook.items?.length || 0} เล่ม
                            </div>
                        </div>

                        {/* Add Item Form */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                            <h3 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2"><PlusCircle className="w-4 h-4"/> เพิ่มตัวเล่มใหม่</h3>
                            <div className="flex flex-col md:flex-row gap-6 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">รูปแบบบาร์โค้ด</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="holdingsMode" checked={holdingsMode === 'Auto'} onChange={() => setHoldingsMode('Auto')} className="text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm">รันอัตโนมัติ (Auto)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="holdingsMode" checked={holdingsMode === 'Manual'} onChange={() => setHoldingsMode('Manual')} className="text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm">ระบุเอง (Manual)</span>
                                        </label>
                                    </div>
                                </div>
                                
                                {holdingsMode === 'Auto' ? (
                                    <div className="w-32">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">จำนวน (เล่ม)</label>
                                        <input type="number" min="1" max="100" className="w-full border rounded p-2 text-sm" value={autoCopyCount} onChange={e => setAutoCopyCount(Number(e.target.value))} />
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">รหัสบาร์โค้ด</label>
                                        <input type="text" className="w-full border rounded p-2 text-sm font-mono" placeholder="Scan or type barcode..." value={manualBarcode} onChange={e => setManualBarcode(e.target.value)} />
                                    </div>
                                )}

                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">สถานที่จัดเก็บ</label>
                                    <select className="w-full border rounded p-2 text-sm" value={location} onChange={e => setLocation(e.target.value)}>
                                        {locations.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>

                                <button onClick={handleAddHoldings} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 shadow-sm h-[38px]">
                                    เพิ่มรายการ
                                </button>
                            </div>
                        </div>

                        {/* Item List Table */}
                        <div className="flex-1 overflow-auto border rounded-lg shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 w-16 text-center">#</th>
                                        <th className="px-4 py-3">รหัสบาร์โค้ด (Barcode)</th>
                                        <th className="px-4 py-3">สถานะ (Status)</th>
                                        <th className="px-4 py-3">สถานที่ (Location)</th>
                                        <th className="px-4 py-3 w-32 text-right">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(!selectedBook.items || selectedBook.items.length === 0) ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400">ยังไม่มีข้อมูลตัวเล่ม</td></tr>
                                    ) : (
                                        selectedBook.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                                                <td className="px-4 py-3">
                                                    {editingItemIndex === idx ? (
                                                        <input 
                                                            type="text" 
                                                            autoFocus
                                                            className="border rounded px-2 py-1 text-sm font-mono w-full bg-white shadow-inner"
                                                            value={tempEditBarcode}
                                                            onChange={e => setTempEditBarcode(e.target.value)}
                                                        />
                                                    ) : (
                                                        <span className="font-mono font-medium text-slate-700">{item.barcode}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {editingItemIndex === idx ? (
                                                        <select
                                                            className="border rounded px-2 py-1 text-sm w-full bg-white shadow-inner"
                                                            value={tempEditStatus}
                                                            onChange={e => setTempEditStatus(e.target.value)}
                                                        >
                                                            <option value="Available">อยู่บนชั้น</option>
                                                            <option value="Checked Out">ถูกยืมออก</option>
                                                            <option value="Shelving Cart">อยู่บนรถเข็น (รอขึ้นชั้น)</option>
                                                            <option value="Lost">สูญหาย</option>
                                                            <option value="Repair">ชำรุด/รอซ่อม</option>
                                                            <option value="Processing">รอติด QR code</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                                                            {getStatusLabel(item.status)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{item.location}</td>
                                                <td className="px-4 py-3 text-right">
                                                    {editingItemIndex === idx ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => handleSaveEditItem(idx)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4"/></button>
                                                            <button onClick={() => setEditingItemIndex(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-4 h-4"/></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => handleEditItem(idx, item)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="แก้ไข"><Edit className="w-4 h-4"/></button>
                                                            <button onClick={() => handleDeleteItem(idx)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="ลบ"><Trash2 className="w-4 h-4"/></button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
          )}

          {activeTab === 'Authority' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col animate-fadeIn overflow-hidden">
                  <div className="p-6 border-b bg-slate-50">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Key className="w-5 h-5 text-accent"/> การควบคุมรายการหลักฐาน (Authority Control)</h3>
                      <p className="text-slate-500 text-sm mt-1">จัดการข้อมูลผู้แต่ง, สำนักพิมพ์, ชื่อชุด, และหัวเรื่อง เพื่อความเป็นมาตรฐาน</p>
                  </div>
                  
                  {/* DETAIL VIEW MODE */}
                  {selectedAuthority ? (
                      <div className="flex-1 flex flex-col h-full animate-fadeIn">
                          <div className="p-4 border-b bg-white flex items-center gap-4">
                              <button onClick={() => setSelectedAuthority(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                                  <ArrowLeft className="w-6 h-6"/>
                              </button>
                              <div>
                                  <h4 className="text-xl font-bold text-slate-800">{selectedAuthority.name}</h4>
                                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{selectedAuthority.type}</span>
                              </div>
                          </div>
                          <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
                              <h5 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4"/> รายการหนังสือที่เกี่ยวข้อง ({getBooksByAuthority(selectedAuthority.type, selectedAuthority.name).length})</h5>
                              <div className="space-y-3">
                                  {getBooksByAuthority(selectedAuthority.type, selectedAuthority.name).length > 0 ? (
                                      getBooksByAuthority(selectedAuthority.type, selectedAuthority.name).map(book => (
                                          <div key={book.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedBook(book); setActiveTab('Search'); }}>
                                              <div className="w-16 h-24 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                                                  {book.coverUrl ? <img src={book.coverUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-6 h-6"/></div>}
                                              </div>
                                              <div className="flex-1">
                                                  <h4 className="font-bold text-slate-800 text-lg mb-1">{book.title}</h4>
                                                  <p className="text-slate-500 text-sm mb-2">{book.author}</p>
                                                  <div className="flex gap-3 text-xs text-slate-400">
                                                      <span className="bg-slate-100 px-2 py-1 rounded">Call No: {book.callNumber}</span>
                                                      <span className={`px-2 py-1 rounded border ${getStatusColor(book.status)}`}>{getStatusLabel(book.status)}</span>
                                                  </div>
                                              </div>
                                              <div className="flex items-center">
                                                  <ArrowRight className="w-5 h-5 text-slate-300"/>
                                              </div>
                                          </div>
                                      ))
                                  ) : (
                                      <div className="text-center py-12 text-slate-400">ไม่พบรายการหนังสือ</div>
                                  )}
                              </div>
                          </div>
                      </div>
                  ) : (
                      /* LIST VIEW MODE (Default) */
                      <div className="flex-1 flex flex-col md:flex-row h-full min-h-0">
                          {/* Left Sidebar */}
                          <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto">
                              <nav className="space-y-2">
                                  <button onClick={() => setAuthorityType('Author')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${authorityType === 'Author' ? 'bg-white shadow-sm text-accent font-medium' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                                      <Users className="w-4 h-4"/> ชื่อผู้แต่ง (Authors)
                                  </button>
                                  <button onClick={() => setAuthorityType('Publisher')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${authorityType === 'Publisher' ? 'bg-white shadow-sm text-accent font-medium' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                                      <Building2 className="w-4 h-4"/> สำนักพิมพ์ (Publishers)
                                  </button>
                                  <button onClick={() => setAuthorityType('Series')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${authorityType === 'Series' ? 'bg-white shadow-sm text-accent font-medium' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                                      <Library className="w-4 h-4"/> ชื่อชุด (Series)
                                  </button>
                                  <button onClick={() => setAuthorityType('Subject')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${authorityType === 'Subject' ? 'bg-white shadow-sm text-accent font-medium' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                                      <Hash className="w-4 h-4"/> หัวเรื่อง (Subjects)
                                  </button>
                              </nav>
                          </div>
                          
                          {/* Main Content List */}
                          <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                              <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-bold text-slate-700 text-lg">รายการ{authorityType === 'Author' ? 'ชื่อผู้แต่ง' : authorityType === 'Publisher' ? 'สำนักพิมพ์' : authorityType === 'Series' ? 'ชื่อชุด' : 'หัวเรื่อง'}ทั้งหมด</h4>
                                  <div className="relative">
                                      <input 
                                          type="text" 
                                          placeholder={`ค้นหา${authorityType === 'Author' ? 'ชื่อผู้แต่ง' : 'ข้อมูล'}...`} 
                                          className="border rounded-lg pl-9 pr-3 py-2 text-sm w-64 focus:ring-2 focus:ring-accent outline-none"
                                          value={authoritySearch}
                                          onChange={(e) => setAuthoritySearch(e.target.value)}
                                      />
                                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                                  </div>
                              </div>
                              
                              <div className="border rounded-lg overflow-hidden flex-1 bg-white shadow-sm">
                                  <table className="w-full text-left text-sm">
                                      <thead className="bg-slate-100 text-slate-600 font-medium">
                                          <tr>
                                              <th className="px-6 py-3 w-16 text-center">#</th>
                                              <th className="px-6 py-3">รายการ (Heading)</th>
                                              <th className="px-6 py-3">
                                                  {authorityType === 'Author' ? 'เลขผู้แต่ง (Cutter)' : 
                                                  authorityType === 'Publisher' ? 'สถานที่พิมพ์ (Place)' : 
                                                  authorityType === 'Subject' ? 'เลขหมู่ (Dewey)' : 'ข้อมูลประกอบ'}
                                              </th>
                                              <th className="px-6 py-3 text-center">จำนวนที่ใช้</th>
                                              <th className="px-6 py-3 w-24 text-center">จัดการ</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                          {getAuthorityData().length === 0 ? (
                                              <tr><td colSpan={5} className="p-8 text-center text-slate-400">ไม่พบข้อมูลรายการหลักฐาน</td></tr>
                                          ) : (
                                              getAuthorityData().map((item, idx) => (
                                                  <tr key={idx} className="hover:bg-slate-50 group cursor-pointer" onClick={() => setSelectedAuthority({ type: authorityType, name: item.name })}>
                                                      <td className="px-6 py-3 text-center text-slate-400">{idx + 1}</td>
                                                      <td className="px-6 py-3 font-medium text-slate-800 hover:text-accent">{item.name}</td>
                                                      <td className="px-6 py-3 text-slate-500 font-mono text-xs">{item.info}</td>
                                                      <td className="px-6 py-3 text-center"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{item.count}</span></td>
                                                      <td className="px-6 py-3 text-center">
                                                          <button className="text-slate-400 hover:text-accent p-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleEditAuthority(authorityType, item.name); }}><Edit className="w-4 h-4"/></button>
                                                      </td>
                                                  </tr>
                                              ))
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'Import' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-hidden flex flex-col animate-fadeIn">
                  {/* ... Import UI Code ... */}
                  <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                        <div><h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><FileSpreadsheet className="w-5 h-5 text-green-600" /> นำเข้าข้อมูลบรรณานุกรม (Excel Import)</h3><p className="text-xs text-slate-500 mt-1">รองรับการอัปโหลดไฟล์ Excel (.xlsx) และการวางข้อมูล (Copy & Paste)</p></div>
                        <div className="flex gap-2">
                            <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded text-sm hover:bg-slate-50 flex items-center gap-2 shadow-sm"><Download className="w-4 h-4"/> ดาวน์โหลดไฟล์ต้นแบบ</button>
                            {previewBooks.length > 0 && (<button onClick={() => {setImportText(''); setPreviewBooks([]);}} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded text-sm">ยกเลิก/ล้างค่า</button>)}
                            {previewBooks.length > 0 && (<button onClick={handleConfirmImport} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 flex items-center gap-2"><Check className="w-4 h-4"/> ยืนยันนำเข้า ({previewBooks.length})</button>)}
                        </div>
                    </div>
                    {/* ... Rest of Import UI (same as before) ... */}
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 border-b">
                            <div className="lg:col-span-1 space-y-4">
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg"><h4 className="font-bold text-blue-800 text-sm mb-3">1. ตั้งค่าเริ่มต้น (Default Settings)</h4><div className="space-y-3"><div><label className="block text-xs font-bold text-slate-600 mb-1">สถานที่จัดเก็บ</label><select className="w-full border rounded text-sm p-2" value={importConfig.location} onChange={e => setImportConfig({...importConfig, location: e.target.value})}>{locations.map(l => <option key={l} value={l}>{l}</option>)}</select></div><div><label className="block text-xs font-bold text-slate-600 mb-1">ประเภททรัพยากร</label><select className="w-full border rounded text-sm p-2" value={importConfig.resourceType} onChange={e => setImportConfig({...importConfig, resourceType: e.target.value})}>{resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div><div className="flex items-center gap-2 pt-2"><input type="checkbox" checked={importConfig.showInOpac} onChange={e => setImportConfig({...importConfig, showInOpac: e.target.checked})} /><label className="text-sm text-slate-700">แสดงใน OPAC</label></div></div></div>
                            </div>
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex flex-col h-full"><h4 className="font-bold text-sm text-slate-700 mb-2">2. เลือกวิธีการนำเข้า (Import Method)</h4>{previewBooks.length === 0 ? (<div className="flex gap-4 h-full"><label className="flex-1 border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100/50 transition-colors relative group p-6"><div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform"><Upload className="w-8 h-8 text-blue-500" /></div><span className="font-bold text-blue-700">อัปโหลดไฟล์ Excel (.xlsx)</span><span className="text-xs text-slate-500 mt-1">คลิกเพื่อเลือกไฟล์</span><input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} /></label><div className="flex-1 relative"><textarea className="w-full h-full border border-slate-300 rounded-xl p-4 text-sm font-mono focus:border-accent focus:ring-0 outline-none resize-none bg-slate-50 focus:bg-white transition-colors" placeholder="หรือ วางข้อมูลจาก Excel ที่นี่ (Ctrl+V)..." value={importText} onChange={e => setImportText(e.target.value)}></textarea>{importText && (<button onClick={handleImportParse} className="absolute bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-900 shadow-lg">แสดงตัวอย่าง</button>)}</div></div>) : (<div className="flex items-center justify-center h-full border border-green-200 bg-green-50 rounded-xl p-6 text-center"><div><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-green-600" /></div><h4 className="font-bold text-green-800 mb-1">โหลดข้อมูลเรียบร้อยแล้ว</h4><p className="text-green-600 text-sm">กรุณาตรวจสอบและแก้ไขข้อมูลในตารางด้านล่าง</p><button onClick={() => {setPreviewBooks([]); setImportText('');}} className="mt-4 text-xs text-slate-500 underline hover:text-slate-700">ยกเลิก / โหลดใหม่</button></div></div>)}</div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col min-h-0 bg-slate-100/50">
                            {previewBooks.length === 0 ? (<div className="flex-1 flex flex-col items-center justify-center text-slate-400"><FileSpreadsheet className="w-16 h-16 mb-4 opacity-20" /><p>ยังไม่มีข้อมูลที่จะนำเข้า</p></div>) : (<div className="flex-1 overflow-auto p-6"><div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"><div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center"><h4 className="font-bold text-slate-700 text-sm">ตัวอย่างข้อมูล ({previewBooks.length} รายการ)</h4><span className="text-xs text-slate-500">สามารถแก้ไขข้อมูลในตารางได้โดยตรง</span></div><table className="w-full text-xs text-left"><thead className="bg-slate-50 text-slate-700 sticky top-0 z-10 shadow-sm"><tr><th className="p-3 border-b w-10 text-center">#</th><th className="p-3 border-b w-24">ID</th><th className="p-3 border-b">Title</th><th className="p-3 border-b w-40">Author</th><th className="p-3 border-b w-24">Call No.</th><th className="p-3 border-b w-32">ISBN</th><th className="p-3 border-b text-center w-16">Copies</th><th className="p-3 border-b w-10"></th></tr></thead><tbody className="divide-y">{previewBooks.map((b, i) => (<tr key={i} className="hover:bg-slate-50 group"><td className="p-2 text-center text-slate-400 align-middle">{i+1}</td><td className="p-2 align-middle"><input type="text" value={b.id} onChange={(e) => handleUpdatePreview(i, 'id', e.target.value)} className="w-full border border-transparent hover:border-slate-300 focus:border-accent rounded px-2 py-1 bg-transparent font-mono font-bold text-blue-600 focus:bg-white outline-none" /></td><td className="p-2 align-middle"><input type="text" value={b.title} onChange={(e) => handleUpdatePreview(i, 'title', e.target.value)} className="w-full border border-transparent hover:border-slate-300 focus:border-accent rounded px-2 py-1 bg-transparent font-medium text-slate-800 focus:bg-white outline-none" /></td><td className="p-2 align-middle"><input type="text" value={b.author} onChange={(e) => handleUpdatePreview(i, 'author', e.target.value)} className="w-full border border-transparent hover:border-slate-300 focus:border-accent rounded px-2 py-1 bg-transparent text-slate-600 focus:bg-white outline-none" /></td><td className="p-2 align-middle"><input type="text" value={b.callNumber} onChange={(e) => handleUpdatePreview(i, 'callNumber', e.target.value)} className="w-full border border-transparent hover:border-slate-300 focus:border-accent rounded px-2 py-1 bg-transparent font-mono focus:bg-white outline-none" /></td><td className="p-2 align-middle"><input type="text" value={b.isbn} onChange={(e) => handleUpdatePreview(i, 'isbn', e.target.value)} className="w-full border border-transparent hover:border-slate-300 focus:border-accent rounded px-2 py-1 bg-transparent text-slate-500 focus:bg-white outline-none" /></td><td className="p-2 text-center align-middle"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]">{b.items?.length || 0}</span></td><td className="p-2 text-center align-middle"><button onClick={() => handleDeletePreviewRow(i)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="ลบรายการ"><Trash2 className="w-4 h-4"/></button></td></tr>))}</tbody></table></div></div>)}
                        </div>
                    </div>
              </div>
          )}
      </div>


      {/* Add MARC Field Modal (Enhanced) */}
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
                          <select className="w-full border rounded px-3 py-2 text-sm bg-white" value={newFieldData.resourceType} onChange={e => setNewFieldData({...newFieldData, resourceType: e.target.value})}>{resourceTypes.map(type => (<option key={type} value={type}>{type}</option>))}</select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">แท็ก (Tag)</label>
                          <select className="w-full border rounded px-3 py-2 text-sm font-mono" value={newFieldData.tag} onChange={handleTagSelect}>
                              <option value="">-- เลือก Tag (จาก Admin) --</option>
                              {marcTags.map(t => (<option key={t.tag} value={t.tag}>{t.tag} - {t.desc}</option>))}
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">รหัสฟิลด์ย่อย</label>
                              <input type="text" className="w-full border rounded px-3 py-2 text-sm font-mono bg-slate-50" value={newFieldData.subfield} onChange={e => setNewFieldData({...newFieldData, subfield: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">รายละเอียด</label>
                              <input type="text" className="w-full border rounded px-3 py-2 text-sm bg-slate-50" value={newFieldData.desc} onChange={e => setNewFieldData({...newFieldData, desc: e.target.value})} />
                          </div>
                      </div>
                       <div className="flex items-center gap-2 mt-2">
                          <input type="checkbox" checked={newFieldData.mandatory} onChange={e => setNewFieldData({...newFieldData, mandatory: e.target.checked})} className="rounded text-blue-600" />
                          <label className="text-sm text-slate-700">ตั้งเป็นฟิลด์บังคับ</label>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">รูปแบบช่องกรอกข้อมูล</label>
                          <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="inputType" value="single" checked={newFieldData.inputType === 'single'} onChange={() => setNewFieldData({...newFieldData, inputType: 'single'})} /><span className="text-sm">บรรทัดเดียว</span></label>
                               <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="inputType" value="multi" checked={newFieldData.inputType === 'multi'} onChange={() => setNewFieldData({...newFieldData, inputType: 'multi'})} /><span className="text-sm">หลายบรรทัด</span></label>
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
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg flex items-center gap-2"><Code className="w-5 h-5"/> แก้ไขระเบียน MARC (Edit MARC)</h3><button onClick={() => setShowMarcModal(false)}><X className="w-5 h-5"/></button></div>
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
      
      {/* History Modal & Holds Modal (Same as before) ... */}
      {showHistoryModal && selectedBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 animate-fadeIn flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg flex items-center gap-2"><History className="w-5 h-5"/> ประวัติการยืม-คืน: {selectedBook.title}</h3><button onClick={() => setShowHistoryModal(false)}><X className="w-5 h-5"/></button></div>
                  <div className="flex-1 overflow-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-100 text-slate-600"><tr><th className="px-4 py-2">วันที่ยืม</th><th className="px-4 py-2">วันที่คืน</th><th className="px-4 py-2">ผู้ยืม</th><th className="px-4 py-2">สถานะ</th></tr></thead><tbody className="divide-y">{getBookLoanHistory(selectedBook).map((tx, i) => (<tr key={i} className="hover:bg-slate-50"><td className="px-4 py-2">{tx.checkoutDate}</td><td className="px-4 py-2">{tx.returnDate || '-'}</td><td className="px-4 py-2">{tx.patronName}</td><td className="px-4 py-2"><span className={`px-2 py-1 rounded-full text-xs ${tx.status === 'Returned' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{translateStatus(tx.status)}</span></td></tr>))}{getBookLoanHistory(selectedBook).length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">ไม่พบประวัติการยืม</td></tr>}</tbody></table></div>
                  <div className="mt-4 flex justify-end"><button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700">ปิด</button></div>
              </div>
          </div>
      )}

      {showHoldsModal && selectedBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 animate-fadeIn flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg flex items-center gap-2"><Bookmark className="w-5 h-5"/> ประวัติรายการจองย้อนหลังทั้งหมด: {selectedBook.title}</h3><button onClick={() => setShowHoldsModal(false)}><X className="w-5 h-5"/></button></div>
                  <div className="flex-1 overflow-auto">{getAllReservationHistory(selectedBook).length > 0 ? (<table className="w-full text-sm text-left"><thead className="bg-orange-100 text-orange-800 sticky top-0 z-10"><tr><th className="px-4 py-2">ชื่อผู้จอง</th><th className="px-4 py-2">วันที่จอง</th><th className="px-4 py-2">สถานะการจอง</th><th className="px-4 py-2">วันที่ดำเนินการ (Action Date)</th></tr></thead><tbody className="divide-y">{getAllReservationHistory(selectedBook).map((h, i) => (<tr key={i} className="hover:bg-orange-50"><td className="px-4 py-2 font-medium text-slate-700">{h.patronName}</td><td className="px-4 py-2 text-slate-500">{h.date}</td><td className="px-4 py-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${h.status.includes('Active') ? 'bg-blue-100 text-blue-700' : h.status.includes('รับหนังสือแล้ว') ? 'bg-green-100 text-green-700' : h.status.includes('ยกเลิก') ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{h.status}</span></td><td className="px-4 py-2 text-slate-500">{h.actionDate}</td></tr>))}</tbody></table>) : (<div className="p-10 text-center text-slate-400"><Bookmark className="w-12 h-12 mx-auto mb-2 opacity-20" /><p>ไม่มีประวัติการจองสำหรับหนังสือเล่มนี้</p></div>)}</div>
                  <div className="mt-4 flex justify-end"><button onClick={() => setShowHoldsModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700">ปิด</button></div>
              </div>
          </div>
      )}
    </div>
  );
};


export default Cataloging;
