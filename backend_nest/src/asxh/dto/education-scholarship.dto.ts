import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { z } from 'zod';

// --- ENUMS ---
export const CandidateStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'INTERVIEW',
  'APPROVED',
  'REJECTED',
  'DISBURSED',
]);

// --- UNIVERSITY PARTNERS ---

export const UniversityPartnerListingQuerySchema = z.object({
  keyword: z.string().optional(),
  school_year: z.string().optional(),
  status: z.string().optional(), // Thêm lọc trạng thái (ACTIVE, INACTIVE...)
  page: z.preprocess((val) => Number(val ?? 1), z.number().min(1)).default(1),
  limit: z.preprocess((val) => Number(val ?? 20), z.number().min(1)).default(20),
});

export class UniversityPartnerListingQueryDto {
  @Allow()
  @ApiPropertyOptional({ example: 'Đại học' })
  keyword?: string;

  @Allow()
  @ApiPropertyOptional({ example: '2025-2026' })
  school_year?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Trạng thái hợp tác (ACTIVE, INACTIVE...)' })
  status?: string;

  @Allow()
  @ApiPropertyOptional({ example: 1 })
  page?: number;

  @Allow()
  @ApiPropertyOptional({ example: 20 })
  limit?: number;
}

export const CreateUniversityPartnerQuotaSchema = z.object({
  major_name: z.string().min(1, 'Vui lòng nhập tên ngành/chuyên ngành'),
  slots: z.preprocess((val) => (val === '' || val === null ? 0 : Number(val)), z.number().min(0, 'Số suất không được nhỏ hơn 0')).optional().nullable(),
  amount_per_slot: z.preprocess((val) => (val === '' || val === null ? 0 : Number(val)), z.number().min(0, 'Mức học bổng không được nhỏ hơn 0')).optional().nullable(),
});

export class CreateUniversityPartnerQuotaDto {
  @Allow()
  @ApiProperty({ example: 'Công nghệ thông tin' })
  major_name: string;

  @Allow()
  @ApiPropertyOptional({ example: 10 })
  slots?: number;

  @Allow()
  @ApiPropertyOptional({ example: 5000000 })
  amount_per_slot?: number;
}

export const CreateUniversityPartnerContactSchema = z.object({
  full_name: z.string().min(1, 'Họ tên liên hệ không được để trống').optional().nullable(),
  name: z.string().min(1, 'Họ tên liên hệ không được để trống').optional().nullable(),
  title: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email không hợp lệ').optional().nullable().or(z.literal('')),
});

export class CreateUniversityPartnerContactDto {
  @Allow()
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  full_name?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  name?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Trưởng phòng công tác sinh viên' })
  title?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Trưởng phòng công tác sinh viên' })
  position?: string;

  @Allow()
  @ApiPropertyOptional({ example: '0987654321' })
  phone?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'contact@university.edu.vn' })
  email?: string;
}

export const CreateUniversityPartnerSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên trường đại học'),
  short_name: z.string().min(1, 'Vui lòng nhập tên viết tắt'),
  code: z.string().min(1, 'Vui lòng nhập mã trường'),
  logo_path: z.string().optional().nullable(),
  address: z.string().min(1, 'Vui lòng nhập địa chỉ'),
  website: z.string().optional().nullable(),
  primary_field: z.string().optional().nullable(),
  main_field: z.string().optional().nullable(),
  cooperation_status: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  mou_number: z.string().optional().nullable(),
  expected_sign_date: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().min(1, 'Vui lòng chọn ngày ký MOU').optional().nullable()),
  sign_date: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().min(1, 'Vui lòng chọn ngày ký MOU').optional().nullable()),
  effective_date: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().min(1, 'Vui lòng chọn ngày hết hạn').optional().nullable()),
  expiry_date: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().min(1, 'Vui lòng chọn ngày hết hạn').optional().nullable()),
  tcsg_signer_name: z.string().optional().nullable(),
  signatory_tcsg: z.string().optional().nullable(),
  tcsg_signer_title: z.string().optional().nullable(),
  school_signer_name: z.string().optional().nullable(),
  signatory_school: z.string().optional().nullable(),
  school_signer_title: z.string().optional().nullable(),
  cooperation_goal: z.string().optional().nullable(),
  cooperation_goals: z.string().optional().nullable(),
  min_gpa: z.preprocess((val) => (val === '' || val === null ? null : Number(val)), z.number().min(0, 'GPA không được nhỏ hơn 0').max(10, 'GPA không được lớn hơn 10').nullable()).optional(),
  priority_target: z.string().optional().nullable(),
  priority_group: z.string().optional().nullable(),
  school_year: z.string().optional().nullable(),
  cooperation_contents: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  quotas: z.array(CreateUniversityPartnerQuotaSchema).optional().nullable(),
  contacts: z.array(CreateUniversityPartnerContactSchema).optional().nullable(),
});

export class CreateUniversityPartnerDto {
  @Allow()
  @ApiPropertyOptional({ example: 'Đại học Bách Khoa TP.HCM' })
  name?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'HCMUT' })
  short_name?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'DT-BK-01' })
  code?: string;

  @Allow()
  @ApiPropertyOptional()
  logo_path?: string;

  @Allow()
  @ApiPropertyOptional({ example: '268 Lý Thường Kiệt, Q.10, TP.HCM' })
  address?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'https://hcmut.edu.vn' })
  website?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Giáo dục & Đào tạo' })
  primary_field?: string;

  @Allow()
  @ApiPropertyOptional()
  main_field?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'ACTIVE' })
  cooperation_status?: string;

  @Allow()
  @ApiPropertyOptional()
  status?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'MOU-2025/01' })
  mou_number?: string;

  @Allow()
  @ApiPropertyOptional({ example: '2025-05-01' })
  expected_sign_date?: string;

  @Allow()
  @ApiPropertyOptional()
  sign_date?: string;

  @Allow()
  @ApiPropertyOptional({ example: '2025-06-01' })
  effective_date?: string;

  @Allow()
  @ApiPropertyOptional()
  expiry_date?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Nguyễn Văn B' })
  tcsg_signer_name?: string;

  @Allow()
  @ApiPropertyOptional()
  signatory_tcsg?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Tổng Giám đốc' })
  tcsg_signer_title?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Trần Văn C' })
  school_signer_name?: string;

  @Allow()
  @ApiPropertyOptional()
  signatory_school?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Hiệu trưởng' })
  school_signer_title?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Hợp tác đào tạo nguồn nhân lực chất lượng cao' })
  cooperation_goal?: string;

  @Allow()
  @ApiPropertyOptional()
  cooperation_goals?: string;

  @Allow()
  @ApiPropertyOptional({ example: 8.0 })
  min_gpa?: number;

  @Allow()
  @ApiPropertyOptional({ example: 'Sinh viên nghèo vượt khó' })
  priority_target?: string;

  @Allow()
  @ApiPropertyOptional()
  priority_group?: string;

  @Allow()
  @ApiPropertyOptional({ example: '2025-2026' })
  school_year?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Chi tiết nội dung hợp tác...' })
  cooperation_contents?: string | string[];

  @Allow()
  @ApiPropertyOptional({ type: [CreateUniversityPartnerQuotaDto] })
  quotas?: CreateUniversityPartnerQuotaDto[];

  @Allow()
  @ApiPropertyOptional({ type: [CreateUniversityPartnerContactDto] })
  contacts?: CreateUniversityPartnerContactDto[];
}

export class UpdateUniversityPartnerDto extends CreateUniversityPartnerDto {}
export const UpdateUniversityPartnerSchema = CreateUniversityPartnerSchema;

export const UploadPartnerAttachmentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  doc_type: z.string().optional(),
});

export class UploadPartnerAttachmentDto {
  @Allow()
  @ApiProperty({ example: 'Biên bản thỏa thuận' })
  title: string;

  @Allow()
  @ApiPropertyOptional({ example: 'MOU' })
  doc_type?: string;
}

// --- SCHOLARSHIP CANDIDATES ---

export const ScholarshipCandidateListingQuerySchema = z.object({
  keyword: z.string().optional(),
  university_partner_id: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().optional()),
  status: z.preprocess((val) => (val === '' ? undefined : val), CandidateStatusEnum.optional()),
  school_year: z.string().optional(),
  page: z.preprocess((val) => Number(val ?? 1), z.number().min(1)).default(1),
  limit: z.preprocess((val) => Number(val ?? 20), z.number().min(1)).default(20),
});

export class ScholarshipCandidateListingQueryDto {
  @Allow()
  @ApiPropertyOptional({ example: 'Nguyễn Văn' })
  keyword?: string;

  @Allow()
  @ApiPropertyOptional({ example: 1 })
  university_partner_id?: number;

  @Allow()
  @ApiPropertyOptional({ enum: ['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'] })
  status?: string;

  @Allow()
  @ApiPropertyOptional({ example: '2025-2026' })
  school_year?: string;

  @Allow()
  @ApiPropertyOptional({ example: 1 })
  page?: number;

  @Allow()
  @ApiPropertyOptional({ example: 20 })
  limit?: number;
}

export const CreateScholarshipCandidateResultSchema = z.object({
  semester_name: z.string().optional().nullable(),
  semester: z.string().optional().nullable(),
  semester_gpa: z.preprocess((val) => (val === '' || val === null ? 0 : Number(val)), z.number().min(0, 'GPA không được nhỏ hơn 0').max(10, 'GPA tối đa là 10')).optional().nullable(),
  gpa: z.preprocess((val) => (val === '' || val === null ? 0 : Number(val)), z.number().min(0).max(10)).optional().nullable(),
  credits: z.preprocess((val) => (val === '' || val === null ? 0 : Number(val)), z.number().int().min(0, 'Số tín chỉ không được nhỏ hơn 0')).optional().nullable(),
  classification: z.string().optional().nullable(),
  rank: z.string().optional().nullable(),
});

export class CreateScholarshipCandidateResultDto {
  @Allow()
  @ApiPropertyOptional({ example: 'Học kỳ 1 - 2024-2025' })
  semester_name?: string;

  @Allow()
  @ApiPropertyOptional()
  semester?: string;

  @Allow()
  @ApiPropertyOptional({ example: 3.8 })
  semester_gpa?: number;

  @Allow()
  @ApiPropertyOptional()
  gpa?: number;

  @Allow()
  @ApiPropertyOptional({ example: 20 })
  credits?: number;

  @Allow()
  @ApiPropertyOptional({ example: 'Giỏi' })
  classification?: string;

  @Allow()
  @ApiPropertyOptional()
  rank?: string;
}

export const CreateScholarshipCandidateAttachmentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  path: z.string().min(1, 'Đường dẫn file là bắt buộc'),
  doc_type: z.string().optional().nullable(),
  is_required: z.preprocess((val) => val === 'true' || val === true || val === 1, z.boolean().optional()).default(false).nullable(),
  status: z.string().optional().default('DRAFT').nullable(),
});

export class CreateScholarshipCandidateAttachmentDto {
  @Allow()
  @ApiProperty({ example: 'Bảng điểm năm 1' })
  title: string;

  @Allow()
  @ApiProperty({ example: '/uploads/transcripts/abc.pdf' })
  path: string;

  @Allow()
  @ApiPropertyOptional({ example: 'TRANSCRIPT' })
  doc_type?: string;

  @Allow()
  @ApiPropertyOptional({ example: true })
  is_required?: boolean;

  @Allow()
  @ApiPropertyOptional({ example: 'DRAFT' })
  status?: string;
}

export const CreateScholarshipCandidateSchema = z.object({
  university_partner_id: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().min(1, 'Vui lòng chọn trường đại học')),
  full_name: z.string().min(1, 'Họ tên không được để trống'),
  dob: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().min(1, 'Vui lòng chọn ngày sinh')),
  birth_date: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  national_id: z.string().min(1, 'Vui lòng nhập CMND/CCCD'),
  identity_number: z.string().optional().nullable(),
  phone: z.string().min(1, 'Vui lòng nhập số điện thoại'),
  email: z.string().email('Email không hợp lệ').min(1, 'Vui lòng nhập email'),
  avatar_path: z.string().optional().nullable(),
  permanent_address: z.string().min(1, 'Vui lòng nhập địa chỉ thường trú'),
  address: z.string().optional().nullable(),
  ethnicity: z.string().optional().nullable(),
  hometown: z.string().min(1, 'Vui lòng nhập quê quán'),
  university_name: z.string().optional().nullable(),
  major_name: z.string().min(1, 'Vui lòng chọn ngành học'),
  student_code: z.string().min(1, 'Vui lòng nhập mã số sinh viên'),
  course_code: z.string().optional().nullable(),
  study_year: z.string().optional().nullable(),
  education_type: z.string().optional().nullable(),
  gpa_current: z.preprocess((val) => (val === '' || val === null ? null : Number(val)), z.number().min(0, 'GPA không được nhỏ hơn 0').max(4.0, 'Vui lòng nhập điểm hệ 4 (Tối đa 4.0)').nullable()),
  gpa: z.preprocess((val) => (val === '' || val === null ? null : Number(val)), z.number().min(0).max(10).nullable()).optional(),
  gpa_scale: z.preprocess((val) => (val ? Number(val) : null), z.number().min(0).max(10).nullable()).optional(),
  priority_group: z.string().optional().nullable(),
  family_context: z.string().optional().nullable(),
  family_description: z.string().optional().nullable(),
  income_per_person_per_month: z.preprocess((val) => (val === '' || val === null ? 0 : Number(val)), z.number().min(0)).optional(),
  income_per_capita: z.preprocess((val) => (val === '' || val === null ? 0 : Number(val)), z.number().min(0)).optional(),
  siblings_in_school_count: z.preprocess((val) => (val === '' || val === null ? 0 : Number(val)), z.number().int().min(0)).optional(),
  studying_siblings: z.preprocess((val) => (val === '' || val === null ? 0 : Number(val)), z.number().int().min(0)).optional(),
  motivation_letter: z.string().min(1, 'Vui lòng trình bày bài luận / động lực xin học bổng'),
  essay_content: z.string().optional().nullable(),
  extracurricular: z.string().optional().nullable(),
  skills_certificates: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  status: CandidateStatusEnum.default('DRAFT').nullable(),
  school_year: z.string().min(1, 'Niên khóa học bổng không được để trống'),
  semester_results: z.array(CreateScholarshipCandidateResultSchema).min(1, 'Vui lòng nhập kết quả của ít nhất 1 học kỳ'),
  attachments: z.array(CreateScholarshipCandidateAttachmentSchema).optional().nullable(),
});

export class CreateScholarshipCandidateDto {
  @Allow()
  @ApiPropertyOptional({ example: 1 })
  university_partner_id?: number;

  @Allow()
  @ApiProperty({ example: 'Nguyễn Văn D' })
  full_name?: string;

  @Allow()
  @ApiPropertyOptional({ example: '2004-10-20' })
  dob?: string;

  @Allow()
  @ApiPropertyOptional()
  birth_date?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Nam' })
  gender?: string;

  @Allow()
  @ApiPropertyOptional({ example: '012345678901' })
  national_id?: string;

  @Allow()
  @ApiPropertyOptional()
  identity_number?: string;

  @Allow()
  @ApiPropertyOptional({ example: '0900111222' })
  phone?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'candidate@student.edu.vn' })
  email?: string;

  @Allow()
  @ApiPropertyOptional()
  avatar_path?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Kon Tum' })
  permanent_address?: string;

  @Allow()
  @ApiPropertyOptional()
  address?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Kinh' })
  ethnicity?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Quảng Ngãi' })
  hometown?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Đại học Bách Khoa TP.HCM' })
  university_name?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Cơ khí' })
  major_name?: string;

  @Allow()
  @ApiPropertyOptional({ example: '2210001' })
  student_code?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'K2022' })
  course_code?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Năm 3' })
  study_year?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Chính quy' })
  education_type?: string;

  @Allow()
  @ApiPropertyOptional({ example: 8.5 })
  gpa_current?: number;

  @Allow()
  @ApiPropertyOptional()
  gpa?: number;

  @Allow()
  @ApiPropertyOptional({ example: 10.0 })
  gpa_scale?: number;

  @Allow()
  @ApiPropertyOptional({ example: 'Hộ nghèo' })
  priority_group?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Gia đình khó khăn...' })
  family_context?: string;

  @Allow()
  @ApiPropertyOptional()
  family_description?: string;

  @Allow()
  @ApiPropertyOptional({ example: 2000000 })
  income_per_person_per_month?: number;

  @Allow()
  @ApiPropertyOptional()
  income_per_capita?: number;

  @Allow()
  @ApiPropertyOptional({ example: 2 })
  siblings_in_school_count?: number;

  @Allow()
  @ApiPropertyOptional()
  studying_siblings?: number;

  @Allow()
  @ApiPropertyOptional({ example: 'Kính gửi ban xét tuyển...' })
  motivation_letter?: string;

  @Allow()
  @ApiPropertyOptional()
  essay_content?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'Tham gia Mùa hè xanh...' })
  extracurricular?: string;

  @Allow()
  @ApiPropertyOptional({ example: 'IELTS 6.5' })
  skills_certificates?: string;

  @Allow()
  @ApiPropertyOptional()
  skills?: string;

  @Allow()
  @ApiPropertyOptional({ enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'], default: 'DRAFT' })
  status?: string;

  @Allow()
  @ApiPropertyOptional({ example: '2025-2026' })
  school_year?: string;

  @Allow()
  @ApiPropertyOptional({ type: [CreateScholarshipCandidateResultDto] })
  semester_results?: CreateScholarshipCandidateResultDto[];

  @Allow()
  @ApiPropertyOptional({ type: [CreateScholarshipCandidateAttachmentDto] })
  attachments?: CreateScholarshipCandidateAttachmentDto[];
}

export class UpdateScholarshipCandidateDto extends CreateScholarshipCandidateDto {}
export const UpdateScholarshipCandidateSchema = CreateScholarshipCandidateSchema;

export const UploadCandidateAttachmentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  doc_type: z.string().optional(),
  is_required: z.preprocess((val) => val === 'true' || val === true || val === 1, z.boolean().optional()).default(false),
  status: z.string().optional().default('DRAFT'),
});

export class UploadCandidateAttachmentDto {
  @Allow()
  @ApiProperty({ example: 'Bảng điểm năm 1' })
  title: string;

  @Allow()
  @ApiPropertyOptional({ example: 'TRANSCRIPT' })
  doc_type?: string;

  @Allow()
  @ApiPropertyOptional({ example: true })
  is_required?: boolean;

  @Allow()
  @ApiPropertyOptional({ example: 'DRAFT' })
  status?: string;
}

export const CandidateStatusUpdateSchema = z.object({
  status: CandidateStatusEnum,
});

export class CandidateStatusUpdateDto {
  @Allow()
  @ApiProperty({ enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'] })
  status: string;
}

// --- OVERVIEW ---

export class EducationScholarshipOverviewDto {
  @ApiProperty()
  total_partners: number;

  @ApiProperty()
  total_candidates: number;

  @ApiProperty()
  total_approved_candidates: number;

  @ApiProperty()
  total_disbursed_candidates: number;

  @ApiProperty()
  total_slots: number;

  @ApiProperty()
  total_budget: number;

  @ApiProperty()
  disbursed_budget: number;

  @ApiProperty()
  candidate_status_stats: { status: string; count: number }[];

  @ApiProperty()
  partner_stats: { name: string; candidate_count: number; approved_count: number }[];
}
