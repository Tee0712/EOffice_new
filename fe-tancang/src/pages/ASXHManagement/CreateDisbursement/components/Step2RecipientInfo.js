import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  TextField, 
  MenuItem,
  Stack,
  Avatar,
  Divider,
  Button
} from "@mui/material";
import { 
  Edit as EditIcon,
  Cached as SwitchIcon,
  CheckCircle as ValidIcon
} from "@mui/icons-material";
import asxhService from "@services/asxhService";

const Step2RecipientInfo = ({ data, onChange, errors = {} }) => {

  const [receivers, setReceivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    const fetchReceivers = async () => {
      setLoading(true);
      try {
        const res = await asxhService.getReceivers();
        if (res.success) {
          setReceivers(res.data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch receivers", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReceivers();
  }, []);

  const handleSelectReceiver = (receiverId) => {
    if (receiverId === "NEW") {
      setIsManual(true);
      // Clear data for new entry
      onChange("receiver_id", null);
      onChange("receiving_unit", "");
      onChange("bank_account_number", "");
      onChange("bank_name", "");
      onChange("bank_branch", "");
      onChange("account_holder", "");
      onChange("tax_code", "");
      return;
    }

    setIsManual(false);
    const selected = receivers.find(r => String(r.id) === String(receiverId));
    if (selected) {
      onChange("receiver_id", selected.id);
      onChange("receiving_unit", selected.name);
      onChange("bank_account_number", selected.bank_account_number);
      onChange("bank_name", selected.bank_name);
      onChange("bank_branch", selected.bank_branch || "");
      onChange("account_holder", selected.bank_account_holder);
      onChange("tax_code", selected.tax_code);
    } else {
      onChange("receiver_id", null);
    }
  };

  const textFieldStyle = {
    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
    "& .MuiInputBase-input": { py: 1.5 }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
        <Avatar sx={{ bgcolor: "#3B82F6", width: 26, height: 26, fontSize: "13px", fontWeight: 700 }}>2</Avatar>
        <Typography fontWeight={700} color="#0f172a" sx={{ fontSize: "17px" }}>
          Đơn vị nhận & Thông tin ngân hàng
        </Typography>
      </Stack>

      <Paper elevation={0} sx={{ p: 4, borderRadius: "12px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
        {/* Chọn đơn vị */}
        <Box mb={3}>
          <Typography variant="body2" fontWeight={700} color="#475569" sx={{ display: "block", mb: 1, fontSize: "13px" }}>
            Chọn đơn vị nhận tiền <span style={{ color: "#ef4444" }}>*</span>
          </Typography>
          <TextField 
            select 
            fullWidth
            id="receiver_id"
            value={isManual ? "NEW" : (data.receiver_id || "")}
            onChange={(e) => handleSelectReceiver(e.target.value)}
            error={!!errors.receiver_id}
            helperText={errors.receiver_id}
            sx={textFieldStyle}
            placeholder="Chọn đơn vị..."
          >
            <MenuItem value=""><em>-- Chọn đơn vị --</em></MenuItem>
            {receivers.map(r => (
              <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
            ))}
            <Divider />
            <MenuItem value="NEW" sx={{ color: "#2563eb", fontWeight: 700 }}>
              + Nhập đơn vị mới...
            </MenuItem>
          </TextField>
        </Box>

        {/* TRƯỜNG HỢP 1: TỰ NHẬP MỚI (Show Form) */}
        {isManual && (
          <Grid container spacing={3}>
            {/* Hàng 1: Định danh */}
            <Grid item xs={12} md={9}>
              <Typography variant="body2" fontWeight={700} color="#475569" sx={{ display: "block", mb: 1, fontSize: "13px" }}>
                Tên đơn vị nhận <span style={{ color: "#ef4444" }}>*</span>
              </Typography>
              <TextField 
                fullWidth 
                id="receiving_unit"
                placeholder="Tên công ty / tổ chức"
                value={data.receiving_unit || ""}
                onChange={(e) => onChange("receiving_unit", e.target.value)}
                error={!!errors.receiving_unit}
                helperText={errors.receiving_unit}
                sx={textFieldStyle}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Typography variant="body2" fontWeight={700} color="#475569" sx={{ display: "block", mb: 1, fontSize: "13px" }}>
                Mã số thuế
              </Typography>
              <TextField 
                fullWidth 
                placeholder="MST"
                value={data.tax_code || ""}
                onChange={(e) => onChange("tax_code", e.target.value)}
                sx={textFieldStyle}
              />
            </Grid>

            {/* Hàng 2: Thông tin tài khoản */}
            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight={700} color="#475569" sx={{ display: "block", mb: 1, fontSize: "13px" }}>
                Số tài khoản <span style={{ color: "#ef4444" }}>*</span>
              </Typography>
              <TextField 
                fullWidth 
                id="bank_account_number"
                placeholder="Nhập số tài khoản"
                value={data.bank_account_number || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ""); // Only numbers
                  onChange("bank_account_number", val);
                }}
                error={!!errors.bank_account_number}
                helperText={errors.bank_account_number}
                sx={textFieldStyle}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight={700} color="#475569" sx={{ display: "block", mb: 1, fontSize: "13px" }}>
                Chủ tài khoản <span style={{ color: "#ef4444" }}>*</span>
              </Typography>
              <TextField 
                fullWidth 
                id="account_holder"
                placeholder="Tên chủ tài khoản (viết hoa)"
                value={data.account_holder || ""}
                onChange={(e) => onChange("account_holder", e.target.value.toUpperCase())}
                error={!!errors.account_holder}
                helperText={errors.account_holder}
                sx={textFieldStyle}
              />
            </Grid>

            {/* Hàng 3: Ngân hàng */}
            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight={700} color="#475569" sx={{ display: "block", mb: 1, fontSize: "13px" }}>
                Ngân hàng <span style={{ color: "#ef4444" }}>*</span>
              </Typography>
              <TextField 
                select
                fullWidth 
                id="bank_name"
                value={data.bank_name || ""}
                onChange={(e) => onChange("bank_name", e.target.value)}
                error={!!errors.bank_name}
                helperText={errors.bank_name}
                sx={textFieldStyle}
              >
                <MenuItem value=""><em>Chọn ngân hàng...</em></MenuItem>
                <MenuItem value="Vietcombank">Vietcombank</MenuItem>
                <MenuItem value="BIDV">BIDV</MenuItem>
                <MenuItem value="Agribank">Agribank</MenuItem>
                <MenuItem value="VietinBank">VietinBank</MenuItem>
                <MenuItem value="Techcombank">Techcombank</MenuItem>
                <MenuItem value="MBBank">MBBank (Ngân hàng Quân đội)</MenuItem>
                <MenuItem value="ACB">ACB (Ngân hàng Á Châu)</MenuItem>
                <MenuItem value="VPBank">VPBank (Ngân hàng Thịnh Vượng)</MenuItem>
                <MenuItem value="Sacombank">Sacombank</MenuItem>
                <MenuItem value="HDBank">HDBank</MenuItem>
                <MenuItem value="TPBank">TPBank</MenuItem>
                <MenuItem value="VIB">VIB (Ngân hàng Quốc tế)</MenuItem>
                <MenuItem value="SHB">SHB (Ngân hàng Sài Gòn - Hà Nội)</MenuItem>
                <MenuItem value="Eximbank">Eximbank</MenuItem>
                <MenuItem value="MSB">MSB (Ngân hàng Hàng Hải)</MenuItem>
                <MenuItem value="SeABank">SeABank</MenuItem>
                <MenuItem value="LienVietPostBank">LPBank</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight={700} color="#475569" sx={{ display: "block", mb: 1, fontSize: "13px" }}>
                Chi nhánh
              </Typography>
              <TextField 
                fullWidth 
                placeholder="Chi nhánh ngân hàng"
                value={data.bank_branch || ""}
                onChange={(e) => onChange("bank_branch", e.target.value)}
                sx={textFieldStyle}
              />
            </Grid>
          </Grid>
        )}

        {/* TRƯỜNG HỢP 2: CHỌN ĐÃ CÓ (Show Card) */}
        {!isManual && data.receiver_id && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              bgcolor: "#f8fafc", 
              borderRadius: "12px", 
              border: "1px solid #e2e8f0",
              position: "relative"
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="#0f172a">{data.receiving_unit}</Typography>
                <Box sx={{ display: "inline-flex", alignItems: "center", mt: 0.5, bgcolor: "#dcfce7", px: 1, py: 0.2, borderRadius: "4px" }}>
                   <ValidIcon sx={{ color: "#16a34a", fontSize: 14, mr: 0.5 }} />
                   <Typography variant="caption" fontWeight={700} color="#16a34a">Đã lưu</Typography>
                </Box>
              </Box>
            </Stack>

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>SỐ TÀI KHOẢN</Typography>
                  <Typography variant="body2" fontWeight={700}>{data.bank_account_number || "---"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>CHỦ TÀI KHOẢN</Typography>
                  <Typography variant="body2" fontWeight={700}>{data.account_holder || "---"}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>NGÂN HÀNG</Typography>
                  <Typography variant="body2" fontWeight={700}>{data.bank_name || "---"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>MÃ SỐ THUẾ</Typography>
                  <Typography variant="body2" fontWeight={700}>{data.tax_code || "---"}</Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2, borderStyle: "dashed" }} />
            
            <Stack direction="row" spacing={2}>
               <Button 
                startIcon={<SwitchIcon />} 
                size="small" 
                sx={{ textTransform: "none", fontWeight: 600 }}
                onClick={() => handleSelectReceiver("")}
               >
                Đổi tài khoản khác
               </Button>
            </Stack>
          </Paper>
        )}
      </Paper>
    </Box>
  );
};

export default Step2RecipientInfo;
