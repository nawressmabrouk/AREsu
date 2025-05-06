export interface User {
    id: string;
    userId: string;
    sub?: string; // For JWT standard claims
    role: string;
    roles?: string[];
  }