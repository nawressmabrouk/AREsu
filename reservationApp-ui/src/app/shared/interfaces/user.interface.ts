export interface User {
    id: string;
    userId: string;
    sub?: string; 
    role: string;
    roles?: string[];
  }