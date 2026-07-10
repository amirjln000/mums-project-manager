import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Project, Discipline } from '../types'
import { getDisciplineItems } from '../data/disciplines'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const TASK_WEIGHTS_UNDER_200: Record<string, number> = {
  // ابنیه (مجموع: 74 درصد)
  'خاکبرداری و فونداسیون': 9,
  'اسکلت و سقف': 14,
  'سفت کاری': 11,
  'کف سازی': 2,
  'نازک کاری': 14,
  'سقف کاذب': 3,
  'کاشی و سرامیک و سنگ': 9,
  'در و پنجره': 3,
  'نما': 9,
  // برق (مجموع: 13 درصد)
  'لوله کشی فولادی-pvc ...و ساپورت ها': 2,
  'نصب سیم و کابل و سرسیم و کابلشو...': 4,
  'کلید و پریزهای برق-تلفن-شبکه-آنتن و چراغها': 2,
  'تابلوهای برق (فشار ضعیف و متوسط) و تجهیزات شبکه': 3,
  'سیستم های جریان ضعیف (تلفن-صوت-آنتن-احضار پرستار-اینترکام...) اعلام حریق': 2,
  // مکانیک (مجموع: 13 درصد)
  'اجرای لوله کشی فاضلاب،آب باران ونت و ...': 3,
  'اجرای لوله کشی آب مصرفی، آتش نشانی، سیستم گرمایشی و سرمایشی': 3,
  'اجرای کانال کشی هوا و اگزاست به همراه ساپورت و اجرای ساپورت لوله ها': 2,
  'نصب کولر، رادیاتور، اگزاست، فن کویل و ..': 1,
  'نصبیات بهداشتی ، آشپزخانه وتأسیساتی دریچه ها': 4
};

export const TASK_WEIGHTS_BETWEEN_200_1000: Record<string, number> = {
  // ابنیه (مجموع: 73 درصد)
  'خاکبرداری و فونداسیون': 9,
  'اسکلت و سقف': 14,
  'سفت کاری': 11,
  'کف سازی': 2,
  'نازک کاری': 14,
  'سقف کاذب': 3,
  'کاشی و سرامیک و سنگ': 9,
  'در و پنجره': 3,
  'نما': 8,
  // برق (مجموع: 14 درصد)
  'لوله کشی فولادی-pvc ...و ساپورت ها': 2,
  'نصب سیم و کابل و سرسیم و کابلشو...': 4,
  'کلید و پریزهای برق-تلفن-شبکه-آنتن و چراغها': 3,
  'تابلوهای برق (فشار ضعیف و متوسط) و تجهیزات شبکه': 3,
  'سیستم های جریان ضعیف (تلفن-صوت-آنتن-احضار پرستار-اینترکام...) اعلام حریق': 2,
  // مکانیک (مجموع: 13 درصد)
  'اجرای لوله کشی فاضلاب،آب باران ونت و ...': 2,
  'اجرای لوله کشی آب مصرفی، آتش نشانی، سیستم گرمایشی و سرمایشی': 2,
  'اجرای کانال کشی هوا و اگزاست به همراه ساپورت و اجرای ساپورت لوله ها': 1.5,
  'نصب کولر، رادیاتور، اگزاست، فن کویل و ..': 0.5,
  'موتورخانه شامل دیگ، پمپ، شیرآلات، اتصالات و ...': 4,
  'نصبیات بهداشتی ، آشپزخانه وتأسیساتی دریچه ها': 3
};

export const TASK_WEIGHTS_ABOVE_1000: Record<string, number> = {
  // ابنیه (مجموع: 55.05 درصد)
  'خاکبرداری و عملیات بنایی سنگ و اجرا فونداسیون و اسکلت': 13.8,
  'قالب بندی و آرماتور بندی و اجرای سقف و دیوار برشی': 6.52,
  'اجرای والپست و تیغه چینی': 4.05,
  'کف سازی': 1.5,
  'اجرای نازک کاری بدنه و سنگ ، کاشی و سرامیک': 9.03,
  'سقف کاذب': 2.71,
  'نقاشی': 2.85,
  'کار های چوبی ، در و پنجره': 4.98,
  'اجرای نما و محوطه': 9.61,
  // برق (مجموع: 18 درصد)
  'لوله کشی فولادی- pvc ... و ساپورت ها': 2.57,
  'اجرای سیم و کابل و سرسیم و کابلشو...(کابل برق -تلفن -شبکه و ...)': 5.14,
  'کلید و پریزهای برق -تلفن -شبکه -آنتن و چراغهای روشنایی': 3.86,
  'تابلوهای برق (فشار ضعیف و متوسط) و تجهیزات شبکه': 3.86,
  'سیستم های جریان ضعیف (تلفن -صوت -آنتن -احضار پرستار-اینترکام...) اعلام حریق': 2.57,
  // مکانیک (مجموع: 27 درصد)
  'اجرای لوله کشی فاضلاب، آب باران ونت و ...': 4.15,
  'اجرای لوله کشی آب مصرفی، آتش نشانی، سیستم گرمایشی و سرمایشی': 4.15,
  'اجرای کانال کشی هوا و اگزاست به همراه ساپورت و اجرای ساپورت لوله ها ، دریچه ها': 3.12,
  'نصب کولر، رادیاتور، اگزاست، فن کویل و هواکش ..': 1.04,
  'موتورخانه شامل دیگ، پمپ، شیرآلات، اتصالات و ...': 8.31,
  'نصبیات بهداشتی ، آشپزخانه و تأسیساتی دریچه ها': 6.23
};

export const TASK_WEIGHTS = TASK_WEIGHTS_UNDER_200;

export function getTaskWeights(scale?: string): Record<string, number> {
  if (scale === 'above_1000') {
    return TASK_WEIGHTS_ABOVE_1000;
  }
  if (scale === 'between_200_1000') {
    return TASK_WEIGHTS_BETWEEN_200_1000;
  }
  return TASK_WEIGHTS_UNDER_200;
}

export function calculateOverallProgress(project: Project): number {
  let weightedProgressSum = 0;
  const scale = project.projectScale || 'under_200';
  const disciplineItems = getDisciplineItems(scale);
  const taskWeights = getTaskWeights(scale);

  ['ابنیه', 'برق', 'مکانیک'].forEach(discipline => {
    // Find the latest report that has this discipline
    const dReports = project.reports.filter(r => {
      if (r.disciplines && r.disciplines[discipline as Discipline]) return true;
      if (r.discipline === discipline) return true;
      return false;
    }).sort((a,b) => b.createdAt - a.createdAt);
    
    const latestReport = dReports.length > 0 ? dReports[0] : null;

    const items = disciplineItems[discipline] || [];

    items.forEach(item => {
      let progressPercent = 0;
      if (latestReport) {
        if (latestReport.disciplines && latestReport.disciplines[discipline as Discipline]) {
          progressPercent = latestReport.disciplines[discipline as Discipline]!.progress[item] || 0;
        } else if (latestReport.progress) {
          progressPercent = latestReport.progress[item] || 0;
        }
      }
      
      const weight = taskWeights[item] || 0;
      // Convert progress (0-100) and weight (0-100) into overall percentage points contribution
      weightedProgressSum += (progressPercent / 100) * weight;
    });
  });

  return Math.round(weightedProgressSum);
}
