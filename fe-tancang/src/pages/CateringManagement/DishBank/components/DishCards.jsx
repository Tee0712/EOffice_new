import React from 'react';
import { 
  VisibilityOutlined as ViewIcon, 
  EditOutlined as EditIcon, 
  BlockOutlined as BlockIcon,
  CheckCircleOutlined as ActivateIcon
} from '@mui/icons-material';
import { getDishImage } from '../constants';

const DishCard = ({ dish, onView, onEdit, onToggle }) => {
  const isActive = dish.isActive === 1;

  const getCategoryTheme = (category) => {
    switch (category) {
      case 'com': return { class: 'rice', label: 'Cơm' };
      case 'bun_pho': return { class: 'noodle', label: 'Bún/Phở' };
      case 'canh': return { class: 'soup', label: 'Canh' };
      default: return { class: 'other', label: 'Khác' };
    }
  };

  const theme = getCategoryTheme(dish.category);
  const supplierAbbr = dish.supplierName ? dish.supplierName.substring(0, 2).toUpperCase() : 'NA';

  return (
    <div className={`dish-card-v2 ${!isActive ? 'inactive' : ''}`}>
      <div className="card-header">
        <img src={getDishImage(dish.imageUrl || dish.image_url, dish.category)} alt={dish.name} className="card-img" />
        <span className={`badge-category ${theme.class}`}>{theme.label}</span>
        <span className={`badge-status ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? 'Đang phục vụ' : 'Ngưng phục vụ'}
        </span>
      </div>

      <div className="card-content">
        <h3 className="card-title">{dish.name}</h3>
        <p className="card-code">{dish.code || 'MA-000'}</p>

        <div className="card-info-grid">
          <div className="info-item">
            <span className="info-label">Đơn giá:</span>
            <span className="info-value price">{dish.price?.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="info-item">
            <span className="info-label">Đơn vị:</span>
            <span className="info-value">{dish.unit || 'Suất'}</span>
          </div>
        </div>

        <div className="supplier-row">
          <div className="supplier-avatar">{supplierAbbr}</div>
          <div className="supplier-details">
            <span className="supplier-name">{dish.supplierName || 'N/A'}</span>
            <span className="supplier-id">{dish.supplier_code || 'NCC-000'}</span>
          </div>
        </div>

        <div className="card-actions-v2">
          <button className="btn-action view" onClick={() => onView(dish)} title="Xem chi tiết">
            <ViewIcon sx={{ fontSize: 18 }} /> Xem
          </button>
          <button className="btn-action edit" onClick={() => onEdit(dish)} title="Chỉnh sửa">
            <EditIcon sx={{ fontSize: 18 }} /> Sửa
          </button>
          <button className={`btn-action toggle ${isActive ? '' : 'activate'}`} onClick={() => onToggle(dish)} title={isActive ? 'Ngưng phục vụ' : 'Kích hoạt'}>
            {isActive
              ? <BlockIcon sx={{ fontSize: 18 }} />
              : <ActivateIcon sx={{ fontSize: 18 }} />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

const DishCards = ({ dishes, onView, onEdit, onToggle }) => (
  <div className="dishes-grid active">
    {dishes.map(dish => (
      <DishCard key={dish.id} dish={dish} onView={onView} onEdit={onEdit} onToggle={onToggle} />
    ))}
  </div>
);

export default DishCards;
