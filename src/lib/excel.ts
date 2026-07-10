import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Project, Report } from '../types';
import { getDisciplineItems } from '../data/disciplines';
import { calculateOverallProgress } from './utils';

export const exportProjectToExcel = async (project: Project, specificReport?: Report) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'سامانه جامع نظارت عمرانی دانشگاه علوم پزشکی مشهد';
  wb.lastModifiedBy = 'ناظر مستقر';
  wb.created = new Date();

  // 1) Main Project Report Sheet
  const sheetName = specificReport ? `گزارش شماره ${specificReport.id.slice(0, 4)}` : 'شناسنامه و گزارش پیشرفت پروژه';
  const ws = wb.addWorksheet(sheetName, {
    views: [{ rightToLeft: true, showGridLines: true }],
    pageSetup: { 
      paperSize: 9, 
      orientation: 'landscape', 
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.15, right: 0.15, top: 0.25, bottom: 0.25, header: 0.1, footer: 0.1 } 
    }
  });

  const fontStandard = { name: 'Vazirmatn', size: 10, color: { argb: 'FF1F2937' } };
  const fontBold = { name: 'Vazirmatn', size: 10, bold: true, color: { argb: 'FF111827' } };
  const fontHeaderWhite = { name: 'Vazirmatn', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const fontDepartment = { name: 'Vazirmatn', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
  const fontTitleMain = { name: 'Vazirmatn', size: 14, bold: true, color: { argb: 'FF1B365D' } };
  const fontSubInfo = { name: 'Vazirmatn', size: 9, color: { argb: 'FF4B5563' } };

  // Columns definition (Total 10 columns: A to J)
  ws.columns = [
    { key: 'A', width: 22 }, // Info Field Label
    { key: 'B', width: 26 }, // Info Value
    { key: 'C', width: 28 }, // Abnieh Task 
    { key: 'D', width: 9 },  // Abnieh %
    { key: 'E', width: 28 }, // Bargh Task
    { key: 'F', width: 9 },  // Bargh %
    { key: 'G', width: 28 }, // Mech Task
    { key: 'H', width: 9 },  // Mech %
    { key: 'I', width: 14 }, // Overall Category Divider / Overhaul Label
    { key: 'J', width: 24 }, // Overall value / Finance Info
  ];

  // Helper for cells
  const styleCell = (
    cell: ExcelJS.Cell, 
    font: any = fontStandard, 
    fill?: string, 
    align: 'center' | 'right' | 'left' = 'center',
    borderType: 'thin' | 'double' | 'bold' = 'thin'
  ) => {
    cell.font = font;
    cell.alignment = { vertical: 'middle', horizontal: align, wrapText: true };
    
    const borderStyle: ExcelJS.Border = {
      style: borderType === 'double' ? 'double' : 'thin',
      color: { argb: borderType === 'bold' ? 'FF111827' : 'FFD1D5DB' }
    };

    cell.border = {
      top: borderStyle,
      left: borderStyle,
      bottom: borderStyle,
      right: borderStyle,
    };

    if (fill) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    }
  };

  // --- official Administrative Letterhead (Rows 1 to 4) ---
  ws.getRow(1).height = 22;
  ws.getRow(2).height = 25;
  ws.getRow(3).height = 22;
  ws.getRow(4).height = 20;

  // Let's create an elegant administrative border around the letterhead area
  for (let r = 1; r <= 4; r++) {
    for (let c = 1; c <= 10; c++) {
      const cell = ws.getCell(r, c);
      styleCell(cell, fontStandard, 'FFF9FAFB', 'center');
    }
  }

  // Right Side (Col A-C): Name of Department & Unit
  ws.mergeCells('A1:C2');
  const mainDeptCell = ws.getCell('A1');
  mainDeptCell.value = 'مدیریت طرح‌های عمرانی و منابع فیزیکی\nدانشگاه علوم پزشکی مشهد';
  styleCell(mainDeptCell, fontDepartment, 'FFF3F4F6', 'right');

  ws.mergeCells('A3:C4');
  const subDeptCell = ws.getCell('A3');
  subDeptCell.value = `کاربر سیستم: ${project.supervisorName || 'ناظر دفتر فنی'}\nواحد نظارت بر پروژه‌های ملی و استانی`;
  styleCell(subDeptCell, fontSubInfo, 'FFF3F4F6', 'right');

  // Center (Col D-G): University Title with Medical Symbol Accent
  ws.mergeCells('D1:H2');
  const uniTitleCell = ws.getCell('D1');
  uniTitleCell.value = `⚕️ شناسنامه و گزارش جامع پیشرفت فیزیکی پروژه`;
  styleCell(uniTitleCell, fontTitleMain, 'FFF3F4F6', 'center');

  ws.mergeCells('D3:H4');
  const subTitleCell = ws.getCell('D3');
  subTitleCell.value = `عنوان طرح: احداث و تکمیل ${project.type} ${project.projectName}`;
  styleCell(subTitleCell, { name: 'Vazirmatn', size: 10, bold: true, color: { argb: 'FF1F2937' } }, 'FFF3F4F6', 'center');

  // Left Side (Col I-J): System details
  const today = new Date().toLocaleDateString('fa-IR');
  ws.mergeCells('I1:J1');
  const numCell = ws.getCell('I1');
  numCell.value = 'شماره گزارش: ' + Math.floor(100000 + Math.random() * 900000);
  styleCell(numCell, fontSubInfo, 'FFF3F4F6', 'left');

  ws.mergeCells('I2:J2');
  const dateCell = ws.getCell('I2');
  dateCell.value = 'تاریخ استخراج گزارش: ' + today;
  styleCell(dateCell, fontSubInfo, 'FFF3F4F6', 'left');

  ws.mergeCells('I3:J3');
  const attachCell = ws.getCell('I3');
  attachCell.value = 'پیوست مستندات: دارد (تصاویر)';
  styleCell(attachCell, fontSubInfo, 'FFF3F4F6', 'left');

  ws.mergeCells('I4:J4');
  const statusStampCell = ws.getCell('I4');
  statusStampCell.value = `وضعیت نهایی پروژه: ${project.status || 'نامشخص'}`;
  styleCell(statusStampCell, { name: 'Vazirmatn', size: 9, bold: true, color: { argb: project.status === 'فعال' ? 'FF15803D' : 'FFB91C1C' } }, 'FFF3F4F6', 'center');

  // Empty separator row
  ws.getRow(5).height = 12;

  // --- Row 6: Primary Table Sections Headers ---
  ws.getRow(6).height = 28;
  
  ws.mergeCells('A6:B6');
  const hInfo = ws.getCell('A6');
  hInfo.value = '📋 شناسنامه مشخصات طرح';
  styleCell(hInfo, fontHeaderWhite, 'FF1B365D'); // Dark Navy

  ws.mergeCells('C6:H6');
  const hProg = ws.getCell('C6');
  hProg.value = '📊 ساختار شکست و درصد پیشرفت بخش‌های مختلف فیزیکی';
  styleCell(hProg, fontHeaderWhite, 'FF005A70'); // Teal Blue

  ws.mergeCells('I6:J6');
  const hFin = ws.getCell('I6');
  hFin.value = '🎯 وضعیت پیشرفت و اعتبارات کل';
  styleCell(hFin, fontHeaderWhite, 'FF374151'); // Charcoal Grey

  // --- Row 7: Discipline Categories Headers ---
  ws.getRow(7).height = 26;

  // Left Blank/Headers for Info Block in Row 7 (will be written in loop)
  styleCell(ws.getCell('A7'), fontBold, 'FFE2EFDA');
  styleCell(ws.getCell('B7'), fontBold, 'FFE2EFDA');

  // Abnieh Sub headers
  ws.mergeCells('C7:D7'); const aSub = ws.getCell('C7'); aSub.value = '🏗️ بخش اول: ابنیه و معماری'; styleCell(aSub, fontBold, 'FFE2EFDA'); // Soft green
  // Bargh Sub headers
  ws.mergeCells('E7:F7'); const bSub = ws.getCell('E7'); bSub.value = '⚡ بخش دوم: تاسیسات الکتریکی'; styleCell(bSub, fontBold, 'FFFFF2CC'); // Soft Yellow
  // Mech Sub headers
  ws.mergeCells('G7:H7'); const mSub = ws.getCell('G7'); mSub.value = '🔧 بخش سوم: تاسیسات مکانیکی'; styleCell(mSub, fontBold, 'FFDDEBF7'); // Soft Blue
  
  // Overall Sub headers in Row 7
  ws.mergeCells('I7:J7'); const oSub = ws.getCell('I7'); oSub.value = 'شاخص‌های کلیدی عملکرد (KPI)'; styleCell(oSub, fontBold, 'FFFCE4D6'); // Warm Peach

  // --- Row 8: Table internal columns labels ---
  ws.getRow(8).height = 24;
  ws.getCell('A8').value = 'عنوان شاخص'; styleCell(ws.getCell('A8'), fontBold, 'FFEFEFEF');
  ws.getCell('B8').value = 'مقدار ثبت شده'; styleCell(ws.getCell('B8'), fontBold, 'FFEFEFEF');

  ['C8', 'E8', 'G8'].forEach(k => { ws.getCell(k).value = 'عنصر ساختمانی ساختار شکست (WBS)'; styleCell(ws.getCell(k), fontBold, 'FFEFEFEF'); });
  ['D8', 'F8', 'H8'].forEach(k => { ws.getCell(k).value = 'درصد پیشرفت'; styleCell(ws.getCell(k), fontBold, 'FFEFEFEF'); });
  
  ws.getCell('I8').value = 'شاخص ارزیابی'; styleCell(ws.getCell('I8'), fontBold, 'FFEFEFEF');
  ws.getCell('J8').value = 'میزان تحقق / وضعیت'; styleCell(ws.getCell('J8'), fontBold, 'FFEFEFEF');


  // --- Prepare Data Mapping ---
  // Beautiful currency formatter for Rials
  const formatCurrency = (val?: string) => {
    if (!val) return 'ثبت نشده';
    const num = parseInt(val.replace(/[^\d]/g, ''));
    if (isNaN(num)) return val;
    return num.toLocaleString('fa-IR') + ' ریال';
  };

  const pInfo = [
    { k: 'شهرستان / محل احداث', v: project.county },
    { k: 'کاربری اصلی پروژه', v: project.mainUsage },
    { k: 'کاربری فرعی پروژه', v: project.subUsage },
    { k: 'مساحت زیربنا (مترمربع)', v: project.area ? `${parseInt(project.area).toLocaleString('fa-IR')} مترمربع` : '-' },
    { k: 'تعداد طبقات سازه', v: project.floors ? `${parseInt(project.floors).toLocaleString('fa-IR')} طبقه` : '-' },
    { k: 'تعداد تخت مصوب', v: project.beds ? `${parseInt(project.beds).toLocaleString('fa-IR')} تخت` : '-' },
    { k: 'تاریخ ابلاغ شروع', v: project.startDate },
    { k: 'پایان پیش‌بینی شده', v: project.endDate },
    { k: 'روش اجرایی ارجاع کار', v: project.executionMethod || 'نامشخص' },
    { hdr: '📋 مشخصات حقوقی و مدیریت پیمان' },
    { k: 'نام شرکت پیمانکار دیسپلین', v: project.contractorName },
    { k: 'شماره قرارداد رسمی', v: project.contractNumber },
    { k: 'تاریخ ابلاغ قرارداد فیزیکی', v: project.contractDate },
    { k: 'مبلغ نهایی با الحاقیه (ریال)', v: formatCurrency(project.contractAmount) },
    { k: 'مختصات ثبت شده نقشه (GPS)', v: project.geoCoordinates },
    { k: 'دوره پایش پورتال نظارت', v: today },
  ];

  const getProg = (disc: string, task: string) => {
    if (specificReport) {
      if (specificReport.disciplines && specificReport.disciplines[disc as 'ابنیه' | 'برق' | 'مکانیک']) {
        return specificReport.disciplines[disc as 'ابنیه' | 'برق' | 'مکانیک']!.progress[task] || 0;
      }
      if (specificReport.discipline === disc && specificReport.progress) {
        return specificReport.progress[task] || 0;
      }
      return 0;
    }

    const list = project.reports.filter(r => {
      if (r.disciplines && r.disciplines[disc as 'ابنیه' | 'برق' | 'مکانیک']) return true;
      if (r.discipline === disc) return true;
      return false;
    }).sort((a,b)=> b.createdAt - a.createdAt);
    
    if (!list.length) return 0;
    
    const latest = list[0];
    if (latest.disciplines && latest.disciplines[disc as 'ابنیه' | 'برق' | 'مکانیک']) {
      return latest.disciplines[disc as 'ابنیه' | 'برق' | 'مکانیک']!.progress[task] || 0;
    }
    
    return latest.progress ? latest.progress[task] || 0 : 0;
  };

  const disciplineItems = getDisciplineItems(project.projectScale);
  const aTasks = (disciplineItems['ابنیه'] || []).map(t => ({ name: t, p: getProg('ابنیه', t) }));
  const bTasks = (disciplineItems['برق'] || []).map(t => ({ name: t, p: getProg('برق', t) }));
  const mTasks = (disciplineItems['مکانیک'] || []).map(t => ({ name: t, p: getProg('مکانیک', t) }));

  // We write exactly 16 rows of data (Row 9 to 24)
  for (let i = 0; i < 16; i++) {
    const rNum = 9 + i;
    const row = ws.getRow(rNum);
    
    // Zebra shading for standard rows
    const isEven = i % 2 === 0;
    const zebraBg = isEven ? 'FFFFFFFF' : 'FFF9FAFB';

    row.height = 34; // Generous height for reading

    // Column A & B: Project Metadata
    const inf = pInfo[i];
    if (inf) {
      if (inf.hdr) {
        ws.mergeCells(`A${rNum}:B${rNum}`);
        const c = ws.getCell(`A${rNum}`);
        c.value = inf.hdr;
        styleCell(c, fontBold, 'FFE5E7EB', 'right');
      } else {
        const cK = ws.getCell(`A${rNum}`); cK.value = inf.k; styleCell(cK, fontBold, 'FFF3F4F6', 'right');
        const cV = ws.getCell(`B${rNum}`); cV.value = inf.v || '-'; styleCell(cV, fontStandard, zebraBg, 'right');
      }
    } else {
      styleCell(ws.getCell(`A${rNum}`), fontStandard, zebraBg); 
      styleCell(ws.getCell(`B${rNum}`), fontStandard, zebraBg);
    }

    // Column C & D: Abnieh
    const ab = aTasks[i];
    const caK = ws.getCell(`C${rNum}`); styleCell(caK, fontStandard, zebraBg, 'right');
    const caV = ws.getCell(`D${rNum}`); styleCell(caV, fontBold, zebraBg, 'center');
    if (ab) { 
      caK.value = ab.name; 
      caV.value = ab.p / 100; // formatted as % inside Excel
      caV.numFmt = '0%';
    }

    // Column E & F: Bargh
    const bq = bTasks[i];
    const cbK = ws.getCell(`E${rNum}`); styleCell(cbK, fontStandard, zebraBg, 'right');
    const cbV = ws.getCell(`F${rNum}`); styleCell(cbV, fontBold, zebraBg, 'center');
    if (bq) { 
      cbK.value = bq.name; 
      cbV.value = bq.p / 100;
      cbV.numFmt = '0%';
    }

    // Column G & H: Mech
    const me = mTasks[i];
    const cmK = ws.getCell(`G${rNum}`); styleCell(cmK, fontStandard, zebraBg, 'right');
    const cmV = ws.getCell(`H${rNum}`); styleCell(cmV, fontBold, zebraBg, 'center');
    if (me) { 
      cmK.value = me.name; 
      cmV.value = me.p / 100;
      cmV.numFmt = '0%';
    }

    // Column I & J: Overall & KPI Details (We populate some structured rows)
    const ci = ws.getCell(`I${rNum}`);
    const cj = ws.getCell(`J${rNum}`);
    styleCell(ci, fontBold, 'FFFCE4D6', 'right');
    styleCell(cj, fontStandard, zebraBg, 'center');

    if (i === 0) {
      ci.value = 'میزان کل پیشرفت فیزیکی'; 
      cj.value = calculateOverallProgress(project) / 100;
      styleCell(cj, { name: 'Vazirmatn', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }, 'FF1E40AF', 'center'); // Distinct dark blue with white text
      cj.numFmt = '0%';
    } else if (i === 1) {
      ci.value = 'وضعیت زمانبندی';
      cj.value = 'پایش فازهای اجرایی';
      cj.font = fontBold;
    } else if (i === 2) {
      ci.value = 'تعداد گزارش به روز';
      cj.value = `${project.reports ? project.reports.length : 0} گزارش مصوب`;
    } else if (i === 3) {
      ci.value = 'آخرین ویرایش ناظر';
      cj.value = today;
    } else if (i === 4) {
      ci.value = 'اعتبار مصوب پروژه';
      cj.value = project.contractAmount ? formatCurrency(project.contractAmount) : 'به تفکیک فاز مالی';
      cj.font = fontSubInfo;
    } else if (i === 5) {
      ci.value = 'دستگاه نظارت فیزیکی';
      cj.value = 'مدیریت طرح های عمرانی';
    } else {
      // Empty or styled filler rows for KPI column merge area or other secondary stats
      ci.value = '';
      cj.value = '';
      styleCell(ci, fontStandard, zebraBg);
      styleCell(cj, fontStandard, zebraBg);
    }
  }

  // --- Row 25: Summary Progress / Average row ---
  const r25 = ws.getRow(25);
  r25.height = 32;
  
  // Overall merged cell showing the progress as a high-density indicator
  ws.mergeCells('A25:B25');
  const sumLabel = ws.getCell('A25');
  sumLabel.value = '📊 میانگین پیشرفت فیزیکی کل طرح';
  styleCell(sumLabel, fontBold, 'FFD9EAD3', 'right');
  
  const sumVal = ws.getCell('B25');
  sumVal.value = calculateOverallProgress(project) / 100;
  sumVal.numFmt = '0%';
  styleCell(sumVal, { name: 'Vazirmatn', size: 12, bold: true, color: { argb: 'FF15803D' } }, 'FFD9EAD3');

  // Abnieh aggregate progress
  const aAvg = aTasks.length ? (aTasks.reduce((s,t) => s+t.p, 0)/aTasks.length).toFixed(1) : '0';
  ws.getCell('C25').value = 'کل پیشرفت ابنیه'; styleCell(ws.getCell('C25'), fontBold, 'FFEFEFEF', 'right');
  ws.getCell('D25').value = parseFloat(aAvg) / 100; styleCell(ws.getCell('D25'), fontBold, 'FFEFEFEF'); ws.getCell('D25').numFmt = '0.0%';

  // Bargh aggregate progress
  const bAvg = bTasks.length ? (bTasks.reduce((s,t) => s+t.p, 0)/bTasks.length).toFixed(1) : '0';
  ws.getCell('E25').value = 'کل پیشرفت برق'; styleCell(ws.getCell('E25'), fontBold, 'FFEFEFEF', 'right');
  ws.getCell('F25').value = parseFloat(bAvg) / 100; styleCell(ws.getCell('F25'), fontBold, 'FFEFEFEF'); ws.getCell('F25').numFmt = '0.0%';

  // Mechanical aggregate progress
  const mAvg = mTasks.length ? (mTasks.reduce((s,t) => s+t.p, 0)/mTasks.length).toFixed(1) : '0';
  ws.getCell('G25').value = 'کل پیشرفت مکانیک'; styleCell(ws.getCell('G25'), fontBold, 'FFEFEFEF', 'right');
  ws.getCell('H25').value = parseFloat(mAvg) / 100; styleCell(ws.getCell('H25'), fontBold, 'FFEFEFEF'); ws.getCell('H25').numFmt = '0.0%';

  // Total merged row KPI fillers
  styleCell(ws.getCell('I25'), fontBold, 'FFFCE4D6');
  styleCell(ws.getCell('J25'), fontBold, 'FFFCE4D6');

  // Separator 
  ws.getRow(26).height = 14;

  // --- Descriptions & Images Section ---
  let cRow = 27;
  const disciplines = ['ابنیه', 'برق', 'مکانیک'];

  const getDisciplineDetails = (disc: string) => {
    if (specificReport) {
      if (specificReport.disciplines && specificReport.disciplines[disc as 'ابنیه' | 'برق' | 'مکانیک']) {
        const dData = specificReport.disciplines[disc as 'ابنیه' | 'برق' | 'مکانیک']!;
        return {
          description: dData.description || '',
          images: dData.images || []
        };
      }
      if (specificReport.discipline === disc) {
        return {
          description: specificReport.description || '',
          images: specificReport.images || []
        };
      }
      return { description: '', images: [] };
    }

    // No specific report specified: find the latest report containing data for this discipline
    const matches = project.reports.filter(r => {
      if (r.disciplines && r.disciplines[disc as 'ابنیه' | 'برق' | 'مکانیک']) {
        const d = r.disciplines[disc as 'ابنیه' | 'برق' | 'مکانیک']!;
        return d.description || (d.images && d.images.length > 0) || Object.keys(d.progress).length > 0;
      }
      return r.discipline === disc;
    }).sort((a, b) => b.createdAt - a.createdAt);

    if (matches.length > 0) {
      const latest = matches[0];
      if (latest.disciplines && latest.disciplines[disc as 'ابنیه' | 'برق' | 'مکانیک']) {
        const dData = latest.disciplines[disc as 'ابنیه' | 'برق' | 'مکانیک']!;
        return {
          description: dData.description || '',
          images: dData.images || []
        };
      }
      return {
        description: latest.description || '',
        images: latest.images || []
      };
    }

    return { description: '', images: [] };
  };

  disciplines.forEach(disc => {
    const { description, images } = getDisciplineDetails(disc);
    const validImages = images.filter(img => img.dataUrl && img.dataUrl.startsWith('data:image'));

    // If there is no summary description and no images, skip rendering this section to keep it clean
    if (!description && validImages.length === 0) return;

    // Description Block Header
    ws.mergeCells(`A${cRow}:J${cRow}`);
    const dTitle = ws.getCell(`A${cRow}`);
    let specSup = project.supervisorName;
    if (disc === 'ابنیه' && project.supervisorCivil) specSup = project.supervisorCivil;
    if (disc === 'برق' && project.supervisorElectrical) specSup = project.supervisorElectrical;
    if (disc === 'مکانیک' && project.supervisorMechanical) specSup = project.supervisorMechanical;

    dTitle.value = `📝 آخرین گزارش وضعیت اجرایی بخش ${disc} - (ناظر مستقر: ${specSup || 'ناظر دفتر فنی'})`;
    styleCell(dTitle, fontBold, disc === 'ابنیه' ? 'FFE2EFDA' : disc === 'برق' ? 'FFFFF2CC' : 'FFDDEBF7', 'right');
    cRow++;

    // Large merged text field for description
    ws.mergeCells(`A${cRow}:J${cRow+3}`);
    const dVal = ws.getCell(`A${cRow}`);
    dVal.value = `شرح عملیات به روزرسانی شده:\n${description || 'توضیحی بابت فعالیت جاری تا این تاریخ مرقوم نگردیده است.'}`;
    styleCell(dVal, fontStandard, 'FFFFFFFF', 'right');
    dVal.alignment = { vertical: 'top', horizontal: 'right', wrapText: true };
    
    // Set heights for the description area
    for(let dR = 0; dR <= 3; dR++) {
      ws.getRow(cRow + dR).height = 20;
    }
    cRow += 5;

    // Associated Images for this discipline
    if (validImages.length > 0) {
      ws.mergeCells(`A${cRow}:J${cRow}`);
      const iTitle = ws.getCell(`A${cRow}`);
      iTitle.value = `📸 گالری تصاویر و مستندات کارگاهی ضمیمه گزارش (${disc})`;
      styleCell(iTitle, { name: 'Vazirmatn', size: 10, bold: true, color: { argb: 'FF1F2937' } }, 'FFF3F4F6', 'right');
      cRow++;

      // Render side-by-side pairs of images in large format
      for (let idx = 0; idx < validImages.length; idx += 2) {
        ws.getRow(cRow).height = 240; // Tall row for holding images
        ws.getRow(cRow + 1).height = 24; // Row for holding annotations/captions

        // Left Image (Col A-E, 0-based col 0)
        const img1 = validImages[idx];
        if (img1) {
          try {
            const rawBase64 = img1.dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
            const imgId = wb.addImage({
              base64: rawBase64,
              extension: img1.dataUrl.includes('png') ? 'png' : 'jpeg',
            });
            ws.addImage(imgId, {
              tl: { col: 0, row: cRow - 1 },
              ext: { width: 400, height: 300 }
            });

            ws.mergeCells(cRow + 1, 1, cRow + 1, 5);
            const capCell1 = ws.getCell(cRow + 1, 1);
            capCell1.value = img1.description || `تصویر کارگاه ساختمانی - ${disc} (${idx + 1})`;
            styleCell(capCell1, { name: 'Vazirmatn', size: 10, italic: true, color: { argb: 'FF4B5563' } }, 'FFF9FAFB', 'center');
          } catch(e) {
            console.error('XLSX Left Image error:', e);
          }
        }

        // Right Image (Col F-J, 0-based col 5)
        const img2 = validImages[idx + 1];
        if (img2) {
          try {
            const rawBase64 = img2.dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
            const imgId = wb.addImage({
              base64: rawBase64,
              extension: img2.dataUrl.includes('png') ? 'png' : 'jpeg',
            });
            ws.addImage(imgId, {
              tl: { col: 5, row: cRow - 1 },
              ext: { width: 400, height: 300 }
            });

            ws.mergeCells(cRow + 1, 6, cRow + 1, 10);
            const capCell2 = ws.getCell(cRow + 1, 6);
            capCell2.value = img2.description || `تصویر کارگاه ساختمانی - ${disc} (${idx + 2})`;
            styleCell(capCell2, { name: 'Vazirmatn', size: 10, italic: true, color: { argb: 'FF4B5563' } }, 'FFF9FAFB', 'center');
          } catch(e) {
            console.error('XLSX Right Image error:', e);
          }
        } else {
          // Fill right empty cells styled
          for (let col = 6; col <= 10; col++) {
            styleCell(ws.getCell(cRow, col), fontStandard, 'FFFFFFFF');
            styleCell(ws.getCell(cRow + 1, col), fontStandard, 'FFF9FAFB');
          }
        }

        cRow += 3; // Step past images + captions + spacer
      }
      cRow += 1;
    }
    
    // Spacing between disciplines
    ws.getRow(cRow).height = 12;
    cRow++;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `گزارش_جامع_${project.projectName}.xlsx`);
};

export interface AdvancedExportConfig {
  selectedStatuses?: string[];
  selectedMainUsages?: string[];
  selectedCounties?: string[];
  selectedScales?: string[];
  selectedSupervisors?: string[];
  selectedColumns?: string[];
  groupBy?: 'status' | 'mainUsage' | 'county' | 'none';
}

export const ALL_COLUMNS_CONFIG: Record<string, { 
  header: string; 
  width: number; 
  getValue: (p: Project, idx: number) => any; 
  numFmt?: string; 
  align: 'center' | 'right' | 'left';
  isNumeric?: boolean;
  aggType?: 'sum' | 'avg' | 'none';
}> = {
  rowNum: { header: 'ردیف', width: 8, getValue: (p, idx) => idx + 1, align: 'center' },
  projectName: { header: 'عنوان پروژه', width: 32, getValue: p => p.projectName, align: 'right' },
  mainUsage: { header: 'کاربری اصلی', width: 18, getValue: p => p.mainUsage || '-', align: 'right' },
  subUsage: { header: 'کاربری فرعی', width: 18, getValue: p => p.subUsage || '-', align: 'right' },
  type: { header: 'تیپ مرکز', width: 18, getValue: p => p.type || '-', align: 'right' },
  county: { header: 'محل احداث', width: 18, getValue: p => p.county || '-', align: 'right' },
  projectScale: { header: 'تیپ برآورد', width: 18, getValue: p => p.projectScale === 'above_1000' ? 'بالای ۱۰۰۰ متر' : p.projectScale === 'between_200_1000' ? 'بین ۲۰۰ تا ۱۰۰۰ متر' : 'زیر ۲۰۰ متر', align: 'center' },
  area: { header: 'متراژ زیربنا', width: 15, getValue: p => p.area ? parseFloat(p.area) || 0 : 0, numFmt: '#,##0" مترمربع"', align: 'center', isNumeric: true, aggType: 'sum' },
  floors: { header: 'تعداد طبقات', width: 12, getValue: p => p.floors ? parseInt(p.floors) || 0 : 0, numFmt: '#,##0', align: 'center', isNumeric: true, aggType: 'sum' },
  beds: { header: 'تعداد تخت', width: 12, getValue: p => p.beds ? parseInt(p.beds) || 0 : 0, numFmt: '#,##0', align: 'center', isNumeric: true, aggType: 'sum' },
  progress: { header: 'پیشرفت فیزیکی', width: 15, getValue: p => calculateOverallProgress(p) / 100, numFmt: '0%', align: 'center', isNumeric: true, aggType: 'avg' },
  startDate: { header: 'تاریخ شروع', width: 14, getValue: p => p.startDate || '-', align: 'center' },
  endDate: { header: 'تاریخ پایان', width: 14, getValue: p => p.endDate || '-', align: 'center' },
  status: { header: 'وضعیت اجرا', width: 14, getValue: p => p.status || '-', align: 'center' },
  supervisorCivil: { header: 'ناظر ابنیه', width: 18, getValue: p => p.supervisorCivil || p.supervisorName || '-', align: 'right' },
  supervisorElectrical: { header: 'ناظر برق', width: 18, getValue: p => p.supervisorElectrical || p.supervisorName || '-', align: 'right' },
  supervisorMechanical: { header: 'ناظر مکانیک', width: 18, getValue: p => p.supervisorMechanical || p.supervisorName || '-', align: 'right' },
  supervisorName: { header: 'نام ناظر (ثبت‌کننده)', width: 18, getValue: p => p.supervisorName || '-', align: 'right' },
  contractorName: { header: 'شرکت پیمانکار', width: 22, getValue: p => p.contractorName || '-', align: 'right' },
  contractAmount: { header: 'مبلغ قرارداد', width: 22, getValue: p => p.contractAmount ? parseFloat(p.contractAmount.replace(/[^\d]/g, '')) || 0 : 0, numFmt: '#,##0" ریال"', align: 'center', isNumeric: true, aggType: 'sum' },
  lastPaymentAmount: { header: 'مبلغ آخرین پرداخت', width: 22, getValue: p => p.lastPaymentAmount ? parseFloat(p.lastPaymentAmount.replace(/[^\d]/g, '')) || 0 : 0, numFmt: '#,##0" ریال"', align: 'center', isNumeric: true, aggType: 'sum' },
  lastPaymentDate: { header: 'تاریخ آخرین پرداخت', width: 14, getValue: p => p.lastPaymentDate || '-', align: 'center' },
  executionMethod: { header: 'روش ارجاع کار', width: 16, getValue: p => p.executionMethod || '-', align: 'center' },
};

const getColLetter = (colIdx: number): string => {
  return String.fromCharCode(64 + colIdx);
};

export const exportAllProjectsToExcel = async (projects: Project[], config?: AdvancedExportConfig) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'سامانه جامع نظارت عمرانی دانشگاه علوم پزشکی مشهد';
  wb.created = new Date();

  // 1) Filtering logic
  let filtered = [...projects];
  if (config) {
    if (config.selectedStatuses && config.selectedStatuses.length > 0) {
      filtered = filtered.filter(p => config.selectedStatuses!.includes(p.status));
    }
    if (config.selectedMainUsages && config.selectedMainUsages.length > 0) {
      filtered = filtered.filter(p => config.selectedMainUsages!.includes(p.mainUsage));
    }
    if (config.selectedCounties && config.selectedCounties.length > 0) {
      filtered = filtered.filter(p => config.selectedCounties!.includes(p.county));
    }
    if (config.selectedScales && config.selectedScales.length > 0) {
      filtered = filtered.filter(p => config.selectedScales!.includes(p.projectScale || 'under_200'));
    }
    if (config.selectedSupervisors && config.selectedSupervisors.length > 0) {
      filtered = filtered.filter(p => 
        config.selectedSupervisors!.includes(p.supervisorName) || 
        (p.supervisorCivil && config.selectedSupervisors!.includes(p.supervisorCivil)) ||
        (p.supervisorElectrical && config.selectedSupervisors!.includes(p.supervisorElectrical)) ||
        (p.supervisorMechanical && config.selectedSupervisors!.includes(p.supervisorMechanical))
      );
    }
  }

  // 2) Column selection logic
  const defaultCols = ['rowNum', 'projectName', 'mainUsage', 'county', 'area', 'progress', 'startDate', 'endDate', 'status'];
  const selectedColKeys = (config && config.selectedColumns && config.selectedColumns.length > 0)
    ? config.selectedColumns
    : defaultCols;

  // Render sheet implementation
  const renderSheet = (ws: ExcelJS.Worksheet, sheetProjects: Project[], sheetTitleSuffix: string = '') => {
    ws.views = [{ rightToLeft: true, showGridLines: true }];
    ws.pageSetup = {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };

    const numCols = selectedColKeys.length;
    
    ws.columns = selectedColKeys.map(key => ({
      key,
      width: ALL_COLUMNS_CONFIG[key]?.width || 16
    }));

    // Header styled area
    for (let r = 1; r <= 3; r++) {
      ws.getRow(r).height = r === 2 ? 30 : 25;
      for (let col = 1; col <= numCols; col++) {
        const cell = ws.getCell(r, col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      }
    }

    ws.mergeCells(1, 1, 1, numCols);
    const mainTitleCell = ws.getCell(1, 1);
    mainTitleCell.value = 'دانشگاه علوم پزشکی مشهد';
    mainTitleCell.font = { name: 'Vazirmatn', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
    mainTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells(2, 1, 2, numCols);
    const subtitleCell = ws.getCell(2, 1);
    subtitleCell.value = 'گزارش نظارتی جامع و اداری وضعیت پیشرفت پروژه‌های عمرانی' + (sheetTitleSuffix ? ` (${sheetTitleSuffix})` : '');
    subtitleCell.font = { name: 'Vazirmatn', size: 14, bold: true, color: { argb: 'FF1B365D' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells(3, 1, 3, numCols);
    const todayStr = new Date().toLocaleDateString('fa-IR');
    const infoCell = ws.getCell(3, 1);
    infoCell.value = `تاریخ گزارش‌گیری: ${todayStr} | مدیریت منابع فیزیکی و نظارت بر طرح‌های دانشگاه | تعداد طرح‌ها: ${sheetProjects.length} پروژه`;
    infoCell.font = { name: 'Vazirmatn', size: 10, italic: true, color: { argb: 'FF4B5563' } };
    infoCell.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.getRow(4).height = 10;

    // Header row 5
    const headerRow = ws.getRow(5);
    headerRow.height = 30;
    selectedColKeys.forEach((key, colIdx) => {
      const colOpt = ALL_COLUMNS_CONFIG[key];
      const cell = headerRow.getCell(colIdx + 1);
      cell.value = colOpt?.header || '';
      cell.font = { name: 'Vazirmatn', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B365D' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF111827' } },
        left: { style: 'thin', color: { argb: 'FF111827' } },
        bottom: { style: 'medium', color: { argb: 'FF111827' } },
        right: { style: 'thin', color: { argb: 'FF111827' } }
      };
    });

    // Project Rows
    sheetProjects.forEach((p, idx) => {
      const rNum = 6 + idx;
      const row = ws.getRow(rNum);
      row.height = 30;
      const isEven = idx % 2 === 0;
      const rBg = isEven ? 'FFFFFFFF' : 'FFF9FAFB';

      selectedColKeys.forEach((key, colIdx) => {
        const colOpt = ALL_COLUMNS_CONFIG[key];
        const cell = row.getCell(colIdx + 1);
        if (colOpt) {
          const val = colOpt.getValue(p, idx);
          cell.value = val;
          cell.font = { name: 'Vazirmatn', size: 10 };
          
          if (colOpt.numFmt) {
            cell.numFmt = colOpt.numFmt;
          }
          if (key === 'progress') {
            cell.font = { name: 'Vazirmatn', size: 10, bold: true, color: { argb: 'FF15803D' } };
          }
          
          cell.alignment = { horizontal: colOpt.align, vertical: 'middle' };
        }

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rBg } };
      });
    });

    // Summary/Aggregation Rows
    const summaryRowIndex = 6 + sheetProjects.length;
    const summaryRow = ws.getRow(summaryRowIndex);
    summaryRow.height = 32;

    let firstNumericColIdx = selectedColKeys.findIndex(key => {
      const opt = ALL_COLUMNS_CONFIG[key];
      return opt && opt.isNumeric && opt.aggType && opt.aggType !== 'none';
    }) + 1;

    if (firstNumericColIdx <= 1) {
      firstNumericColIdx = Math.min(3, numCols);
    }

    ws.mergeCells(summaryRowIndex, 1, summaryRowIndex, firstNumericColIdx);
    const labelCell = ws.getCell(summaryRowIndex, 1);
    labelCell.value = 'میانگین پیشبُرد پروژه‌ها و آمار تجمعی:';
    labelCell.font = { name: 'Vazirmatn', size: 10, bold: true };
    labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

    selectedColKeys.forEach((key, colIdx) => {
      const realColIdx = colIdx + 1;
      const cell = summaryRow.getCell(realColIdx);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF111827' } },
        bottom: { style: 'double', color: { argb: 'FF111827' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };

      if (realColIdx > firstNumericColIdx) {
        const colOpt = ALL_COLUMNS_CONFIG[key];
        const letter = getColLetter(realColIdx);
        if (colOpt && colOpt.isNumeric && colOpt.aggType !== 'none') {
          if (colOpt.aggType === 'sum') {
            cell.value = { formula: `=SUM(${letter}6:${letter}${summaryRowIndex - 1})` };
          } else if (colOpt.aggType === 'avg') {
            cell.value = { formula: `=AVERAGE(${letter}6:${letter}${summaryRowIndex - 1})` };
          }
          if (colOpt.numFmt) {
            cell.numFmt = colOpt.numFmt;
          }
          cell.font = { name: 'Vazirmatn', size: 11, bold: true, color: { argb: key === 'progress' ? 'FF1E3A8A' : 'FF111827' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.value = '';
        }
      }
    });
  };

  const cleanSheetName = (name: string): string => {
    return name.replace(/[\\/?*\[\]:]/g, ' ').slice(0, 30);
  };

  // Main list worksheet creation
  const wsMain = wb.addWorksheet('لیست اداری کل', {
    views: [{ rightToLeft: true, showGridLines: true }]
  });
  renderSheet(wsMain, filtered, 'کل پروژه‌ها');

  // Worksheets grouping creation (if requested)
  if (config && config.groupBy && config.groupBy !== 'none' && filtered.length > 0) {
    const groups: Record<string, Project[]> = {};
    filtered.forEach(p => {
      let key = '';
      if (config.groupBy === 'status') key = p.status || 'نامشخص';
      else if (config.groupBy === 'mainUsage') key = p.mainUsage || 'ثبت‌نشده';
      else if (config.groupBy === 'county') key = p.county || 'ثبت‌نشده';

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(p);
    });

    Object.entries(groups).forEach(([grpName, grpProjects]) => {
      const safeName = cleanSheetName(grpName);
      const wsGroup = wb.addWorksheet(safeName, {
        views: [{ rightToLeft: true, showGridLines: true }]
      });
      renderSheet(wsGroup, grpProjects, grpName);
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `گزارش_اداری_لیست_پروژه‌ها.xlsx`);
};

export const exportSingleReportToExcel = async (project: Project, report: Report) => {
  return exportProjectToExcel(project, report);
};
