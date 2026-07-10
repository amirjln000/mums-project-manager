import React, { useState, useEffect } from 'react';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { ProjectFormView } from './views/ProjectFormView';
import { ProjectDetailView } from './views/ProjectDetailView';
import { ReportFormView } from './views/ReportFormView';
import { getProject } from './lib/storage';
import { Project } from './types';

export type ViewState = 'login' | 'dashboard' | 'project_form' | 'project_detail' | 'report_form';

export default function App() {
  const [view, setView] = useState<ViewState>('login');
  const [supervisorName, setSupervisorName] = useState<string>('');
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [activeReportId, setActiveReportId] = useState<string | undefined>();
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('supervisorName');
    if (savedName) {
      setSupervisorName(savedName);
      setView('dashboard');
    }
  }, []);

  const handleLogin = (name: string) => {
    setSupervisorName(name);
    localStorage.setItem('supervisorName', name);
    setView('dashboard');
  };

  const handleLogout = () => {
    setSupervisorName('');
    localStorage.removeItem('supervisorName');
    setView('login');
  };

  const handleNavigate = async (newView: ViewState, projectId?: string, reportId?: string) => {
    setActiveReportId(reportId);
    if (projectId) {
      setActiveProjectId(projectId);
      if (newView === 'report_form' || newView === 'project_detail') {
        const p = await getProject(projectId);
        setActiveProject(p);
      }
    } else if (newView === 'project_form' && !projectId) {
      setActiveProjectId(undefined); // creating new
    }
    
    setView(newView);
  };

  return (
    <div className="min-h-screen text-gray-900 font-sans selection:bg-blue-200">
      {view === 'login' && <LoginView onLogin={handleLogin} />}
      
      {view === 'dashboard' && (
        <DashboardView 
          supervisorName={supervisorName} 
          onNavigate={handleNavigate} 
          onLogout={handleLogout}
        />
      )}
      
      {view === 'project_form' && (
        <ProjectFormView 
          supervisorName={supervisorName} 
          projectId={activeProjectId} 
          onNavigate={handleNavigate} 
        />
      )}
      
      {view === 'project_detail' && activeProjectId && (
        <ProjectDetailView 
          projectId={activeProjectId} 
          onNavigate={handleNavigate} 
        />
      )}
      
      {view === 'report_form' && activeProject && (
        <ReportFormView 
          project={activeProject} 
          reportId={activeReportId}
          supervisorName={supervisorName}
          onNavigate={handleNavigate} 
        />
      )}
    </div>
  );
}
