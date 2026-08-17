import { callApi } from "./api.js";

const LOCAL_AGENT_URL = "http://127.0.0.1:8888";

export const usbTokenSignService = {
  /**
   * Kiểm tra Local Signing Agent có đang chạy trên máy trạm không.
   */
  checkAgentStatus: async () => {
    try {
      const response = await fetch(`${LOCAL_AGENT_URL}/status`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  /**
   * Lấy danh sách chứng thư số từ USB Token cắm trên máy trạm.
   */
  getCertificates: async () => {
    try {
      const response = await fetch(`${LOCAL_AGENT_URL}/certificates`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Không thể đọc USB Token");
      return await response.json();
    } catch (e) {
      throw new Error("Local Agent ký số USB Token chưa được khởi chạy (port 8888).");
    }
  },

  /**
   * Thực hiện ký số trọn vẹn:
   * 1. Gửi file lên backend để chuẩn bị SHA256 digest
   * 2. Gửi digest xuống USB Token Local Agent để ký và lấy chữ ký PKCS#7
   * 3. Gửi chữ ký ngược lại lên backend để đóng gói vào file PDF
   */
  signPdfWithUsbToken: async ({ fileBase64, signInfo }) => {
    // B1: Lấy hash từ backend
    const { digest, documentId } = await callApi("post", "/api/v1/signature/usb-token/prepare-hash", {
      fileBase64,
      ...signInfo,
    });

    // B2: Gọi Local Agent ký digest bằng USB Token
    const agentResponse = await fetch(`${LOCAL_AGENT_URL}/sign-hash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hash: digest,
        documentId,
      }),
    });

    if (!agentResponse.ok) {
      throw new Error("Người dùng hủy ký hoặc mã PIN USB Token không chính xác.");
    }

    const { signatureHex, certificatePem } = await agentResponse.json();

    // B3: Đóng gói chữ ký vào PDF trên backend
    const signResult = await callApi("post", "/api/v1/signature/usb-token/attach-signature", {
      fileBase64,
      signatureHex,
      certificatePem,
      signInfo,
    });

    return signResult;
  },
};
