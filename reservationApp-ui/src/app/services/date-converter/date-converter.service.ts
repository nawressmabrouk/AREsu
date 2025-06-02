import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateConverterService {
  // Convert API date strings to Date objects
  convertToDate(dateValue: string | Date): Date {
    if (dateValue instanceof Date) {
      return dateValue; // Already a Date
    }
    
    // Handle ISO strings
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      return new Date(dateValue);
    }
    
    // Fallback for other formats
    return new Date(dateValue);
  }

  //  ConvertS Date to API-acceptable format
  convertToApiFormat(date: Date): string {
    return date.toISOString();
  }
}