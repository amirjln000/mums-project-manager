import React, { useState, useEffect } from 'react';
import { Project, ProjectType, ProjectStatus } from '../types';
import { PROJECT_TYPES, PROJECT_STATUSES, SUB_USAGES, COUNTIES, MAIN_USAGES, SUPERVISORS_LIST } from '../data/disciplines';
import { saveProject, getProject } from '../lib/storage';
import { ArrowRight, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { SearchableSelect } from '../components/SearchableSelect';

interface ProjectFormViewProps {
  supervisorName: string;
  projectId?: string; // If editing
  onNavigate: (view: 'dashboard' | 'project_detail', id?: string) => void;
}

export function ProjectFormView({ supervisorName, projectId, onNavigate }: ProjectFormViewProps) {
  const [formData, setFormData] = useState<Partial<Project>>({
    projectName: '',
    type: PROJECT_TYPES[0] as ProjectType,
    projectScale: 'under_200',
    county: '',
    mainUsage: '',
    subUsage: '',
    supervisorCivil: '',
    supervisorElectrical: '',
    supervisorMechanical: '',
    area: '',
    floors: '',
    beds: '',
    startDate: '',
    endDate: '',
    contractorName: '',
    contractDate: '',
    contractNumber: '',
    contractAmount: '',
    lastPaymentAmount: '',
    lastPaymentDate: '',
    status: 'شروع نشده',
    description: ''
  });

  const [selectedSubUsage, setSelectedSubUsage] = useState('');
  const [isCustomSubUsage, setIsCustomSubUsage] = useState(false);

  const [originalData, setOriginalData] = useState<Project | null>(null);

  useEffect(() => {
    if (projectId) {
      getProject(projectId).then(p => {
        if (p) {
          setOriginalData(p);
          setFormData(p);
          if (p.subUsage) {
            if (SUB_USAGES.includes(p.subUsage) && p.subUsage !== 'سایر') {
              setSelectedSubUsage(p.subUsage);
              setIsCustomSubUsage(false);
            } else {
              setSelectedSubUsage('سایر');
              setIsCustomSubUsage(true);
            }
          }
        }
      });
    }
  }, [projectId]);

  const handleSubUsageSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSubUsage(val);
    if (val === 'سایر') {
      setIsCustomSubUsage(true);
      setFormData(prev => ({ ...prev, subUsage: '' }));
    } else {
      setIsCustomSubUsage(false);
      setFormData(prev => ({ ...prev, subUsage: val }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.type) return alert('نام و تیپ پروژه الزامی است');

    const historyItems = formData.history ? [...formData.history] : [];
    
    let details = '';
    if (projectId && originalData) {
      const changes: string[] = [];
      const keysToTrack: (keyof Project)[] = ['projectName', 'status', 'description', 'contractorName', 'executionMethod', 'county', 'mainUsage', 'subUsage', 'supervisorCivil', 'supervisorElectrical', 'supervisorMechanical'];
      keysToTrack.forEach(key => {
        if (formData[key] !== originalData[key]) {
          changes.push(`تغییر ${key} از "${originalData[key] || 'خالی'}" به "${formData[key] || 'خالی'}"`);
        }
      });
      if (changes.length > 0) {
        details = changes.join(' | ');
      } else {
        details = `ویرایش توسط: ${supervisorName}`;
      }
    } else {
      details = `ایجاد توسط: ${supervisorName}`;
    }

    historyItems.push({
      id: uuidv4(),
      timestamp: Date.now(),
      user: supervisorName,
      action: projectId ? 'ویرایش مشخصات پروژه' : 'ایجاد پروژه',
      details
    });

    const project: Project = {
      id: projectId || uuidv4(),
      supervisorName,
      reports: formData.reports || [],
      history: historyItems,
      projectScale: formData.projectScale || 'under_200',
      ...(formData as any)
    };

    try {
      await saveProject(project);
      onNavigate(projectId ? 'project_detail' : 'dashboard', project.id);
    } catch (e) {
      console.error(e);
      alert('خطا در ذخیره‌سازی پروژه. در صورت آپلود تصاویر زیاد، ممکن است حجم دیتابیس پر شده باشد.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12" dir="rtl">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate(projectId ? 'project_detail' : 'dashboard', projectId)}
              className="text-gray-500 hover:text-gray-900"
            >
              <ArrowRight size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">{projectId ? 'ویرایش پروژه' : 'افزودن پروژه جدید'}</h1>
          </div>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition"
          >
            <Save size={18} />
            ذخیره
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Info */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">اطلاعات اصلی</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">نام پروژه *</label>
                <input required name="projectName" value={formData.projectName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ناظر ابنیه</label>
                  <SearchableSelect 
                    options={SUPERVISORS_LIST} 
                    value={formData.supervisorCivil || ''} 
                    onChange={v => setFormData(prev => ({ ...prev, supervisorCivil: v }))} 
                    placeholder="انتخاب ناظر..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ناظر تاسیسات برق</label>
                  <SearchableSelect 
                    options={SUPERVISORS_LIST} 
                    value={formData.supervisorElectrical || ''} 
                    onChange={v => setFormData(prev => ({ ...prev, supervisorElectrical: v }))} 
                    placeholder="انتخاب ناظر..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ناظر تاسیسات مکانیک</label>
                  <SearchableSelect 
                    options={SUPERVISORS_LIST} 
                    value={formData.supervisorMechanical || ''} 
                    onChange={v => setFormData(prev => ({ ...prev, supervisorMechanical: v }))} 
                    placeholder="انتخاب ناظر..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شهرستان</label>
                <select name="county" value={formData.county || ''} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  <option value="">انتخاب کنید...</option>
                  {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مختصات جغرافیایی</label>
                <input name="geoCoordinates" value={formData.geoCoordinates} onChange={handleChange} placeholder="مثال: 36.2605, 59.6168" className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">کاربری اصلی</label>
                <select name="mainUsage" value={formData.mainUsage || ''} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  <option value="">انتخاب کنید...</option>
                  {MAIN_USAGES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700">کاربری فرعی</label>
                <select 
                  value={selectedSubUsage} 
                  onChange={handleSubUsageSelectChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">انتخاب کنید...</option>
                  {SUB_USAGES.map(usage => (
                    <option key={usage} value={usage}>{usage}</option>
                  ))}
                </select>
                
                {isCustomSubUsage && (
                  <input 
                    name="subUsage" 
                    value={formData.subUsage} 
                    onChange={handleChange} 
                    placeholder="عنوان کاربری فرعی سفارشی را بنویسید..."
                    className="w-full mt-1 rounded-lg border border-orange-300 px-3 py-2 bg-orange-50/20 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-sm transition-all" 
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تیپ پروژه *</label>
                <select required name="type" value={formData.type} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مقیاس و تیپ برآورد پروژه *</label>
                <select required name="projectScale" value={formData.projectScale || 'under_200'} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  <option value="under_200">زیر ۲۰۰ متر مربع (برآورد قدیم)</option>
                  <option value="between_200_1000">بین ۲۰۰ تا ۱۰۰۰ متر مربع (برآورد جدید)</option>
                  <option value="above_1000">بالای ۱۰۰۰ متر مربع (برآورد پروژه بزرگ)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت اجرایی پروژه</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Physical Specs */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">مشخصات فیزیکی</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">زیربنا (مترمربع)</label>
                <input type="number" name="area" value={formData.area} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تعداد طبقات</label>
                <input type="number" name="floors" value={formData.floors} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تعداد تخت</label>
                <input type="number" name="beds" value={formData.beds} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ شروع</label>
                <DatePicker 
                  calendar={persian} 
                  locale={persian_fa} 
                  value={formData.startDate}
                  onChange={(date: any) => setFormData(prev => ({...prev, startDate: date?.format?.('YYYY/MM/DD') || date?.toString() || ''}))}
                  inputClass="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  containerClassName="w-full"
                />
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ پایان (پیش‌بینی)</label>
                <DatePicker 
                  calendar={persian} 
                  locale={persian_fa} 
                  value={formData.endDate}
                  onChange={(date: any) => setFormData(prev => ({...prev, endDate: date?.format?.('YYYY/MM/DD') || date?.toString() || ''}))}
                  inputClass="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  containerClassName="w-full"
                />
              </div>
            </div>
          </section>

          {/* Contract */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">مشخصات پیمان</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام پیمانکار</label>
                <input name="contractorName" value={formData.contractorName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">روش اجرا</label>
                <select name="executionMethod" value={formData.executionMethod || ''} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  <option value="">انتخاب کنید...</option>
                  <option value="امانی">امانی</option>
                  <option value="پیمانی">پیمانی</option>
                  <option value="امانی/پیمانی">امانی/پیمانی</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شماره قرارداد</label>
                <input name="contractNumber" value={formData.contractNumber} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ قرارداد</label>
                <DatePicker 
                  calendar={persian} 
                  locale={persian_fa} 
                  value={formData.contractDate}
                  onChange={(date: any) => setFormData(prev => ({...prev, contractDate: date?.format?.('YYYY/MM/DD') || date?.toString() || ''}))}
                  inputClass="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  containerClassName="w-full"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ قرارداد (ریال)</label>
                <input type="text" name="contractAmount" value={formData.contractAmount} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" dir="ltr" />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ آخرین پرداخت</label>
                <DatePicker
                  value={formData.lastPaymentDate as any}
                  onChange={(date: any) => setFormData(prev => ({...prev, lastPaymentDate: date?.format?.('YYYY/MM/DD') || date?.toString() || ''}))}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  containerClassName="w-full"
                  inputClass="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ آخرین پرداخت (ریال)</label>
                <input type="text" name="lastPaymentAmount" value={formData.lastPaymentAmount || ''} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" dir="ltr" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"></textarea>
              </div>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
