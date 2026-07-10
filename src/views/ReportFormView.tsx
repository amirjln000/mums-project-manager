import React, { useState, useRef } from 'react';
import { Project, Discipline, Report, ReportImage } from '../types';
import { getDisciplineItems } from '../data/disciplines';
import { ArrowRight, Save, Camera, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { saveProject } from '../lib/storage';

interface ReportFormViewProps {
  project: Project;
  reportId?: string;
  supervisorName: string;
  onNavigate: (view: any, id?: string, reportId?: string) => void;
}

export function ReportFormView({ project, reportId, supervisorName, onNavigate }: ReportFormViewProps) {
  const [discipline, setDiscipline] = useState<Discipline>('ابنیه');
  const [data, setData] = useState<{ [key in Discipline]: { progress: Record<string, number>; description: string; images: ReportImage[]; } }>({
    'ابنیه': { progress: {}, description: '', images: [] },
    'برق': { progress: {}, description: '', images: [] },
    'مکانیک': { progress: {}, description: '', images: [] }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set initial data for edit mode, or load from previous report for create mode
  React.useEffect(() => {
    if (reportId) {
      const existingReport = project.reports.find(r => r.id === reportId);
      if (existingReport) {
        // If it uses the new structure
        if (existingReport.disciplines) {
          setData({
            'ابنیه': existingReport.disciplines['ابنیه'] || { progress: {}, description: '', images: [] },
            'برق': existingReport.disciplines['برق'] || { progress: {}, description: '', images: [] },
            'مکانیک': existingReport.disciplines['مکانیک'] || { progress: {}, description: '', images: [] },
          });
        } 
        // If it's a legacy single-discipline report
        else if (existingReport.discipline) {
          setData(prev => ({
            ...prev,
            [existingReport.discipline!]: {
              progress: existingReport.progress || {},
              description: existingReport.description || '',
              images: existingReport.images || []
            }
          }));
          setDiscipline(existingReport.discipline);
        }
        return;
      }
    }

    // Creating new report - prepopulate with last values for each discipline
    const newData = {
      'ابنیه': { progress: {}, description: '', images: [] },
      'برق': { progress: {}, description: '', images: [] },
      'مکانیک': { progress: {}, description: '', images: [] }
    };

    (['ابنیه', 'برق', 'مکانیک'] as Discipline[]).forEach(d => {
      // Find latest report that has this discipline
      const lastR = [...project.reports].reverse().find(r => 
        (r.disciplines && r.disciplines[d]) || r.discipline === d
      );
      if (lastR) {
        if (lastR.disciplines && lastR.disciplines[d]) {
          newData[d].progress = lastR.disciplines[d]!.progress;
        } else if (lastR.progress) {
          newData[d].progress = lastR.progress;
        }
      }
    });

    setData(newData);
  }, [project.reports, reportId]);

  const handleProgressChange = (item: string, value: number) => {
    setData(prev => ({
      ...prev,
      [discipline]: {
        ...prev[discipline],
        progress: {
          ...prev[discipline].progress,
          [item]: value
        }
      }
    }));
  };

  const setDescription = (desc: string) => {
    setData(prev => ({
      ...prev,
      [discipline]: { ...prev[discipline], description: desc }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setData(prev => ({
            ...prev,
            [discipline]: {
              ...prev[discipline],
              images: [
                ...prev[discipline].images,
                { id: uuidv4(), dataUrl: event.target!.result as string, description: '' }
              ]
            }
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const updateImageDescription = (id: string, desc: string) => {
    setData(prev => ({
      ...prev,
      [discipline]: {
        ...prev[discipline],
        images: prev[discipline].images.map(img => img.id === id ? { ...img, description: desc } : img)
      }
    }));
  };

  const removeImage = (id: string) => {
    setData(prev => ({
      ...prev,
      [discipline]: {
        ...prev[discipline],
        images: prev[discipline].images.filter(img => img.id !== id)
      }
    }));
  };

  const handleSubmit = async () => {
    let updatedReports;

    const newReportData = {
      disciplines: data
    };

    if (reportId) {
      // Edit Mode
      updatedReports = project.reports.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            ...newReportData,
            images: [], // Clear legacy fields to avoid confusion
            progress: {},
            description: ''
          };
        }
        return r;
      });
    } else {
      // Create Mode
      const newReport: Report = {
        id: uuidv4(),
        createdAt: Date.now(),
        ...newReportData,
        images: []
      };
      updatedReports = [...project.reports, newReport];
    }

    let details = `عملیات توسط: ${supervisorName}`;
    if (reportId) {
      details = `ویرایش گزارش ثبت شده. ویرایش‌کننده: ${supervisorName}`;
    } else {
      const activeDisciplines = Object.keys(data).filter(d => 
        data[d as Discipline].description || Object.keys(data[d as Discipline].progress).length > 0
      );
      details = `ثبت گزارش جدید برای دیسیپلین‌های: ${activeDisciplines.join('، ') || 'خالی'}. ثبت‌کننده: ${supervisorName}`;
    }

    const updatedProject = {
      ...project,
      reports: updatedReports,
      history: [
        ...(project.history || []),
        {
          id: uuidv4(),
          timestamp: Date.now(),
          user: supervisorName,
          action: reportId ? 'ویرایش گزارش' : 'ثبت گزارش جدید',
          details
        }
      ]
    };

    try {
      await saveProject(updatedProject);
      onNavigate('project_detail', project.id);
    } catch (e) {
      console.error(e);
      alert('خطا در ذخیره‌سازی. فضای ذخیره‌سازی پر شده است یا خطای سیستمی رخ داده است.');
    }
  };

  const items = getDisciplineItems(project.projectScale)[discipline] || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('project_detail', project.id)}
              className="text-gray-500 hover:text-gray-900"
            >
              <ArrowRight size={24} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900">
                {reportId ? 'ویرایش گزارش کارگاهی' : 'ثبت گزارش جدید'}
              </h1>
              <span className="text-xs text-gray-500">{project.projectName}</span>
            </div>
          </div>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700 transition"
          >
            <Save size={18} />
            {reportId ? 'ذخیره تغییرات' : 'ثبت نهایی'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Discipline Selection */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-bold text-gray-900">انتخاب رشته</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            {(['ابنیه', 'برق', 'مکانیک'] as Discipline[]).map(d => (
              <button
                key={d}
                onClick={() => setDiscipline(d)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  discipline === d 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        {/* Progress Inputs */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-3">درصد پیشرفت فیزیکی ({discipline})</h2>
          <div className="space-y-6">
            {items.map(item => (
              <div key={item} className="flex flex-col md:flex-row md:items-center gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100 hover:border-blue-100 transition-colors">
                <label className="flex-1 text-sm font-medium text-gray-800 leading-relaxed">{item}</label>
                  <div className="flex items-center gap-4 md:w-1/2" dir="ltr">
                    <div className="relative flex-none">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={data[discipline].progress[item] || 0}
                        onChange={e => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val)) val = 0;
                          if (val > 100) val = 100;
                          if (val < 0) val = 0;
                          handleProgressChange(item, val);
                        }}
                        className="w-16 text-center text-sm font-bold bg-white text-blue-700 border border-blue-200 px-2 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        dir="ltr"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 text-xs font-bold font-sans select-none pointer-events-none">%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={data[discipline].progress[item] || 0} 
                      onChange={e => handleProgressChange(item, parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full"
                      dir="ltr"
                    />
                  </div>
              </div>
            ))}
          </div>
        </section>

        {/* Description & Images */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">توضیحات ({discipline})</h2>
            <textarea 
              value={data[discipline].description}
              onChange={e => setDescription(e.target.value)}
              rows={3} 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              placeholder={`توضیحات وضعیت کارگاهی تجهیزات ${discipline} و ...`}
            ></textarea>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-gray-900">مستندات تصویری ({discipline})</h2>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"
              >
                <Camera size={16} />
                افزودن تصویر
              </button>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                multiple 
                className="hidden" 
                onChange={handleImageUpload} 
              />
            </div>
            
            {data[discipline].images.length === 0 ? (
              <p className="text-center text-gray-500 py-4 text-sm bg-gray-50 rounded-lg dashed-border">
                تصویری برای این گزارش ثبت نشده است.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data[discipline].images.map((img) => (
                  <div key={img.id} className="relative border border-gray-200 rounded-xl overflow-hidden bg-gray-50 group">
                    <img src={img.dataUrl} alt="مستند" className="w-full h-48 object-cover" />
                    <button 
                      onClick={() => removeImage(img.id)}
                      className="absolute top-2 right-2 p-1.5 bg-white/80 text-red-600 rounded-full hover:bg-red-100 backdrop-blur opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={16} />
                    </button>
                    <div className="p-3">
                      <input 
                        type="text" 
                        value={img.description} 
                        onChange={e => updateImageDescription(img.id, e.target.value)}
                        placeholder="توضیح تصویر (مثال: نمای اصلی)"
                        className="w-full text-sm rounded bg-white border border-gray-200 px-2 py-1 outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
