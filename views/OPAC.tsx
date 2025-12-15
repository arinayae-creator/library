
import React, { useState, useEffect } from 'react';
import { Search, Book, Bookmark, Share2, Star, SlidersHorizontal, MessageSquare, X, Filter, CalendarClock, Eye, XCircle, BookOpen } from 'lucide-react';
import { Book as BookType } from '../types';
import { useLibrary } from '../context/LibraryContext';

const OPAC: React.FC = () => {
  const { books } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [results, setResults] = useState<BookType[]>(books);
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
  
  // Update results when global books change
  useEffect(() => {
      setResults(books);
  }, [books]);
  
  // Advanced Search Fields
  const [advTitle, setAdvTitle] = useState('');
  const [advAuthor, setAdvAuthor] = useState('');
  const [advSubject, setAdvSubject] = useState('');
  const [advISBN, setAdvISBN] = useState('');

  const handleSearch = () => {
    let filtered = books;
    const lowerQuery = searchQuery.toLowerCase();
    
    if (advancedMode) {
        filtered = books.filter(b => 
            (advTitle ? (b.title && b.title.toLowerCase().includes(advTitle.toLowerCase())) : true) &&
            (advAuthor ? (b.author && b.author.toLowerCase().includes(advAuthor.toLowerCase())) : true) &&
            (advSubject ? (b.subject?.toLowerCase().includes(advSubject.toLowerCase())) : true) &&
            (advISBN ? (b.isbn && String(b.isbn).includes(advISBN)) : true)
        );
    } else {
        filtered = books.filter(b => 
            (b.title && b.title.toLowerCase().includes(lowerQuery)) || 
            (b.author && b.author.toLowerCase().includes(lowerQuery)) ||
            (b.isbn && String(b.isbn).includes(lowerQuery)) ||
            (b.id && String(b.id).includes(lowerQuery))
        );
    }
    setResults(filtered);
  };

  const handleHold = (book: BookType) => {
    if(window.confirm(`ยืนยันการจองหนังสือ "${book.title}" ?\nคุณจะเป็นคิวที่ 1 เมื่อหนังสือถูกส่งคืน`)) {
        alert('บันทึกการจองสำเร็จ ระบบจะแจ้งเตือนเมื่อหนังสือพร้อมให้บริการ');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12 font-sans">
      
      {/* Book Detail Modal */}
      {selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setSelectedBook(null)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                  <div className="w-full md:w-1/3 bg-slate-100 p-8 flex items-center justify-center relative">
                       <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-48 h-auto shadow-lg rounded-lg object-cover" />
                       <button onClick={() => setSelectedBook(null)} className="absolute top-4 left-4 p-2 bg-white/50 rounded-full hover:bg-white md:hidden">
                           <X className="w-5 h-5" />
                       </button>
                  </div>
                  <div className="w-full md:w-2/3 p-8 flex flex-col max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <h2 className="text-2xl font-bold text-slate-900">{selectedBook.title}</h2>
                              <p className="text-lg text-slate-600 font-medium">{selectedBook.author}</p>
                          </div>
                          <button onClick={() => setSelectedBook(null)} className="hidden md:block text-slate-400 hover:text-slate-600">
                              <XCircle className="w-8 h-8" />
                          </button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                          <span className="px-3 py-1 bg-slate-100 rounded-full text-sm font-mono text-slate-700 border border-slate-200">{selectedBook.callNumber}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${selectedBook.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {selectedBook.status === 'Available' ? <span className="w-2 h-2 bg-green-500 rounded-full"></span> : null}
                              {selectedBook.status === 'Available' ? 'พร้อมให้บริการ' : 'ไม่ว่าง'}
                          </span>
                          {selectedBook.format === 'Digital' && (
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">E-Book</span>
                          )}
                      </div>

                      <div className="space-y-4 mb-8 flex-1">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                              <div><span className="text-slate-500 block">ISBN</span> {selectedBook.isbn}</div>
                              <div><span className="text-slate-500 block">ปีที่พิมพ์</span> {selectedBook.pubYear}</div>
                              <div><span className="text-slate-500 block">สำนักพิมพ์</span> {selectedBook.publisher || '-'}</div>
                              <div><span className="text-slate-500 block">จำนวนหน้า</span> {selectedBook.pages || '-'}</div>
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-800 mb-2">เรื่องย่อ</h3>
                              <p className="text-slate-600 text-sm leading-relaxed">
                                  {selectedBook.description || 'ไม่มีข้อมูลเรื่องย่อสำหรับหนังสือเล่มนี้...'}
                              </p>
                          </div>
                      </div>

                      <div className="flex gap-3 mt-auto pt-4 border-t">
                           {selectedBook.format === 'Digital' ? (
                               <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-200 transition-transform active:scale-95">
                                   <BookOpen className="w-5 h-5" /> อ่านออนไลน์ทันที
                               </button>
                           ) : (
                                <button 
                                    onClick={() => handleHold(selectedBook)}
                                    disabled={selectedBook.status === 'Available'}
                                    className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${selectedBook.status === 'Checked Out' ? 'bg-accent text-white hover:bg-blue-600 shadow-blue-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                >
                                    {selectedBook.status === 'Checked Out' ? <><CalendarClock className="w-5 h-5"/> จองหนังสือ (Hold)</> : 'มีอยู่บนชั้น (Walk-in)'}
                                </button>
                           )}
                           <button className="px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600">
                               <Share2 className="w-5 h-5" />
                           </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Hero / Search Header */}
      <div className="bg-primary px-8 py-16 text-center transition-all">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">สืบค้นทรัพยากรสารสนเทศ</h1>
        <p className="text-slate-400 mb-8 max-w-2xl mx-auto">ค้นหาหนังสือ, วารสาร, และสื่อดิจิทัล ของห้องสมุดอิกเราะอฺ</p>
        
        <div className="max-w-3xl mx-auto relative bg-white p-4 rounded-xl shadow-2xl">
            {!advancedMode ? (
                <div className="flex rounded-lg overflow-hidden border border-slate-200">
                    <div className="bg-white flex-1 flex items-center px-4 py-2">
                        <Search className="text-slate-400 w-6 h-6 mr-3" />
                        <input 
                            type="text" 
                            className="flex-1 outline-none text-lg text-slate-700 placeholder:text-slate-400"
                            placeholder="พิมพ์ชื่อเรื่อง, ผู้แต่ง, หัวเรื่อง หรือ ISBN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <button 
                        onClick={handleSearch}
                        className="bg-accent text-white px-8 font-bold text-lg hover:bg-blue-600 transition-colors"
                    >
                        ค้นหา
                    </button>
                </div>
            ) : (
                <div className="text-left space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="ชื่อเรื่อง (Title)" className="border p-2 rounded" value={advTitle} onChange={e => setAdvTitle(e.target.value)} />
                        <input type="text" placeholder="ผู้แต่ง (Author)" className="border p-2 rounded" value={advAuthor} onChange={e => setAdvAuthor(e.target.value)} />
                        <input type="text" placeholder="หัวเรื่อง (Subject)" className="border p-2 rounded" value={advSubject} onChange={e => setAdvSubject(e.target.value)} />
                        <input type="text" placeholder="ISBN" className="border p-2 rounded" value={advISBN} onChange={e => setAdvISBN(e.target.value)} />
                    </div>
                    <div className="flex gap-2 pt-2">
                         <button onClick={handleSearch} className="bg-accent text-white px-6 py-2 rounded hover:bg-blue-600">ค้นหาขั้นสูง</button>
                         <button onClick={() => setAdvancedMode(false)} className="bg-slate-100 text-slate-600 px-6 py-2 rounded hover:bg-slate-200">ยกเลิก</button>
                    </div>
                </div>
            )}
            
            <div className="flex justify-between items-center mt-3 px-1">
                <button 
                    onClick={() => setAdvancedMode(!advancedMode)}
                    className="text-sm text-accent flex items-center gap-1 hover:underline"
                >
                    {advancedMode ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                    {advancedMode ? 'ปิดการค้นหาขั้นสูง' : 'การค้นหาขั้นสูง (Advanced Search)'}
                </button>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-slate-500 text-sm cursor-pointer">
                        <input type="checkbox" className="rounded border-slate-300" /> เฉพาะรายการที่ว่าง
                    </label>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="hidden lg:block space-y-8">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" /> กรองผลลัพธ์
                </h3>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>รูปแบบ (Format)</span>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" className="rounded text-accent" defaultChecked /> หนังสือ ({books.filter(b => b.format === 'Book').length})
                    </label>
                     <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" className="rounded text-accent" /> วารสาร (0)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" className="rounded text-accent" /> สื่อดิจิทัล ({books.filter(b => b.format === 'Digital').length})
                    </label>
                </div>
            </div>
            
            {/* Tag Cloud (OPAC 2.0) */}
            <div>
                <h3 className="font-bold text-slate-800 mb-3">คำค้นยอดนิยม (Tag Cloud)</h3>
                <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-slate-200 rounded text-xs text-slate-700 hover:bg-slate-300 cursor-pointer" onClick={() => {setSearchQuery('อิสลามศึกษา'); handleSearch();}}>อิสลามศึกษา</span>
                    <span className="px-2 py-1 bg-slate-200 rounded text-xs text-slate-700 hover:bg-slate-300 cursor-pointer" onClick={() => {setSearchQuery('วิทยาศาสตร์'); handleSearch();}}>วิทยาศาสตร์</span>
                    <span className="px-2 py-1 bg-slate-200 rounded text-xs text-slate-700 hover:bg-slate-300 cursor-pointer" onClick={() => {setSearchQuery('การ์ตูนความรู้'); handleSearch();}}>การ์ตูนความรู้</span>
                </div>
            </div>
        </div>

        {/* Results Grid */}
        <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-xl text-slate-800">ผลการค้นหา</h2>
                <span className="text-sm text-slate-500">พบ {results.length} รายการ</span>
            </div>

            <div className="space-y-6">
                {results.map((book) => (
                    <div key={book.id} className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 relative">
                        <div className="w-full md:w-32 h-48 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 relative group cursor-pointer" onClick={() => setSelectedBook(book)}>
                            <img src={book.coverUrl || 'https://via.placeholder.com/200x300?text=No+Cover'} alt={book.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="text-white w-8 h-8 drop-shadow-md" />
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 hover:text-accent cursor-pointer" onClick={() => setSelectedBook(book)}>{book.title}</h3>
                                        <p className="text-slate-600">โดย <span className="text-accent font-medium">{book.author}</span></p>
                                        <p className="text-xs text-slate-400 mt-1">ปีพิมพ์: {book.pubYear} | หัวเรื่อง: {book.subject}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 text-slate-400 hover:text-yellow-400 transition-colors" title="ให้คะแนน/รีวิว">
                                            <Star className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-accent transition-colors" title="แชร์ (My Share)">
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md font-mono border border-slate-300">
                                        {book.callNumber}
                                    </span>
                                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md">
                                        ISBN: {book.isbn}
                                    </span>
                                    <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md border border-green-200">
                                        ID: {book.id}
                                    </span>
                                </div>
                                
                                <div className="mt-2 text-xs text-slate-400 flex items-center gap-4">
                                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-current" /> 4.5</span>
                                    <span className="flex items-center gap-1 cursor-pointer hover:text-accent"><MessageSquare className="w-3 h-3" /> แสดงความคิดเห็น</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${book.status === 'Available' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span className={`text-sm font-medium ${book.status === 'Available' ? 'text-green-700' : 'text-red-700'}`}>
                                        {book.status === 'Available' ? 'พร้อมให้บริการ' : 'ไม่ว่าง'}
                                    </span>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleHold(book)}
                                        disabled={book.status === 'Available'}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-colors ${
                                            book.status === 'Checked Out' 
                                            ? 'bg-accent text-white hover:bg-blue-600' 
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {book.status === 'Checked Out' ? <><CalendarClock className="w-4 h-4"/> จอง (Hold)</> : 'มีอยู่บนชั้น (On Shelf)'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {results.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                        <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">ไม่พบรายการที่ค้นหา</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default OPAC;
