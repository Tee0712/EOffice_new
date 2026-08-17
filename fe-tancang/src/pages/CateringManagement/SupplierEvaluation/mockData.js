export const mockStats = [
  { title: "Tổng đánh giá", value: 256, icon: "assignment", color: "#0ea5e9", bgColor: "#f0f9ff" },
  { title: "Chờ đánh giá", value: 5, icon: "schedule", color: "#f59e0b", bgColor: "#fffbeb" },
  { title: "Xuất sắc (4-5★)", value: 186, icon: "verified", color: "#22c55e", bgColor: "#f0fdf4" },
  { title: "Tốt (3-4★)", value: 58, icon: "thumb_up", color: "#8b5cf6", bgColor: "#f5f3ff" },
  { title: "Cần cải thiện", value: 12, icon: "report_problem", color: "#ef4444", bgColor: "#fef2f2" },
];

export const mockEvaluations = [
  {
    id: 1,
    supplierName: "Công ty TNHH Suất ăn Hương An",
    orderId: "DH-20250203-001",
    mealType: "Bữa trưa",
    quantity: 320,
    mainDish: "Cơm sườn nướng",
    date: "03/02/2025",
    status: "PENDING", // Chờ đánh giá
  },
  {
    id: 2,
    supplierName: "Công ty TNHH Suất ăn Hương An",
    orderId: "DH-20250202-001",
    mealType: "Bữa trưa",
    quantity: 315,
    mainDish: "Cá lóc kho tộ",
    date: "02/02/2025",
    status: "COMPLETED",
    overallScore: 4.8,
    scores: {
      food_quality: 5.0,
      delivery_time: 4.5,
      hygiene_safety: 5.0,
      service_attitude: 4.5
    },
    comment: "Món ăn rất ngon, giao hàng đúng giờ, đóng gói cẩn thận.",
  },
  {
    id: 3,
    supplierName: "Công ty CP Thực phẩm Phú Thịnh",
    orderId: "DH-20250201-002",
    mealType: "Bữa sáng",
    quantity: 150,
    mainDish: "Phở gà",
    date: "01/02/2025",
    status: "COMPLETED",
    overallScore: 4.0,
    scores: {
      food_quality: 4.0,
      delivery_time: 4.0,
      hygiene_safety: 4.5,
      service_attitude: 3.5
    },
    comment: "Phở hơi nguội khi đến nơi, nhưng chất lượng gà rất tốt.",
  }
];

export const mockSuppliers = [
  { id: 1, name: "Công ty TNHH Suất ăn Hương An", taxCode: "0101234567" },
  { id: 2, name: "Công ty CP Thực phẩm Phú Thịnh", taxCode: "0107654321" },
];

export const mockOrders = [
  { id: "DH-001", name: "Đơn hàng 03/02 - Bữa trưa" },
  { id: "DH-002", name: "Đơn hàng 02/02 - Bữa trưa" },
];
