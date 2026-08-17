import { callApi } from "./api";

const workflowWizardService = {
  saveWorkflow: (data) => callApi("post", "/api/v1/workflow-wizard/save", data),
  
  getList: () => callApi("post", "/api/v1/workflow-wizard/find-all"),
  
  getDetail: (processKey) => callApi("post", "/api/v1/workflow-wizard/detail", { processKey }),
  
  deleteWorkflow: (processKey) => callApi("post", "/api/v1/workflow-wizard/delete", { processKey }),

  // Helper to fetch groups for the selector
  getGroups: (params) => callApi("get", "/api/group-users", params),
};

export default workflowWizardService;
