export type DifficultyLevel = 'ئاساسىي' | 'ئوتتۇرا' | 'چوڭقۇر';

export interface StudyQuestion {
  id: number;
  topic: string;
  difficulty: DifficultyLevel;
  question: string;
  answer: string;
  keyPoint: string;
  mastered?: boolean;
}

export interface StudyBook {
  id: string;
  bookTitle: string;
  author: string;
  category: string;
  description: string;
  createdAt: string;
  questions: StudyQuestion[];
}

export interface ExtensionSettings {
  reminderEnabled: boolean;
  theme: 'light' | 'dark';
}

export type WorkspaceTab = 'simulator' | 'code' | 'prd' | 'spec' | 'style';
