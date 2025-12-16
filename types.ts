
export enum ModuleType {
  DASHBOARD = 'Dashboard',
  ACQUISITIONS = 'Acquisitions',
  CATALOGING = 'Cataloging',
  SERIALS = 'Serials',
  CIRCULATION = 'Circulation',
  OPAC = 'OPAC',
  ADMIN = 'Administration',
  REPORTS = 'Reports',
  SUPPORTING = 'Supporting'
}

export interface Subject {
  id: string;
  heading: string;
  dewey?: string;
}

export interface MarcTagDefinition {
  tag: string;
  sub: string;
  desc: string;
}

export interface ReservationLog {
  patronName: string;
  requestDate: string;
  status: 'Fulfilled' | 'Cancelled' | 'Expired';
  actionDate?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  callNumber: string;
  status: 'Available' | 'Checked Out' | 'Lost' | 'Reserved' | 'Repair';
  coverUrl?: string;
  format: 'Book' | 'Journal' | 'Digital';
  pubYear?: string;
  subject?: string;
  items?: Item[]; // For multiple copies
  description?: string;
  publisher?: string;
  pages?: string;
  ebookUrl?: string;
  maxReservations?: number;
  marcData?: Record<string, string>; 
  reservationHistory?: ReservationLog[];
}

export interface Item {
  barcode: string;
  status: string;
  location: string;
  callNumber?: string; // Specific call number if different
  price?: number;
  acquiredDate?: string;
  note?: string; // For notes like who lost the book
}

export interface FineTransaction {
  id: string;
  date: string;
  description: string;
  amount: number; // Positive = Debt/Charge, Negative = Payment
  type: 'Overdue' | 'Damaged' | 'Lost' | 'Payment' | 'Adjustment';
  balanceAfter: number;
}

export interface Patron {
  id: string;
  name: string;
  type: string; // Student, Teacher, Staff
  gender?: string;
  group: string; // Class/Grade e.g., M.1/1
  finesOwed: number;
  history: Transaction[];
  fineHistory?: FineTransaction[];
  email?: string;
  phone?: string;
  expiryDate?: string;
  status?: 'Active' | 'Suspended' | 'Expired';
  imageUrl?: string;
  reservedItems?: Book[];
}

export interface Transaction {
  id: string;
  bookTitle: string;
  patronName: string;
  checkoutDate?: string;
  dueDate: string;
  returnDate?: string;
  status: 'Active' | 'Overdue' | 'Returned';
  fineAmount?: number;
  barcode?: string;
}

export interface AcquisitionRequest {
  id: string;
  title: string;
  requester: string;
  status: 'Pending' | 'Approved' | 'Ordered' | 'Received';
  price: number;
  department: string;
}

export interface SystemConfig {
  libraryName: string;
  finePerDay: number;
  loanPeriodDays: number;
  maxLoanItems: number;
  holidays: string[];
}

export interface PublicPage {
  id: string;
  title: string;
  content: string;
  isVisible: boolean;
}

export interface AuthorityRecord {
  id: string;
  heading: string;
  type: 'Personal Name' | 'Corporate Name' | 'Topical Term' | 'Geographic Name';
  tag: string; // 100, 110, 650, etc.
  cutter?: string; // Cutter-Sanborn Number
  seeAlso?: string[];
  see?: string[];
  marcData?: Record<string, string>; // Full MARC data for authority
}

export interface WorksheetField {
  id: string;
  tag: string;
  ind1: string;
  ind2: string;
  sub: string;
  desc: string;
  required: boolean;
  defaultValue?: string;
}

export interface Worksheet {
  id: string;
  name: string;
  type: 'Bibliographic' | 'Authority';
  isFavorite: boolean;
  fields: WorksheetField[];
}

// Session Persistence Types
export interface CirculationSession {
  mode: 'Checkout' | 'Checkin';
  activeTab: 'Service' | 'Patrons';
  subTab: 'List' | 'Promotion';
  currentPatronId: string | null;
  checkoutScannedItems: Transaction[];
  checkinScannedItems: Transaction[];
  itemIdInput: string;
  patronIdInput: string;
  rightPanelTab: 'Active' | 'History' | 'Fines' | 'Holds';
  isPatronFormOpen: boolean;
  patronFormData: Partial<Patron>;
  isPatronEditMode: boolean;
}

export interface CatalogingSession {
  activeTab: 'Search' | 'Bib' | 'Item' | 'Union' | 'Authority' | 'Import' | 'Worksheet';
  viewMode: 'List' | 'Detail'; // List = Search Results, Detail = Single Book View
  detailTab: 'Edit' | 'MARC' | 'Holdings' | 'Circulation' | 'Reservations';
  searchQuery: string;
  advSearch: {
      title: string;
      author: string;
      isbn: string;
      callNo: string;
  };
  searchType: 'Basic' | 'Advanced';
  searchBarcode: string;
  searchResultsIds: string[]; // Store IDs to be lightweight
  selectedBookId: string | null;
  bibFormData: Record<string, any>;
  isEditMode: boolean;
  formId: string;
  holdingsMode: 'Manual' | 'Auto';
}
