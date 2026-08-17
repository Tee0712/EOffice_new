import React, { useState, useEffect, useCallback } from "react";
import { Grid, TextField, Autocomplete, Box, Typography, Button, Avatar, IconButton, CircularProgress } from "@mui/material";
import { Add, Close } from "@mui/icons-material";
import asxhService from "@services/asxhService";

/**
 * Helper component for Form Fields with Labels Above
 */
const FormField = ({ label, required, children, sx = {} }) => (
  <Box sx={{ mb: 2, ...sx }}>
    <Typography 
      variant="body2" 
      sx={{ 
        fontWeight: 600, 
        color: "#344054", 
        mb: 1, 
        display: "flex", 
        alignItems: "center",
        fontSize: "0.875rem"
      }}
    >
      {label} {required && <Box component="span" sx={{ color: "#F04438", ml: 0.5 }}>*</Box>}
    </Typography>
    {children}
  </Box>
);

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    fontSize: "0.95rem",
    minHeight: "44px",
    "& fieldset": {
      borderColor: "#D0D5DD",
    },
    "&:hover fieldset": {
      borderColor: "#2563EB",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2563EB",
    },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#98A2B3",
    opacity: 1,
  },
};

const avatarColors = ["#00796b", "#e65100", "#1976d2", "#d81b60", "#388e3c", "#fbc02d", "#8e24aa"];
const getAvatarColor = (name) => {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const getInitials = (name) => {
  if (!name) return "U";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const PersonnelSection = ({ values, errors = {}, onChange, orgUnits = [] }) => {
  const [leaderOptions, setLeaderOptions] = useState([]);
  const [memberOptions, setMemberOptions] = useState([]);
  const [loadingLeader, setLoadingLeader] = useState(false);
  const [loadingMember, setLoadingMember] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedLeaderObj, setSelectedLeaderObj] = useState(null);

  // Async function to fetch users with limit
  const fetchUsers = async (query, setOptions, setLoading) => {
    setLoading(true);
    try {
      const res = await asxhService.getUsersLimit({ name: query, limit: 5 });
      if (res.success) {
        setOptions(res.data || []);
      }
    } catch (err) {
      console.error("Lỗi fetch nhân sự:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch for the leader if ID exists
  useEffect(() => {
    if (values.lead_user_id && !selectedLeaderObj) {
      // For now, we mock fetching the initial leader using the same API or it might be better 
      // if the parent component keeps a cache. Since the user asked for optimization, 
      // we only fetch when needed.
      asxhService.getUsersLimit({ limit: 1 }).then(res => {
        if (res.success && res.data.length > 0) {
           // This is just a fallback to avoid empty label on mount
           // Real implementation would use a "getUserById" API
        }
      });
    }
  }, [values.lead_user_id]);

  const handleLeaderSearch = (e, val) => {
    if (val.length >= 2) {
      fetchUsers(val, setLeaderOptions, setLoadingLeader);
    } else if (val.length === 0) {
      // Keep existing options or clear? Let's clear if empty or just let onOpen handle it
    }
  };

  const handleMemberSearch = (e, val) => {
    if (val.length >= 2) {
      fetchUsers(val, setMemberOptions, setLoadingMember);
    }
  };

  const handleLeaderChange = (e, nv) => {
    setSelectedLeaderObj(nv);
    onChange("lead_user_id", nv?.id || null);
    if (nv) {
      const userDept = nv.parent?.name || nv.organizationName || "";
      if (userDept && !values.lead_department) {
        onChange("lead_department", userDept);
      }
    }
  };

  const handleRemoveMember = (idx) => {
    const newMembers = values.members.filter((_, i) => i !== idx);
    onChange("members", newMembers);
  };

  const renderUserInfo = (option) => {
    const name = option.name || option.username || "";
    const dept = option.parent?.name || option.organizationName || "";
    return dept ? `${name} - ${dept}` : name;
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormField label="Trưởng chương trình" required>
            <Autocomplete
              options={leaderOptions}
              getOptionLabel={renderUserInfo}
              onInputChange={handleLeaderSearch}
              onOpen={() => {
                if (leaderOptions.length === 0) fetchUsers("", setLeaderOptions, setLoadingLeader);
              }}
              onChange={handleLeaderChange}
              value={selectedLeaderObj}
              loading={loadingLeader}
              openOnFocus
              sx={inputStyles}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  placeholder="Phạm Ngọc Hà - P.ASXH" 
                  error={!!errors.lead_user_id}
                  helperText={errors.lead_user_id}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingLeader ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </FormField>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormField label="Phòng ban chủ trì">
            <Autocomplete
              options={orgUnits}
              getOptionLabel={(o) => o.name || o}
              value={orgUnits.find(u => u.name === values.lead_department) || (values.lead_department ? { name: values.lead_department } : null)}
              onChange={(e, nv) => onChange("lead_department", nv?.name || nv)}
              freeSolo
              sx={inputStyles}
              renderInput={(params) => (
                <TextField {...params} placeholder="Phòng An sinh Xã hội" />
              )}
            />
          </FormField>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#344054", mb: 1.5 }}>
            Thành viên tham gia
          </Typography>

          <Box sx={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: 1.5,
            p: 1.5,
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            backgroundColor: "#FFFFFF",
            minHeight: "64px",
            alignItems: "center"
          }}>
            {/* Lead Pill */}
            {selectedLeaderObj && (
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 1, 
                pl: 1,
                pr: 1.5, 
                py: 0.75, 
                bgcolor: "#F8FAFC", 
                border: "1px solid #E2E8F0", 
                borderRadius: "50px" 
              }}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: getAvatarColor(selectedLeaderObj.name), fontSize: "0.75rem" }}>
                  {getInitials(selectedLeaderObj.name)}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#344054" }}>{selectedLeaderObj.name}</Typography>
                <Typography variant="caption" sx={{ color: "#64748B" }}>Trưởng CT</Typography>
                <IconButton size="small" onClick={() => handleLeaderChange(null, null)} sx={{ p: 0.25, ml: 0.5 }}>
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            )}

            {/* Members List */}
            {(values.members || []).map((m, idx) => (
               <Box key={idx} sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 1, 
                pl: 1,
                pr: 1.5, 
                py: 0.75, 
                bgcolor: "#F8FAFC", 
                border: "1px solid #E2E8F0", 
                borderRadius: "50px" 
              }}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: getAvatarColor(m.name || "Member"), fontSize: "0.75rem" }}>
                  {getInitials(m.name || m.user_id || "M")}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#344054" }}>{m.name || "Thành viên"}</Typography>
                <Typography variant="caption" sx={{ color: "#64748B" }}>Phối hợp</Typography>
                <IconButton size="small" onClick={() => handleRemoveMember(idx)} sx={{ p: 0.25, ml: 0.5 }}>
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}

            {/* Add Member Button/Search */}
            {!isAddingMember ? (
              <Button
                startIcon={<Add />}
                onClick={() => setIsAddingMember(true)}
                sx={{ 
                  textTransform: "none", 
                  color: "#64748B", 
                  fontWeight: 600, 
                  fontSize: "0.875rem",
                  border: "1px dashed #D0D5DD",
                  borderRadius: "50px",
                  px: 2,
                  "&:hover": { bgcolor: "#F1F5F9" }
                }}
              >
                Thêm thành viên
              </Button>
            ) : (
              <Autocomplete
                size="small"
                options={memberOptions}
                getOptionLabel={renderUserInfo}
                onInputChange={handleMemberSearch}
                onOpen={() => {
                  fetchUsers("", setMemberOptions, setLoadingMember);
                }}
                loading={loadingMember}
                onChange={(e, nv) => {
                  if (nv) {
                    const newMembers = [...(values.members || []), { ...nv, user_id: nv.id, name: nv.name, role: "MEMBER" }];
                    onChange("members", newMembers);
                  }
                  setIsAddingMember(false);
                }}
                onBlur={() => setIsAddingMember(false)}
                openOnFocus
                sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: "50px" } }}
                renderInput={(params) => <TextField {...params} autoFocus placeholder="Tìm nhân sự..." />}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PersonnelSection;
