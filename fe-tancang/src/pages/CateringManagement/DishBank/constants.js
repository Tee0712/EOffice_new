import * as yup from 'yup';
import { API_VIEW_FILE } from '@EnvironmentFile/constants/urlConfig';

export const dishSchema = yup.object().shape({
  name: yup.string().required('Tên món ăn không được để trống'),
  code: yup.string().required('Mã món ăn không được để trống'),
  category: yup.string().required('Phân loại không được để trống'),
  supplierId: yup.number()
    .transform((value, originalValue) => originalValue === "" ? undefined : value)
    .typeError('Nhà cung cấp không được để trống')
    .required('Nhà cung cấp không được để trống'),
  price: yup.number()
    .transform((value, originalValue) => originalValue === "" ? undefined : value)
    .typeError('Đơn giá phải là số')
    .positive('Giá phải là số dương')
    .required('Đơn giá không được để trống'),
  unit: yup.string().required('Đơn vị tính không được để trống'),
  description: yup.string().nullable(),
  image_url: yup.string().nullable(),
});

export const CATEGORIES = [
  { value: 'ALL', label: 'Tất cả', count: 48, color: '#1890ff' },
  { value: 'com', label: 'Món cơm', count: 18, color: '#fa8c16' },
  { value: 'bun_pho', label: 'Bún/Phở/Mì', count: 15, color: '#52c41a' },
  { value: 'canh', label: 'Canh/Soup', count: 10, color: '#13c2c2' },
  { value: 'mon_khac', label: 'Món khác', count: 15, color: '#722ed1' },
];

export const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Đang phục vụ' },
  { value: 'INACTIVE', label: 'Ngưng phục vụ' },
];

export const PRICE_RANGE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'UNDER_30K', label: 'Dưới 30.000đ' },
  { value: '30K_40K', label: '30.000đ-40.000đ' },
  { value: 'OVER_40K', label: 'Trên 40.000đ' },
];
export const DEFAULT_DISH_IMAGES = {
  com: 'https://api.lifetex.vn/static/canteen/com_trang.jpg',
  bun_pho: 'https://api.lifetex.vn/static/canteen/pho_bo.jpg',
  canh: 'https://api.lifetex.vn/static/canteen/canh_chua.jpg',
  mon_khac: 'https://api.lifetex.vn/static/canteen/ga_kho.jpg',
  default: 'https://api.lifetex.vn/static/canteen/com_trang.jpg'
};

export const getDishImage = (imageUrl, category) => {
  if (imageUrl && imageUrl !== 'null' && imageUrl !== 'undefined') {
    // If it's a relative path from the backend storage, prepend the view API
    if (String(imageUrl).startsWith('TCSG/') || (!String(imageUrl).startsWith('http') && String(imageUrl).includes('/'))) {
      return `${API_VIEW_FILE}/${imageUrl}`;
    }
    return imageUrl;
  }
  return DEFAULT_DISH_IMAGES[category] || DEFAULT_DISH_IMAGES.default;
};
