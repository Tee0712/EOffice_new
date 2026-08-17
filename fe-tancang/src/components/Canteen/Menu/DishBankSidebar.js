import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Typography, 
  InputAdornment,
  Card,
  CardMedia,
} from '@mui/material';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Search, Plus, GripVertical } from 'lucide-react';

const DishItem = ({ dish, index, onAdd }) => (
  <Draggable draggableId={`dish-${dish.id}`} index={index}>
    {(provided, snapshot) => (
      <Card 
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        sx={{ 
          display: 'flex', 
          mb: 1.5, 
          p: 1.5, 
          cursor: snapshot.isDragging ? 'grabbing' : 'pointer', 
          '&:hover': { bgcolor: 'var(--neutral-50)', borderColor: 'var(--primary)' },
          bgcolor: snapshot.isDragging ? 'var(--glass-bg-hover)' : 'var(--glass-bg)',
          backdropFilter: 'blur(8px)',
          boxShadow: snapshot.isDragging ? 'var(--shadow-lg)' : 'none',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.2s ease',
          zIndex: snapshot.isDragging ? 1000 : 1
        }}
        onClick={() => onAdd(dish)}
      >
        <GripVertical size={16} color="var(--neutral-400)" style={{ marginRight: 8, marginTop: 4 }} />
        <CardMedia
          component="img"
          sx={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
          image={dish.image_url || 'https://placehold.co/100x100?text=Food'}
          alt={dish.name}
        />
        <Box sx={{ ml: 2, flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--neutral-800)', lineHeight: 1.2, mb: 0.5 }}>{dish.name}</Typography>
          <Typography variant="caption" sx={{ color: 'var(--neutral-500)', fontWeight: 600 }}>{dish.dish_code}</Typography>
        </Box>
        <Plus size={16} color="var(--primary)" />
      </Card>
    )}
  </Draggable>
);

const DishBankSidebar = ({ dishes = [], onAddDish }) => {
  const [search, setSearch] = useState('');

  const filteredDishes = dishes.filter(d => 
    (d.name?.toLowerCase().includes(search.toLowerCase())) || 
    (d.dish_code?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        placeholder="Tìm món ăn nhanh..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} color="var(--neutral-400)" />
            </InputAdornment>
          ),
        }}
        sx={{ 
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: 'var(--radius-md)',
            bgcolor: 'var(--neutral-50)',
            '& fieldset': { borderColor: 'var(--neutral-200)' }
          }
        }}
      />

      <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--neutral-500)', mb: 2, display: 'block', letterSpacing: '0.05em' }}>
        DANH MỤC MÓN ĂN ({filteredDishes.length})
      </Typography>

      <Droppable droppableId="dish-bank" isDropDisabled={true}>
        {(provided) => (
          <Box 
            {...provided.droppableProps}
            ref={provided.innerRef}
            sx={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 2 } }}
          >
            {filteredDishes.map((dish, index) => (
              <DishItem key={dish.id} dish={dish} index={index} onAdd={onAddDish} />
            ))}
            {provided.placeholder}
            {filteredDishes.length === 0 && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'var(--neutral-400)', fontStyle: 'italic' }}>
                  Không tìm thấy món ăn nào khớp với từ khóa
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Droppable>
    </Box>
  );
};

export default DishBankSidebar;
