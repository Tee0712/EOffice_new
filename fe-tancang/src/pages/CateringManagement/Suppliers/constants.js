import * as yup from 'yup';

export const supplierSchema = yup.object().shape({
  name: yup.string().required('Tên nhà cung cấp là bắt buộc'),
  taxCode: yup.string().required('Mã số thuế là bắt buộc').matches(/^[0-9]{10,13}$/, 'MST phải từ 10-13 số'),
  contactName: yup.string().required('Người đại diện là bắt buộc'),
  phone: yup.string().required('Số điện thoại là bắt buộc').matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'SĐT không hợp lệ'),
  email: yup.string().email('Email không đúng định dạng').required('Email là bắt buộc'),
  type: yup.string().required('Vui lòng chọn loại hình cung cấp'),
  address: yup.string().required('Địa chỉ là bắt buộc'),
  startDate: yup.date().nullable().required('Ngày bắt đầu hợp đồng là bắt buộc'),
  endDate: yup.date().nullable().required('Ngày kết thúc hợp đồng là bắt buộc')
    .min(yup.ref('startDate'), 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu'),
  notes: yup.string()
});

export const contractSchema = yup.object().shape({
  contractNo: yup.string().required('Số hợp đồng là bắt buộc'),
  signDate: yup.date().required('Ngày ký là bắt buộc'),
  effectiveDate: yup.date().required('Ngày hiệu lực là bắt buộc'),
  expiryDate: yup.date().required('Ngày hết hạn là bắt buộc')
    .min(yup.ref('effectiveDate'), 'Ngày hết hạn phải sau ngày hiệu lực'),
  amount: yup.number().min(0, 'Giá trị phải lớn hơn 0').required('Giá trị hợp đồng là bắt buộc')
});

export const evaluationSchema = yup.object().shape({
  supplierId: yup.number().required(),
  rating: yup.number().min(1, 'Vui lòng đánh giá sao').max(5).required(),
  comment: yup.string().required('Vui lòng nhập nội dung đánh giá'),
  evaluationDate: yup.date().default(() => new Date())
});
