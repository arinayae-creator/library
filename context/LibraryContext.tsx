
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Book, Patron, Transaction, Subject, FineTransaction, CirculationSession, CatalogingSession, MarcTagDefinition, PublicPage, AuthorityRecord, Worksheet, Item } from '../types';
import { api } from '../services/api';

interface LibraryContextType {
  books: Book[];
  patrons: Patron[];
  subjects: Subject[];
  isLoading: boolean;
  addBook: (book: Book) => void;
  deleteBook: (bookId: string) => void;
  updateBookStatus: (bookId: string, status: Book['status']) => void;
  updateBookDetails: (book: Book) => void;
  addItemsToBook: (bookId: string, items: Item[]) => void;
  mergeBooks: (targetId: string, sourceId: string) => void;
  addPatron: (patron: Patron) => void;
  updatePatron: (patron: Patron) => void;
  updatePatronsBatch: (updates: Patron[]) => void;
  deletePatron: (patronId: string) => void;
  addTransaction: (patronId: string, transaction: Transaction) => void;
  deleteTransaction: (patronId: string, transactionId: string) => void;
  returnBook: (patronId: string, transactionId: string, fine: number) => void;
  renewLoan: (patronId: string, transactionId: string, extraDays: number) => void;
  addSubject: (subject: Subject) => void;
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
  
  addMarcTag: (tag: MarcTagDefinition) => void;
  deleteMarcTag: (tag: string) => void;
  updateMarcTag: (oldTag: string, newTag: MarcTagDefinition) => void;

  addPublicPage: (page: PublicPage) => void;
  updatePublicPage: (page: PublicPage) => void;
  deletePublicPage: (id: string) => void;

  addAuthorityRecord: (rec: AuthorityRecord) => void;
  updateAuthorityRecord: (rec: AuthorityRecord) => void;
  deleteAuthorityRecord: (id: string) => void;
  
  generateCutter: (name: string) => string;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

// Initial Fallback Data (Used only if API fails or is empty initially)
const initialMarcTags: MarcTagDefinition[] = [
    { tag: '020', sub: '$a', desc: 'ISBN' },
    { tag: '100', sub: '$a', desc: 'Main Entry - Personal Name' },
    { tag: '245', sub: '$a', desc: 'Title' },
    { tag: '260', sub: '$a', desc: 'Publication' },
    { tag: '650', sub: '$a', desc: 'Subject' },
];

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [patrons, setPatrons] = useState<Patron[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Config States
  const [resourceTypes, setResourceTypes] = useState<string[]>(['Book', 'Journal', 'Digital', 'CD/DVD', 'Equipment']);
  const [locations, setLocations] = useState<string[]>(['ชั้น 1 - ทั่วไป', 'ชั้น 2 - อ้างอิง']);
  const [patronTypes, setPatronTypes] = useState<string[]>(['นักเรียน', 'ครูอาจารย์', 'บุคลากร']);
  const [patronGroups, setPatronGroups] = useState<string[]>(['ม.1/1', 'ม.1/2', 'ม.2/1', 'ม.2/2', 'ม.3/1']);
  const [marcTags, setMarcTags] = useState<MarcTagDefinition[]>(initialMarcTags);
  const [publicPages, setPublicPages] = useState<PublicPage[]>([]);
  const [authorityRecords, setAuthorityRecords] = useState<AuthorityRecord[]>([]);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);

  // Session State (Not persisted to DB, just local session)
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
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const data = await api.loadAllData();
      if (data) {
        if (data.books) setBooks(data.books);
        if (data.patrons) setPatrons(data.patrons);
        if (data.subjects) setSubjects(data.subjects);
        // Load configs if they exist in DB, otherwise stick to defaults
        if (data.resourceTypes) setResourceTypes(data.resourceTypes);
        if (data.locations) setLocations(data.locations);
      }
      setIsLoading(false);
    };
    initData();
  }, []);

  const updateCirculationSession = (session: Partial<CirculationSession>) => {
    setCirculationSession(prev => ({ ...prev, ...session }));
  };

  const updateCatalogingSession = (session: Partial<CatalogingSession>) => {
    setCatalogingSession(prev => ({ ...prev, ...session }));
  };

  const addBook = (book: Book) => {
    setBooks((prev) => [...prev, book]);
    api.sendAction('addBook', { book });
  };

  const deleteBook = (bookId: string) => {
    setBooks((prev) => prev.filter(b => b.id !== bookId));
    api.sendAction('deleteBook', { bookId });
  };

  const updateBookStatus = (bookId: string, status: Book['status']) => {
    setBooks((prev) => prev.map(b => b.id === bookId ? { ...b, status } : b));
    api.sendAction('updateBookStatus', { bookId, status });
  };

  const updateBookDetails = (updatedBook: Book) => {
    setBooks((prev) => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    api.sendAction('updateBookDetails', { book: updatedBook });
  };

  const addItemsToBook = (bookId: string, items: Item[]) => {
      setBooks(prev => prev.map(b => {
          if (b.id === bookId) {
              const newBook = { ...b, items: [...(b.items || []), ...items] };
              api.sendAction('updateBookDetails', { book: newBook });
              return newBook;
          }
          return b;
      }));
  };

  const mergeBooks = (targetId: string, sourceId: string) => {
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

  const addPatron = (patron: Patron) => {
    setPatrons((prev) => [...prev, patron]);
    api.sendAction('addPatron', { patron });
  };

  const updatePatron = (patron: Patron) => {
    setPatrons((prev) => prev.map(p => p.id === patron.id ? patron : p));
    api.sendAction('updatePatron', { patron });
  };

  const updatePatronsBatch = (updates: Patron[]) => {
    setPatrons(prev => {
        const updateMap = new Map(updates.map(p => [p.id, p]));
        return prev.map(p => updateMap.get(p.id) || p);
    });
    api.sendAction('updatePatronsBatch', { patrons: updates });
  };

  const deletePatron = (patronId: string) => {
    setPatrons((prev) => prev.filter(p => p.id !== patronId));
    api.sendAction('deletePatron', { patronId });
  };

  const addTransaction = (patronId: string, transaction: Transaction) => {
      setPatrons(prev => prev.map(p => {
          if (p.id === patronId) {
              const newPatron = { ...p, history: [transaction, ...p.history] };
              api.sendAction('updatePatron', { patron: newPatron }); // Sync full patron object to be safe
              return newPatron;
          }
          return p;
      }));
  };

  const deleteTransaction = (patronId: string, transactionId: string) => {
    const patron = patrons.find(p => p.id === patronId);
    const tx = patron?.history.find(t => t.id === transactionId);
    const barcode = tx?.barcode;

    setPatrons(prev => prev.map(p => {
        if (p.id === patronId) {
            const newPatron = { ...p, history: p.history.filter(t => t.id !== transactionId) };
            api.sendAction('updatePatron', { patron: newPatron });
            return newPatron;
        }
        return p;
    }));

    if (barcode) {
        updateBookStatus(barcode, 'Available');
    }
  };

  const returnBook = (patronId: string, transactionId: string, fine: number) => {
      setPatrons(prev => prev.map(p => {
          if (p.id === patronId) {
              const updatedHistory = p.history.map(h => {
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
              const newPatron = { ...p, history: updatedHistory, finesOwed: p.finesOwed + fine };
              api.sendAction('updatePatron', { patron: newPatron });
              return newPatron;
          }
          return p;
      }));
  };

  const renewLoan = (patronId: string, transactionId: string, extraDays: number) => {
    setPatrons(prev => prev.map(p => {
        if (p.id === patronId) {
            const updatedHistory = p.history.map(h => {
                if (h.id === transactionId) {
                    const [d, m, y] = h.dueDate.split('/').map(Number);
                    const currentDue = new Date(y - 543, m - 1, d);
                    currentDue.setDate(currentDue.getDate() + extraDays);
                    
                    const newDueStr = currentDue.toLocaleDateString('th-TH');
                    return { ...h, dueDate: newDueStr };
                }
                return h;
            });
            const newPatron = { ...p, history: updatedHistory };
            api.sendAction('updatePatron', { patron: newPatron });
            return newPatron;
        }
        return p;
    }));
  };

  const addSubject = (subject: Subject) => {
      setSubjects(prev => [...prev, subject]);
      api.sendAction('addSubject', { subject });
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

  // Config Wrappers (Can be synced similarly if needed)
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

  const addMarcTag = (tag: MarcTagDefinition) => setMarcTags(prev => [...prev, tag]);
  const deleteMarcTag = (tag: string) => setMarcTags(prev => prev.filter(t => t.tag !== tag));
  const updateMarcTag = (oldTag: string, newTag: MarcTagDefinition) => setMarcTags(prev => prev.map(t => t.tag === oldTag ? newTag : t));

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
      books, patrons, subjects, isLoading, addBook, deleteBook, updateBookStatus, updateBookDetails, addItemsToBook, mergeBooks, addPatron, updatePatron, updatePatronsBatch, deletePatron, addTransaction, deleteTransaction, returnBook, renewLoan, addSubject, translateStatus,
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
