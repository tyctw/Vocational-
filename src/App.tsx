import React, { useState, useMemo, useEffect } from 'react';
import { School } from './types';
import { Search, GraduationCap, Building2, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, List, AlertCircle, RefreshCw, ArrowRight, MapPin, BookOpen, Clock, Tag, Compass, Target, MessageSquare, Menu, X, Heart, Download, Copy, ArrowUpDown, Scale, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export default function App() {
  const [schoolsData, setSchoolsData] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white/70 backdrop-blur-2xl border-b border-slate-200/60 sticky top-0 z-40 supports-[backdrop-filter]:bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3.5 shrink-0 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(99,102,241,0.5)] group-hover:shadow-[0_8px_25px_-5px_rgba(99,102,241,0.6)] group-hover:-translate-y-0.5 transition-all duration-300">
                <GraduationCap size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-slate-900 leading-none">台灣高中職名錄</span>
                <span className="text-[10.5px] font-bold text-indigo-500/80 tracking-[0.2em] uppercase mt-1.5">Taiwan High Schools</span>
              </div>
            </div>
            
            {/* Header Right */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2.5 text-xs font-bold text-slate-500 bg-white/60 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                共 {schoolsData.length} 筆資料
              </div>
              
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-3 -mr-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all duration-300 hover:shadow-sm"
                aria-label="打開選單"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Slide-out Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-500 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsMenuOpen(false)}
      ></div>

      {/* Slide-out Menu Panel */}
      <div className={`fixed inset-y-0 right-0 w-[300px] sm:w-[380px] bg-white z-50 shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 flex items-center justify-center text-white rounded-xl shadow-md">
              <GraduationCap size={18} strokeWidth={2} />
            </div>
            <span className="font-black text-2xl text-slate-900 tracking-tight">導覽選單</span>
          </div>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={22} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-8 px-6 sm:px-8 space-y-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">升學輔導資源</div>
          <a href="https://tyctw.github.io/future/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl hover:bg-indigo-50/80 border border-transparent hover:border-indigo-100/80 text-slate-700 hover:text-indigo-700 font-bold transition-all group shadow-sm hover:shadow-md hover:shadow-indigo-500/10">
            <div className="p-3 bg-white text-indigo-500 rounded-xl group-hover:scale-110 transition-transform shadow-sm border border-indigo-50">
              <Compass size={22} />
            </div>
            <span className="text-base">高職十五學群導覽</span>
            <ArrowRight size={18} className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-400" />
          </a>
          <a href="https://tyctw.github.io/spare/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl hover:bg-emerald-50/80 border border-transparent hover:border-emerald-100/80 text-slate-700 hover:text-emerald-700 font-bold transition-all group shadow-sm hover:shadow-md hover:shadow-emerald-500/10">
            <div className="p-3 bg-white text-emerald-500 rounded-xl group-hover:scale-110 transition-transform shadow-sm border border-emerald-50">
              <Target size={22} />
            </div>
            <span className="text-base">會考落點分析</span>
            <ArrowRight size={18} className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-400" />
          </a>
          <a href="https://tyctw.github.io/shared/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl hover:bg-sky-50/80 border border-transparent hover:border-sky-100/80 text-slate-700 hover:text-sky-700 font-bold transition-all group shadow-sm hover:shadow-md hover:shadow-sky-500/10">
            <div className="p-3 bg-white text-sky-500 rounded-xl group-hover:scale-110 transition-transform shadow-sm border border-sky-50">
              <MessageSquare size={22} />
            </div>
            <span className="text-base">錄取分享</span>
            <ArrowRight size={18} className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-sky-400" />
          </a>
        </div>
        
        <div className="p-6 sm:p-8 bg-gradient-to-b from-transparent to-slate-50/80 border-t border-slate-100">
          <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
            <span className="text-sm font-bold text-slate-500">資料總筆數</span>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-black text-xl text-slate-900">{schoolsData.length}</span>
            </div>
          </div>
        </div>
      </div>

      {error && !isLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 text-red-900 p-5 border border-red-200 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center rounded-3xl">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-full shrink-0 shadow-inner">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-black uppercase tracking-wide text-sm text-red-800">連線錯誤</h3>
              <p className="text-sm mt-1 text-red-700/80 font-medium">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 sm:mt-0 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all flex items-center gap-2 shrink-0 rounded-full shadow-md hover:shadow-lg focus:ring-4 focus:ring-red-500/20"
            >
              <RefreshCw size={16} /> 重新整理
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="relative bg-[#F8FAFC] border-b border-slate-200/60 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 via-white/50 to-[#F8FAFC] pointer-events-none"></div>
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-[900px] h-[900px] bg-gradient-to-bl from-indigo-200/30 via-purple-100/20 to-transparent rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[700px] h-[700px] bg-gradient-to-tr from-sky-200/30 via-blue-100/20 to-transparent rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-slate-200/80 text-[11px] font-bold tracking-[0.15em] text-indigo-600 mb-8 shadow-sm uppercase">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              Taiwan Open Data
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-slate-900 mb-6 leading-[1.15]">
              台灣高級中等學校
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500">開放資料庫</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl leading-relaxed font-medium">
              收錄全台高中、高職及相關教育機構的名錄，提供便捷的查詢與資料探索體驗。
            </p>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <div className="relative z-20 -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] rounded-[2rem] p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="搜尋學校名稱或地址..."
                className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-slate-50/80 hover:bg-slate-100/80 focus:bg-white border border-slate-200/60 rounded-2xl text-slate-900 text-[15px] focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 font-medium shadow-sm"
                value={searchTerm}
                onChange={handleFilterChange(setSearchTerm)}
              />
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap w-full lg:w-auto gap-3">
              <div className="relative flex-1 sm:flex-none">
                <select
                  className="w-full sm:w-[140px] appearance-none bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 rounded-2xl text-slate-700 py-3.5 sm:py-4 pl-4 pr-10 text-[15px] focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer font-medium shadow-sm hover:shadow"
                  value={filterCity}
                  onChange={handleFilterChange(setFilterCity)}
                >
                  <option value="">全部縣市</option>
                  {cities.map(city => (
                    <option key={`city-${city}`} value={city}>{city}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <ChevronDown size={16} strokeWidth={2.5} />
                </div>
              </div>

              <div className="relative flex-1 sm:flex-none">
                <select
                  className="w-full sm:w-[140px] appearance-none bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 rounded-2xl text-slate-700 py-3.5 sm:py-4 pl-4 pr-10 text-[15px] focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer font-medium shadow-sm hover:shadow"
                  value={filterLevel}
                  onChange={handleFilterChange(setFilterLevel)}
                >
                  <option value="">所有等級</option>
                  {levels.map(level => (
                    <option key={`level-${level}`} value={level}>{level}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <ChevronDown size={16} strokeWidth={2.5} />
                </div>
              </div>

              <div className="relative flex-1 sm:flex-none">
                <select
                  className="w-full sm:w-[140px] appearance-none bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 rounded-2xl text-slate-700 py-3.5 sm:py-4 pl-4 pr-10 text-[15px] focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer font-medium shadow-sm hover:shadow"
                  value={filterDayNight}
                  onChange={handleFilterChange(setFilterDayNight)}
                >
                  <option value="">日夜別</option>
                  {dayNights.map(dn => (
                    <option key={`dn-${dn}`} value={dn}>{dn}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <ChevronDown size={16} strokeWidth={2.5} />
                </div>
              </div>

              <div className="relative flex-1 sm:flex-none">
                <select
                  className="w-full sm:w-[140px] appearance-none bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 rounded-2xl text-slate-700 py-3.5 sm:py-4 pl-4 pr-10 text-[15px] focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer font-medium shadow-sm hover:shadow"
                  value={filterGroup}
                  onChange={handleFilterChange(setFilterGroup)}
                >
                  <option value="">所有群別</option>
                  {groups.map(grp => (
                    <option key={`grp-${grp}`} value={grp}>{grp}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <ChevronDown size={16} strokeWidth={2.5} />
                </div>
              </div>

              <div className="hidden sm:flex bg-slate-50/80 rounded-2xl p-1.5 border border-slate-200/60 shrink-0 shadow-sm items-center">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] border border-slate-200/50 scale-105' : 'text-slate-400 hover:text-slate-900 border border-transparent hover:bg-slate-200/50'}`}
                  title="網格視圖"
                >
                  <LayoutGrid size={20} strokeWidth={2} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] border border-slate-200/50 scale-105' : 'text-slate-400 hover:text-slate-900 border border-transparent hover:bg-slate-200/50'}`}
                  title="列表視圖"
                >
                  <List size={20} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

        {/* Tabs */}
        <div className="mb-10 flex justify-center sm:justify-start">
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-[1.25rem] border border-slate-200/80 shadow-inner w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-[15px] font-bold transition-all duration-300 ${
                activeTab === 'list' 
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50 scale-[1.02]' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'
              }`}
            >
              <List size={18} strokeWidth={2.5} />
              學校列表
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-[15px] font-bold transition-all duration-300 ${
                activeTab === 'analysis' 
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50 scale-[1.02]' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'
              }`}
            >
              <PieChartIcon size={18} strokeWidth={2.5} />
              資料分析
            </button>
          </div>
        </div>

        {activeTab === 'list' && (
          <>
            {/* Placement Analysis Promo Banner */}
            <div className="mb-10 relative overflow-hidden bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
              <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-gradient-to-bl from-indigo-100/60 to-transparent rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-gradient-to-tr from-purple-100/50 to-transparent rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative px-6 py-10 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50/80 text-indigo-600 border border-indigo-100/80 text-xs font-bold tracking-[0.15em] mb-5 shadow-sm uppercase">
                    <Target size={16} strokeWidth={2.5} className="text-indigo-500" />
                    <span>全新功能上線</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                    歡迎使用 114 年落點分析系統
                  </h2>
                  <p className="text-slate-500 text-[15px] sm:text-[17px] font-medium max-w-xl leading-relaxed">
                    還在為填志願煩惱嗎？輸入您的成績，讓我們用精準的數據為您推薦最適合的學校與科系，讓未來升學之路更清晰。
                  </p>
                </div>
                <div className="shrink-0 w-full md:w-auto">
                  <a 
                    href="https://tyctw.github.io/spare/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-[0_8px_20px_rgba(15,23,42,0.2)] hover:shadow-[0_12px_25px_rgba(15,23,42,0.3)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      立即開始分析
                      <ArrowRight size={20} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </a>
                </div>
              </div>
            </div>

        {/* Results Info & Toolbar */}
        {!isLoading && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
              <span>顯示 <span className="text-slate-900 font-black">{filteredSchools.length}</span> 筆結果</span>
              {filteredSchools.length > 0 && (
                <button 
                  onClick={() => { setSearchTerm(''); setFilterCity(''); setFilterLevel(''); setFilterDayNight(''); setFilterGroup(''); setCurrentPage(1); setShowFavoritesOnly(false); }}
                  className="text-slate-400 hover:text-indigo-600 hover:underline flex items-center gap-1 transition-colors"

                >
                  清除所有篩選
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-2 px-3 py-2 sm:py-2 rounded-xl text-[13px] font-bold transition-all border ${
                  showFavoritesOnly 
                    ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Heart size={14} strokeWidth={2.5} className={showFavoritesOnly ? "fill-current" : ""} />
                {showFavoritesOnly ? '顯示全部' : '已收藏'}
              </button>

              <div className="relative group">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 py-2 sm:py-2 pl-8 pr-8 text-[13px] font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm group-hover:shadow"
                >
                  <option value="">預設排序</option>
                  <option value="schoolCode">依代碼排序</option>
                  <option value="cityName">依縣市排序</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <ArrowUpDown size={14} strokeWidth={2} />
                </div>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown size={14} strokeWidth={2.5} />
                </div>
              </div>

              <button
                onClick={exportToCSV}
                disabled={filteredSchools.length === 0}
                className="flex items-center gap-2 px-3 py-2 sm:py-2 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-[13px] font-bold text-slate-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow"
                title="匯出為 CSV"
              >
                <Download size={14} strokeWidth={2.5} />
                <span className="hidden sm:inline">匯出 CSV</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-32 flex flex-col items-center justify-center space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-200 rounded-full blur-xl animate-pulse opacity-60"></div>
              <div className="w-14 h-14 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin relative z-10 shadow-sm"></div>
            </div>
            <p className="text-slate-500 font-bold tracking-[0.2em] uppercase text-sm animate-pulse">載入資料中...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSchools.length === 0 && !error && (
          <div className="bg-white/60 backdrop-blur-md border border-slate-200/80 rounded-[2rem] p-16 text-center shadow-sm max-w-2xl mx-auto mt-8">
            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3">
              <Search size={32} className="text-slate-400 -rotate-3" strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">找不到符合的學校資料</h3>
            <p className="text-slate-500 mb-8 text-[15px] font-medium leading-relaxed">找不到符合目前篩選條件的學校，請嘗試減少篩選條件或使用其他關鍵字。</p>
            <button 
              onClick={() => { setSearchTerm(''); setFilterCity(''); setFilterLevel(''); setFilterDayNight(''); setFilterGroup(''); setCurrentPage(1); }}
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[15px] font-bold rounded-2xl transition-all shadow-[0_4px_15px_rgba(15,23,42,0.15)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.25)] hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-slate-900/20"
            >
              清除所有篩選條件
            </button>
          </div>
        )}

        {/* Grid View */}
        {!isLoading && filteredSchools.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedSchools.map((school, index) => (
              <div key={`${school.schoolCode}-${school.departmentName}-${index}`} className="group relative bg-white border border-slate-200/50 rounded-[1.75rem] hover:border-indigo-200 hover:shadow-[0_12px_35px_-5px_rgba(79,70,229,0.15)] transition-all duration-500 flex flex-col h-full overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-1 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="p-6 sm:p-7 flex-1 flex flex-col relative z-10">
                  <div className="flex items-start justify-between mb-5 gap-3">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      {school.cityName && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 rounded-xl border border-slate-200/60 shadow-sm transition-colors group-hover:bg-white group-hover:border-slate-300">
                          <MapPin size={12} className="text-slate-400" />
                          {school.cityName}
                        </span>
                      )}
                      {school.levelName && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold text-teal-700 bg-teal-50/80 rounded-xl border border-teal-200/60 shadow-sm transition-colors group-hover:bg-white group-hover:border-teal-300">
                          <GraduationCap size={12} className="text-teal-500" />
                          {school.levelName}
                        </span>
                      )}
                      {school.dayNightName && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold text-violet-700 bg-violet-50/80 rounded-xl border border-violet-200/60 shadow-sm transition-colors group-hover:bg-white group-hover:border-violet-300">
                          <Clock size={12} className="text-violet-500" />
                          {school.dayNightName}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-0.5 shrink-0 -mr-2 -mt-2 bg-white/50 backdrop-blur-sm rounded-full p-1 border border-slate-100 shadow-sm">
                      <button
                        onClick={() => toggleCompare(school)}
                        className={`p-2 rounded-full transition-all ${compareList.some(s => s.schoolCode === school.schoolCode && s.departmentName === school.departmentName) ? "text-indigo-600 bg-indigo-50 shadow-inner" : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"}`}
                        title={compareList.some(s => s.schoolCode === school.schoolCode && s.departmentName === school.departmentName) ? "取消比較" : "加入比較"}
                      >
                        <Scale size={16} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => toggleFavorite(school)}
                        className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        title={favorites.includes(`${school.schoolCode}-${school.departmentName}`) ? "取消收藏" : "加入收藏"}
                      >
                        <Heart size={16} strokeWidth={2.5} className={favorites.includes(`${school.schoolCode}-${school.departmentName}`) ? "fill-rose-500 text-rose-500" : ""} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-5 flex-1">
                    <h3 className="text-[22px] font-black text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2 tracking-tight">
                      {school.schoolName}
                    </h3>
                  </div>
                  
                  <div className="flex flex-col gap-2.5 mb-6">
                    {school.groupName && (
                      <div className="flex items-center gap-3.5 bg-slate-50/80 rounded-2xl p-3 border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 group-hover:shadow-[0_2px_10px_-3px_rgba(99,102,241,0.1)] transition-all duration-300">
                        <div className="w-10 h-10 rounded-[14px] bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100/50">
                          <BookOpen size={18} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">群別</span>
                          <span className="text-[15px] font-bold text-slate-800 truncate">{school.groupName}</span>
                        </div>
                      </div>
                    )}
                    
                    {school.departmentName && (
                      <div className="flex items-center gap-3.5 bg-slate-50/80 rounded-2xl p-3 border border-slate-100 group-hover:bg-white group-hover:border-purple-100 group-hover:shadow-[0_2px_10px_-3px_rgba(168,85,247,0.1)] transition-all duration-300">
                        <div className="w-10 h-10 rounded-[14px] bg-purple-50 text-purple-500 flex items-center justify-center shrink-0 border border-purple-100/50">
                          <Tag size={18} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">科系</span>
                          <span className="text-[15px] font-bold text-slate-800 truncate">{school.departmentName}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 group/copy cursor-pointer" onClick={() => copyToClipboard(school.schoolCode, '學校代碼')} title="點擊複製代碼">
                      <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">ID</span>
                      <span className="text-[13px] font-mono font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/50 group-hover/copy:bg-indigo-50 group-hover/copy:text-indigo-600 group-hover/copy:border-indigo-200 transition-colors flex items-center gap-2">
                        {school.schoolCode}
                        <Copy size={14} strokeWidth={2.5} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                      </span>
                    </div>
                    <button 
                      onClick={() => window.open(`https://www.google.com/search?q=${school.schoolName}`, '_blank')}
                      className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 transform hover:bg-indigo-600 hover:text-white text-indigo-600 shadow-sm hover:shadow-[0_4px_12px_rgba(79,70,229,0.3)]"
                      title="Google 搜尋"
                    >
                      <Search size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!isLoading && filteredSchools.length > 0 && viewMode === 'list' && (
          <div className="bg-white border border-slate-200/80 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11.5px] font-bold tracking-[0.15em]">
                  <tr>
                    <th className="px-6 py-5 font-bold">代碼</th>
                    <th className="px-6 py-5 font-bold">學校名稱</th>
                    <th className="px-6 py-5 font-bold">所在縣市</th>
                    <th className="px-6 py-5 font-bold">等級</th>
                    <th className="px-6 py-5 font-bold">日夜別</th>
                    <th className="px-6 py-5 font-bold">群別 / 科系</th>
                    <th className="px-6 py-5 font-bold text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSchools.map((school, index) => (
                    <tr key={`${school.schoolCode}-${school.departmentName}-${index}`} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4.5">
                        <span className="text-[13px] font-mono font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors shadow-sm">
                          {school.schoolCode}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="font-black text-slate-900 text-base flex items-center gap-3">
                          <div className="p-2 bg-slate-100/80 rounded-xl text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            <Building2 size={16} strokeWidth={2.5} />
                          </div>
                          {school.schoolName}
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-slate-600 font-bold text-[15px]">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} strokeWidth={2.5} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          {school.cityName}
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-teal-700 bg-teal-50 rounded-xl border border-teal-100">
                          <GraduationCap size={14} strokeWidth={2.5} className="text-teal-500" />
                          {school.levelName}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 rounded-xl border border-indigo-100">
                          <Clock size={14} strokeWidth={2.5} className="text-indigo-500" />
                          {school.dayNightName}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col gap-2.5">
                          {school.groupName && (
                            <div className="flex items-center gap-2 font-bold text-[15px] text-slate-800">
                              <BookOpen size={16} strokeWidth={2.5} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                              {school.groupName}
                            </div>
                          )}
                          {school.departmentName && (
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                              <Tag size={14} strokeWidth={2.5} className="text-slate-400 group-hover:text-purple-400 transition-colors" />
                              {school.departmentName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyToClipboard(school.schoolCode, '學校代碼')}
                            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="複製代碼"
                          >
                            <Copy size={16} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => toggleCompare(school)}
                            className={`p-2 rounded-xl transition-colors ${compareList.some(s => s.schoolCode === school.schoolCode && s.departmentName === school.departmentName) ? "text-indigo-600 bg-indigo-50 shadow-inner" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"}`}
                            title={compareList.some(s => s.schoolCode === school.schoolCode && s.departmentName === school.departmentName) ? "取消比較" : "加入比較"}
                          >
                            <Scale size={16} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => toggleFavorite(school)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                            title={favorites.includes(`${school.schoolCode}-${school.departmentName}`) ? "取消收藏" : "加入收藏"}
                          >
                            <Heart size={16} strokeWidth={2.5} className={favorites.includes(`${school.schoolCode}-${school.departmentName}`) ? "fill-rose-500 text-rose-500" : ""} />
                          </button>
                        </div>
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
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-200/80 pt-8">
            <div className="text-[13px] font-bold text-slate-500 bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-sm w-full sm:w-auto text-center sm:text-left flex items-center justify-center sm:justify-start gap-1.5">
              顯示第 <span className="font-black text-indigo-600 text-[15px]">{(currentPage - 1) * itemsPerPage + 1}</span> 至{' '}
              <span className="font-black text-indigo-600 text-[15px]">
                {Math.min(currentPage * itemsPerPage, filteredSchools.length)}
              </span>{' '}
              筆結果，共 <span className="font-black text-slate-900 text-[15px]">{filteredSchools.length}</span> 筆
            </div>
            
            <div className="flex items-center gap-1.5 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm w-full sm:w-auto justify-center sm:justify-start overflow-x-auto">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-all shrink-0"
              >
                <ChevronLeft size={18} strokeWidth={3} />
              </button>
              
              <div className="flex items-center gap-1.5 px-1.5">
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
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[40px] h-10 px-2 rounded-xl text-[15px] font-bold flex items-center justify-center transition-all shrink-0 ${
                        currentPage === pageNum
                          ? 'bg-slate-900 text-white shadow-[0_4px_10px_rgba(15,23,42,0.2)] scale-105'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-all shrink-0"
              >
                <ChevronRight size={18} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}
        </>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-8">
            {!isLoading && filteredSchools.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-slate-200/50 rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[420px] flex flex-col transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    <div className="flex items-center gap-4 mb-8 shrink-0">
                      <div className="w-12 h-12 rounded-[18px] bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50">
                        <BarChart2 size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight">縣市分佈</h3>
                        <p className="text-[14px] font-bold text-slate-500 mt-1 tracking-wide">篩選條件下的各縣市學校統計</p>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataCity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }}
                            dy={15}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                          />
                          <Tooltip 
                            cursor={{ fill: '#eef2ff', opacity: 0.6 }}
                            contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)', fontWeight: 700, color: '#0f172a', padding: '12px 16px', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)' }}
                            itemStyle={{ color: '#4f46e5', fontWeight: 900 }}
                          />
                          <Bar dataKey="count" name="學校數量" radius={[8, 8, 0, 0]} maxBarSize={48}>
                            {chartDataCity.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#818cf8'} className="transition-all duration-300 hover:opacity-80" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/50 rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[420px] flex flex-col transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    <div className="flex items-center gap-4 mb-8 shrink-0">
                      <div className="w-12 h-12 rounded-[18px] bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/50">
                        <PieChartIcon size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight">學校等級</h3>
                        <p className="text-[14px] font-bold text-slate-500 mt-1 tracking-wide">高中職、五專等各等級佔比</p>
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
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                            label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                            labelLine={false}
                          >
                            {chartDataLevel.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="transition-all duration-300 hover:opacity-80 outline-none" />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)', fontWeight: 700, color: '#0f172a', padding: '12px 16px', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)' }}
                            itemStyle={{ fontWeight: 900 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/50 rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[420px] flex flex-col lg:col-span-2 transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    <div className="flex items-center gap-4 mb-8 shrink-0">
                      <div className="w-12 h-12 rounded-[18px] bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100/50">
                        <Clock size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight">日夜間部</h3>
                        <p className="text-[14px] font-bold text-slate-500 mt-1 tracking-wide">日間部與進修部數量對比</p>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataDayNight} layout="vertical" margin={{ top: 10, right: 30, left: 50, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis 
                            type="number"
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                          />
                          <YAxis 
                            dataKey="name"
                            type="category"
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }}
                            dx={-15}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f0f9ff', opacity: 0.6 }}
                            contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)', fontWeight: 700, color: '#0f172a', padding: '12px 16px', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)' }}
                            itemStyle={{ color: '#0ea5e9', fontWeight: 900 }}
                          />
                          <Bar dataKey="value" name="數量" radius={[0, 8, 8, 0]} maxBarSize={48}>
                            {chartDataDayNight.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#0ea5e9' : '#7dd3fc'} className="transition-all duration-300 hover:opacity-80" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 border border-slate-200/80 rounded-[2rem] p-16 text-center">
                <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 rotate-3">
                  <BarChart2 size={32} className="text-slate-300 -rotate-3" strokeWidth={2.5} />
                </div>
                <h3 className="text-[20px] font-black text-slate-900 mb-3 tracking-tight">沒有圖表資料可供分析</h3>
                <p className="text-[15px] font-medium text-slate-500">請嘗試調整篩選條件，以顯示更多學校資料。</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto shrink-0 pb-24 md:pb-6">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 text-slate-900">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shadow-inner">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
            <span className="font-black text-[15px] tracking-[0.2em] uppercase text-slate-800">TWHS Database</span>
          </div>
          
          <div className="flex items-center gap-8 text-[13px] font-bold text-slate-500">
            <a href="https://tyctw.github.io/public/about.html" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">關於我們</a>
            <a href="https://tyctw.github.io/public/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">隱私權政策</a>
            <a href="https://tyctw.github.io/public/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">服務條款</a>
          </div>

          <div className="text-[12px] font-bold text-slate-400 text-center md:text-right tracking-wide">
            &copy; {new Date().getFullYear()} 台灣高級中等學校名錄 版權所有.
          </div>
        </div>
      </footer>

      {/* Floating Compare Banner */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 sm:p-6 pointer-events-none flex justify-center">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_20px_40px_-10px_rgba(15,23,42,0.1)] rounded-[1.5rem] p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pointer-events-auto transform transition-all max-w-4xl w-full mx-auto">
            <div className="flex-1 w-full flex items-center gap-5 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              <div className="flex items-center gap-2.5 shrink-0 text-[14px] font-black text-slate-700">
                <Scale size={20} strokeWidth={2.5} className="text-indigo-500" />
                比較清單 ({compareList.length}/3)
              </div>
              <div className="flex items-center gap-2.5">
                {compareList.map((school) => (
                  <div key={`${school.schoolCode}-${school.departmentName}`} className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 shrink-0 shadow-sm">
                    <span className="text-[13px] font-bold text-slate-800 max-w-[140px] truncate">{school.schoolName}</span>
                    <button 
                      onClick={() => toggleCompare(school)}
                      className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-md transition-colors"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setCompareList([])}
                className="flex-1 sm:flex-none px-5 py-2.5 text-[14px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                清除
              </button>
              <button
                onClick={() => setShowCompareModal(true)}
                disabled={compareList.length < 2}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-bold rounded-xl transition-all shadow-[0_4px_12px_rgba(79,70,229,0.2)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                開始比較
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100/50">
                  <Scale size={24} strokeWidth={2.5} />
                </div>
                <h2 className="text-[22px] font-black text-slate-900 tracking-tight">學校比較</h2>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                {compareList.map(school => (
                  <div key={`${school.schoolCode}-${school.departmentName}`} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                      <h3 className="font-black text-[18px] text-slate-900 mb-1 leading-snug">{school.schoolName}</h3>
                      <p className="text-[13px] font-mono font-bold text-slate-500">{school.schoolCode}</p>
                    </div>
                    <div className="p-6 flex-1 flex flex-col gap-5">
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1.5">所在縣市</div>
                        <div className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                          <MapPin size={16} strokeWidth={2.5} className="text-slate-400" />
                          {school.cityName}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1.5">學校等級</div>
                        <div className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                          <GraduationCap size={16} strokeWidth={2.5} className="text-slate-400" />
                          {school.levelName}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1.5">日夜別</div>
                        <div className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                          <Clock size={16} strokeWidth={2.5} className="text-slate-400" />
                          {school.dayNightName}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1.5">群別</div>
                        <div className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                          <BookOpen size={16} strokeWidth={2.5} className="text-slate-400" />
                          {school.groupName || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1.5">科系</div>
                        <div className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                          <Tag size={16} strokeWidth={2.5} className="text-slate-400" />
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
