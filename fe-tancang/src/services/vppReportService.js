import { callApi } from './api';

export const reportService = {
  getSummary: async (fromDate, toDate) => {
    return new Promise((resolve) => 
      setTimeout(() => {
        resolve({
          total_requests: 124,
          total_cost: 42800000,
          budget: 50000000,
          completed: 120
        });
      }, 400)
    );
  },
  
  getReportDetails: async (tab, fromDate, toDate, departmentId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (tab === 'inventory') {
          resolve([
            { id: 1, code: 'VPP-GI-003', name: 'Giấy in A4 Paper One', category: 'Giấy in', unit: 'Ram', opening: 50, import: 100, export: 124, closing: 26 },
            { id: 2, code: 'VPP-BI-002', name: 'Cặp 3 dây Kingjim A4', category: 'Bìa / Cặp', unit: 'Cái', opening: 10, import: 50, export: 35, closing: 25 },
            { id: 3, code: 'VPP-BV-003', name: 'Bút chì gỗ Staedtler 2B', category: 'Bút viết', unit: 'Cây', opening: 20, import: 100, export: 72, closing: 48 },
            { id: 4, code: 'VPP-MI-002', name: 'Hộp mực Canon 337', category: 'Mực in', unit: 'Hộp', opening: 5, import: 10, export: 12, closing: 3 }
          ]);
        } else if (tab === 'department') {
          resolve([
            { id: 1, department: 'Phòng Kỹ thuật', requests: 45, qty: 156, cost: 12500000 },
            { id: 2, department: 'Phòng Hành chính', requests: 52, qty: 210, cost: 18400000 },
            { id: 3, department: 'Phòng Kế toán', requests: 27, qty: 85, cost: 11900000 },
          ]);
        } else if (tab === 'quota') {
          resolve([
            { id: 1, department: 'Phòng Kỹ thuật', actual: 12500000, quota: 15000000 },
            { id: 2, department: 'Phòng Hành chính', actual: 18400000, quota: 15000000 },
            { id: 3, department: 'Phòng Kế toán', actual: 11900000, quota: 12000000 },
            { id: 4, department: 'Ban Giám đốc', actual: 8000000, quota: 5000000 },
          ]);
        } else {
          // cost tab
          resolve([
            { id: 1, code: 'VPP-GI-003', name: 'Giấy in A4 Paper One 70gsm', category: 'Giấy in', unit: 'Ram', qty: 124, cost: 7440000, trend: 15 },
            { id: 2, code: 'VPP-BI-002', name: 'Cặp 3 dây Kingjim A4', category: 'Bìa / Cặp', unit: 'Cái', qty: 35, cost: 2450000, trend: 20 },
            { id: 3, code: 'VPP-BV-003', name: 'Bút chì gỗ Staedtler 2B', category: 'Bút viết', unit: 'Cây', qty: 72, cost: 360000, trend: -30 },
            { id: 4, code: 'VPP-KG-001', name: 'Kẹp bướm 32mm Deli', category: 'Kẹp / Ghim', unit: 'Hộp', qty: 58, cost: 870000, trend: 50 },
            { id: 5, code: 'VPP-MI-002', name: 'Hộp mực Canon 337', category: 'Mực in', unit: 'Hộp', qty: 3, cost: 4500000, trend: -3 },
          ]);
        }
      }, 600);
    });
  }
};
