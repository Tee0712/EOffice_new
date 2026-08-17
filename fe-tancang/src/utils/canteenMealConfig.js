export const DEFAULT_MEAL_CONFIG = {
  1: {
    id: 1,
    mealSessionId: 1,
    key: "breakfast",
    name: "Ăn sáng",
    price: 25000,
    timeStart: "06:30",
    timeEnd: "08:00",
    time: "06:30 - 08:00",
    icon: "🌅",
    border: "#EAB308",
    bg: "#FEFCE8",
    dishName: "Phở bò Hà Nội / Bánh mì ốp la",
    active: true,
  },
  2: {
    id: 2,
    mealSessionId: 2,
    key: "lunch",
    name: "Ăn trưa",
    price: 25000,
    timeStart: "11:00",
    timeEnd: "13:00",
    time: "11:00 - 13:00",
    icon: "☀️",
    border: "#22C55E",
    bg: "#F0FDF4",
    dishName: "Cơm sườn nướng mật ong + Canh chua",
    active: true,
  },
  3: {
    id: 3,
    mealSessionId: 3,
    key: "dinner",
    name: "Ăn tối",
    price: 35000,
    timeStart: "17:30",
    timeEnd: "19:00",
    time: "17:30 - 19:00",
    icon: "🌙",
    border: "#A855F7",
    bg: "#FAF5FF",
    dishName: "Bún bò Huế đặc biệt / Cơm gà xối mỡ",
    active: true,
  },
};

export const getMealSessionConfig = () => {
  try {
    const raw = localStorage.getItem("CANTEEN_SYSTEM_SETTINGS");
    if (raw) {
      const parsed = JSON.parse(raw);
      const ms = parsed?.meal_session;
      if (ms) {
        const bPrice = Number(ms?.breakfast_price?.value ?? DEFAULT_MEAL_CONFIG[1].price);
        const lPrice = Number(ms?.lunch_price?.value ?? DEFAULT_MEAL_CONFIG[2].price);
        const dPrice = Number(ms?.dinner_price?.value ?? DEFAULT_MEAL_CONFIG[3].price);

        const bStart = ms?.breakfast_start_time?.value || "06:30";
        const bEnd = ms?.breakfast_end_time?.value || "08:00";
        const lStart = ms?.lunch_start_time?.value || "11:00";
        const lEnd = ms?.lunch_end_time?.value || "13:00";
        const dStart = ms?.dinner_start_time?.value || "17:30";
        const dEnd = ms?.dinner_end_time?.value || "19:00";

        return {
          1: {
            ...DEFAULT_MEAL_CONFIG[1],
            price: Number.isFinite(bPrice) && bPrice > 0 ? bPrice : 25000,
            timeStart: bStart,
            timeEnd: bEnd,
            time: `${bStart} - ${bEnd}`,
            active: ms?.breakfast_active?.value !== false,
          },
          2: {
            ...DEFAULT_MEAL_CONFIG[2],
            price: Number.isFinite(lPrice) && lPrice > 0 ? lPrice : 25000,
            timeStart: lStart,
            timeEnd: lEnd,
            time: `${lStart} - ${lEnd}`,
            active: ms?.lunch_active?.value !== false,
          },
          3: {
            ...DEFAULT_MEAL_CONFIG[3],
            price: Number.isFinite(dPrice) && dPrice > 0 ? dPrice : 35000,
            timeStart: dStart,
            timeEnd: dEnd,
            time: `${dStart} - ${dEnd}`,
            active: ms?.dinner_active?.value !== false,
          },
        };
      }
    }
  } catch (e) {
    console.warn("Read CANTEEN_SYSTEM_SETTINGS error:", e);
  }
  return DEFAULT_MEAL_CONFIG;
};
