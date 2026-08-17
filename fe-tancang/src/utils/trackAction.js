/**
 * Tiện ích ghi log audit thao tác người dùng (Demo)
 * @param {string} actionName - Tên hành động (vd: CREATE_PROGRAM_START)
 * @param {object} payload - Dữ liệu đi kèm
 */
export const trackAction = (actionName, payload) => {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT LOG] [${timestamp}] ${actionName}:`, payload);
  
  // Trong thực tế, đây sẽ là một API call đến service log tập trung
  // api.post("/api/v1/system-logs", { action: actionName, payload, time: timestamp });
};
