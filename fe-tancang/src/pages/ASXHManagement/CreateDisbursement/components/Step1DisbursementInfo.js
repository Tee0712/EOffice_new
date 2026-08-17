import React from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  TextField, 
  MenuItem,
  Stack,
  Avatar
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const Step1DisbursementInfo = ({ data, onChange, programItems = [], nextCodeInfo = {}, errors = {} }) => {

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" mb={2.5}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ bgcolor: "#3B82F6", width: 26, height: 26, fontSize: "13px", fontWeight: 700 }}>1</Avatar>
          <Typography fontWeight={700} color="#0f172a" sx={{ fontSize: "17px" }}>
            Thông tin đợt giải ngân
          </Typography>
        </Box>
        
        <Box sx={{ display: "flex", gap: 1 }}>
           <Box sx={{ px: 1.5, py: 0.5, bgcolor: "#ecf2f7", borderRadius: "8px", border: "1px solid #d0d7de" }}>
              <Typography variant="caption" fontWeight={700} color="#0055cc" sx={{ fontSize: "12px", fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif" }}>
                {nextCodeInfo.code || "GN-001/03"}
              </Typography>
           </Box>
           <Box sx={{ px: 1.5, py: 0.5, bgcolor: "#fff9c4", borderRadius: "8px", border: "1px solid #f9e16d" }}>
              <Typography variant="caption" fontWeight={700} color="#856404" sx={{ fontSize: "12px", fontFamily: "\"Inter\", \"Roboto\", \"Segoe UI\", \"Helvetica\", \"Arial\", sans-serif" }}>
                Đợt {nextCodeInfo.order_number || "1"}
              </Typography>
           </Box>
        </Box>
      </Stack>

      <Paper elevation={0} sx={{ p: 4, borderRadius: "12px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
        <Grid container spacing={3.5}>
          <Grid item xs={12}>
            <Typography variant="body2" fontWeight={700} color="#475569" sx={{ display: "block", mb: 1, fontSize: "13px" }}>
              Nội dung giải ngân <span style={{ color: "#ef4444" }}>*</span>
            </Typography>
            <TextField 
              fullWidth 
              id="disbursement_content"
              placeholder="VD: Đợt 3 – Thi công đường liên ấp Phú Túc – An Khánh"
              value={data.disbursement_content || ""}
              onChange={(e) => onChange("disbursement_content", e.target.value)}
              error={!!errors.disbursement_content}
              helperText={errors.disbursement_content}
              sx={{ 
                "& .MuiOutlinedInput-root": { 
                  borderRadius: "10px",
                  bgcolor: "#fff",
                  "& fieldset": { borderColor: "#d1d5db" }
                } 
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" fontWeight={700} color="#475569" sx={{ display: "block", mb: 1, fontSize: "13px" }}>
              Mô tả chi tiết
            </Typography>
            <TextField 
              fullWidth 
              id="detailed_description"
              multiline 
              minRows={3} 
              placeholder="Thanh toán lần 1 cho hạng mục thi công đường liên ấp Phú Túc – An Khánh..."
              value={data.detailed_description || ""}
              onChange={(e) => onChange("detailed_description", e.target.value)}
              sx={{ 
                "& .MuiOutlinedInput-root": { 
                  borderRadius: "10px",
                  bgcolor: "#fff",
                  "& fieldset": { borderColor: "#d1d5db" },
                  padding: "12px 14px"
                } 
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight={700} color="#475569" sx={{ display: "block", mb: 1, fontSize: "13px" }}>
              Ngày dự kiến chuyển tiền <span style={{ color: "#ef4444" }}>*</span>
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker 
                format="MM/DD/YYYY"
                value={data.expected_transfer_date ? dayjs(data.expected_transfer_date) : null}
                onChange={(val) => onChange("expected_transfer_date", val ? val.format("YYYY-MM-DD") : null)}
                slotProps={{
                  textField: {
                    id: "expected_transfer_date",
                    error: !!errors.expected_transfer_date,
                    helperText: errors.expected_transfer_date,
                    fullWidth: true,
                    sx: { 
                      "& .MuiOutlinedInput-root": { 
                        borderRadius: "10px",
                        bgcolor: "#fff",
                        "& fieldset": { borderColor: "#d1d5db" }
                      } 
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight={700} color="#475569" sx={{ display: "block", mb: 1, fontSize: "13px" }}>
              Hạng mục liên quan
            </Typography>
            <TextField 
              select 
              id="program_item_id"
              fullWidth
              value={data.program_item_id || ""}
              onChange={(e) => onChange("program_item_id", e.target.value)}
              error={!!errors.program_item_id}
              helperText={errors.program_item_id}
              sx={{ 
                "& .MuiOutlinedInput-root": { 
                  borderRadius: "10px",
                  bgcolor: "#fff",
                  "& fieldset": { borderColor: "#d1d5db" }
                } 
              }}
            >
              <MenuItem value="">-- Chọn hạng mục --</MenuItem>
              {programItems.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} - {item.approved_budget?.toLocaleString()} VNĐ
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Step1DisbursementInfo;
