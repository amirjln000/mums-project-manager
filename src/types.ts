export type Discipline = 'ابنیه' | 'برق' | 'مکانیک';
export type ProjectStatus = 'فعال' | 'نیمه فعال' | 'متوقف' | 'شروع نشده' | 'اتمام یافته';
export type ProjectType = 'خانه بهداشت' | 'پایگاه اورژانس' | 'مرکز جامع سلامت شهری' | 'مرکز جامع سلامت روستایی' | 'بیمارستان' | 'سایر';
export type ProjectScale = 'under_200' | 'between_200_1000' | 'above_1000';

export interface ReportImage {
  id: string;
  dataUrl: string; // Base64
  description: string;
}

export interface DisciplineReport {
  progress: Record<string, number>;
  description: string;
  images: ReportImage[];
}

export interface Report {
  id: string;
  createdAt: number;
  discipline?: Discipline; // Used for legacy/migration
  progress?: Record<string, number>;
  description?: string;
  images: ReportImage[];
  
  // New grouped data
  disciplines?: {
    'ابنیه'?: DisciplineReport;
    'برق'?: DisciplineReport;
    'مکانیک'?: DisciplineReport;
  };
}

export interface Project {
  id: string;
  projectName: string;
  type: ProjectType;
  projectScale?: ProjectScale; // Scale of project estimation template
  supervisorName: string;
  
  supervisorCivil?: string;
  supervisorElectrical?: string;
  supervisorMechanical?: string;
  
  // Identification
  county: string;
  geoCoordinates?: string;
  mainUsage: string;
  subUsage: string;
  area: string;
  floors: string;
  beds: string;
  startDate: string;
  endDate: string;
  executionMethod?: string;
  
  // Contract
  contractorName: string;
  contractDate: string;
  contractNumber: string;
  contractAmount: string;
  lastPaymentAmount?: string;
  lastPaymentDate?: string;
  status: ProjectStatus;
  
  description: string;
  
  reports: Report[];
  history?: ProjectHistoryItem[];
}

export interface ProjectHistoryItem {
  id: string;
  timestamp: number;
  user: string;
  action: string;
  details?: string;
}

