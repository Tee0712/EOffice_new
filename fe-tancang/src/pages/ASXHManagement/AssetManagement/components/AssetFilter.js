import React from "react";
import { 
  Box, 
  TextField, 
  InputAdornment, 
  MenuItem, 
  Select, 
  FormControl 
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { SkySelect, SkyTextField } from "@styles/SkyStyles";

const AssetFilter = ({ onFilterChange }) => {
  const [keyword, setKeyword] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const handleChange = () => {
    onFilterChange({
      keyword,
      status: status === "all" ? "" : status
    });
  };

  React.useEffect(() => {
    const timer = setTimeout(handleChange, 500);
    return () => clearTimeout(timer);
  }, [keyword, status]);

  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <TextField
        placeholder="Tìm hiện vật..."
        size="small"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
            </InputAdornment>
          ),
        }}
        sx={{ 
          width: 250,
          "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "white" }
        }}
      />
      
      <FormControl size="small">
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ 
            minWidth: 150, borderRadius: "8px", bgcolor: "white",
            "& .MuiSelect-select": { py: "8.5px" }
          }}
        >
          <MenuItem value="all">Tất cả trạng thái</MenuItem>
          <MenuItem value="RECEIVED">Đã tiếp nhận</MenuItem>
          <MenuItem value="IN_PROCUREMENT">Đang mua sắm</MenuItem>
          <MenuItem value="PURCHASED">Đã mua</MenuItem>
          <MenuItem value="SHIPPING">Đang vận chuyển</MenuItem>
          <MenuItem value="DELIVERED">Đã bàn giao</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default AssetFilter;
