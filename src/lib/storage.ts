import { Project } from '../types';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const PROJECTS_COLLECTION = 'projects';

export const getProjects = async (): Promise<Project[]> => {
  try {
    const projectsCol = collection(db, PROJECTS_COLLECTION);
    const projectSnapshot = await getDocs(projectsCol);
    const projects = projectSnapshot.docs.map(doc => doc.data() as Project);
    return projects.sort((a, b) => (b.reports?.length || 0) - (a.reports?.length || 0));
  } catch (error) {
    console.error('Error fetching projects from firestore:', error);
    return [];
  }
};

export const subscribeProjects = (callback: (projects: Project[]) => void) => {
  const projectsCol = collection(db, PROJECTS_COLLECTION);
  return onSnapshot(projectsCol, (snapshot) => {
    const projects = snapshot.docs.map(doc => doc.data() as Project);
    projects.sort((a, b) => (b.reports?.length || 0) - (a.reports?.length || 0));
    callback(projects);
  });
};

export const getProject = async (id: string): Promise<Project | null> => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Project;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    return null;
  }
};

export const saveProject = async (project: Project): Promise<void> => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, project.id);
    await setDoc(docRef, project);
  } catch (error) {
    console.error('Error saving project to firestore:', error);
    throw error;
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    throw error;
  }
};
