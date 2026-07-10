import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { deleteProject } from '../lib/storage';
import { exportProjectToExcel, exportSingleReportToExcel } from '../lib/excel';
import { ArrowRight, Download, Plus, Edit, Trash2, Calendar, HardHat, Building2, Building, MapPin, Percent, History } from 'lucide-react';
import { getDisciplineItems } from '../data/disciplines';
import { calculateOverallProgress } from '../lib/utils';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface ProjectDetailViewProps {
  projectId: string;
  onNavigate: (view: any, id?: string, reportId?: string) => void;
}

export function ProjectDetailView({ projectId, onNavigate }: ProjectDetailViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'projects', projectId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProject(docSnap.data() as Project);
      } else {
        setProject(null);
      }
    });
    
    return () => unsubscribe();
  }, [projectId]);

  const handleExport = async () => {
    if (project) {
        try {
            await exportProjectToExcel(project);
        } catch (e) {
            console.error('Export failed', e);
            alert('خطا در ایجاد فایل اکسل');
        }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('آیا از حذف این پروژه اطمینان دارید؟')) {
      await deleteProject(projectId);
      onNavigate('dashboard');
    }
  };

  if (!project) return <div className="p-8 text-center" dir="rtl">در حال بارگذاری...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12" dir="rtl">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="text-gray-500 hover:text-gray-900"
            >
              <ArrowRight size={24} />
            </button>
            <img 
              src="/logo-square.png" 
              alt="لوگو" 
              className="h-8 w-auto object-contain hidden sm:block" 
              onError={(e) => {
                e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/en/e/ef/Mashhad_University_of_Medical_Sciences_logo.svg";
                e.currentTarget.onerror = null;
              }}
            />
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs">{project.projectName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition whitespace-nowrap"
              title="تاریخچه تغییرات"
            >
              <History size={18} />
              <span className="hidden sm:inline">تاریخچه</span>
            </button>
            <div className="hidden lg:flex items-center ml-2">
              <img 
                src="/logo-wide.png" 
                alt="دانشگاه" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                  }
                }}
              />
              <span className="hidden text-sm font-bold text-gray-700">د. ع. پ. مشهد</span>
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition whitespace-nowrap"
              title="خروجی اکسل"
            >
              <Download size={18} />
              خروجی اکسل
            </button>
            <button 
              onClick={() => onNavigate('project_form', project.id)}
              className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              title="ویرایش پروژه"
            >
              <Edit size={20} />
            </button>
            <button 
              onClick={handleDelete}
              className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
              title="حذف پروژه"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
        
        {/* Info Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Building2 size={24} /></div>
            <div>
              <p className="text-xs text-gray-500">کاربری اصلی</p>
              <p className="font-bold text-gray-900">{project.mainUsage || '-'}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Building size={24} /></div>
            <div>
              <p className="text-xs text-gray-500">زیربنا</p>
              <p className="font-bold text-gray-900">{project.area ? `${project.area} مترمربع` : '-'}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><MapPin size={24} /></div>
            <div>
              <p className="text-xs text-gray-500">شهرستان</p>
              <p className="font-bold text-gray-900 truncate max-w-[120px]">{project.county || '-'}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Calendar size={24} /></div>
            <div>
              <p className="text-xs text-gray-500">وضعیت</p>
              <p className="font-bold text-gray-900">{project.status || '-'}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4 col-span-2 lg:col-span-1">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Percent size={24} /></div>
            <div>
              <p className="text-xs text-gray-500">درصد پیشرفت کل</p>
              <p className="font-bold text-gray-900">{calculateOverallProgress(project)}%</p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">شناسنامه و اطلاعات پروژه</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <p className="flex justify-between text-sm"><span className="text-gray-500">شهرستان:</span><span className="font-medium text-gray-900">{project.county || '-'}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">مختصات:</span><span className="font-medium text-gray-900 whitespace-pre-wrap text-left" dir="ltr">{project.geoCoordinates || '-'}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">کاربری اصلی:</span><span className="font-medium text-gray-900">{project.mainUsage || '-'}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">کاربری فرعی:</span><span className="font-medium text-gray-900">{project.subUsage || '-'}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">روش اجرا:</span><span className="font-medium text-gray-900">{project.executionMethod || '-'}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">تیپ برآورد وزن‌ها:</span><span className="font-bold text-blue-600">{project.projectScale === 'above_1000' ? 'بالای ۱۰۰۰ متر مربع' : project.projectScale === 'between_200_1000' ? 'بین ۲۰۰ تا ۱۰۰۰ متر مربع' : 'زیر ۲۰۰ متر مربع'}</span></p>
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                <p className="flex justify-between text-sm"><span className="text-gray-500">ناظر ابنیه:</span><span className="font-medium text-gray-900">{project.supervisorCivil || '-'}</span></p>
                <p className="flex justify-between text-sm"><span className="text-gray-500">ناظر برق:</span><span className="font-medium text-gray-900">{project.supervisorElectrical || '-'}</span></p>
                <p className="flex justify-between text-sm"><span className="text-gray-500">ناظر مکانیک:</span><span className="font-medium text-gray-900">{project.supervisorMechanical || '-'}</span></p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="flex justify-between text-sm"><span className="text-gray-500">تاریخ شروع:</span><span className="font-medium text-gray-900">{project.startDate || '-'}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">تاریخ پایان (پیش‌بینی):</span><span className="font-medium text-gray-900">{project.endDate || '-'}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">تعداد طبقات:</span><span className="font-medium text-gray-900">{project.floors || '-'}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">تعداد تخت:</span><span className="font-medium text-gray-900">{project.beds || '-'}</span></p>
            </div>
            <div className="space-y-3">
              <p className="flex justify-between text-sm"><span className="text-gray-500">شماره قرارداد:</span><span className="font-medium text-gray-900">{project.contractNumber || '-'}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">تاریخ قرارداد:</span><span className="font-medium text-gray-900">{project.contractDate || '-'}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">مبلغ قرارداد:</span><span className="font-medium text-gray-900">{project.contractAmount ? `${project.contractAmount} ریال` : '-'}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">آخرین مبلغ پرداختی:</span><span className="font-medium text-gray-900">{project.lastPaymentAmount ? `${project.lastPaymentAmount} ریال` : '-'}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">تاریخ آخرین پرداخت:</span><span className="font-medium text-gray-900">{project.lastPaymentDate || '-'}</span></p>
              <p className="flex justify-between text-sm"><span className="text-gray-500">نام پیمانکار:</span><span className="font-medium text-gray-900">{project.contractorName || '-'}</span></p>
            </div>
          </div>
        </div>

        {/* Reports Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">گزارشات و پیشرفت کار</h2>
              <p className="text-sm text-gray-500 mt-1">لیست تاریخچه گزارشات ثبت شده برای این پروژه</p>
            </div>
            <button 
              onClick={() => onNavigate('report_form', project.id)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              افزودن گزارش پیشرفت این پروژه
            </button>
          </div>

          <div className="p-6 bg-gray-50/50">
            {project.reports.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">هیچ گزارشی تاکنون ثبت نشده است.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Sort reports by latest first */}
                {[...project.reports].sort((a,b) => b.createdAt - a.createdAt).map((report, index) => (
                  <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b pb-3">
                      <div className="flex items-center gap-3">
                        {report.discipline ? (
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm font-bold">
                            {report.discipline}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm font-bold">
                            گزارش جامع
                          </span>
                        )}
                        <span className="text-gray-500 text-sm">
                          {new Date(report.createdAt).toLocaleString('fa-IR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-medium text-gray-400">گزارش #{project.reports.length - index}</span>
                        
                        <button
                          onClick={() => onNavigate('report_form', project.id, report.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-lg transition"
                          title="ویرایش اطلاعات و پیوستی‌های این گزارش"
                        >
                          <Edit size={13} />
                          ویرایش گزارش
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              await exportSingleReportToExcel(project, report);
                            } catch (e) {
                              console.error('Single export failed', e);
                              alert('خطا در ایجاد فایل اکسل برای این گزارش');
                            }
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 border border-green-200/60 rounded-lg transition"
                          title="خروجی اکسل این گزارش"
                        >
                          <Download size={13} />
                          خروجی اکسل
                        </button>
                      </div>
                    </div>
                    
                    {report.disciplines ? (
                      <div>
                        {['ابنیه', 'برق', 'مکانیک'].map((d) => {
                          const dData = report.disciplines?.[d as any];
                          if (!dData || (!dData.description && Object.keys(dData.progress).length === 0 && dData.images.length === 0)) return null;

                          return (
                            <div key={d} className="mb-6 border-b border-gray-100 pb-4 last:border-0">
                              <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center before:content-[''] before:w-2 before:h-2 before:bg-blue-500 before:rounded-full before:ml-2">{d}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-4">
                                {(getDisciplineItems(project.projectScale)[d] || []).map((item) => {
                                  const prog = dData.progress[item] || 0;
                                  return (
                                    <div key={item} className="flex justify-between items-center">
                                      <span className="text-sm text-gray-700 truncate pr-2">{item}</span>
                                      <div className="flex items-center gap-3">
                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${prog}%` }}></div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 w-8">{prog}%</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {dData.description && (
                                <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{dData.description}</p>
                                </div>
                              )}

                              {dData.images && dData.images.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-bold text-gray-500 mb-3">مستندات تصویری ({dData.images.length})</h4>
                                  <div className="flex gap-3 overflow-x-auto pb-2">
                                    {dData.images.map((img) => (
                                      <div key={img.id} className="min-w-[150px] relative rounded-lg overflow-hidden border border-gray-200 group">
                                        <img src={img.dataUrl} alt="مستند" className="w-[150px] h-[100px] object-cover" />
                                        {img.description && (
                                          <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1.5 backdrop-blur-sm">
                                            <p className="text-[10px] text-white truncate text-center">{img.description}</p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Legacy single discipline render
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                          {(getDisciplineItems(project.projectScale)[report.discipline!] || []).map((item) => (
                            <div key={item} className="flex justify-between items-center">
                              <span className="text-sm text-gray-700 truncate pr-2">{item}</span>
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full" 
                                    style={{ width: `${report.progress![item] || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-bold text-gray-900 w-8">{report.progress![item] || 0}%</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {report.description && (
                          <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.description}</p>
                          </div>
                        )}

                        {report.images && report.images.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 mb-3">مستندات تصویری ({report.images.length})</h4>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {report.images.map((img) => (
                                <div key={img.id} className="min-w-[150px] relative rounded-lg overflow-hidden border border-gray-200 group">
                                  <img src={img.dataUrl} alt="مستند" className="w-[150px] h-[100px] object-cover" />
                                  {img.description && (
                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1.5 backdrop-blur-sm">
                                      <p className="text-[10px] text-white truncate text-center">{img.description}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="text-gray-500" size={20} />
                تاریخچه تغییرات
              </h2>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-full transition"
              >
                <span className="font-bold">✕</span>
              </button>
            </div>
            <div className="p-6 bg-white overflow-y-auto">
              {(!project.history || project.history.length === 0) ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">تاریخچه‌ای برای این پروژه ثبت نشده است.</p>
                </div>
              ) : (
                <div className="relative border-r border-gray-200 mr-4 pr-6 space-y-8">
                  {[...project.history].sort((a,b) => b.timestamp - a.timestamp).map((item) => (
                    <div key={item.id} className="relative">
                      <span className="absolute -right-[31px] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white"></span>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900 text-base">{item.action}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md" dir="ltr">
                            {new Date(item.timestamp).toLocaleString('fa-IR')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          توسط: <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{item.user}</span>
                        </div>
                        {item.details && (
                          <div className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed">
                            {item.details.split(' | ').map((detail, idx) => (
                              <div key={idx} className="mb-1 last:mb-0">
                                • {detail}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
