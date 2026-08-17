import React, { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ViewJob from "./components/ViewJob";

const TaskDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleClose = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  }, [navigate]);

  if (!id) {
    return null;
  }

  return (
    <ViewJob
      open
      documentId={id}
      onClose={handleClose}
    />
  );
};

export default TaskDetailPage;
