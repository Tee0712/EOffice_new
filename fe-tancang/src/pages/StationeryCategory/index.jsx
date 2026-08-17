import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  CheckCircleOutline,
  CreditCardOutlined,
  FileDownloadOutlined as FileDownloadOutlinedIcon,
  Inventory2Outlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import VppPageHeader from "@components/vpp/VppPageHeader";
import { useStationeryData } from "../../hooks/useStationeryData";
import {
  createStationeryItem,
  deleteStationeryItem,
  updateStationeryItem,
  updateStationeryStatus,
} from "../../services/stationeryService";
import { fetchVPPCategories } from "../../services/inventoryService";
import FilterBar from "./components/FilterBar";
import ItemGrid from "./components/ItemGrid";
import ItemTable from "./components/ItemTable";
import AddStationeryDrawer from "./components/AddStationeryDrawer";
import ImportCatalogModal from "./components/ImportCatalogModal";
import { formatValidationErrors } from "../../utils/utils";

const StationeryCategory = () => {
  const { data, loading, filters, stats, handleFilterChange, refetch } =
    useStationeryData();

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Reuse logic/service from InventoryManagement (đang hoạt động đúng)
        const res = await fetchVPPCategories();
        if (!res) return;

        const rawItems =
          res?.data?.items ||
          res?.items ||
          res?.data ||
          (Array.isArray(res) ? res : []);

        if (Array.isArray(rawItems)) {
          const normalized = rawItems
            .filter(Boolean)
            .map((c) => {
              if (typeof c === "string") return { value: c, label: c };
              if (c?.value !== undefined && c?.label !== undefined) return c;
              if (c?.value !== undefined) return { value: c.value, label: c.value };
              if (c?.label !== undefined) return { value: c.label, label: c.label };
              return null;
            })
            .filter(Boolean);
          setCategories(normalized);
        }
      } catch (error) {
        console.error("Lỗi khi load danh sách nhóm hàng:", error);
      }
    };

    loadCategories();
  }, []);

  // Fallback: nếu API nhóm hàng rỗng/lỗi, derive từ data đang hiển thị
  useEffect(() => {
    if (categories.length) return;
    const list = Array.isArray(data) ? data : [];
    const derived = Array.from(
      new Set(
        list
          .map((i) => i?.category || i?.categoryId || i?.category_name)
          .filter(Boolean)
      )
    ).map((v) => ({ value: v, label: v }));

    if (derived.length) setCategories(derived);
  }, [data, categories.length]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [view, setView] = useState("list");
  const [isSaving, setIsSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: "",
    row: null,
  });

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
    if (!open) {
      setTimeout(() => setEditingItem(null), 300);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setDrawerOpen(true);
  };

  const handleSaveItem = async (formData) => {
    try {
      setIsSaving(true);
      if (editingItem && editingItem.id) {
        await updateStationeryItem(editingItem.id, formData);
      } else {
        await createStationeryItem(formData);
      }
      setDrawerOpen(false);
      setEditingItem(null);
      refetch?.();
    } catch (error) {
      console.error("Lỗi khi lưu mặt hàng:", error);
      const errorMsg = formatValidationErrors(error, "Đã xảy ra lỗi khi lưu thông tin.");
      alert(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    try {
      setIsSaving(true);
      await deleteStationeryItem(confirmDialog.row.id);
      setConfirmDialog({ open: false, type: "", row: null });
      refetch?.();
    } catch (err) {
      alert("Xóa thất bại. Dummy API có thể chưa phản hồi đúng.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatusItem = async () => {
    try {
      setIsSaving(true);
      const newStatus = confirmDialog.row.status === "active" ? "hidden" : "active";
      await updateStationeryStatus(confirmDialog.row.id, newStatus);
      setConfirmDialog({ open: false, type: "", row: null });
      refetch?.();
    } catch (err) {
      alert("Cập nhật trạng thái thất bại. Dummy API có thể chưa phản hồi đúng.");
    } finally {
      setIsSaving(false);
    }
  };
  const displayData = Array.isArray(data) ? data : [];

  const totalCount = stats?.total !== undefined ? stats.total : displayData.length;
  const activeCount = stats?.active !== undefined ? stats.active : displayData.filter((i) => i.status === "active").length;
  const hiddenCount = stats?.hidden !== undefined ? stats.hidden : displayData.filter((i) => i.status === "hidden").length;
  const groupsCount = categories.length > 0 ? categories.length : (stats?.groups || new Set(displayData.map((i) => i.category).filter(Boolean)).size || 0);

  return (
    <Box sx={{ backgroundColor: "#f1f5f9", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="xl">
        <VppPageHeader
          title="Danh mục Văn phòng phẩm"
          subtitle="Quản lý toàn bộ danh mục mặt hàng, định mức cấp phát và thông tin tham khảo"
          actions={
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={() => setImportModalOpen(true)}
                sx={{
                  borderRadius: "8px",
                  borderColor: "#cbd5e1",
                  color: "#334155",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  height: 42,
                  backgroundColor: "#fff",
                  fontSize: "13px",
                  "&:hover": {
                    borderColor: "#2563eb",
                    backgroundColor: "#eff6ff",
                    color: "#2563eb",
                  },
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                Import Excel
              </Button>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingItem(null);
                  setDrawerOpen(true);
                }}
                sx={{
                  borderRadius: "8px",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  height: 42,
                  fontSize: "13px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  "&:hover": {
                    backgroundColor: "#1d4ed8",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                Thêm mặt hàng
              </Button>
            </Stack>
          }
        />

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "grey.200",
                p: 1.5,
              }}
            >
              <Stack direction="row" alignItems="center">
                <Avatar
                  variant="rounded"
                  sx={{
                    bgcolor: "#e8effe",
                    color: "#255df2",
                    width: 44,
                    height: 44,
                    mr: 2,
                    borderRadius: 1.5,
                  }}
                >
                  <Inventory2Outlined />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="800" color="#0f172a">
                    {totalCount}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight="500"
                  >
                    Tổng mặt hàng
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "grey.200",
                p: 1.5,
              }}
            >
              <Stack direction="row" alignItems="center">
                <Avatar
                  variant="rounded"
                  sx={{
                    bgcolor: "#e6f8f1",
                    color: "#16a34a",
                    width: 44,
                    height: 44,
                    mr: 2,
                    borderRadius: 1.5,
                  }}
                >
                  <CheckCircleOutline />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="800" color="#0f172a">
                    {activeCount}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight="500"
                  >
                    Đang hoạt động
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "grey.200",
                p: 1.5,
              }}
            >
              <Stack direction="row" alignItems="center">
                <Avatar
                  variant="rounded"
                  sx={{
                    bgcolor: "#fef3c7",
                    color: "#d97706",
                    width: 44,
                    height: 44,
                    mr: 2,
                    borderRadius: 1.5,
                  }}
                >
                  <WarningAmberOutlined />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="800" color="#0f172a">
                    {groupsCount}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight="500"
                  >
                    Nhóm hàng
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "grey.200",
                p: 1.5,
              }}
            >
              <Stack direction="row" alignItems="center">
                <Avatar
                  variant="rounded"
                  sx={{
                    bgcolor: "#f3e8ff",
                    color: "#9333ea",
                    width: 44,
                    height: 44,
                    mr: 2,
                    borderRadius: 1.5,
                  }}
                >
                  <CreditCardOutlined />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="800" color="#0f172a">
                    {hiddenCount}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight="500"
                  >
                    Đã ẩn
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        <FilterBar
          filters={filters}
          categories={categories}
          onFilterChange={handleFilterChange}
          view={view}
          onViewChange={setView}
        />

        <Box sx={{ mt: 0 }}>
          {view === "list" ? (
            <ItemTable
              data={data}
              loading={loading}
              filters={filters}
              totalCount={totalCount}
              onPageChange={(page) => handleFilterChange("page", page)}
              onEdit={handleEditItem}
              onHide={(row) => setConfirmDialog({ open: true, type: "hide", row })}
              onDelete={(row) =>
                setConfirmDialog({ open: true, type: "delete", row })
              }
            />
          ) : (
            <ItemGrid
              data={data}
              loading={loading}
              onEdit={handleEditItem}
              onHide={(row) => setConfirmDialog({ open: true, type: "hide", row })}
              onDelete={(row) =>
                setConfirmDialog({ open: true, type: "delete", row })
              }
            />
          )}
        </Box>

        <AddStationeryDrawer
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          itemData={editingItem}
          categories={categories}
          onSave={handleSaveItem}
          isSaving={isSaving}
        />

        <ImportCatalogModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onSuccess={() => refetch?.()}
        />

        <Dialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            {confirmDialog.type === "delete"
              ? "Xác nhận xóa mặt hàng"
              : "Xác nhận cập nhật trạng thái"}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {confirmDialog.type === "delete"
                ? `Bạn có chắc chắn muốn xóa "${confirmDialog.row?.name}" không? Thao tác này không thể hoàn tác.`
                : `Bạn có muốn chuyển "${confirmDialog.row?.name}" sang trạng thái ${
                    confirmDialog.row?.status === "active" ? "Đã ẩn" : "Hoạt động"
                  }?`}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={() =>
                setConfirmDialog({ ...confirmDialog, open: false, row: null, type: "" })
              }
              color="inherit"
              sx={{ textTransform: "none", borderRadius: 1.5 }}
            >
              Hủy
            </Button>
            <Button
              onClick={
                confirmDialog.type === "delete"
                  ? handleDeleteItem
                  : handleToggleStatusItem
              }
              color={confirmDialog.type === "delete" ? "error" : "primary"}
              variant="contained"
              autoFocus
              disabled={isSaving}
              sx={{ textTransform: "none", borderRadius: 1.5, boxShadow: "none" }}
            >
              {isSaving ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default StationeryCategory;
