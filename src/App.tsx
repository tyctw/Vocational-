import React, { useState, useMemo, useEffect } from 'react';
import { School } from './types';
import { Search, GraduationCap, Building2, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, List, AlertCircle, RefreshCw, ArrowRight, MapPin, BookOpen, Clock, Tag, Compass, Target, MessageSquare, Menu, X, Heart, Download, Copy, ArrowUpDown, Scale, BarChart2, PieChart as PieChartIcon, Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export default function App() {
  const [schoolsData, setSchoolsData] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Calculate academic year
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const taiwanYear = currentYear - 1911;
  const academicYear = currentMonth >= 9 ? taiwanYear + 1 : taiwanYear;
  
  const [activeTab, setActiveTab] = useState<'list' | 'analysis'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterDayNight, setFilterDayNight] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [compareList, setCompareList] = useState<School[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('twhs_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const itemsPerPage = 24;

  useEffect(() => {
    localStorage.setItem('twhs_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const toggleFavorite = (school: School) => {
    const id = `${school.schoolCode}-${school.departmentName}`;
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const toggleCompare = (school: School) => {
    setCompareList(prev => {
      const exists = prev.some(s => s.schoolCode === school.schoolCode && s.departmentName === school.departmentName);
      if (exists) {
        return prev.filter(s => !(s.schoolCode === school.schoolCode && s.departmentName === school.departmentName));
      } else {
        if (prev.length >= 3) {
          alert("最多只能比較 3 筆資料");
          return prev;
        }
        return [...prev, school];
      }
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // Simple UI feedback could be implemented, but relying on browser or native behavior is okay for now.
    // For a quick visual feedback, a simple alert (though not ideal UX, it's functional).
    // Let's skip alert to keep it clean and just copy.
  };

  const exportToCSV = () => {
    const headers = ['學校代碼', '學校名稱', '縣市', '等級', '日夜別', '群別', '科系'];
    const csvContent = [
      headers.join(','),
      ...filteredSchools.map(s => 
        [s.schoolCode, s.schoolName, s.cityName, s.levelName, s.dayNightName, s.groupName, s.departmentName]
        .map(v => `"${v || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'taiwan_high_schools.csv';
    link.click();
  };

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_D1_API_URL;
    if (apiUrl) {
      setIsLoading(true);
      setError(null);
      let fetchUrl = apiUrl;
      if (!fetchUrl.endsWith('/api/schools')) {
        fetchUrl = fetchUrl.replace(/\/$/, '') + '/api/schools';
      }
      fetch(fetchUrl)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP 錯誤！狀態碼: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            const mappedData: School[] = data.map((item: any) => ({
              cityCode: item.county_code || item['縣市代碼'] || item.cityCode || '',
              cityName: item.county_name || item['縣市名稱'] || item.cityName || '',
              schoolCode: item.school_code || item['學校代碼'] || item.schoolCode || '',
              schoolName: item.school_name || item['學校名稱'] || item.schoolName || '',
              levelName: item.level_name || item['等級名稱'] || item.levelName || '',
              dayNightName: item.day_night_name || item['日夜別名稱'] || item.dayNightName || '',
              groupCode: item.group_code || item['群別代碼'] || item.groupCode || '',
              groupName: item.group_name || item['群別名稱'] || item.groupName || '',
              departmentName: item.department_name || item['科系名稱'] || item.departmentName || ''
            }));
            setSchoolsData(mappedData);
          } else {
             throw new Error('資料格式錯誤：非陣列格式');
          }
        })
        .catch(err => {
          console.error('從 D1 資料庫獲取資料失敗:', err);
          setError(err.message);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
      setError('VITE_D1_API_URL 環境變數尚未在設定中設定。');
      console.warn('未設定 VITE_D1_API_URL。');
    }
  }, []);

  // Extract unique values for filters
  const cities = useMemo(() => Array.from(new Set(schoolsData.map(s => s.cityName).filter(Boolean))).sort(), [schoolsData]);
  const levels = useMemo(() => Array.from(new Set(schoolsData.map(s => s.levelName).filter(Boolean))).sort(), [schoolsData]);
  const dayNights = useMemo(() => Array.from(new Set(schoolsData.map(s => s.dayNightName).filter(Boolean))).sort(), [schoolsData]);
  const groups = useMemo(() => Array.from(new Set(schoolsData.map(s => s.groupName).filter(Boolean))).sort(), [schoolsData]);

  // Filter schools
  const filteredSchools = useMemo(() => {
    let result = schoolsData.filter(school => {
      if (showFavoritesOnly) {
        const id = `${school.schoolCode}-${school.departmentName}`;
        if (!favorites.includes(id)) return false;
      }
      const matchSearch = school.schoolName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCity = filterCity ? school.cityName === filterCity : true;
      const matchLevel = filterLevel ? school.levelName === filterLevel : true;
      const matchDayNight = filterDayNight ? school.dayNightName === filterDayNight : true;
      const matchGroup = filterGroup ? school.groupName === filterGroup : true;
      return matchSearch && matchCity && matchLevel && matchDayNight && matchGroup;
    });

    if (sortBy === 'schoolCode') {
      result.sort((a, b) => a.schoolCode.localeCompare(b.schoolCode));
    } else if (sortBy === 'cityName') {
      result.sort((a, b) => a.cityName.localeCompare(b.cityName));
    }

    return result;
  }, [schoolsData, searchTerm, filterCity, filterLevel, filterDayNight, filterGroup, sortBy, showFavoritesOnly, favorites]);

  const chartDataCity = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSchools.forEach(school => {
      const city = school.cityName || '未分類';
      counts[city] = (counts[city] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredSchools]);

  const chartDataLevel = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSchools.forEach(school => {
      const level = school.levelName || '未分類';
      counts[level] = (counts[level] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredSchools]);

  const chartDataDayNight = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSchools.forEach(school => {
      const dn = school.dayNightName || '未分類';
      counts[dn] = (counts[dn] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredSchools]);

  const COLORS = ['#4F46E5', '#818CF8', '#A5B4FC', '#C7D2FE', '#E0E7FF', '#312E81', '#4338CA', '#3730A3'];

  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage);

  const paginatedSchools = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSchools.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSchools, currentPage]);

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-black font-sans selection:bg-[#F7C548] selection:text-black flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b-4 border-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <button 
              className="flex items-center gap-3.5 shrink-0 group cursor-pointer text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-black" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="回首頁"
            >
              <div className="w-12 h-12 bg-[#E54B4B] flex items-center justify-center text-white border-2 border-black group-hover:bg-[#F7C548] group-hover:text-black transition-colors rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <GraduationCap size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter text-black leading-none uppercase">台灣高中職名錄</span>
                <span className="text-[12px] font-black text-black tracking-[0.2em] uppercase mt-1">Taiwan High Schools</span>
              </div>
            </button>
            
            {/* Header Right */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2.5 text-sm font-black text-black bg-white px-4 py-2 border-2 border-black uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-none">
                <div className="w-3 h-3 bg-[#E54B4B] border-2 border-black animate-pulse rounded-none"></div>
                TOTAL: {schoolsData.length}
              </div>
              
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-2 border-2 border-transparent hover:border-black hover:bg-[#F7C548] text-black transition-all rounded-none"
                aria-label="打開選單"
                aria-expanded={isMenuOpen}
              >
                <Menu size={24} strokeWidth={3} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Slide-out Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsMenuOpen(false)}
      ></div>

      {/* Slide-out Menu Panel */}
      <div className={`fixed inset-y-0 right-0 w-[300px] sm:w-[380px] bg-[#f4f4f0] z-50 border-l-4 border-black transform transition-transform duration-300 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 sm:p-8 border-b-4 border-black bg-[#5D9B9B] text-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-none">
              <GraduationCap size={18} strokeWidth={3} />
            </div>
            <span className="font-black text-2xl text-black tracking-tighter uppercase">導覽選單</span>
          </div>
          <button 
            onClick={() => setIsMenuOpen(false)}
            aria-label="關閉選單"
            className="p-2 text-black hover:bg-white border-2 border-transparent hover:border-black rounded-none shadow-none hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
          >
            <X size={22} strokeWidth={3} aria-hidden="true" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-8 px-6 sm:px-8 space-y-4 bg-[#f4f4f0]">
          <div className="text-[12px] font-black text-black uppercase tracking-[0.2em] mb-4 ml-1">升學輔導資源</div>
          <a href="https://tyctw.github.io/future/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 sm:p-5 bg-white border-2 border-black text-black font-black uppercase transition-all group shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-[#F7C548] rounded-none">
            <div className="p-3 bg-white text-black border-2 border-black group-hover:scale-110 transition-transform rounded-none">
              <Compass size={22} strokeWidth={2.5} />
            </div>
            <span className="text-base tracking-widest">高職十五學群導覽</span>
            <ArrowRight size={18} strokeWidth={3} className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-black" />
          </a>
          <a href="https://tyctw.github.io/spare/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 sm:p-5 bg-white border-2 border-black text-black font-black uppercase transition-all group shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-[#5D9B9B] rounded-none">
            <div className="p-3 bg-white text-black border-2 border-black group-hover:scale-110 transition-transform rounded-none">
              <Target size={22} strokeWidth={2.5} />
            </div>
            <span className="text-base tracking-widest">會考落點分析</span>
            <ArrowRight size={18} strokeWidth={3} className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-black" />
          </a>
          <a href="https://tyctw.github.io/shared/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 sm:p-5 bg-white border-2 border-black text-black font-black uppercase transition-all group shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-[#E54B4B] hover:text-white rounded-none">
            <div className="p-3 bg-white text-black border-2 border-black group-hover:scale-110 transition-transform rounded-none">
              <MessageSquare size={22} strokeWidth={2.5} className="group-hover:text-black" />
            </div>
            <span className="text-base tracking-widest">錄取分享</span>
            <ArrowRight size={18} strokeWidth={3} className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-white" />
          </a>
        </div>
        
        <div className="p-6 sm:p-8 bg-[#f4f4f0] border-t-4 border-black">
          <div className="flex items-center justify-between p-5 bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-none">
            <span className="text-sm font-black text-black uppercase tracking-widest">資料總筆數</span>
            <div className="flex items-center gap-2.5">
              <span className="font-black text-2xl text-black">{schoolsData.length}</span>
            </div>
          </div>
        </div>
      </div>

      {error && !isLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-[#E54B4B] text-white p-5 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col sm:flex-row gap-4 items-start sm:items-center rounded-none">
            <div className="p-2.5 bg-white text-black border-2 border-black shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-none">
              <AlertCircle size={20} strokeWidth={3} />
            </div>
            <div className="flex-1">
              <h3 className="font-black uppercase tracking-widest text-lg">連線錯誤</h3>
              <p className="text-sm mt-1 font-bold">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 sm:mt-0 px-6 py-3 bg-white text-black border-2 border-black text-sm font-black uppercase transition-all flex items-center gap-2 shrink-0 rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-[#F7C548]"
            >
              <RefreshCw size={16} strokeWidth={3} /> 重新整理
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="relative bg-white border-b-4 border-black overflow-hidden">
        {/* Decorative neo-brutalism grid background */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 sm:py-28 lg:py-36">
          <div className="w-full border-4 border-black p-8 sm:p-12 lg:p-16 bg-[#F7C548] shadow-[8px_8px_0_0_rgba(0,0,0,1)] sm:shadow-[12px_12px_0_0_rgba(0,0,0,1)] rounded-none relative">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-16 h-16 bg-[#E54B4B] border-4 border-black rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center rotate-12">
              <Target size={32} color="white" strokeWidth={3} />
            </div>
            
            <div className="inline-flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-none bg-white border-2 border-black text-[12px] sm:text-[14px] font-black tracking-widest text-black mb-8 sm:mb-10 shadow-[4px_4px_0_0_rgba(0,0,0,1)] uppercase">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#E54B4B] border-2 border-black animate-pulse"></div>
              Taiwan Open Data
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-black mb-6 sm:mb-8 leading-[1.1] uppercase">
              台灣高級中等學校
              <br className="hidden sm:block" />
              <span className="text-black bg-white px-3 py-1 sm:px-4 sm:py-2 mt-3 sm:mt-4 inline-block border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_0_rgba(0,0,0,1)]">開放資料庫</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-black max-w-2xl leading-relaxed font-bold mt-8 sm:mt-10 border-l-4 sm:border-l-8 border-black pl-4 sm:pl-6 bg-white/30 sm:bg-transparent p-4 sm:p-0">
              收錄全台高中、高職及相關教育機構的名錄，提供便捷的查詢與資料探索體驗。
            </p>
          </div>
        </div>
      </header>



      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative z-20">

        {/* Placement Analysis Promo Banner - New Design */}
        <div className="mb-12 relative bg-[#F7C548] border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] sm:shadow-[12px_12px_0_0_rgba(0,0,0,1)] rounded-none overflow-hidden group">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 sm:w-64 sm:h-64 bg-[#E54B4B] rounded-full border-4 border-black opacity-30 group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-full border-4 border-black opacity-30 group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
          
          <div className="relative p-6 sm:p-10 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 lg:gap-16">
            <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-none bg-black text-[#F7C548] border-2 border-transparent text-[13px] sm:text-[14px] font-black tracking-widest mb-4 sm:mb-6 uppercase shadow-[4px_4px_0_0_rgba(229,75,75,1)]">
                <Target size={20} strokeWidth={3} className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>全新功能上線</span>
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-black mb-4 sm:mb-6 tracking-tighter leading-[1.1] uppercase">
                {academicYear} 年 <br className="hidden lg:block" />
                <span className="text-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)] sm:drop-shadow-[4px_4px_0_rgba(0,0,0,1)] block lg:inline mt-2 lg:mt-0">落點分析系統</span>
              </h2>
              <p className="text-black bg-white/90 backdrop-blur-sm p-4 sm:p-5 border-4 border-black font-bold text-[15px] sm:text-[16px] md:text-[18px] max-w-2xl leading-relaxed shadow-[4px_4px_0_0_rgba(0,0,0,1)] sm:shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                還在為填志願煩惱嗎？輸入您的成績，讓我們用精準的數據為您推薦最適合的學校與科系，讓未來升學之路更清晰。
              </p>
            </div>
            <div className="shrink-0 w-full lg:w-auto relative z-10">
              <a 
                href="https://tyctw.github.io/spare/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group/btn relative w-full lg:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 bg-white text-black px-6 py-4 sm:px-10 sm:py-5 md:px-12 md:py-6 rounded-none font-black text-lg sm:text-xl md:text-2xl border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] sm:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all uppercase"
              >
                <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                  立即開始分析
                  <ArrowRight size={24} strokeWidth={3} className="w-6 h-6 sm:w-7 sm:h-7 group-hover/btn:translate-x-2 transition-transform" />
                </span>
              </a>
            </div>
          </div>
        </div>

            {/* Filter Section */}
            <div className="mb-8">
              <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-none p-4 sm:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                    <div className="relative flex-1 group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-black group-focus-within:text-[#E54B4B] transition-colors">
                        <Search size={24} strokeWidth={3} />
                      </div>
                      <input
                        type="text"
                        aria-label="搜尋學校名稱或地址"
                        placeholder="搜尋學校名稱或地址..."
                        className="w-full pl-14 pr-4 py-4 bg-[#f4f4f0] border-2 border-black rounded-none text-black text-[16px] font-black focus:outline-none focus:bg-white focus:ring-0 transition-all placeholder:text-black/50 shadow-[4px_4px_0_0_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_rgba(0,0,0,1)] h-full"
                        value={searchTerm}
                        onChange={handleFilterChange(setSearchTerm)}
                      />
                    </div>
                    
                    <div className="hidden sm:flex bg-white rounded-none p-1 border-2 border-black shrink-0 shadow-[4px_4px_0_0_rgba(0,0,0,1)] items-center gap-1 h-full">
                      <button
                        onClick={() => setViewMode('grid')}
                        aria-label="切換至網格視圖"
                        className={`h-full px-4 rounded-none border-2 transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-[#E54B4B] text-white border-black' : 'text-black border-transparent hover:border-black hover:bg-[#f4f4f0]'}`}
                        title="網格視圖"
                      >
                        <LayoutGrid size={24} strokeWidth={3} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        aria-label="切換至列表視圖"
                        className={`h-full px-4 rounded-none border-2 transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-[#E54B4B] text-white border-black' : 'text-black border-transparent hover:border-black hover:bg-[#f4f4f0]'}`}
                        title="列表視圖"
                      >
                        <List size={24} strokeWidth={3} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                      <select
                        aria-label="選擇縣市"
                        className="w-full appearance-none bg-[#f4f4f0] border-2 border-black rounded-none text-black py-4 pl-4 pr-10 text-[14px] sm:text-[15px] font-black focus:outline-none focus:bg-white transition-all cursor-pointer shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase"
                        value={filterCity}
                        onChange={handleFilterChange(setFilterCity)}
                      >
                        <option value="">全部縣市</option>
                        {cities.map(city => (
                          <option key={`city-${city}`} value={city}>{city}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-black">
                        <ChevronDown size={20} strokeWidth={3} />
                      </div>
                    </div>

                    <div className="relative">
                      <select
                        aria-label="選擇等級"
                        className="w-full appearance-none bg-[#f4f4f0] border-2 border-black rounded-none text-black py-4 pl-4 pr-10 text-[14px] sm:text-[15px] font-black focus:outline-none focus:bg-white transition-all cursor-pointer shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase"
                        value={filterLevel}
                        onChange={handleFilterChange(setFilterLevel)}
                      >
                        <option value="">所有等級</option>
                        {levels.map(level => (
                          <option key={`level-${level}`} value={level}>{level}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-black">
                        <ChevronDown size={20} strokeWidth={3} />
                      </div>
                    </div>

                    <div className="relative">
                      <select
                        aria-label="選擇日夜別"
                        className="w-full appearance-none bg-[#f4f4f0] border-2 border-black rounded-none text-black py-4 pl-4 pr-10 text-[14px] sm:text-[15px] font-black focus:outline-none focus:bg-white transition-all cursor-pointer shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase"
                        value={filterDayNight}
                        onChange={handleFilterChange(setFilterDayNight)}
                      >
                        <option value="">日夜別</option>
                        {dayNights.map(dn => (
                          <option key={`dn-${dn}`} value={dn}>{dn}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-black">
                        <ChevronDown size={20} strokeWidth={3} />
                      </div>
                    </div>

                    <div className="relative">
                      <select
                        aria-label="選擇群別"
                        className="w-full appearance-none bg-[#f4f4f0] border-2 border-black rounded-none text-black py-4 pl-4 pr-10 text-[14px] sm:text-[15px] font-black focus:outline-none focus:bg-white transition-all cursor-pointer shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase"
                        value={filterGroup}
                        onChange={handleFilterChange(setFilterGroup)}
                      >
                        <option value="">所有群別</option>
                        {groups.map(grp => (
                          <option key={`grp-${grp}`} value={grp}>{grp}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-black">
                        <ChevronDown size={20} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

        {/* Results Info & Toolbar */}
        {!isLoading && (
          <div id="results-top" className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-1">
            <div className="flex flex-wrap items-center gap-3 text-sm font-black text-black uppercase tracking-widest bg-[#f4f4f0] p-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <span className="flex items-center">顯示 <span className="text-[#E54B4B] text-xl mx-2 underline decoration-4 underline-offset-4">{filteredSchools.length}</span> 筆結果</span>
              {filteredSchools.length > 0 && (
                <button 
                  onClick={() => { setSearchTerm(''); setFilterCity(''); setFilterLevel(''); setFilterDayNight(''); setFilterGroup(''); setCurrentPage(1); setShowFavoritesOnly(false); }}
                  className="ml-0 sm:ml-4 text-black bg-white px-4 py-2 border-2 border-black hover:bg-[#E54B4B] hover:text-white transition-colors uppercase text-[12px] shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  清除所有篩選
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] w-full xl:w-auto flex-1">
              {/* Tabs */}
              <div role="tablist" aria-label="資料檢視模式" className="flex items-stretch border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] w-full sm:w-auto">
                <button
                  role="tab"
                  aria-selected={!showFavoritesOnly}
                  onClick={() => setShowFavoritesOnly(false)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-none text-[14px] font-black uppercase transition-colors border-r-2 border-black ${
                    !showFavoritesOnly 
                      ? 'bg-[#F7C548] text-black' 
                      : 'bg-[#f4f4f0] text-black hover:bg-[#E54B4B] hover:text-white'
                  }`}
                >
                  <Building2 size={18} strokeWidth={3} aria-hidden="true" />
                  所有學校
                </button>
                <button
                  role="tab"
                  aria-selected={showFavoritesOnly}
                  onClick={() => setShowFavoritesOnly(true)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-none text-[14px] font-black uppercase transition-colors ${
                    showFavoritesOnly 
                      ? 'bg-[#F7C548] text-black' 
                      : 'bg-[#f4f4f0] text-black hover:bg-[#E54B4B] hover:text-white'
                  }`}
                >
                  <Heart size={18} strokeWidth={3} className={showFavoritesOnly ? "fill-current" : ""} aria-hidden="true" />
                  已收藏與分析
                </button>
              </div>

              <div className="hidden sm:block w-px h-8 bg-black/20 mx-1"></div>

              {/* Action Group */}
              <div className="flex items-center gap-3 flex-1 sm:flex-none sm:justify-end">
                <div className="relative group flex-1 sm:flex-none sm:min-w-[150px]">
                  <select
                    aria-label="排序方式"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-[#f4f4f0] border-2 border-black rounded-none text-black py-3 pl-10 pr-10 text-[14px] font-black uppercase focus:outline-none focus:bg-[#F7C548] transition-all cursor-pointer shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  >
                    <option value="">預設排序</option>
                    <option value="schoolCode">依代碼排序</option>
                    <option value="cityName">依縣市排序</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black">
                    <ArrowUpDown size={18} strokeWidth={3} />
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-black">
                    <ChevronDown size={18} strokeWidth={3} />
                  </div>
                </div>

                <button
                  onClick={exportToCSV}
                  disabled={filteredSchools.length === 0}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-[#f4f4f0] hover:bg-[#5D9B9B] hover:text-white border-2 border-black rounded-none text-[14px] font-black uppercase text-black transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  title="匯出為 CSV"
                >
                  <Download size={18} strokeWidth={3} aria-hidden="true" />
                  <span className="hidden sm:inline">匯出 CSV</span>
                  <span className="sm:hidden">匯出</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-32 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 bg-[#E54B4B] border-4 border-black animate-spin shadow-[4px_4px_0_0_rgba(0,0,0,1)]"></div>
            <p className="text-black bg-white px-4 py-2 border-2 border-black font-black tracking-widest uppercase text-sm shadow-[2px_2px_0_0_rgba(0,0,0,1)]">載入資料中...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSchools.length === 0 && !error && (
          <div className="bg-white border-4 border-black rounded-none p-16 text-center shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-2xl mx-auto mt-8">
            <div className="w-24 h-24 bg-[#F7C548] border-4 border-black flex items-center justify-center mx-auto mb-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <Search size={40} className="text-black" strokeWidth={3} />
            </div>
            <h3 className="text-3xl font-black text-black mb-4 tracking-tighter uppercase">找不到符合的學校資料</h3>
            <p className="text-black bg-[#f4f4f0] p-4 border-2 border-black mb-8 text-[16px] font-bold leading-relaxed shadow-[2px_2px_0_0_rgba(0,0,0,1)]">找不到符合目前篩選條件的學校，請嘗試減少篩選條件或使用其他關鍵字。</p>
            <button 
              onClick={() => { setSearchTerm(''); setFilterCity(''); setFilterLevel(''); setFilterDayNight(''); setFilterGroup(''); setCurrentPage(1); }}
              className="px-8 py-4 bg-black text-white text-[16px] font-black uppercase rounded-none transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-[#E54B4B] border-2 border-transparent hover:border-black"
            >
              清除所有篩選條件
            </button>
          </div>
        )}

        {/* Grid View */}
        {!isLoading && filteredSchools.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {paginatedSchools.map((school, index) => (
              <div key={`${school.schoolCode}-${school.departmentName}-${index}`} className="group relative bg-white border-4 border-black rounded-none hover:-translate-y-2 hover:shadow-[12px_12px_0_0_rgba(0,0,0,1)] shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all duration-200 flex flex-col h-full overflow-hidden">
                {/* Colored Top Bar */}
                <div className={`h-4 w-full border-b-4 border-black ${['bg-[#E54B4B]', 'bg-[#F7C548]', 'bg-[#5D9B9B]'][index % 3]}`}></div>
                
                <div className="p-6 sm:p-8 flex-1 flex flex-col relative z-10 bg-white">
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      {school.cityName && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black text-black bg-[#F7C548] border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase">
                          <MapPin size={14} strokeWidth={3} />
                          {school.cityName}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 -mt-1 -mr-1">
                      <button
                        onClick={() => toggleCompare(school)}
                        aria-label={compareList.some(s => s.schoolCode === school.schoolCode && s.departmentName === school.departmentName) ? "取消比較" : "加入比較"}
                        className={`p-2 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all ${compareList.some(s => s.schoolCode === school.schoolCode && s.departmentName === school.departmentName) ? "text-white bg-black" : "text-black bg-white hover:bg-[#F7C548]"}`}
                        title={compareList.some(s => s.schoolCode === school.schoolCode && s.departmentName === school.departmentName) ? "取消比較" : "加入比較"}
                      >
                        <Scale size={16} strokeWidth={3} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => toggleFavorite(school)}
                        aria-label={favorites.includes(`${school.schoolCode}-${school.departmentName}`) ? "取消收藏" : "加入收藏"}
                        className="p-2 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-black bg-white hover:bg-[#E54B4B] hover:text-white transition-all"
                        title={favorites.includes(`${school.schoolCode}-${school.departmentName}`) ? "取消收藏" : "加入收藏"}
                      >
                        <Heart size={16} strokeWidth={3} className={favorites.includes(`${school.schoolCode}-${school.departmentName}`) ? "fill-current" : ""} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-5 flex-1">
                    <h3 className="text-[22px] font-black text-black leading-tight uppercase tracking-tighter decoration-4 decoration-[#F7C548] underline-offset-4 group-hover:underline transition-all">
                      {school.schoolName}
                    </h3>
                  </div>
                  
                  <div className="flex flex-col mb-6 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-white divide-y-2 divide-black">
                    {school.levelName && (
                      <div className="flex items-stretch group-hover:bg-[#5D9B9B] group-hover:text-white transition-colors">
                        <div className="bg-[#f4f4f0] px-3 py-2 border-r-2 border-black flex items-center justify-center shrink-0 w-[70px] group-hover:bg-[#4a7c7c] transition-colors">
                          <span className="text-[11px] font-black uppercase tracking-widest text-black group-hover:text-white">等級</span>
                        </div>
                        <div className="px-3 py-2 flex items-center min-w-0 flex-1">
                          <span className="text-[14px] font-bold truncate" title={school.levelName}>{school.levelName}</span>
                        </div>
                      </div>
                    )}
                    {school.dayNightName && (
                      <div className="flex items-stretch group-hover:bg-black group-hover:text-white transition-colors">
                        <div className="bg-[#f4f4f0] px-3 py-2 border-r-2 border-black flex items-center justify-center shrink-0 w-[70px] group-hover:bg-[#333] transition-colors">
                          <span className="text-[11px] font-black uppercase tracking-widest text-black group-hover:text-white">日夜</span>
                        </div>
                        <div className="px-3 py-2 flex items-center min-w-0 flex-1">
                          <span className="text-[14px] font-bold truncate" title={school.dayNightName}>{school.dayNightName}</span>
                        </div>
                      </div>
                    )}
                    {school.groupName && (
                      <div className="flex items-stretch group-hover:bg-[#F7C548] transition-colors">
                        <div className="bg-[#f4f4f0] px-3 py-2 border-r-2 border-black flex items-center justify-center shrink-0 w-[70px]">
                          <span className="text-[11px] font-black text-black uppercase tracking-widest">群別</span>
                        </div>
                        <div className="px-3 py-2 flex items-center min-w-0 flex-1">
                          <span className="text-[14px] font-bold text-black truncate" title={school.groupName}>{school.groupName}</span>
                        </div>
                      </div>
                    )}
                    
                    {school.departmentName && (
                      <div className="flex items-stretch group-hover:bg-[#5D9B9B] group-hover:text-white transition-colors">
                        <div className="bg-[#f4f4f0] px-3 py-2 border-r-2 border-black flex items-center justify-center shrink-0 w-[70px] group-hover:bg-[#4a7c7c] group-hover:text-white transition-colors">
                          <span className="text-[11px] font-black uppercase tracking-widest">科系</span>
                        </div>
                        <div className="px-3 py-2 flex items-center min-w-0 flex-1">
                          <span className="text-[14px] font-bold truncate" title={school.departmentName}>{school.departmentName}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t-4 border-black flex items-center justify-between">
                    <button 
                      className="flex items-center gap-2 group/copy cursor-pointer bg-[#f4f4f0] hover:bg-black hover:text-white transition-colors border-2 border-black px-3 py-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus:outline-none focus:ring-4 focus:ring-black" 
                      onClick={() => copyToClipboard(school.schoolCode, '學校代碼')} 
                      title="點擊複製代碼"
                      aria-label={`複製學校代碼 ${school.schoolCode}`}
                    >
                      <span className="text-[11px] font-black tracking-widest uppercase opacity-80">ID</span>
                      <span className="text-[14px] font-bold flex items-center gap-2">
                        {school.schoolCode}
                        <Copy size={14} strokeWidth={3} className="opacity-50 group-hover/copy:opacity-100" aria-hidden="true" />
                      </span>
                    </button>
                    <button 
                      onClick={() => window.open(`https://www.google.com/search?q=${school.schoolName}`, '_blank')}
                      aria-label="在 Google 搜尋此學校"
                      className="w-10 h-10 bg-white text-black border-2 border-black flex items-center justify-center hover:bg-[#E54B4B] hover:text-white transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                      title="Google 搜尋"
                    >
                      <Search size={18} strokeWidth={3} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!isLoading && filteredSchools.length > 0 && viewMode === 'list' && (
          <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[15px] whitespace-nowrap">
                <thead className="bg-[#f4f4f0] border-b-4 border-black text-black uppercase text-[14px] font-black tracking-widest">
                  <tr>
                    <th className="px-6 py-6 border-r-2 border-black">代碼</th>
                    <th className="px-6 py-6 border-r-2 border-black">學校名稱</th>
                    <th className="px-6 py-6 border-r-2 border-black">所在縣市</th>
                    <th className="px-6 py-6 border-r-2 border-black">屬性 / 群科</th>
                    <th className="px-6 py-6 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  {paginatedSchools.map((school, index) => (
                    <tr key={`${school.schoolCode}-${school.departmentName}-${index}`} className="hover:bg-[#F7C548] transition-colors group">
                      <td className="px-6 py-5 border-r-2 border-black">
                        <span className="text-[14px] font-bold bg-white px-3 py-1.5 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                          {school.schoolCode}
                        </span>
                      </td>
                      <td className="px-6 py-5 border-r-2 border-black">
                        <div className="font-black text-black text-[18px] uppercase flex items-center gap-3">
                          <div className="p-2 bg-black text-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            <Building2 size={20} strokeWidth={3} />
                          </div>
                          {school.schoolName}
                        </div>
                      </td>
                      <td className="px-6 py-5 border-r-2 border-black">
                        <div className="inline-flex items-stretch border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-white">
                          <div className="bg-[#F7C548] px-2 flex items-center justify-center border-r-2 border-black">
                            <MapPin size={16} strokeWidth={3} className="text-black" />
                          </div>
                          <div className="bg-white px-3 py-1.5 text-[12px] font-black text-black uppercase">
                            {school.cityName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 border-r-2 border-black">
                        <div className="flex flex-col gap-2">
                          {school.levelName && (
                            <span className="text-[13px] font-black text-black bg-[#5D9B9B] px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase truncate max-w-[200px]">
                              等: {school.levelName}
                            </span>
                          )}
                          {school.dayNightName && (
                            <span className="text-[13px] font-black text-white bg-black px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase truncate max-w-[200px]">
                              時: {school.dayNightName}
                            </span>
                          )}
                          {school.groupName && (
                            <span className="text-[13px] font-black text-black bg-[#F7C548] px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase truncate max-w-[200px]">
                              群: {school.groupName}
                            </span>
                          )}
                          {school.departmentName && (
                            <span className="text-[13px] font-black text-black bg-white px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] truncate max-w-[200px]">
                              系: {school.departmentName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right space-x-2">
                        <button
                          onClick={() => copyToClipboard(school.schoolCode, '學校代碼')}
                          aria-label="複製學校代碼"
                          className="p-2 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-black bg-white hover:bg-[#5D9B9B] hover:text-white transition-all inline-flex"
                          title="複製代碼"
                        >
                          <Copy size={18} strokeWidth={3} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => toggleCompare(school)}
                          aria-label={compareList.some(s => s.schoolCode === school.schoolCode && s.departmentName === school.departmentName) ? "取消比較" : "加入比較"}
                          className={`p-2 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all inline-flex ${compareList.some(s => s.schoolCode === school.schoolCode && s.departmentName === school.departmentName) ? "text-white bg-black" : "text-black bg-white hover:bg-[#F7C548]"}`}
                          title={compareList.some(s => s.schoolCode === school.schoolCode && s.departmentName === school.departmentName) ? "取消比較" : "加入比較"}
                        >
                          <Scale size={18} strokeWidth={3} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => toggleFavorite(school)}
                          aria-label={favorites.includes(`${school.schoolCode}-${school.departmentName}`) ? "取消收藏" : "加入收藏"}
                          className="p-2 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-black bg-white hover:bg-[#E54B4B] hover:text-white transition-all inline-flex"
                          title={favorites.includes(`${school.schoolCode}-${school.departmentName}`) ? "取消收藏" : "加入收藏"}
                        >
                          <Heart size={18} strokeWidth={3} className={favorites.includes(`${school.schoolCode}-${school.departmentName}`) ? "fill-current" : ""} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && filteredSchools.length > itemsPerPage && (
          <div className="mt-12 flex justify-center items-center gap-3 border-t-4 border-black pt-8">
            <button
              onClick={() => {
                setCurrentPage(p => Math.max(1, p - 1));
                document.getElementById('results-top')?.scrollIntoView({ behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              aria-label="上一頁"
              className="w-12 h-12 flex items-center justify-center bg-white border-4 border-black rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all text-black hover:bg-[#F7C548]"
            >
              <ChevronLeft size={24} strokeWidth={3} aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      document.getElementById('results-top')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    aria-label={`第 ${pageNum} 頁`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                    className={`w-12 h-12 flex items-center justify-center border-4 border-black rounded-none font-black text-[16px] transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] ${
                      currentPage === pageNum
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-[#F7C548]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                setCurrentPage(p => Math.min(totalPages, p + 1));
                document.getElementById('results-top')?.scrollIntoView({ behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              aria-label="下一頁"
              className="w-12 h-12 flex items-center justify-center bg-white border-4 border-black rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all text-black hover:bg-[#F7C548]"
            >
              <ChevronRight size={24} strokeWidth={3} aria-hidden="true" />
            </button>
          </div>
        )}

        {showFavoritesOnly && (
          <div className="mt-16 space-y-12 border-t-8 border-black pt-12">
            <h2 className="text-3xl font-black text-black uppercase tracking-widest flex items-center gap-3">
              <PieChartIcon size={32} strokeWidth={3} />
              收藏分析
            </h2>
            {!isLoading && filteredSchools.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-[#f4f4f0] border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] h-[420px] flex flex-col">
                    <div className="flex items-center gap-4 mb-8 shrink-0 border-b-4 border-black pb-4">
                      <div className="w-12 h-12 bg-[#F7C548] text-black flex items-center justify-center border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                        <BarChart2 size={24} strokeWidth={3} />
                      </div>
                      <div>
                        <h3 className="text-[24px] font-black text-black tracking-tight uppercase leading-none">縣市分佈</h3>
                        <p className="text-[14px] font-bold text-black mt-2 tracking-widest uppercase">篩選條件下的各縣市學校統計</p>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 w-full relative -ml-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataCity} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="0" vertical={false} stroke="#000" strokeWidth={2} />
                          <XAxis 
                            dataKey="name" 
                            axisLine={{ stroke: '#000', strokeWidth: 4 }}
                            tickLine={{ stroke: '#000', strokeWidth: 4, length: 6 }} 
                            tick={{ fill: '#000', fontSize: 13, fontWeight: 900 }}
                            dy={15}
                          />
                          <YAxis 
                            axisLine={{ stroke: '#000', strokeWidth: 4 }}
                            tickLine={{ stroke: '#000', strokeWidth: 4, length: 6 }}
                            tick={{ fill: '#000', fontSize: 13, fontWeight: 900 }}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                            contentStyle={{ borderRadius: '0', border: '4px solid #000', boxShadow: '4px 4px 0 0 rgba(0,0,0,1)', fontWeight: 900, color: '#000', padding: '12px 16px', backgroundColor: '#fff' }}
                            itemStyle={{ color: '#E54B4B', fontWeight: 900 }}
                          />
                          <Bar dataKey="count" name="學校數量" maxBarSize={48}>
                            {chartDataCity.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill="#F7C548" stroke="#000" strokeWidth={4} />
                             ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#f4f4f0] border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] h-[420px] flex flex-col">
                    <div className="flex items-center gap-4 mb-8 shrink-0 border-b-4 border-black pb-4">
                      <div className="w-12 h-12 bg-[#5D9B9B] text-black flex items-center justify-center border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                        <PieChartIcon size={24} strokeWidth={3} />
                      </div>
                      <div>
                        <h3 className="text-[24px] font-black text-black tracking-tight uppercase leading-none">學校等級</h3>
                        <p className="text-[14px] font-bold text-black mt-2 tracking-widest uppercase">各等級佔比</p>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartDataLevel}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="#000"
                            strokeWidth={4}
                            label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                            labelLine={false}
                          >
                            {chartDataLevel.map((entry, index) => {
                              const colors = ['#E54B4B', '#F7C548', '#5D9B9B', '#fff'];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="#000" strokeWidth={4} />
                            })}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '0', border: '4px solid #000', boxShadow: '4px 4px 0 0 rgba(0,0,0,1)', fontWeight: 900, color: '#000', padding: '12px 16px', backgroundColor: '#fff' }}
                            itemStyle={{ fontWeight: 900 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#f4f4f0] border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] h-[420px] flex flex-col lg:col-span-2">
                    <div className="flex items-center gap-4 mb-8 shrink-0 border-b-4 border-black pb-4">
                      <div className="w-12 h-12 bg-black text-white flex items-center justify-center border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                        <Clock size={24} strokeWidth={3} />
                      </div>
                      <div>
                        <h3 className="text-[24px] font-black text-black tracking-tight uppercase leading-none">日夜間部</h3>
                        <p className="text-[14px] font-bold text-black mt-2 tracking-widest uppercase">日間部與進修部數量對比</p>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 w-full relative -ml-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataDayNight} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="0" horizontal={false} stroke="#000" strokeWidth={2} />
                          <XAxis 
                            type="number"
                            axisLine={{ stroke: '#000', strokeWidth: 4 }}
                            tickLine={{ stroke: '#000', strokeWidth: 4, length: 6 }} 
                            tick={{ fill: '#000', fontSize: 13, fontWeight: 900 }}
                          />
                          <YAxis 
                            dataKey="name"
                            type="category"
                            axisLine={{ stroke: '#000', strokeWidth: 4 }}
                            tickLine={{ stroke: '#000', strokeWidth: 4, length: 6 }} 
                            tick={{ fill: '#000', fontSize: 13, fontWeight: 900 }}
                            dx={-15}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                            contentStyle={{ borderRadius: '0', border: '4px solid #000', boxShadow: '4px 4px 0 0 rgba(0,0,0,1)', fontWeight: 900, color: '#000', padding: '12px 16px', backgroundColor: '#fff' }}
                            itemStyle={{ color: '#E54B4B', fontWeight: 900 }}
                          />
                          <Bar dataKey="value" name="數量" maxBarSize={48}>
                             {chartDataDayNight.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={index === 0 ? '#E54B4B' : '#5D9B9B'} stroke="#000" strokeWidth={4} />
                             ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-[#f4f4f0] border-4 border-black p-16 text-center shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                <div className="w-24 h-24 bg-white border-4 border-black flex items-center justify-center mx-auto mb-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <BarChart2 size={40} className="text-black" strokeWidth={3} />
                </div>
                <h3 className="text-[24px] font-black text-black mb-4 tracking-tighter uppercase">沒有圖表資料可供分析</h3>
                <p className="text-[16px] font-bold text-black bg-white px-4 py-2 border-2 border-black inline-block shadow-[2px_2px_0_0_rgba(0,0,0,1)]">請嘗試調整篩選條件，以顯示更多學校資料。</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white border-t-8 border-black mt-auto relative z-20 shrink-0 pb-24 md:pb-6">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
          <div className="flex items-center gap-3">
             <div className="bg-[#F7C548] p-2 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
               <Database size={28} strokeWidth={3} className="text-black" />
             </div>
             <span className="font-black text-[20px] tracking-[0.1em] uppercase">TWHS Database</span>
          </div>
          
          <div className="flex items-center gap-8 text-[14px] font-black uppercase tracking-widest">
            <a href="https://tyctw.github.io/public/about.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#F7C548] hover:underline underline-offset-4 transition-colors">關於我們</a>
            <a href="https://tyctw.github.io/public/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#F7C548] hover:underline underline-offset-4 transition-colors">隱私權政策</a>
            <a href="https://tyctw.github.io/public/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#F7C548] hover:underline underline-offset-4 transition-colors">服務條款</a>
          </div>

          <div className="text-[12px] font-black text-white/60 text-center md:text-right tracking-widest uppercase">
            &copy; {new Date().getFullYear()} 台灣高級中等學校名錄 版權所有.
          </div>
        </div>
      </footer>

      {/* Floating Compare Banner */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 sm:p-6 pointer-events-none flex justify-center">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-none p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pointer-events-auto max-w-4xl w-full mx-auto">
            <div className="flex-1 w-full flex items-center gap-5 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              <div className="flex items-center gap-2.5 shrink-0 text-[16px] font-black text-black uppercase tracking-widest bg-[#F7C548] px-3 py-1.5 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                <Scale size={20} strokeWidth={3} className="text-black" />
                比較清單 ({compareList.length}/3)
              </div>
              <div className="flex items-center gap-2.5">
                {compareList.map((school) => (
                  <div key={`${school.schoolCode}-${school.departmentName}`} className="flex items-center gap-2 bg-[#f4f4f0] border-2 border-black px-3 py-2 shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)] group">
                    <span className="text-[14px] font-bold text-black max-w-[140px] truncate">{school.schoolName}</span>
                    <button 
                      onClick={() => toggleCompare(school)}
                      aria-label={`從比較清單移除 ${school.schoolName}`}
                      className="text-black hover:text-white hover:bg-[#E54B4B] p-1 border-2 border-transparent hover:border-black transition-colors"
                    >
                      <X size={16} strokeWidth={3} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setCompareList([])}
                className="flex-1 sm:flex-none px-6 py-3 text-[14px] font-black uppercase text-black bg-white border-2 border-black hover:bg-[#f4f4f0] shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                清除
              </button>
              <button
                onClick={() => setShowCompareModal(true)}
                disabled={compareList.length < 2}
                className="flex-1 sm:flex-none px-6 py-3 bg-[#5D9B9B] text-black text-[14px] font-black uppercase border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:translate-x-0 disabled:hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] disabled:cursor-not-allowed hover:bg-black hover:text-white"
              >
                開始比較
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] rounded-none w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 sm:p-8 border-b-4 border-black bg-[#F7C548]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white text-black flex items-center justify-center border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <Scale size={24} strokeWidth={3} />
                </div>
                <h2 className="text-[24px] font-black text-black tracking-tighter uppercase">學校比較</h2>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                aria-label="關閉比較視窗"
                className="p-2 bg-white border-2 border-black text-black hover:bg-[#E54B4B] hover:text-white transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                <X size={24} strokeWidth={3} aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#f4f4f0]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                {compareList.map(school => (
                  <div key={`${school.schoolCode}-${school.departmentName}`} className="bg-white border-4 border-black rounded-none flex flex-col shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                    <div className="p-6 bg-[#F7C548] border-b-4 border-black">
                      <h3 className="font-black text-[20px] text-black mb-2 leading-snug uppercase">{school.schoolName}</h3>
                      <p className="text-[14px] font-black tracking-widest text-black bg-white px-2 py-1 inline-block border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">ID: {school.schoolCode}</p>
                    </div>
                    <div className="p-6 flex-1 flex flex-col gap-6">
                      <div className="flex flex-col gap-2">
                        <div className="text-[12px] font-black text-black uppercase tracking-widest bg-[#f4f4f0] px-2 py-1 border-2 border-black self-start shadow-[2px_2px_0_0_rgba(0,0,0,1)]">所在縣市</div>
                        <div className="text-[16px] font-bold text-black flex items-center gap-2">
                          <MapPin size={18} strokeWidth={3} className="text-[#E54B4B]" />
                          {school.cityName}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[12px] font-black text-black uppercase tracking-widest bg-[#f4f4f0] px-2 py-1 border-2 border-black self-start shadow-[2px_2px_0_0_rgba(0,0,0,1)]">學校等級</div>
                        <div className="text-[16px] font-bold text-black flex items-center gap-2">
                          <GraduationCap size={18} strokeWidth={3} className="text-[#5D9B9B]" />
                          {school.levelName}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[12px] font-black text-black uppercase tracking-widest bg-[#f4f4f0] px-2 py-1 border-2 border-black self-start shadow-[2px_2px_0_0_rgba(0,0,0,1)]">日夜別</div>
                        <div className="text-[16px] font-bold text-black flex items-center gap-2">
                          <Clock size={18} strokeWidth={3} className="text-black" />
                          {school.dayNightName}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[12px] font-black text-black uppercase tracking-widest bg-[#f4f4f0] px-2 py-1 border-2 border-black self-start shadow-[2px_2px_0_0_rgba(0,0,0,1)]">群別</div>
                        <div className="text-[16px] font-bold text-black flex items-center gap-2">
                          <BookOpen size={18} strokeWidth={3} className="text-black" />
                          {school.groupName || '-'}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[12px] font-black text-black uppercase tracking-widest bg-[#f4f4f0] px-2 py-1 border-2 border-black self-start shadow-[2px_2px_0_0_rgba(0,0,0,1)]">科系</div>
                        <div className="text-[16px] font-bold text-black flex items-center gap-2">
                          <Tag size={18} strokeWidth={3} className="text-black" />
                          {school.departmentName || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
