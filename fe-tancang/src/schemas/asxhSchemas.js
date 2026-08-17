import { z } from "zod";

export const programItemSchema = z.object({
  name: z.string().min(1, "Tên hạng mục không được để trống"),
  unit_price: z.number().min(0, "Đơn giá phải >= 0"),
  quantity: z.number().int().min(1, "Số lượng phải >= 1"),
});

export const programMilestoneSchema = z.object({
  milestone_name: z.string().min(1, "Tên mốc không được để trống"),
  milestone_date: z.string().min(1, "Ngày không được để trống"),
  milestone_type: z.enum(["MANDATORY", "OPTIONAL"]),
});

export const programMemberSchema = z.object({
  user_id: z.union([z.number(), z.string()]),
  role: z.enum(["LEADER", "MEMBER", "VIEWER"]),
});

export const asxhProgramSchema = z.object({
  name: z.string().min(5, "Tên chương trình phải từ 5 ký tự"),
  funding_type: z.enum(["Bang_tien", "Hien_vat", "Giao_duc"], {
    errorMap: () => ({ message: "Vui lòng chọn loại hình tài trợ" }),
  }),
  locality: z.string().min(1, "Vui lòng chọn địa phương"),
  start_date: z.string().min(1, "Ngày bắt đầu là bắt buộc"),
  end_date: z.string().min(1, "Ngày kết thúc là bắt buộc"),
  beneficiary: z.string().optional(),
  classification_keywords: z.string().optional(),
  lead_user_id: z.union([z.number(), z.string().min(1, "Vui lòng chọn trưởng chương trình")]),
  lead_department: z.string().min(1, "Vui lòng chọn phòng ban chủ trì"),
  items: z.array(programItemSchema).optional(),
  milestones: z.array(programMilestoneSchema).optional(),
  members: z.array(programMemberSchema).min(1, "Phải có ít nhất 1 thành viên"),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, {
  message: "Ngày kết thúc phải sau ngày bắt đầu",
  path: ["end_date"],
});
