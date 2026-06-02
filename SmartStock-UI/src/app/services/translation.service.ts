import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private currentLang = signal<string>(localStorage.getItem('lang') || 'en');

  private translations: any = {
    en: {
      dashboard: 'Dashboard',
      products: 'Products',
      inventory: 'Inventory',
      billing: 'Billing',
      reports: 'Reports',
      settings: 'Settings',
      logout: 'Logout',
      welcome: 'Welcome',
      recent_sales: 'Recent Sales',
      total_revenue: 'Total Revenue',
      stock_status: 'Stock Status',
      add_new: 'Add New',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search...',
      profile: 'Profile',
      users: 'Users',
      roles: 'Roles',
      audit_log: 'Audit Log',
      enterprise: 'Enterprise',
      collapse_sidebar: 'Collapse Sidebar'
    },
    bn: {
      dashboard: 'ড্যাশবোর্ড',
      products: 'পণ্য',
      inventory: 'ইনভেন্টরি',
      billing: 'বিলিং',
      reports: 'রিপোর্ট',
      settings: 'সেটিংস',
      logout: 'লগআউট',
      welcome: 'স্বাগতম',
      recent_sales: 'সাম্প্রতিক বিক্রয়',
      total_revenue: 'মোট আয়',
      stock_status: 'স্টক অবস্থা',
      add_new: 'নতুন যোগ করুন',
      save: 'সেভ করুন',
      cancel: 'বাতিল',
      delete: 'ডিলিট',
      edit: 'এডিট',
      search: 'খুঁজুন...',
      profile: 'প্রোফাইল',
      users: 'ব্যবহারকারী',
      roles: 'রোল',
      audit_log: 'অডিট লগ',
      enterprise: 'এন্টারপ্রাইজ',
      collapse_sidebar: 'সাইডবার ছোট করুন'
    }
  };

  lang = computed(() => this.currentLang());

  translate(key: string): string {
    const keys = key.split('.');
    let value = this.translations[this.currentLang()];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  }

  setLanguage(lang: string) {
    this.currentLang.set(lang);
    localStorage.setItem('lang', lang);
  }

  getLanguage() {
    return this.currentLang();
  }
}
