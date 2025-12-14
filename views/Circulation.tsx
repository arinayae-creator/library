
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRightLeft, User, BookOpen, Search, Check, Wifi, UserPlus, History, Upload, CalendarOff, Edit, Trash2, X, Save, ChevronsUp, DollarSign, AlertCircle, CreditCard, PlusCircle, MinusCircle, Filter, Calendar, Clock, RefreshCw, Image as ImageIcon, Bookmark, Camera, BellRing, ArrowRight, Receipt, FileClock, XCircle, UserCheck } from 'lucide-react';
import { Patron, Transaction, Book, FineTransaction } from '../types';
import { useLibrary } from '../context/LibraryContext';

const Circulation: React.FC = () => {
  const { 
    books, patrons, updateBookStatus, addPatron, updatePatron, updatePatronsBatch, deletePatron, 
    addTransaction, deleteTransaction, returnBook, renewLoan,
    circulationSession, updateCirculationSession 
  } = useLibrary();

  // Use session state from context
  const activeTab = circulationSession.activeTab;
  const subTab = circulationSession.subTab;
  const mode = circulationSession.mode;
  const scannedItems = circulationSession.scannedItems;
  const rightPanelTab = circulationSession.rightPanelTab;

  // Form State from Context
  const isFormOpen = circulationSession.isPatronFormOpen;
  const formData = circulationSession.patronFormData;
  const isEditing = circulationSession.isPatronEditMode;

  // Local state for UI inputs (controlled by context too for persistence)
  const patronId = circulationSession.patronIdInput;
  const itemId = circulationSession.itemIdInput;

  // Derive current patron from session ID
  const currentPatron = patrons.find(p => p.id === circulationSession.currentPatronId) || null;
  
  const setPatronId = (val: string) => updateCirculationSession({ patronIdInput: val });
  const setItemId = (val: string) => updateCirculationSession({ itemIdInput: val });
  const setActiveTab = (val: 'Service' | 'Patrons') => updateCirculationSession({ activeTab: val });
  const setSubTab = (val: 'List' | 'Promotion') => updateCirculationSession({ subTab: val });
  const setMode = (val: 'Checkout' | 'Checkin') => updateCirculationSession({ mode: val });
  const setScannedItems = (items: Transaction[]) => updateCirculationSession({ scannedItems: items });
  const setCurrentPatronId = (id: string | null) => updateCirculationSession({ currentPatronId: id });
  const setRightPanelTab = (val: 'Active' | 'History' | 'Fines') => updateCirculationSession({ rightPanelTab: val });

  // Form Setters
  const setIsFormOpen = (isOpen: boolean) => updateCirculationSession({ isPatronFormOpen: isOpen });
  const setFormData = (data: Partial<Patron>) => updateCirculationSession({ patronFormData: data });
  const setIsEditing = (editing: boolean) => updateCirculationSession({ isPatronEditMode: editing });

  // UI State for Modals (No need to persist these across nav)
  const [showFineModal, setShowFineModal] = useState(false);
  const [fineAmountInput, setFineAmountInput] = useState<string>('');
  const [fineAction, setFineAction] = useState<'Pay' | 'Add'>('Pay');
  const [checkinAlert, setCheckinAlert] = useState<{ patron: Patron, bookTitle: string, fine: number, transactionId: string, barcode: string } | null>(null);
  const [checkinHoldAlert, setCheckinHoldAlert] = useState<{ patron: Patron, bookTitle: string, bookId: string } | null>(null);
  const [reservationInput, setReservationInput] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const [patronSearch, setPatronSearch] = useState('');

  // Batch Promotion State
  const [promoFilterGroup, setPromoFilterGroup] = useState('');
  const [promoList, setPromoList] = useState<(Patron & { newGroup: string, newStatus: string })[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragEndIndex, setDragEndIndex] = useState<number | null>(null);

  // Renew Membership Modal State
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewYears, setRenewYears] = useState(1);

  // Helper: Date Parsing
  const parseThaiDate = (dateStr: string): Date => {
      const [d, m, y] = dateStr.split('/').map(Number);
      return new Date(y - 543, m - 1, d);
  };

  const isOverdue = (dueDateStr: string): boolean => {
      if (!dueDateStr) return false;
      const due = parseThaiDate(dueDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      return today > due;
  };

  const checkMembershipExpiry = (patron: Patron) => {
      if (!patron.expiryDate) return patron;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(patron.expiryDate);
      if (expiry < today && patron.status !== 'Expired') {
          const updatedPatron = { ...patron, status: 'Expired' as const };
          updatePatron(updatedPatron);
          return updatedPatron;
      }
      return patron;
  };

  const getDueDateForBook = (bookId: string): string => {
      for (const p of patrons) {
          const tx = p.history.find(t => t.barcode === bookId && t.status === 'Active');
          if (tx) return tx.dueDate;
      }
      return '-';
  };

  const handlePatronLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const found = patrons.find(p => p.id === patronId || p.name.includes(patronId));
    if (found) {
        const checkedPatron = checkMembershipExpiry(found);
        setCurrentPatronId(checkedPatron.id);
        setPatronId('');
    } else {
        alert('ไม่พบข้อมูลสมาชิก');
    }
  };

  const handleSelectPatronFromList = (patron: Patron) => {
      const checkedPatron = checkMembershipExpiry(patron);
      setCurrentPatronId(checkedPatron.id);
      setActiveTab('Service');
      setMode('Checkout');
  };

  const calculateLateFine = (dueDateStr: string): number => {
      if (!dueDateStr) return 0;
      const due = parseThaiDate(dueDateStr);
      const today = new Date();
      today.setHours(0,0,0,0);
      
      if (today > due) {
          const diffTime = Math.abs(today.getTime() - due.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          return diffDays * 5; // 5 THB per day
      }
      return 0;
  };

  const handleScanItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) return;

    if (mode === 'Checkout') {
        if (!currentPatron) {
            alert('กรุณาระบุสมาชิกก่อนยืมหนังสือ');
            return;
        }

        if (currentPatron.status === 'Expired') {
             alert(`ไม่สามารถยืมได้! \nสมาชิก "หมดอายุ" (Expired)`);
             setItemId('');
             return;
        }

        if (currentPatron.finesOwed > 0) {
            alert(`ไม่สามารถยืมได้! \nสมาชิกมีค่าปรับค้างชำระ ${currentPatron.finesOwed} บาท`);
            setItemId('');
            return;
        }

        const hasOverdueItems = currentPatron.history.some(t => t.status === 'Active' && isOverdue(t.dueDate));
        if (hasOverdueItems) {
             alert(`ไม่สามารถยืมได้! \nสมาชิกมีรายการหนังสือค้างส่ง (Overdue)`);
             setItemId('');
             return;
        }

        if (currentPatron.status !== 'Active') {
             alert(`ไม่สามารถยืมได้! \nสถานะสมาชิกคือ ${currentPatron.status}`);
             setItemId('');
             return;
        }

        const book = books.find(b => b.id === itemId || b.isbn === itemId);
        if (!book) {
            alert(`ไม่พบข้อมูลหนังสือ รหัส: ${itemId} ในระบบ`);
            setItemId('');
            return;
        }

        if (book.status !== 'Available') {
            if (book.status === 'Reserved') {
                 const isReservedByThisPatron = currentPatron.reservedItems?.some(b => b.id === book.id);
                 if (!isReservedByThisPatron) {
                    alert(`หนังสือ "${book.title}" ถูกจองโดยสมาชิกท่านอื่น`);
                    setItemId('');
                    return;
                 }
            } else {
                alert(`หนังสือ "${book.title}" ไม่ว่าง (สถานะ: ${book.status})`);
                setItemId('');
                return;
            }
        }
        
        if (currentPatron.reservedItems?.some(b => b.id === book.id)) {
             const updatedReserved = currentPatron.reservedItems.filter(b => b.id !== book.id);
             updatePatron({ ...currentPatron, reservedItems: updatedReserved });
        }

        let finalDueDateStr = '';
        if (useCustomDate && customDate) {
             const [y, m, d] = customDate.split('-');
             finalDueDateStr = `${d}/${m}/${parseInt(y) + 543}`;
        } else {
            const today = new Date();
            const dueDate = new Date();
            dueDate.setDate(today.getDate() + 7); 
            finalDueDateStr = dueDate.toLocaleDateString('th-TH');
        }
        
        const newTx: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            barcode: book.id, 
            bookTitle: book.title,
            patronName: currentPatron.name,
            checkoutDate: new Date().toLocaleDateString('th-TH'),
            dueDate: finalDueDateStr,
            status: 'Active'
        };

        addTransaction(currentPatron.id, newTx);
        updateBookStatus(book.id, 'Checked Out');
        
        setScannedItems([newTx, ...scannedItems]);
        setItemId('');

    } else {
        let foundPatron: Patron | undefined;
        let foundTx: Transaction | undefined;

        for (const p of patrons) {
            const tx = p.history.find(t => (t.barcode === itemId || t.bookTitle === itemId) && t.status === 'Active');
            if (tx) {
                foundPatron = p;
                foundTx = tx;
                break;
            }
        }

        if (foundPatron && foundTx) {
            const fine = calculateLateFine(foundTx.dueDate);
            if (fine > 0) {
                setCheckinAlert({
                    patron: foundPatron,
                    bookTitle: foundTx.bookTitle,
                    fine: fine,
                    transactionId: foundTx.id,
                    barcode: foundTx.barcode || itemId
                });
                setItemId('');
                return; 
            }
            completeReturnLogic(foundPatron.id, foundTx.id, 0, foundTx.barcode || itemId);
        } else {
            alert('ไม่พบข้อมูลการยืมของหนังสือเล่มนี้ หรือคืนแล้ว');
            setItemId('');
        }
    }
  };

  const handleRemoveItem = (tx: Transaction) => {
    if (!currentPatron) return;
    if (window.confirm('ยืนยันการลบรายการนี้? (Undo)')) {
        deleteTransaction(currentPatron.id, tx.id);
        if (tx.status === 'Active') {
            if (tx.barcode) updateBookStatus(tx.barcode, 'Available');
        } else if (tx.status === 'Returned') {
            if (tx.barcode) updateBookStatus(tx.barcode, 'Checked Out');
        }
        setScannedItems(scannedItems.filter(item => item.id !== tx.id));
    }
  };

  const completeReturnLogic = (pId: string, txId: string, fine: number, bookId: string) => {
      returnBook(pId, txId, fine);
      
      if (fine > 0) {
          const patron = patrons.find(p => p.id === pId);
          if (patron) {
              const newBalance = patron.finesOwed + fine;
              const fineTx: FineTransaction = {
                  id: 'F-' + Math.random().toString(36).substr(2, 9),
                  date: new Date().toLocaleDateString('th-TH'),
                  description: 'คืนหนังสือเกินกำหนด: ' + (books.find(b => b.id === bookId)?.title || bookId),
                  amount: fine,
                  type: 'Overdue',
                  balanceAfter: newBalance
              };
              updatePatron({
                  ...patron,
                  finesOwed: newBalance,
                  history: patron.history.map(h => h.id === txId ? { ...h, status: 'Returned', returnDate: new Date().toLocaleDateString('th-TH'), fineAmount: fine } : h),
                  fineHistory: [fineTx, ...(patron.fineHistory || [])]
              });
          }
      }

      let holdPatron: Patron | undefined;
      for(const p of patrons) {
          if (p.reservedItems?.some(b => b.id === bookId)) {
              holdPatron = p;
              break;
          }
      }

      if (holdPatron) {
          updateBookStatus(bookId, 'Reserved');
          setCheckinHoldAlert({
              bookId: bookId,
              bookTitle: books.find(b => b.id === bookId)?.title || 'Unknown',
              patron: holdPatron
          });
      } else {
          updateBookStatus(bookId, 'Available');
      }

      const p = patrons.find(p => p.id === pId); 
      const tx = p?.history.find(t => t.id === txId);
      
      setScannedItems([{
          id: txId,
          bookTitle: tx?.bookTitle || 'Unknown Book',
          patronName: p?.name || 'Unknown Patron',
          dueDate: tx?.dueDate || '',
          status: 'Returned',
          fineAmount: fine
      } as Transaction, ...scannedItems]);

      setItemId('');
      setCheckinAlert(null);
  };

  const handleRenew = (txId: string) => {
      if (!currentPatron) return;
      if (window.confirm('ยืนยันการยืมต่อ (Renew) อีก 7 วัน?')) {
          renewLoan(currentPatron.id, txId, 7);
      }
  };

  const handlePayFineFromAlert = () => {
      if (checkinAlert) {
          completeReturnLogic(checkinAlert.patron.id, checkinAlert.transactionId, checkinAlert.fine, checkinAlert.barcode);
          const updatedPatron = patrons.find(x => x.id === checkinAlert.patron.id);
          if (updatedPatron) {
              setCurrentPatronId(updatedPatron.id);
              setMode('Checkout'); 
              openFineModal('Pay'); 
          }
      }
  };

  const handleAddReservation = (e: React.FormEvent) => {
      e.preventDefault();
      if (!reservationInput || !currentPatron) return;
      const book = books.find(b => b.id === reservationInput || b.isbn === reservationInput);
      if (!book) { alert('ไม่พบหนังสือรหัสนี้ในระบบ'); return; }
      if (currentPatron.reservedItems?.some(b => b.id === book.id)) { alert('สมาชิกจองหนังสือเล่มนี้ไว้แล้ว'); setReservationInput(''); return; }
      const updatedPatron = { ...currentPatron, reservedItems: [...(currentPatron.reservedItems || []), book] };
      updatePatron(updatedPatron);
      setReservationInput('');
      alert(`จองหนังสือ "${book.title}" เรียบร้อยแล้ว`);
  };

  const handleCancelReservation = (bookId: string) => {
      if (!currentPatron) return;
      if (!window.confirm('ยืนยันการยกเลิกรายการจองนี้?')) return;
      const updatedReservedItems = currentPatron.reservedItems?.filter(b => b.id !== bookId) || [];
      const book = books.find(b => b.id === bookId);
      if (book && book.status === 'Reserved') updateBookStatus(bookId, 'Available');
      updatePatron({ ...currentPatron, reservedItems: updatedReservedItems });
  };

  const handleSwitchToHoldPatron = () => {
      if (checkinHoldAlert) {
          setCurrentPatronId(checkinHoldAlert.patron.id);
          setMode('Checkout');
          setItemId(checkinHoldAlert.bookId); 
          setCheckinHoldAlert(null);
      }
  };

  const openFineModal = (action: 'Pay' | 'Add') => {
      setFineAction(action);
      setFineAmountInput(action === 'Pay' ? (currentPatron?.finesOwed.toString() || '') : '');
      setShowFineModal(true);
  };

  const handleProcessFine = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentPatron) return;
      const amount = parseFloat(fineAmountInput);
      if (isNaN(amount) || amount <= 0) { alert('กรุณาระบุจำนวนเงินที่ถูกต้อง'); return; }

      let newFines = currentPatron.finesOwed;
      let fineTx: FineTransaction;

      if (fineAction === 'Pay') {
          newFines = Math.max(0, currentPatron.finesOwed - amount); 
          fineTx = { id: 'P-' + Math.random().toString(36).substr(2, 9), date: new Date().toLocaleDateString('th-TH'), description: 'ชำระค่าปรับ (Payment)', amount: -amount, type: 'Payment', balanceAfter: newFines };
      } else {
          newFines = currentPatron.finesOwed + amount;
          fineTx = { id: 'C-' + Math.random().toString(36).substr(2, 9), date: new Date().toLocaleDateString('th-TH'), description: 'เพิ่มค่าปรับ/ค่าธรรมเนียม (Manual Charge)', amount: amount, type: 'Adjustment', balanceAfter: newFines };
      }
      updatePatron({ ...currentPatron, finesOwed: newFines, fineHistory: [fineTx, ...(currentPatron.fineHistory || [])] });
      setShowFineModal(false);
  };

  const handleDeleteFine = (fineId: string) => {
      if (!currentPatron) return;
      if (!window.confirm('ยืนยันการลบรายการนี้?')) return;
      const transactionToDelete = currentPatron.fineHistory?.find(f => f.id === fineId);
      if (!transactionToDelete) return;
      let newBalance = currentPatron.finesOwed - transactionToDelete.amount;
      if (newBalance < 0) newBalance = 0; 
      updatePatron({ ...currentPatron, finesOwed: newBalance, fineHistory: currentPatron.fineHistory?.filter(f => f.id !== fineId) || [] });
  };

  const confirmRenewMembership = () => {
      if (!currentPatron) return;
      const currentExpiry = currentPatron.expiryDate ? new Date(currentPatron.expiryDate) : new Date();
      const today = new Date();
      const baseDate = currentExpiry < today ? today : currentExpiry;
      baseDate.setFullYear(baseDate.getFullYear() + renewYears);
      const newExpiry = baseDate.toISOString().split('T')[0];
      updatePatron({ ...currentPatron, expiryDate: newExpiry, status: 'Active' });
      setShowRenewModal(false);
      alert('ต่ออายุสมาชิกเรียบร้อยแล้ว');
  };

  const handleAddClick = () => {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setFormData({ id: '', name: '', type: 'นักเรียน', gender: 'Male', group: '', finesOwed: 0, status: 'Active', imageUrl: '', fineHistory: [], expiryDate: nextYear.toISOString().split('T')[0] });
      setIsEditing(false);
      setIsFormOpen(true);
  };

  const handleEditClick = (patron: Patron) => {
      setFormData(patron);
      setIsEditing(true);
      setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string | 'batch') => {
      if (id === 'batch') {
          if (!window.confirm(`ยืนยันการลบสมาชิกที่เลือกจำนวน ${selectedIds.length} รายการ?`)) return;
          selectedIds.forEach(pid => deletePatron(pid));
          setSelectedIds([]);
      } else {
          if (!window.confirm('ยืนยันการลบสมาชิกรายนี้?')) return; 
          deletePatron(id);
      }
  };

  const handleSavePatron = (e: React.FormEvent) => {
      e.preventDefault();
      if (isEditing && formData.id) {
           updatePatron(formData as Patron);
      } else {
          const newId = formData.id || Math.floor(10000 + Math.random() * 90000).toString();
          const newPatron: Patron = { ...(formData as Patron), id: newId, finesOwed: 0, history: [], fineHistory: [], reservedItems: [] };
          addPatron(newPatron);
      }
      setIsFormOpen(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => { setFormData({ ...formData, imageUrl: reader.result as string }); };
          reader.readAsDataURL(file);
      }
  };

  const handleImportCSV = () => alert('Import CSV not available yet');

  const loadPromoList = () => {
      if (!promoFilterGroup) { alert('กรุณาระบุกลุ่ม/ระดับชั้น'); return; }
      const filtered = patrons.filter(p => p.group.includes(promoFilterGroup)).map(p => ({ ...p, newGroup: p.group, newStatus: p.status || 'Active' }));
      if (filtered.length === 0) alert('ไม่พบสมาชิก');
      setPromoList(filtered);
  };

  const handlePromoChange = (index: number, field: 'newGroup' | 'newStatus', value: string) => {
      const newList = [...promoList];
      newList[index] = { ...newList[index], [field]: value };
      setPromoList(newList);
  };

  const handleSavePromotion = () => {
      if (window.confirm(`ยืนยันการบันทึกข้อมูล ${promoList.length} รายการ?`)) {
          const updates = promoList.map(p => ({ ...p, group: p.newGroup, status: p.newStatus as 'Active' | 'Suspended' | 'Expired' }));
          updatePatronsBatch(updates);
          setPromoList([]); setPromoFilterGroup(''); setSubTab('List'); 
      }
  };

  const handleMouseDown = (index: number) => { setIsDragging(true); setDragStartIndex(index); setDragEndIndex(index); };
  const handleMouseEnter = (index: number) => { if (isDragging) setDragEndIndex(index); };
  const handleMouseUp = () => {
      if (isDragging && dragStartIndex !== null && dragEndIndex !== null) {
          const valueToCopy = promoList[dragStartIndex].newGroup;
          const newList = [...promoList];
          for (let i = Math.min(dragStartIndex, dragEndIndex); i <= Math.max(dragStartIndex, dragEndIndex); i++) { newList[i].newGroup = valueToCopy; }
          setPromoList(newList);
      }
      setIsDragging(false); setDragStartIndex(null); setDragEndIndex(null);
  };

  useEffect(() => { window.addEventListener('mouseup', handleMouseUp); return () => window.removeEventListener('mouseup', handleMouseUp); }, [isDragging, dragStartIndex, dragEndIndex, promoList]);

  const toggleSelection = (id: string) => setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(sid => sid !== id) : [...selectedIds, id]);
  const toggleSelectAll = () => setSelectedIds(selectedIds.length === patrons.length ? [] : patrons.map(p => p.id));
  const getFilteredPatrons = () => patrons.filter(p => p.name.includes(patronSearch) || p.id.includes(patronSearch) || p.group.includes(patronSearch));
  const overdueItemsCount = currentPatron ? currentPatron.history.filter(h => h.status === 'Active' && isOverdue(h.dueDate)).length : 0;

  return (
    <div className="p-8 h-full flex flex-col relative">
        {checkinAlert && (
             <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-fadeIn">
                 <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-t-8 border-red-500">
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">คืนหนังสือเกินกำหนด!</h3>
                        <p className="text-slate-600 mb-6">สมาชิก: <span className="font-bold">{checkinAlert.patron.name}</span><br/>รายการ: {checkinAlert.bookTitle}<br/><span className="text-red-500 text-sm font-medium mt-2 block">มีค่าปรับค้างชำระจากการคืนล่าช้า</span></p>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6"><p className="text-sm text-red-800 uppercase font-bold tracking-wider">ยอดค่าปรับ (Fine Amount)</p><p className="text-4xl font-bold text-red-600">฿{checkinAlert.fine.toFixed(2)}</p></div>
                        <div className="grid grid-cols-2 gap-3"><button onClick={() => { completeReturnLogic(checkinAlert.patron.id, checkinAlert.transactionId, checkinAlert.fine, checkinAlert.barcode); }} className="px-4 py-3 border border-slate-300 rounded-lg text-slate-600 font-bold hover:bg-slate-50">ไว้ชำระทีหลัง</button><button onClick={handlePayFineFromAlert} className="px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-lg shadow-red-200 flex items-center justify-center gap-2"><DollarSign className="w-5 h-5" /> ชำระค่าปรับทันที</button></div>
                    </div>
                 </div>
             </div>
        )}
        
        {isFormOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                 <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">
                    <div className="bg-primary p-4 flex justify-between items-center sticky top-0 z-10"><h3 className="text-white font-bold flex items-center gap-2">{isEditing ? <Edit className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}{isEditing ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่'}</h3><button onClick={() => setIsFormOpen(false)} className="text-slate-300 hover:text-white"><X className="w-5 h-5" /></button></div>
                    <form onSubmit={handleSavePatron} className="p-6 space-y-4">
                        <div className="flex flex-col items-center mb-4"><div className="relative w-24 h-24 bg-slate-100 rounded-full overflow-hidden mb-3 border-2 border-slate-200 shadow-inner group cursor-pointer" onClick={() => imageUploadRef.current?.click()}>{formData.imageUrl ? (<img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex flex-col items-center justify-center text-slate-400"><Camera className="w-8 h-8 mb-1" /><span className="text-[10px]">เลือกรูป</span></div>)}<div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Edit className="w-6 h-6 text-white" /></div></div><input type="file" ref={imageUploadRef} className="hidden" accept="image/*" onChange={handleImageChange} /></div>
                        <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">รหัสสมาชิก</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} disabled={isEditing} placeholder="ระบบสร้างอัตโนมัติ" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">ประเภท</label><select className="w-full border rounded-lg px-3 py-2" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="นักเรียน">นักเรียน</option><option value="ครูอาจารย์">ครูอาจารย์</option><option value="บุคลากร">บุคลากร</option></select></div></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label><input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">กลุ่ม/ชั้นเรียน</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={formData.group || ''} onChange={e => setFormData({...formData, group: e.target.value})} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">สถานะ</label><select className="w-full border rounded-lg px-3 py-2" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="Active">ปกติ</option><option value="Suspended">ระงับ</option><option value="Expired">หมดอายุ</option></select></div></div>
                        <div className="pt-4 flex gap-3 justify-end border-t mt-4"><button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg">ยกเลิก</button><button type="submit" className="px-4 py-2 text-white bg-accent rounded-lg flex items-center gap-2"><Save className="w-4 h-4" /> บันทึกข้อมูล</button></div>
                    </form>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">บริการยืม-คืน (Circulation)</h1>
                <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
                    <button onClick={() => setActiveTab('Service')} className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'Service' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>ยืม-คืน</button>
                    <button onClick={() => setActiveTab('Patrons')} className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'Patrons' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>จัดการสมาชิก</button>
                </div>
            </div>
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-medium border border-green-200"><Wifi className="w-3 h-3" /> ระบบออนไลน์</div>
        </div>

        {activeTab === 'Service' ? (
            <>
                <div className="flex justify-center mb-8">
                    <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm inline-flex">
                        <button onClick={() => setMode('Checkout')} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'Checkout' ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>ยืมหนังสือ (Check Out)</button>
                        <button onClick={() => setMode('Checkin')} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'Checkin' ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>คืนหนังสือ (Check In)</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
                    <div className="lg:col-span-1 space-y-6">
                        {mode === 'Checkout' && (
                            <div className={`bg-white p-6 rounded-xl border shadow-sm transition-all ${currentPatron ? ((currentPatron.finesOwed > 0 || overdueItemsCount > 0 || currentPatron.status === 'Expired') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50') : 'border-slate-200'}`}>
                                <h2 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><User className="w-4 h-4" /> ข้อมูลสมาชิก</h2>
                                {!currentPatron ? (
                                    <form onSubmit={handlePatronLookup}><div className="relative"><input type="text" value={patronId} onChange={(e) => setPatronId(e.target.value)} className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:outline-none" placeholder="ค้นหาชื่อ หรือ ID สมาชิก..." autoFocus /><button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-md text-slate-500 hover:text-accent"><Search className="w-4 h-4" /></button></div></form>
                                ) : (
                                    <div className="animate-fadeIn">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 bg-slate-200">{currentPatron.imageUrl ? (<img src={currentPatron.imageUrl} alt={currentPatron.name} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon className="w-8 h-8" /></div>)}</div>
                                            <div className="flex-1 min-w-0"><h3 className="text-xl font-bold text-slate-800 truncate">{currentPatron.name}</h3><p className="text-slate-600">{currentPatron.type} ({currentPatron.group})</p><p className="text-xs text-slate-400">ID: {currentPatron.id}</p></div>
                                            <button onClick={() => { setCurrentPatronId(null); setPatronId(''); setScannedItems([]); }} className="text-xs text-slate-500 hover:underline border border-slate-300 px-2 py-1 rounded bg-white">เปลี่ยน</button>
                                        </div>
                                        {currentPatron.status === 'Expired' && (<div className="mt-4 bg-red-100 text-red-800 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-200"><UserCheck className="w-5 h-5 shrink-0" /><div className="flex-1"><span className="font-bold">สมาชิกหมดอายุ</span><p className="text-xs mt-1">หมดอายุเมื่อ {currentPatron.expiryDate}</p><button onClick={() => setShowRenewModal(true)} className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700">ต่ออายุสมาชิก</button></div></div>)}
                                        {overdueItemsCount > 0 && (<div className="mt-4 bg-red-100 text-red-800 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-200"><Clock className="w-5 h-5 shrink-0" /><div><span className="font-bold">ถูกระงับ: มีหนังสือค้างส่ง</span><p className="text-xs mt-1">เกินกำหนด {overdueItemsCount} เล่ม</p></div></div>)}
                                        {currentPatron.finesOwed > 0 && (<div className="mt-2 bg-orange-100 text-orange-800 p-3 rounded-lg text-sm flex items-start gap-2 border border-orange-200"><DollarSign className="w-5 h-5 shrink-0" /><div><span className="font-bold">มีค่าปรับค้างชำระ</span><p className="text-xs mt-1">ยอดรวม {currentPatron.finesOwed} บาท</p></div></div>)}
                                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                            <div className="bg-white p-2 rounded border border-slate-200"><span className="block text-slate-400 text-xs">สถานภาพ</span><span className={`font-semibold ${currentPatron.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>{currentPatron.status || 'ปกติ'}</span></div>
                                            <div className="bg-white p-2 rounded border border-slate-200"><span className="block text-slate-400 text-xs">ค่าปรับค้าง</span><span className={`font-semibold ${currentPatron.finesOwed > 0 ? 'text-red-600' : 'text-slate-800'}`}>฿{currentPatron.finesOwed.toFixed(2)}</span></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2"><button onClick={() => openFineModal('Pay')} className="bg-green-600 text-white px-2 py-1.5 rounded text-xs font-medium hover:bg-green-700 flex items-center justify-center gap-1"><DollarSign className="w-3 h-3" /> ชำระค่าปรับ</button><button onClick={() => openFineModal('Add')} className="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-1.5 rounded text-xs font-medium hover:bg-slate-200 flex items-center justify-center gap-1"><PlusCircle className="w-3 h-3" /> เพิ่มค่าปรับ</button></div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4" /> สแกนหนังสือ ({mode === 'Checkout' ? 'ยืม' : 'คืน'})</h2>
                            {mode === 'Checkout' && (<div className="mb-3"><label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none mb-2"><input type="checkbox" checked={useCustomDate} onChange={e => setUseCustomDate(e.target.checked)} className="rounded text-accent focus:ring-accent" />กำหนดวันส่งคืนพิเศษ</label>{useCustomDate && (<div className="flex items-center gap-2 animate-fadeIn"><Calendar className="w-4 h-4 text-slate-500" /><input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-accent" /></div>)}</div>)}
                            <form onSubmit={handleScanItem}><div className="relative"><input type="text" value={itemId} onChange={(e) => setItemId(e.target.value)} autoFocus disabled={mode === 'Checkout' && (!currentPatron || (currentPatron && (currentPatron.finesOwed > 0 || overdueItemsCount > 0 || currentPatron.status === 'Expired')))} className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed" placeholder="สแกนบาร์โค้ดหนังสือ..." /><button type="submit" disabled={mode === 'Checkout' && !currentPatron} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-md text-slate-500 hover:text-accent"><ArrowRightLeft className="w-4 h-4" /></button></div></form>
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[600px]">
                        {mode === 'Checkout' && currentPatron ? (
                            <div className="h-full flex flex-col">
                                <div className="bg-slate-50 p-1 border-b border-slate-200 flex">
                                    <button className={`flex-1 py-2 text-sm font-medium ${rightPanelTab === 'Active' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`} onClick={() => setRightPanelTab('Active')}>กำลังยืม (Active)</button>
                                    <button className={`flex-1 py-2 text-sm font-medium ${rightPanelTab === 'History' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`} onClick={() => setRightPanelTab('History')}>ประวัติยืม-คืน</button>
                                    <button className={`flex-1 py-2 text-sm font-medium ${rightPanelTab === 'Fines' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`} onClick={() => setRightPanelTab('Fines')}>ประวัติค่าปรับ</button>
                                </div>
                                {rightPanelTab === 'Active' && (
                                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                        <div><h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" /> รายการที่กำลังยืมอยู่</h3>
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full text-left text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="p-3">Barcode</th><th className="p-3">ชื่อหนังสือ</th><th className="p-3">กำหนดส่ง</th><th className="p-3">ค่าปรับ</th><th className="p-3 text-right">จัดการ</th></tr></thead><tbody className="divide-y divide-slate-100">{currentPatron.history.filter(h => h.status === 'Active').length === 0 ? (<tr><td colSpan={5} className="p-4 text-center text-slate-400">ไม่มียืมหนังสืออยู่ขณะนี้</td></tr>) : (currentPatron.history.filter(h => h.status === 'Active').map(h => { const lateFine = calculateLateFine(h.dueDate); const overdue = isOverdue(h.dueDate); return (<tr key={h.id} className={`hover:bg-slate-50 ${overdue ? 'bg-red-50/30' : ''}`}><td className="p-3 font-mono text-slate-500">{h.barcode || '-'}</td><td className="p-3"><div className="font-medium">{h.bookTitle}</div><div className="text-xs text-slate-400">{h.checkoutDate}</div></td><td className="p-3"><div className={`font-medium ${overdue ? 'text-red-600' : 'text-slate-600'}`}>{h.dueDate}</div>{overdue && <span className="text-xs text-red-500 font-bold">เกินกำหนด</span>}</td><td className="p-3">{lateFine > 0 ? <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">฿{lateFine}</span> : <span className="text-slate-400">-</span>}</td><td className="p-3 text-right"><button onClick={() => handleRenew(h.id)} className="px-3 py-1 border border-blue-200 text-blue-600 rounded hover:bg-blue-50 text-xs font-medium flex items-center gap-1 ml-auto"><RefreshCw className="w-3 h-3" /> ยืมต่อ</button></td></tr>); }))}</tbody></table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {rightPanelTab === 'History' && (<div className="flex-1 overflow-y-auto p-0"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 shadow-sm"><tr><th className="p-3 pl-4">รายการหนังสือ</th><th className="p-3">ยืมเมื่อ</th><th className="p-3">คืนเมื่อ</th><th className="p-3">สถานะ</th><th className="p-3 text-right pr-4">ค่าปรับ</th></tr></thead><tbody className="divide-y">{currentPatron.history.map((h) => (<tr key={h.id} className="hover:bg-slate-50"><td className="p-3 pl-4 font-medium text-slate-700">{h.bookTitle}</td><td className="p-3 text-slate-500">{h.dueDate}</td><td className="p-3 text-slate-600">{h.returnDate || '-'}</td><td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${h.status === 'Returned' ? 'bg-green-100 text-green-700' : h.status === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{h.status}</span></td><td className="p-3 text-right pr-4 font-mono text-red-500">{h.fineAmount ? `฿${h.fineAmount}` : '-'}</td></tr>))}</tbody></table></div>)}
                                {rightPanelTab === 'Fines' && (<div className="flex-1 flex flex-col"><div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center"><h3 className="font-bold text-slate-700 flex items-center gap-2"><FileClock className="w-4 h-4"/> ประวัติธุรกรรมค่าปรับ</h3><div className="bg-white border px-3 py-1 rounded-lg text-sm"><span className="text-slate-500 mr-2">ยอดคงเหลือสุทธิ:</span><span className={`font-bold ${currentPatron.finesOwed > 0 ? 'text-red-600' : 'text-green-600'}`}>฿{currentPatron.finesOwed.toFixed(2)}</span></div></div><div className="flex-1 overflow-y-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 shadow-sm"><tr><th className="p-3 pl-4">วันที่</th><th className="p-3">รายการ</th><th className="p-3 text-right">จำนวนเงิน</th><th className="p-3 text-right pr-4">คงเหลือ</th><th className="p-3 w-10"></th></tr></thead><tbody className="divide-y">{(!currentPatron.fineHistory || currentPatron.fineHistory.length === 0) ? (<tr><td colSpan={5} className="p-6 text-center text-slate-400">ไม่พบประวัติค่าปรับ</td></tr>) : (currentPatron.fineHistory.map((f) => (<tr key={f.id} className="hover:bg-slate-50 group"><td className="p-3 pl-4 text-slate-500">{f.date}</td><td className="p-3"><span className="font-medium text-slate-700">{f.description}</span><span className="text-xs text-slate-400 block">{f.type}</span></td><td className={`p-3 text-right font-bold font-mono ${f.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>{f.amount > 0 ? `+${f.amount.toFixed(2)}` : f.amount.toFixed(2)}</td><td className="p-3 text-right pr-4 font-mono text-slate-600">{f.balanceAfter.toFixed(2)}</td><td className="p-3 text-center"><button onClick={() => handleDeleteFine(f.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button></td></tr>)))}</tbody></table></div></div>)}
                            </div>
                        ) : (
                            <>
                                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center"><h3 className="font-bold text-slate-700">รายการปัจจุบัน ({mode === 'Checkout' ? 'กำลังยืม' : 'กำลังคืน'})</h3>{scannedItems.length > 0 && (<button onClick={() => setScannedItems([])} className="text-xs text-red-500 hover:underline">ล้างรายการ</button>)}</div>
                                <div className="flex-1 overflow-y-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-slate-600 sticky top-0"><tr><th className="p-3 pl-4">รายการ</th><th className="p-3">สมาชิก</th><th className="p-3">กำหนดส่ง</th><th className="p-3">สถานะ</th><th className="p-3 text-right pr-4"></th></tr></thead><tbody className="divide-y">{scannedItems.map((item) => (<tr key={item.id} className="hover:bg-slate-50 group"><td className="p-3 pl-4 font-medium">{item.bookTitle}</td><td className="p-3 text-slate-600">{item.patronName}</td><td className="p-3 text-slate-500">{item.dueDate}</td><td className="p-3"><span className={`text-xs px-2 py-1 rounded-full flex items-center w-fit gap-1 ${item.status === 'Returned' ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'}`}><Check className="w-3 h-3" /> {item.status === 'Returned' ? 'คืนสำเร็จ' : 'ยืมสำเร็จ'}</span></td><td className="p-3 text-right pr-4"><button onClick={() => handleRemoveItem(item)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button></td></tr>))}{scannedItems.length === 0 && (<tr><td colSpan={5} className="p-8 text-center text-slate-400"><div className="flex flex-col items-center"><div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2"><ArrowRightLeft className="w-6 h-6 text-slate-300" /></div><p>ยังไม่มีรายการที่สแกน</p></div></td></tr>)}</tbody></table></div>
                            </>
                        )}
                    </div>
                </div>
            </>
        ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">
                 <div className="flex justify-between items-center mb-6"><div className="flex gap-2"><button onClick={() => setSubTab('List')} className={`px-4 py-2 text-sm font-medium rounded-lg border ${subTab === 'List' ? 'bg-slate-50 border-slate-300 text-slate-800' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>รายชื่อสมาชิก (Member List)</button><button onClick={() => setSubTab('Promotion')} className={`px-4 py-2 text-sm font-medium rounded-lg border ${subTab === 'Promotion' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}><ChevronsUp className="w-4 h-4 inline mr-1"/> ปรับสถานะ/ระดับชั้น</button></div><div className="flex gap-2"><label className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer shadow-sm"><Upload className="w-4 h-4" /> นำเข้า CSV<input type="file" className="hidden" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} /></label><button onClick={handleAddClick} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600 shadow-sm flex items-center gap-2"><UserPlus className="w-4 h-4" /> เพิ่มสมาชิก</button></div></div>
                {subTab === 'List' ? (
                    <>
                        <div className="flex gap-4 mb-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="text" placeholder="ค้นหาชื่อ, รหัส, หรือกลุ่ม..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none" value={patronSearch} onChange={(e) => setPatronSearch(e.target.value)} /></div><button className="px-3 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"><Filter className="w-4 h-4" /></button>{selectedIds.length > 0 && (<button onClick={() => handleDeleteClick('batch')} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-2"><Trash2 className="w-4 h-4" /> ลบรายการที่เลือก ({selectedIds.length})</button>)}</div>
                        <div className="flex-1 overflow-auto border rounded-lg"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600 font-medium sticky top-0 z-10"><tr><th className="px-4 py-3 w-10"><input type="checkbox" checked={selectedIds.length === patrons.length && patrons.length > 0} onChange={toggleSelectAll} /></th><th className="px-4 py-3">รหัส</th><th className="px-4 py-3">ชื่อ-นามสกุล</th><th className="px-4 py-3">กลุ่ม/ชั้น</th><th className="px-4 py-3">ประเภท</th><th className="px-4 py-3">ค่าปรับค้าง</th><th className="px-4 py-3">สถานะ</th><th className="px-4 py-3 text-right">จัดการ</th></tr></thead><tbody className="divide-y divide-slate-100">{getFilteredPatrons().map(p => (<tr key={p.id} className="hover:bg-slate-50 group"><td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelection(p.id)} /></td><td className="px-4 py-3 font-mono text-slate-500">{p.id}</td><td className="px-4 py-3 font-medium text-slate-800 cursor-pointer hover:text-accent" onClick={() => handleSelectPatronFromList(p)}><div className="flex items-center gap-2">{p.imageUrl && <img src={p.imageUrl} className="w-6 h-6 rounded-full object-cover" alt="" />}{p.name}</div></td><td className="px-4 py-3 text-slate-600">{p.group}</td><td className="px-4 py-3 text-slate-500">{p.type}</td><td className="px-4 py-3 text-red-600 font-medium">{p.finesOwed > 0 ? `฿${p.finesOwed}` : '-'}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${p.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span></td><td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEditClick(p)} className="p-1 text-slate-400 hover:text-accent"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteClick(p.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div></td></tr>))}</tbody></table></div>
                    </>
                ) : (
                     <div className="flex-1 flex flex-col"><div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"><h3 className="text-blue-800 font-bold mb-2 text-sm flex items-center gap-2"><ChevronsUp className="w-4 h-4"/> เลื่อนระดับชั้นแบบกลุ่ม</h3><div className="flex gap-4 items-end"><div><label className="block text-xs text-blue-600 mb-1">เลือกระดับชั้นเดิม</label><input type="text" placeholder="เช่น ม.1/1" className="border border-blue-300 rounded px-3 py-1.5 text-sm w-48" value={promoFilterGroup} onChange={(e) => setPromoFilterGroup(e.target.value)} /></div><button onClick={loadPromoList} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 shadow-sm">แสดงรายการ</button>{promoList.length > 0 && (<button onClick={handleSavePromotion} className="ml-auto bg-green-600 text-white px-6 py-1.5 rounded text-sm hover:bg-green-700 shadow-sm flex items-center gap-2"><Save className="w-4 h-4" /> บันทึกการเปลี่ยนแปลง</button>)}</div></div>{promoList.length > 0 && (<div className="flex-1 overflow-auto border rounded-lg select-none"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-slate-600 font-medium"><tr><th className="px-4 py-3">รหัส</th><th className="px-4 py-3">ชื่อ-นามสกุล</th><th className="px-4 py-3 text-slate-400">ชั้นเดิม</th><th className="px-4 py-3 w-48 bg-blue-50 text-blue-700 border-b-2 border-blue-200">ชั้นใหม่ (ลากมุมเพื่อ Copy)</th><th className="px-4 py-3">สถานะใหม่</th></tr></thead><tbody className="divide-y divide-slate-100">{promoList.map((p, idx) => (<tr key={p.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-mono text-slate-500">{p.id}</td><td className="px-4 py-3">{p.name}</td><td className="px-4 py-3 text-slate-400">{p.group}</td><td className="px-4 py-1 relative p-0"><div className="relative w-full h-full"><input type="text" className="w-full h-full px-4 py-3 border-2 border-transparent focus:border-blue-400 outline-none bg-transparent" value={p.newGroup} onChange={(e) => handlePromoChange(idx, 'newGroup', e.target.value)} /><div className="absolute bottom-1 right-1 w-3 h-3 bg-blue-600 cursor-crosshair hover:scale-125 transition-transform rounded-sm z-10" onMouseDown={() => handleMouseDown(idx)} /></div></td><td className="px-4 py-1"><select className="w-full bg-transparent outline-none" value={p.newStatus} onChange={(e) => handlePromoChange(idx, 'newStatus', e.target.value)}><option value="Active">ปกติ</option><option value="Expired">จบการศึกษา</option><option value="Suspended">ระงับ</option></select></td></tr>))}</tbody></table></div>)}</div>
                )}
            </div>
        )}
    </div>
  );
};

export default Circulation;