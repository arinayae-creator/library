
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Book, Patron, Transaction, Subject, FineTransaction, CirculationSession, CatalogingSession, MarcTagDefinition, PublicPage, AuthorityRecord, Worksheet, Item, AcquisitionRequest } from '../types';
import { api } from '../services/api';

// Declare Swal type
declare const Swal: any;

interface LibraryContextType {
  books: Book[];
  patrons: Patron[];
  subjects: Subject[];
  acquisitionRequests: AcquisitionRequest[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addBook: (book: Book) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  updateBookStatus: (bookId: string, status: Book['status']) => Promise<void>;
  updateBookDetails: (book: Book) => Promise<void>;
  addItemsToBook: (bookId: string, items: Item[]) => Promise<void>;
  mergeBooks: (targetId: string, sourceId: string) => Promise<void>;
  addPatron: (patron: Patron) => Promise<void>;
  updatePatron: (patron: Patron) => Promise<void>;
  updatePatronsBatch: (updates: Patron[]) => Promise<void>;
  deletePatron: (patronId: string) => Promise<void>;
  addTransaction: (patronId: string, transaction: Transaction) => Promise<void>;
  deleteTransaction: (patronId: string, transactionId: string) => Promise<void>;
  returnBook: (patronId: string, transactionId: string, fine: number) => Promise<void>;
  renewLoan: (patronId: string, transactionId: string, extraDays: number) => Promise<void>;
  addSubject: (subject: Subject) => Promise<void>;
  
  // Acquisitions
  addAcquisition: (req: AcquisitionRequest) => Promise<void>;
  updateAcquisition: (req: AcquisitionRequest) => Promise<void>;
  deleteAcquisition: (id: string) => Promise<void>;

  translateStatus: (status: string) => string;
  // Session Persistence
  circulationSession: CirculationSession;
  updateCirculationSession: (session: Partial<CirculationSession>) => void;
  catalogingSession: CatalogingSession;
  updateCatalogingSession: (session: Partial<CatalogingSession>) => void;
  
  // Configurable Lists
  resourceTypes: string[];
  locations: string[];
  patronTypes: string[];
  patronGroups: string[];
  marcTags: MarcTagDefinition[];
  publicPages: PublicPage[];
  authorityRecords: AuthorityRecord[];
  
  // Worksheets
  worksheets: Worksheet[];
  addWorksheet: (ws: Worksheet) => void;
  updateWorksheet: (ws: Worksheet) => void;
  deleteWorksheet: (id: string) => void;
  toggleFavoriteWorksheet: (id: string) => void;

  // Config Methods
  addResourceType: (val: string) => void;
  updateResourceType: (oldVal: string, newVal: string) => void;
  deleteResourceType: (val: string) => void;
  
  addLocation: (val: string) => void;
  updateLocation: (oldVal: string, newVal: string) => void;
  deleteLocation: (val: string) => void;
  
  addPatronType: (val: string) => void;
  updatePatronType: (oldVal: string, newVal: string) => void;
  deletePatronType: (val: string) => void;
  
  addPatronGroup: (val: string) => void;
  updatePatronGroup: (oldVal: string, newVal: string) => void;
  deletePatronGroup: (val: string) => void;
  
  addMarcTag: (tag: MarcTagDefinition) => Promise<void>;
  deleteMarcTag: (tag: string) => Promise<void>;
  updateMarcTag: (oldTag: string, newTag: MarcTagDefinition) => Promise<void>;

  addPublicPage: (page: PublicPage) => void;
  updatePublicPage: (page: PublicPage) => void;
  deletePublicPage: (id: string) => void;

  addAuthorityRecord: (rec: AuthorityRecord) => void;
  updateAuthorityRecord: (rec: AuthorityRecord) => void;
  deleteAuthorityRecord: (id: string) => void;
  
  generateCutter: (name: string) => string;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

// Initial Fallback Data
const initialMarcTags: MarcTagDefinition[] = [
    { tag: '020', sub: '$a', desc: 'ISBN' },
    { tag: '100', sub: '$a', desc: 'Main Entry - Personal Name' },
    { tag: '245', sub: '$a', desc: 'Title' },
    { tag: '260', sub: '$a', desc: 'Publication' },
    { tag: '650', sub: '$a', desc: 'Subject' },
];

// Safe JSON parser helper
const safeJsonParse = (data: any, fallback: any) => {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) return data; // Already an object (not array)
    if (Array.isArray(data) && Array.isArray(fallback)) return data; // Already an array
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            return parsed;
        } catch (e) {
            return fallback;
        }
    }
    return fallback;
};

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [patrons, setPatrons] = useState<Patron[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [acquisitionRequests, setAcquisitionRequests] = useState<AcquisitionRequest[]>([]);

  // Config States
  const [resourceTypes, setResourceTypes] = useState<string[]>(['Book', 'Journal', 'Digital', 'CD/DVD', 'Equipment']);
  const [locations, setLocations] = useState<string[]>(['ชั้น 1 - ทั่วไป', 'ชั้น 2 - อ้างอิง']);
  const [patronTypes, setPatronTypes] = useState<string[]>(['นักเรียน', 'ครูอาจารย์', 'บุคลากร']);
  const [patronGroups, setPatronGroups] = useState<string[]>(['ม.1/1', 'ม.1/2', 'ม.2/1', 'ม.2/2', 'ม.3/1']);
  const [marcTags, setMarcTags] = useState<MarcTagDefinition[]>(initialMarcTags);
  const [publicPages, setPublicPages] = useState<PublicPage[]>([]);
  const [authorityRecords, setAuthorityRecords] = useState<AuthorityRecord[]>([]);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([
    {
      id: 'default',
      name: 'Default (Books)',
      type: 'Bibliographic',
      isFavorite: true,
      fields: [
          { id: '1', tag: '020', ind1: '', ind2: '', sub: '$a', desc: 'ISBN', required: false },
          { id: '2', tag: '100', ind1: '1', ind2: '#', sub: '$a', desc: 'Author', required: true },
          { id: '3', tag: '245', ind1: '1', ind2: '0', sub: '$a', desc: 'Title', required: true },
          { id: '4', tag: '260', ind1: '#', ind2: '#', sub: '$a', desc: 'Publisher', required: false },
          { id: '5', tag: '300', ind1: '#', ind2: '#', sub: '$a', desc: 'Physical Description', required: false },
          { id: '6', tag: '650', ind1: '#', ind2: '#', sub: '$a', desc: 'Subject', required: false },
      ]
    }
  ]);

  // Session State
  const [circulationSession, setCirculationSession] = useState<CirculationSession>({
    mode: 'Checkout',
    activeTab: 'Service',
    subTab: 'List',
    currentPatronId: null,
    scannedItems: [],
    itemIdInput: '',
    patronIdInput: '',
    rightPanelTab: 'Active',
    isPatronFormOpen: false,
    patronFormData: {},
    isPatronEditMode: false
  });

  const [catalogingSession, setCatalogingSession] = useState<CatalogingSession>({
    activeTab: 'Search',
    viewMode: 'List',
    detailTab: 'Edit',
    searchQuery: '',
    advSearch: { title: '', author: '', isbn: '', callNo: '' },
    searchBarcode: '',
    searchType: 'Basic',
    searchResultsIds: [],
    selectedBookId: null,
    bibFormData: {},
    isEditMode: false,
    formId: '',
    holdingsMode: 'Auto'
  });

  // --- API INTEGRATION ---
  const refreshData = async () => {
      setIsLoading(true);
      const data = await api.loadAllData();
      if (data) {
        if (data.books) {
            setBooks(data.books.map((b: any) => ({
                ...b,
                id: b.id ? String(b.id) : '',
                items: safeJsonParse(b.items, []),
                reservationHistory: safeJsonParse(b.reservationHistory, []),
                marcData: safeJsonParse(b.marcData, {}) // Correctly parse marcData
            })));
        }
        if (data.patrons) {
            setPatrons(data.patrons.map((p: any) => ({
                ...p,
                id: p.id ? String(p.id) : '',
                history: safeJsonParse(p.history, []),
                fineHistory: safeJsonParse(p.fineHistory, []),
                reservedItems: safeJsonParse(p.reservedItems, []),
                finesOwed: Number(p.finesOwed) || 0
            })));
        }
        if (data.subjects) setSubjects(data.subjects);
        if (data.acquisitionRequests) setAcquisitionRequests(data.acquisitionRequests);
        if (data.marcTags) setMarcTags(data.marcTags);
      }
      setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Helper for SweetAlert wrapper
  const performAction = async (actionName: string, payload: any, stateUpdate: () => void, successMsg = 'บันทึกสำเร็จ') => {
      // Optimistic UI update
      stateUpdate();
      
      // Background sync (Non-blocking but shows status)
      const toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
      });
      
      api.sendAction(actionName, payload).then(success => {
          if(!success) {
              Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกลง Google Sheets ได้', 'error');
          } 
      });
  };

  const updateCirculationSession = (session: Partial<CirculationSession>) => setCirculationSession(prev => ({ ...prev, ...session }));
  const updateCatalogingSession = (session: Partial<CatalogingSession>) => setCatalogingSession(prev => ({ ...prev, ...session }));

  const addBook = async (book: Book) => {
    await performAction('addBook', { book }, () => setBooks(prev => [...prev, book]));
  };

  const deleteBook = async (bookId: string) => {
    await performAction('deleteBook', { bookId }, () => setBooks(prev => prev.filter(b => b.id !== bookId)));
  };

  const updateBookStatus = async (bookId: string, status: Book['status']) => {
    await performAction('updateBookStatus', { bookId, status }, () => 
        setBooks(prev => prev.map(b => b.id === bookId ? { ...b, status } : b))
    );
  };

  const updateBookDetails = async (updatedBook: Book) => {
    await performAction('updateBookDetails', { book: updatedBook }, () => 
        setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b))
    );
  };

  const addItemsToBook = async (bookId: string, items: Item[]) => {
      let updatedBook: Book | undefined;
      setBooks(prev => {
          const nextState = prev.map(b => {
              if (b.id === bookId) {
                  updatedBook = { ...b, items: [...(b.items || []), ...items] };
                  return updatedBook;
              }
              return b;
          });
          // Note: State update must happen inside performAction or here. 
          // Since we need the updatedBook obj, we do it slightly differently or call api direct
          return nextState;
      });
      if (updatedBook) {
          api.sendAction('updateBookDetails', { book: updatedBook });
      }
  };

  const mergeBooks = async (targetId: string, sourceId: string) => {
      setBooks(prev => {
          const target = prev.find(b => b.id === targetId);
          const source = prev.find(b => b.id === sourceId);
          if (!target || !source) return prev;
          
          const mergedItems = [...(target.items || []), ...(source.items || [])];
          const updatedTarget = { ...target, items: mergedItems };
          
          api.sendAction('updateBookDetails', { book: updatedTarget });
          api.sendAction('deleteBook', { bookId: sourceId });

          return prev.map(b => b.id === targetId ? updatedTarget : b).filter(b => b.id !== sourceId);
      });
  };

  const addPatron = async (patron: Patron) => {
    await performAction('addPatron', { patron }, () => setPatrons(prev => [...prev, patron]));
  };

  const updatePatron = async (patron: Patron) => {
    await performAction('updatePatron', { patron }, () => setPatrons(prev => prev.map(p => p.id === patron.id ? patron : p)));
  };

  const updatePatronsBatch = async (updates: Patron[]) => {
    await performAction('updatePatronsBatch', { patrons: updates }, () => {
        setPatrons(prev => {
            const updateMap = new Map(updates.map(p => [p.id, p]));
            return prev.map(p => updateMap.get(p.id) || p);
        });
    });
  };

  const deletePatron = async (patronId: string) => {
    await performAction('deletePatron', { patronId }, () => setPatrons(prev => prev.filter(p => p.id !== patronId)));
  };

  const addTransaction = async (patronId: string, transaction: Transaction) => {
      let updatedPatron: Patron | undefined;
      setPatrons(prev => prev.map(p => {
          if (p.id === patronId) {
              updatedPatron = { ...p, history: [transaction, ...(p.history || [])] };
              return updatedPatron;
          }
          return p;
      }));
      if (updatedPatron) api.sendAction('updatePatron', { patron: updatedPatron });
  };

  const deleteTransaction = async (patronId: string, transactionId: string) => {
    let updatedPatron: Patron | undefined;
    setPatrons(prev => prev.map(p => {
        if (p.id === patronId) {
            updatedPatron = { ...p, history: (p.history || []).filter(t => t.id !== transactionId) };
            return updatedPatron;
        }
        return p;
    }));
    // Also update book status logic needs to be handled by caller or here
    // For simplicity, syncing patron is key
    if (updatedPatron) api.sendAction('updatePatron', { patron: updatedPatron });
  };

  const returnBook = async (patronId: string, transactionId: string, fine: number) => {
      let updatedPatron: Patron | undefined;
      setPatrons(prev => prev.map(p => {
          if (p.id === patronId) {
              const updatedHistory = (p.history || []).map(h => {
                  if (h.id === transactionId) {
                      return { 
                          ...h, 
                          status: 'Returned' as const, 
                          returnDate: new Date().toLocaleDateString('th-TH'),
                          fineAmount: fine 
                      };
                  }
                  return h;
              });
              updatedPatron = { ...p, history: updatedHistory, finesOwed: (p.finesOwed || 0) + fine };
              return updatedPatron;
          }
          return p;
      }));
      if (updatedPatron) api.sendAction('updatePatron', { patron: updatedPatron });
  };

  const renewLoan = async (patronId: string, transactionId: string, extraDays: number) => {
    let updatedPatron: Patron | undefined;
    setPatrons(prev => prev.map(p => {
        if (p.id === patronId) {
            const updatedHistory = (p.history || []).map(h => {
                if (h.id === transactionId) {
                    const [d, m, y] = h.dueDate.split('/').map(Number);
                    const currentDue = new Date(y - 543, m - 1, d);
                    currentDue.setDate(currentDue.getDate() + extraDays);
                    const newDueStr = currentDue.toLocaleDateString('th-TH');
                    return { ...h, dueDate: newDueStr };
                }
                return h;
            });
            updatedPatron = { ...p, history: updatedHistory };
            return updatedPatron;
        }
        return p;
    }));
    if (updatedPatron) api.sendAction('updatePatron', { patron: updatedPatron });
  };

  const addSubject = async (subject: Subject) => {
      await performAction('addSubject', { subject }, () => setSubjects(prev => [...prev, subject]));
  };
  
  const addAcquisition = async (req: AcquisitionRequest) => {
      await performAction('addAcquisition', { request: req }, () => setAcquisitionRequests(prev => [...prev, req]));
  };

  const updateAcquisition = async (req: AcquisitionRequest) => {
      await performAction('updateAcquisition', { request: req }, () => setAcquisitionRequests(prev => prev.map(r => r.id === req.id ? req : r)));
  };

  const deleteAcquisition = async (id: string) => {
      await performAction('deleteAcquisition', { id }, () => setAcquisitionRequests(prev => prev.filter(r => r.id !== id)));
  };

  const translateStatus = (status: string) => {
      switch(status) {
          case 'Available': return 'ว่าง';
          case 'Checked Out': return 'ถูกยืม';
          case 'Reserved': return 'จองแล้ว';
          case 'Lost': return 'สูญหาย';
          case 'Repair': return 'ซ่อมแซม';
          default: return status;
      }
  };

  const generateCutter = (name: string): string => {
      if (!name) return '';
      const firstChar = name.charAt(0);
      let num = 0;
      for (let i = 0; i < name.length; i++) {
          num += name.charCodeAt(i);
      }
      return `${firstChar}${num % 999}`;
  };

  // Config Wrappers
  const addResourceType = (val: string) => setResourceTypes(prev => [...prev, val]);
  const updateResourceType = (oldVal: string, newVal: string) => setResourceTypes(prev => prev.map(i => i === oldVal ? newVal : i));
  const deleteResourceType = (val: string) => setResourceTypes(prev => prev.filter(i => i !== val));
  
  const addLocation = (val: string) => setLocations(prev => [...prev, val]);
  const updateLocation = (oldVal: string, newVal: string) => setLocations(prev => prev.map(i => i === oldVal ? newVal : i));
  const deleteLocation = (val: string) => setLocations(prev => prev.filter(i => i !== val));
  
  const addPatronType = (val: string) => setPatronTypes(prev => [...prev, val]);
  const updatePatronType = (oldVal: string, newVal: string) => setPatronTypes(prev => prev.map(i => i === oldVal ? newVal : i));
  const deletePatronType = (val: string) => setPatronTypes(prev => prev.filter(i => i !== val));
  
  const addPatronGroup = (val: string) => setPatronGroups(prev => [...prev, val]);
  const updatePatronGroup = (oldVal: string, newVal: string) => setPatronGroups(prev => prev.map(i => i === oldVal ? newVal : i));
  const deletePatronGroup = (val: string) => setPatronGroups(prev => prev.filter(i => i !== val));

  // MARC Actions
  const addMarcTag = async (tag: MarcTagDefinition) => {
      await performAction('addMarcTag', { tag }, () => setMarcTags(prev => [...prev, tag]));
  };
  const deleteMarcTag = async (tag: string) => {
      await performAction('deleteMarcTag', { tagId: tag }, () => setMarcTags(prev => prev.filter(t => t.tag !== tag)));
  };
  const updateMarcTag = async (oldTag: string, newTag: MarcTagDefinition) => {
      await performAction('updateMarcTag', { oldTag, newTag }, () => setMarcTags(prev => prev.map(t => t.tag === oldTag ? newTag : t)));
  };

  const addPublicPage = (page: PublicPage) => setPublicPages(prev => [...prev, page]);
  const updatePublicPage = (page: PublicPage) => setPublicPages(prev => prev.map(p => p.id === page.id ? page : p));
  const deletePublicPage = (id: string) => setPublicPages(prev => prev.filter(p => p.id !== id));

  const addAuthorityRecord = (rec: AuthorityRecord) => setAuthorityRecords(prev => [...prev, rec]);
  const updateAuthorityRecord = (rec: AuthorityRecord) => setAuthorityRecords(prev => prev.map(r => r.id === rec.id ? rec : r));
  const deleteAuthorityRecord = (id: string) => setAuthorityRecords(prev => prev.filter(r => r.id !== id));

  const addWorksheet = (ws: Worksheet) => setWorksheets(prev => [...prev, ws]);
  const updateWorksheet = (ws: Worksheet) => setWorksheets(prev => prev.map(w => w.id === ws.id ? ws : w));
  const deleteWorksheet = (id: string) => setWorksheets(prev => prev.filter(w => w.id !== id));
  const toggleFavoriteWorksheet = (id: string) => setWorksheets(prev => prev.map(w => w.id === id ? { ...w, isFavorite: !w.isFavorite } : w));

  const value = {
      books, patrons, subjects, acquisitionRequests, isLoading, refreshData, addBook, deleteBook, updateBookStatus, updateBookDetails, addItemsToBook, mergeBooks, addPatron, updatePatron, updatePatronsBatch, deletePatron, addTransaction, deleteTransaction, returnBook, renewLoan, addSubject, translateStatus,
      addAcquisition, updateAcquisition, deleteAcquisition,
      circulationSession, updateCirculationSession,
      catalogingSession, updateCatalogingSession,
      resourceTypes, locations, patronTypes, patronGroups, marcTags, publicPages, authorityRecords, worksheets,
      addResourceType, updateResourceType, deleteResourceType,
      addLocation, updateLocation, deleteLocation,
      addPatronType, updatePatronType, deletePatronType,
      addPatronGroup, updatePatronGroup, deletePatronGroup,
      addMarcTag, deleteMarcTag, updateMarcTag,
      addPublicPage, updatePublicPage, deletePublicPage,
      addAuthorityRecord, updateAuthorityRecord, deleteAuthorityRecord,
      addWorksheet, updateWorksheet, deleteWorksheet, toggleFavoriteWorksheet,
      generateCutter
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
