import { callApi } from "./api";

const BASE_URL = "/api/birthday-cbnv";

const birthdayService = {
  getBirthdays: (params = {}) => callApi("get", BASE_URL, params),
  sendWish: (userId, payload = {}) => callApi("post", `${BASE_URL}/${userId}/wishes`, payload),
};

export default birthdayService;

