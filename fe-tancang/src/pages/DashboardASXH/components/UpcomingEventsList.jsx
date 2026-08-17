import React from "react";
import { Box, Typography, List, ListItem, ListItemText, Stack, Chip, CircularProgress } from "@mui/material";
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ChartCard from "./ChartCard";
import dayjs from "dayjs";

const UpcomingEventsList = ({ data, loading }) => {
  return (
    <ChartCard title="Sự kiện sắp tới" extra={<Typography variant="body2" sx={{ color: "#2563EB", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", "&:hover": { textDecoration: "underline" } }}></Typography>} sx={{ borderRadius: "16px", boxShadow: "0px 4px 20px rgba(0,0,0,0.03)" }}>
      <Box sx={{ height: 340, overflowY: "auto", pr: 0.5, mt: 1 }}>
        {data && data.length > 0 ? (
          <List disablePadding>
            {data.map((event, index) => {
              const date = dayjs(event.event_date);
              const day = date.format("DD");
              const month = `TH${date.month() + 1}`;

              return (
                <ListItem
                  key={event.id || index}
                  alignItems="flex-start"
                  sx={{
                    py: 2,
                    px: 0,
                    borderBottom: index === data.length - 1 ? "none" : "1px solid #F1F5F9",
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 56,
                      height: 56,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 2.5,
                      borderRadius: "12px",
                      bgcolor: "#2563EB",
                      color: "#FFFFFF",
                      boxShadow: "0px 4px 10px rgba(37, 99, 235, 0.2)"
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1 }}>{day}</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase", opacity: 0.9 }}>{month}</Typography>
                  </Box>
                  <ListItemText
                    sx={{ my: 0 }}
                    primary={
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                          {event.title}
                        </Typography>
                        <Chip
                          label={event.badge_label}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.6rem",
                            fontWeight: 800,
                            backgroundColor: `${event.badge_color}15`,
                            color: event.badge_color,
                            borderRadius: "6px",
                            minWidth: 40
                          }}
                        />
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={0.5}>
                        <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500, fontSize: "0.85rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>
                          {event.description}
                        </Typography>
                        {event.location && (
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                            <LocationOnIcon sx={{ fontSize: "0.75rem", color: "#94A3B8" }} />
                            <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 600, fontSize: "0.7rem" }}>
                              {event.location}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        ) : loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Typography color="textSecondary" align="center" sx={{ pt: 10 }}>Không có sự kiện</Typography>
        )}
      </Box>
    </ChartCard>
  );
};

export default UpcomingEventsList;
