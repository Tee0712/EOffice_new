export const mealCriteria = [
  {
    id: "taste",
    scoreField: "tasteScore",
    averageField: "tasteAverage",
    title: "Khẩu vị",
    description: "Món ăn ngon, vừa miệng, nêm nếm hợp lý",
    icon: "🍜",
    accent: "#fff4cc",
  },
  {
    id: "hygiene",
    scoreField: "hygieneScore",
    averageField: "hygieneAverage",
    title: "Vệ sinh an toàn thực phẩm",
    description: "Thức ăn sạch sẽ, khu vực ăn gọn gàng",
    icon: "🧼",
    accent: "#dcfce7",
  },
  {
    id: "portion",
    scoreField: "portionScore",
    averageField: "portionAverage",
    title: "Khẩu phần",
    description: "Lượng cơm, thức ăn đủ no, phân chia hợp lý",
    icon: "⚖️",
    accent: "#e0e7ff",
  },
  {
    id: "variety",
    scoreField: "varietyScore",
    averageField: "varietyAverage",
    title: "Đa dạng món",
    description: "Thực đơn phong phú, không lặp lại nhiều",
    icon: "🥗",
    accent: "#fce7f3",
  },
  {
    id: "service",
    scoreField: "serviceScore",
    averageField: "serviceAverage",
    title: "Phục vụ",
    description: "Thái độ phục vụ, thời gian chờ, sắp xếp",
    icon: "🤝",
    accent: "#dcfce7",
  },
];

export const criteriaFieldMap = {
  taste: "tasteScore",
  hygiene: "hygieneScore",
  portion: "portionScore",
  variety: "varietyScore",
  service: "serviceScore",
};

export const criteriaIconMap = {
  utensils: "🍜",
  "shield-check": "🧼",
  scales: "⚖️",
  salad: "🥗",
  handshake: "🤝",
  taste: "🍜",
  hygiene: "🧼",
  portion: "⚖️",
  variety: "🥗",
  service: "🤝",
};

export const decorateCriteria = (criteria = []) =>
  criteria.map((item, index) => {
    const fallback = mealCriteria.find(
      (criterion) =>
        criterion.id === item.criteriaCode ||
        criterion.scoreField === criteriaFieldMap[item.criteriaCode]
    );

    return {
      id: item.criteriaCode || fallback?.id || `criterion-${index}`,
      scoreField:
        criteriaFieldMap[item.criteriaCode] ||
        fallback?.scoreField ||
        item.criteriaCode,
      averageField: fallback?.averageField,
      title: item.criteriaName || fallback?.title || "Tiêu chí",
      description: item.description || fallback?.description || "",
      icon:
        criteriaIconMap[item.iconName] ||
        criteriaIconMap[item.criteriaCode] ||
        fallback?.icon ||
        "⭐",
      accent: fallback?.accent || "#eef4ff",
      minScore: item.minScore ?? 1,
      maxScore: item.maxScore ?? 5,
      isRequired: item.isRequired ?? true,
      sortOrder: item.sortOrder ?? index + 1,
    };
  });

export const quickFeedbackTemplates = [
  {
    id: "very-satisfied",
    label: "Rất hài lòng",
    content:
      "Món ăn ngon, khẩu phần hợp lý, phục vụ nhanh và khu vực ăn sạch sẽ.",
  },
  {
    id: "acceptable",
    label: "Tạm ổn",
    content:
      "Chất lượng bữa ăn ở mức ổn, mong cải thiện thêm về hương vị và độ đa dạng món.",
  },
  {
    id: "need-improvement",
    label: "Cần cải thiện",
    content:
      "Bữa ăn hôm nay chưa phù hợp khẩu vị, đề nghị cải thiện hương vị, khẩu phần và cách phục vụ.",
  },
  {
    id: "better-menu",
    label: "Đề xuất thực đơn",
    content:
      "Đề xuất bổ sung thêm món luân phiên trong tuần để thực đơn đa dạng và đỡ lặp lại.",
  },
];

export const initialScores = Object.fromEntries(
  mealCriteria.map((item) => [item.id, 0])
);

export const reviewStatusLabels = {
  new: "Mới",
  pending_reply: "Chưa phản hồi",
  replied: "Đã phản hồi",
  closed: "Đã đóng",
};

export const reviewStatusTones = {
  new: { bg: "#eef2ff", color: "#2563eb" },
  pending_reply: { bg: "#fff4db", color: "#b45309" },
  replied: { bg: "#dcfce7", color: "#15803d" },
  closed: { bg: "#e2e8f0", color: "#475569" },
};

export const scoreColor = (score) => {
  if (score >= 4) return "#22c55e";
  if (score >= 3) return "#eab308";
  return "#f97316";
};

export const formatRatingStars = (score) =>
  "★".repeat(score) + "☆".repeat(5 - score);

const mealTypeLabelMap = {
  breakfast: "Bữa sáng",
  lunch: "Bữa trưa",
  afternoon: "Bữa chiều",
  dinner: "Bữa tối",
  morning: "Bữa sáng",
  trua: "Bữa trưa",
  toi: "Bữa tối",
  1: "Bữa sáng",
  2: "Bữa trưa",
  3: "Bữa chiều",
  4: "Bữa tối",
};

export const resolveMealTypeLabel = (menu) => {
  if (!menu) return "";
  const code =
    menu?.mealTypeCode ||
    menu?.mealType ||
    (typeof menu?.mealTypeName === "string"
      ? menu.mealTypeName.toLowerCase().trim()
      : "");

  return (
    mealTypeLabelMap[code] ||
    mealTypeLabelMap[menu?.mealTypeId] ||
    menu?.mealTypeName ||
    "Bữa ăn"
  );
};

export const buildMealOptionLabel = (menu) => {
  if (!menu) return "";
  const start = menu.servingStartTime?.slice(0, 5);
  const end = menu.servingEndTime?.slice(0, 5);
  const mealLabel = resolveMealTypeLabel(menu);

  if (start && end) {
    return `${mealLabel} (${start} - ${end})`;
  }

  return mealLabel;
};
