import React, { useEffect, useState } from 'react';
import { Project } from '../types';
import { subscribeProjects } from '../lib/storage';
import { exportAllProjectsToExcel } from '../lib/excel';
import { calculateOverallProgress } from '../lib/utils';
import { Plus, Download, Folder, ChevronLeft, LogOut, X, Sliders, Search, Layers, User } from 'lucide-react';

const AVAILABLE_COLUMNS_INFO = [
  { key: 'rowNum', label: 'ردیف', category: 'عمومی' },
  { key: 'projectName', label: 'عنوان پروژه', category: 'عمومی' },
  { key: 'mainUsage', label: 'کاربری اصلی', category: 'مشخصات' },
  { key: 'subUsage', label: 'کاربری فرعی', category: 'مشخصات' },
  { key: 'type', label: 'تیپ مرکز', category: 'مشخصات' },
  { key: 'county', label: 'محل احداث (شهرستان)', category: 'مکان‌یافت' },
  { key: 'projectScale', label: 'تیپ برآورد', category: 'مشخصات' },
  { key: 'area', label: 'متراژ زیربنا', category: 'فنی' },
  { key: 'floors', label: 'تعداد طبقات', category: 'فنی' },
  { key: 'beds', label: 'تعداد تخت', category: 'فنی' },
  { key: 'progress', label: 'درصد پیشرفت کل', category: 'فنی' },
  { key: 'startDate', label: 'تاریخ شروع', category: 'زمانبندی' },
  { key: 'endDate', label: 'تاریخ پایان', category: 'زمانبندی' },
  { key: 'status', label: 'وضعیت اجرای طرح', category: 'فنی' },
  { key: 'supervisorName', label: 'نام مهندسی ناظر', category: 'قرارداد' },
  { key: 'contractorName', label: 'شرکت پیمانکار', category: 'قرارداد' },
  { key: 'contractAmount', label: 'مبلغ نهایی پیمان', category: 'قرارداد' },
  { key: 'lastPaymentAmount', label: 'مبلغ آخرین پرداخت', category: 'قرارداد' },
  { key: 'lastPaymentDate', label: 'تاریخ آخرین پرداخت', category: 'قرارداد' },
  { key: 'executionMethod', label: 'روش ارجاع کار', category: 'قرارداد' },
];

interface DashboardViewProps {
  supervisorName: string;
  onNavigate: (view: 'project_form' | 'project_detail', projectId?: string) => void;
  onLogout: () => void;
}

export function DashboardView({ supervisorName, onNavigate, onLogout }: DashboardViewProps) {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filterType, setFilterType] = useState<'my' | 'all'>('my');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Advanced Excel export states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedMainUsages, setSelectedMainUsages] = useState<string[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [selectedScales, setSelectedScales] = useState<string[]>([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'rowNum', 'projectName', 'mainUsage', 'county', 'area', 'progress', 'startDate', 'endDate', 'status'
  ]);
  const [groupBy, setGroupBy] = useState<'status' | 'mainUsage' | 'county' | 'none'>('none');

  const uniqueStatuses = Array.from(new Set(allProjects.map(p => p.status).filter(Boolean))) as string[];
  const uniqueMainUsages = Array.from(new Set(allProjects.map(p => p.mainUsage).filter(Boolean))) as string[];
  const uniqueCounties = Array.from(new Set(allProjects.map(p => p.county).filter(Boolean))) as string[];
  const uniqueSupervisors = Array.from(new Set(allProjects.flatMap(p => [p.supervisorName, p.supervisorCivil, p.supervisorElectrical, p.supervisorMechanical]).filter(Boolean))) as string[];
  const uniqueScales = Array.from(new Set(allProjects.map(p => p.projectScale || 'under_200'))) as string[];

  const handleToggleColumn = (key: string) => {
    if (key === 'projectName' || key === 'rowNum') return;
    if (selectedColumns.includes(key)) {
      setSelectedColumns(selectedColumns.filter(c => c !== key));
    } else {
      setSelectedColumns([...selectedColumns, key]);
    }
  };

  const handleToggleStatus = (val: string) => {
    if (selectedStatuses.includes(val)) {
      setSelectedStatuses(selectedStatuses.filter(x => x !== val));
    } else {
      setSelectedStatuses([...selectedStatuses, val]);
    }
  };

  const handleToggleMainUsage = (val: string) => {
    if (selectedMainUsages.includes(val)) {
      setSelectedMainUsages(selectedMainUsages.filter(x => x !== val));
    } else {
      setSelectedMainUsages([...selectedMainUsages, val]);
    }
  };

  const handleToggleCounty = (val: string) => {
    if (selectedCounties.includes(val)) {
      setSelectedCounties(selectedCounties.filter(x => x !== val));
    } else {
      setSelectedCounties([...selectedCounties, val]);
    }
  };

  const handleToggleScale = (val: string) => {
    if (selectedScales.includes(val)) {
      setSelectedScales(selectedScales.filter(x => x !== val));
    } else {
      setSelectedScales([...selectedScales, val]);
    }
  };

  const handleApplyPreset = (presetType: 'simple' | 'comprehensive' | 'financial') => {
    if (presetType === 'simple') {
      setSelectedColumns(['rowNum', 'projectName', 'mainUsage', 'county', 'area', 'progress', 'startDate', 'endDate', 'status']);
      setGroupBy('none');
    } else if (presetType === 'comprehensive') {
      setSelectedColumns([
        'rowNum', 'projectName', 'type', 'mainUsage', 'subUsage', 'county', 'projectScale', 
        'area', 'floors', 'beds', 'progress', 'startDate', 'endDate', 'status', 'supervisorName'
      ]);
      setGroupBy('status');
    } else if (presetType === 'financial') {
      setSelectedColumns([
        'rowNum', 'projectName', 'mainUsage', 'county', 'contractorName', 'contractAmount', 'executionMethod', 'progress', 'status'
      ]);
      setGroupBy('county');
    }
  };

  const getFilteredProjectsCount = () => {
    let temp = [...allProjects];
    if (selectedStatuses.length > 0) temp = temp.filter(p => selectedStatuses.includes(p.status));
    if (selectedMainUsages.length > 0) temp = temp.filter(p => selectedMainUsages.includes(p.mainUsage));
    if (selectedCounties.length > 0) temp = temp.filter(p => selectedCounties.includes(p.county));
    if (selectedScales.length > 0) temp = temp.filter(p => selectedScales.includes(p.projectScale || 'under_200'));
    if (selectedSupervisors.length > 0) {
      temp = temp.filter(p => 
        selectedSupervisors.includes(p.supervisorName) || 
        (p.supervisorCivil && selectedSupervisors.includes(p.supervisorCivil)) ||
        (p.supervisorElectrical && selectedSupervisors.includes(p.supervisorElectrical)) ||
        (p.supervisorMechanical && selectedSupervisors.includes(p.supervisorMechanical))
      );
    }
    return temp.length;
  };

  const executeAdvancedExport = async () => {
    try {
      await exportAllProjectsToExcel(allProjects, {
        selectedStatuses,
        selectedMainUsages,
        selectedCounties,
        selectedScales,
        selectedSupervisors,
        selectedColumns,
        groupBy
      });
      setIsExportModalOpen(false);
    } catch (e) {
      console.error('Export advanced failed', e);
      alert('خطا در ایجاد گزارش پیشرفته اکسل');
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeProjects((data) => {
      setAllProjects(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const baseProjects = filterType === 'all'
    ? allProjects
    : allProjects.filter(p => 
        p.supervisorName === supervisorName || 
        p.supervisorCivil === supervisorName || 
        p.supervisorElectrical === supervisorName || 
        p.supervisorMechanical === supervisorName
      );

  const projects = baseProjects.filter(p => 
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportAll = async () => {
    if (filterType === 'all') {
      setIsExportModalOpen(true);
    } else {
      try {
        await exportAllProjectsToExcel(projects, {
          selectedColumns: [
            'rowNum', 'projectName', 'type', 'mainUsage', 'subUsage', 'county', 'projectScale', 
            'area', 'floors', 'beds', 'progress', 'startDate', 'endDate', 'status', 'supervisorName',
            'contractorName', 'contractAmount', 'lastPaymentAmount', 'lastPaymentDate', 'executionMethod'
          ],
          groupBy: 'none'
        });
      } catch (e) {
        console.error('Export my projects failed', e);
        alert('خطا در ایجاد گزارش اکسل');
      }
    }
  };

  if (loading) return <div className="p-8 text-center" dir="rtl">در حال بارگذاری...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12" dir="rtl">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/logo-square.png" 
              alt="MUMS Logo" 
              className="h-12 w-auto object-contain hidden sm:block" 
              onError={(e) => {
                e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/en/e/ef/Mashhad_University_of_Medical_Sciences_logo.svg";
                e.currentTarget.onerror = null;
              }}
            />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900">داشبورد پروژه‌ها</h1>
              <span className="text-sm text-gray-500">ناظر: {supervisorName}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center">
              <img 
                src="/logo-wide.png" 
                alt="دانشگاه علوم پزشکی مشهد" 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                  }
                }}
              />
              <span className="hidden text-sm font-bold text-gray-700">دانشگاه علوم پزشکی مشهد</span>
            </div>
            <button 
              onClick={onLogout}
              className="text-gray-500 hover:text-red-500 flex items-center gap-2 text-sm bg-gray-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
            >
              خروج <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
        {/* Box-based Tab switcher for Projects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <button
            onClick={() => setFilterType('my')}
            className={`flex flex-col p-6 rounded-2xl border-2 transition-all cursor-pointer text-right shadow-sm ${
              filterType === 'my'
                ? 'border-blue-500 bg-[#f4f8ff]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center w-full mb-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl flex items-center justify-center ${
                  filterType === 'my' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <User size={24} />
                </div>
                <span className={`font-bold text-xl ${
                  filterType === 'my' ? 'text-blue-900' : 'text-gray-800'
                }`}>
                  پروژه‌های من
                </span>
              </div>
              <span className={`text-4xl font-bold ${
                filterType === 'my' ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {allProjects.filter(p => p.supervisorName === supervisorName).length}
              </span>
            </div>
            <p className={`text-sm mt-2 ${filterType === 'my' ? 'text-blue-600/80' : 'text-gray-500'}`}>
              پروژه‌هایی که شما به عنوان ناظر در آن‌ها تعریف شده‌اید
            </p>
          </button>

          <button
            onClick={() => setFilterType('all')}
            className={`flex flex-col p-6 rounded-2xl border-2 transition-all cursor-pointer text-right shadow-sm ${
              filterType === 'all'
                ? 'border-blue-500 bg-[#f4f8ff]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center w-full mb-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl flex items-center justify-center ${
                  filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Layers size={24} />
                </div>
                <span className={`font-bold text-xl ${
                  filterType === 'all' ? 'text-blue-900' : 'text-gray-800'
                }`}>
                  همه پروژه‌های سامانه
                </span>
              </div>
              <span className={`text-4xl font-bold ${
                filterType === 'all' ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {allProjects.length}
              </span>
            </div>
            <p className={`text-sm mt-2 ${filterType === 'all' ? 'text-blue-600/80' : 'text-gray-500'}`}>
              دسترسی به تمامی پروژه‌های ثبت شده در سامانه یکپارچه
            </p>
          </button>
        </div>

        {/* Toolbar Container */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 shadow-sm">
          {/* Search - Right side (first in RTL) */}
          <div className="relative w-full sm:max-w-md">
            <input 
              type="text" 
              placeholder="جستجوی پروژه..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 hover:bg-white transition-colors"
              dir="rtl"
            />
            <Search className="absolute right-3 top-3 text-gray-400" size={18} />
          </div>

          {/* Actions - Left side (second in RTL) */}
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('project_form')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm"
            >
              <Plus size={18} />
              افزودن پروژه جدید
            </button>
            <button
              onClick={handleExportAll}
              disabled={projects.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-[#61c991] px-5 py-2.5 text-white text-sm font-medium hover:bg-[#4ea876] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="خروجی اکسل کلی"
            >
              <Download size={18} />
              خروجی اکسل
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <Folder size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ پروژه‌ای یافت نشد</h3>
            <p className="text-gray-500 max-w-sm">برای این بخش در حال حاضر هیچ پروژه‌ای ثبت نشده است.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <div 
                key={project.id} 
                onClick={() => onNavigate('project_detail', project.id)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all cursor-pointer flex flex-col group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500 rounded-r-xl group-hover:bg-blue-600 transition-colors"></div>
                
                <div className="flex justify-between items-start mb-4 pr-3">
                  <div className="flex flex-col gap-1 w-full">
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1 leading-tight">{project.projectName}</h3>
                    {filterType === 'all' && (
                      <span className="text-[11px] text-gray-500 font-medium bg-gray-100 px-2.5 py-0.5 rounded border border-gray-200/50 w-fit">
                        ناظر: {project.supervisorName || 'کاربر'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600 mb-6 flex-1 pr-3">
                  {/* Overall Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-700">پیشرفت کل پروژه</span>
                      <span className="font-bold text-blue-600">{calculateOverallProgress(project)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${calculateOverallProgress(project)}%` }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-400">کاربری اصلی</span>
                      <span className="font-medium text-gray-800">{project.mainUsage || '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-400">محل احداث</span>
                      <span className="font-medium text-gray-800">{project.county || '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-400">متراژ زیربنا</span>
                      <span className="font-medium text-gray-800">{project.area ? `${project.area} مترمربع` : '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-400">وضعیت اجرایی</span>
                      <span className={`inline-flex w-fit px-2 py-0.5 rounded text-xs font-medium ${
                        project.status === 'فعال' ? 'bg-green-100 text-green-700' : 
                        project.status === 'متوقف' ? 'bg-red-100 text-red-700' : 
                        project.status === 'اتمام یافته' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end text-blue-600 text-sm font-medium mt-auto group-hover:text-blue-700">
                  <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg group-hover:bg-blue-100 transition-colors">
                    مشاهده پروژه
                    <ChevronLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Advanced Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-gray-905/60 bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-905 text-lg">تنظیمات و پیش‌فیلترهای گزارش اکسل اداری</h3>
                  <p className="text-xs text-gray-500">پروژه‌ها را فیلتر کرده، ستون‌های مورد نیاز را برگزینید و تب‌های فایل را تفکیک کنید.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              
              {/* Helper Presets */}
              <div>
                <span className="font-semibold text-gray-700 block mb-2">⚡ قالب‌های آماده خروجی (کلیک جهت تنظیم سریع):</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleApplyPreset('simple')}
                    className="flex flex-col items-start gap-1 p-3 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/20 text-right transition cursor-pointer w-full"
                  >
                    <span className="font-bold text-gray-808">۱. گزارش خلاصه فیزیکی</span>
                    <span className="text-[11px] text-gray-500">استاندارد، بدون تفکیک تب‌ها (سریع)</span>
                  </button>
                  <button
                    onClick={() => handleApplyPreset('comprehensive')}
                    className="flex flex-col items-start gap-1 p-3 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/20 text-right transition cursor-pointer w-full"
                  >
                    <span className="font-bold text-gray-808">۲. گزارش نظارتی کامل</span>
                    <span className="text-[11px] text-gray-500">تمام ستون‌ها تفکیک‌شده بر اساس وضعیت پروژه</span>
                  </button>
                  <button
                    onClick={() => handleApplyPreset('financial')}
                    className="flex flex-col items-start gap-1 p-3 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/20 text-right transition cursor-pointer w-full"
                  >
                    <span className="font-bold text-gray-808">۳. گزارش مالی و پیمانکاران</span>
                    <span className="text-[11px] text-gray-500">ستون‌های مبلغ، پیمانکار تفکیک‌شده بر اساس شهرستان</span>
                  </button>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Section 1: Filters */}
              <div>
                <span className="font-semibold text-gray-808 block mb-3">🔍 فیلترهای محدودکننده‌ی اطلاعات خروجی:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Statuses Filter */}
                  <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/40">
                    <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-100">
                      <span className="font-bold text-gray-700 text-xs">فیلتر وضعیت اجرا</span>
                      <button 
                        onClick={() => setSelectedStatuses([])}
                        className={`text-[11px] font-medium ${selectedStatuses.length === 0 ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-blue-600'}`}
                      >
                        همه وضعیت‌ها
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto">
                      {uniqueStatuses.map(st => (
                        <button
                          key={st}
                          onClick={() => handleToggleStatus(st)}
                          className={`px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer ${
                            selectedStatuses.includes(st)
                              ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-55'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Usages Filter */}
                  <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/40">
                    <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-100">
                      <span className="font-bold text-gray-700 text-xs">فیلتر کاربری اصلی</span>
                      <button 
                        onClick={() => setSelectedMainUsages([])}
                        className={`text-[11px] font-medium ${selectedMainUsages.length === 0 ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-blue-600'}`}
                      >
                        همه کاربری‌ها
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto">
                      {uniqueMainUsages.map(mu => (
                        <button
                          key={mu}
                          onClick={() => handleToggleMainUsage(mu)}
                          className={`px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer ${
                            selectedMainUsages.includes(mu)
                              ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-55'
                          }`}
                        >
                          {mu}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Counties Filter */}
                  <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/40">
                    <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-100">
                      <span className="font-bold text-gray-700 text-xs">فیلتر شهرستان</span>
                      <button 
                        onClick={() => setSelectedCounties([])}
                        className={`text-[11px] font-medium ${selectedCounties.length === 0 ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-blue-600'}`}
                      >
                        همه شهرستان‌ها
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto">
                      {uniqueCounties.map(ct => (
                        <button
                          key={ct}
                          onClick={() => handleToggleCounty(ct)}
                          className={`px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer ${
                            selectedCounties.includes(ct)
                              ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-55'
                          }`}
                        >
                          {ct}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scales Filter */}
                  <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/40">
                    <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-100">
                      <span className="font-bold text-gray-700 text-xs">فیلتر تیپ برآورد</span>
                      <button 
                        onClick={() => setSelectedScales([])}
                        className={`text-[11px] font-medium ${selectedScales.length === 0 ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-blue-600'}`}
                      >
                        همه تیپ‌ها
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto">
                      {uniqueScales.map(sc => (
                        <button
                          key={sc}
                          onClick={() => handleToggleScale(sc)}
                          className={`px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer ${
                            selectedScales.includes(sc)
                              ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-55'
                          }`}
                        >
                          {sc === 'above_1000' ? 'بالای ۱۰۰۰ متر' : sc === 'between_200_1000' ? 'بین ۲۰۰ تا ۱۰۰۰ متر' : 'زیر ۲۰۰ متر'}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Section 2: Columns select */}
              <div>
                <span className="font-semibold text-gray-808 block mb-3">📍 انتخاب ستون‌های گنجانده‌شده در فایل نهایی:</span>
                
                <div className="space-y-4">
                  {['عمومی', 'مشخصات', 'فنی', 'زمانبندی', 'قرارداد'].map(cat => {
                    const catCols = AVAILABLE_COLUMNS_INFO.filter(col => col.category === cat || (cat === 'مشخصات' && col.category === 'مکان‌یافت'));
                    if (catCols.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-1.5">
                        <span className="text-[11px] font-bold text-gray-400 tracking-wider block bg-gray-100 px-2.5 py-0.5 rounded w-fit">{cat}</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                          {catCols.map(col => {
                            const isRequired = col.key === 'projectName' || col.key === 'rowNum';
                            const isChecked = selectedColumns.includes(col.key) || isRequired;
                            return (
                              <label 
                                key={col.key} 
                                className={`flex items-center gap-2 px-3 py-2 border rounded-xl transition text-xs ${
                                  isRequired 
                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                    : isChecked
                                      ? 'bg-blue-50/40 border-blue-200 text-blue-900 font-medium hover:bg-blue-50/60 cursor-pointer'
                                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isRequired}
                                  onChange={() => handleToggleColumn(col.key)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                                <span>{col.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Section 3: Worksheeting / grouping */}
              <div>
                <span className="font-semibold text-gray-808 block mb-2">📑 نحوه تقسیم‌بندی تب‌های فایل اکسل (Worksheets / Tabs):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'none', label: 'یک شیت یک‌پارچه', desc: 'کل پروژه‌ها بدون تفکیک در یک صفحه' },
                    { id: 'status', label: 'تفکیک بر‌اساس وضعیت اجرا', desc: 'تب اختصاصی برای فعال، غیرفعال و...' },
                    { id: 'mainUsage', label: 'تفکیک بر‌اساس کاربری اصلی', desc: 'تب اختصاصی به ازای هر کاربری اصلی' },
                    { id: 'county', label: 'تفکیک بر‌اساس شهرستان', desc: 'تب اختصاصی به ازای هر شهرستان' },
                  ].map(groupOpt => (
                    <label 
                      key={groupOpt.id} 
                      className={`flex flex-col items-start gap-1 p-3 border rounded-xl transition cursor-pointer text-right ${
                        groupBy === groupOpt.id
                          ? 'border-blue-500 bg-blue-50/20 text-blue-900 font-medium'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="groupingOption"
                          checked={groupBy === groupOpt.id}
                          onChange={() => setGroupBy(groupOpt.id as any)}
                          className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                        />
                        <span className="font-bold text-xs">{groupOpt.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 leading-tight pr-6">{groupOpt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5 text-right w-full sm:w-auto">
                <span className="text-xs text-gray-500">پروژه‌های مشمول فیلترها:</span>
                <span className="font-bold text-blue-600 text-sm">
                  {getFilteredProjectsCount()} پروژه از {allProjects.length} کل پروژه‌های ثبت شده
                </span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="flex-1 sm:flex-none justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium bg-white hover:bg-gray-50 cursor-pointer text-xs"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={executeAdvancedExport}
                  disabled={getFilteredProjectsCount() === 0}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md text-xs"
                >
                  <Download size={16} />
                  تولید و دانلود اکسل
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
