/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
(function () {
  var globalObj = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);

  var isProduction = false;
  var isDev = !isProduction;
  var TITLE_APP = "VPS-TCSG";
  var SERVICE_ID = "SERVER_TAN_CANG";
  var APP_BASE_URL = "http://localhost:3156";
  var APP_DHVB = "http://localhost:3156/api";
  var APP_BASE_CAMUNDA = "https://camunda-bpmn.lifetex.vn";

  var URL_ONLYOFFICE = "https://vpstc-document.lifetex.vn/";
  var APP_WEB_SOCKET_BASE_URL = "http://localhost:3156";
  var APP_WEB_SOCKET_URL = "http://localhost:3156";
  var URL_TOOL_EDIT_OFFICE = "http://localhost:1901";
  var URL_DOWLOAD_TOOL_EDIT_WORD = "https://vpstc.lifetex.vn:356/api/files/download/1358";
  var URL_DOWLOAD_TOOL_EDIT_WORD_MAC = "https://vpstc.lifetex.vn:356/api/files/download/1357";
  var URL_FILE_EXAMPLE = "https://vpstc.lifetex.vn:356/api/files/download/86983";
  var APP_TOOL_SIGN_DIGITAL = "http://192.168.0.185:1234";
  var APP_CHAT_URL = "https://administrator.lifetex.vn:436";
  var APP_BASE_SIGN_DIGITAL = "https://kysotaptrung-service.lifetex.vn";
  var DOCUMENT_APP_LOCAL = "https://vpstc-document.lifetex.vn/loleaflet/dist/loleaflet.html";
  var DOCUMENT_APP = "https://vpstc-document.lifetex.vn/loleaflet/dist/loleaflet.html";
  var APP_BASE_URL_SIGN_USB_TOKEN = "http://localhost:8088";
  var ROLE_ADMIN = "ADMIN";

  var LINK_TO_TASKS = "/taskManagerCv";
  var LINK_TO_MEETINGS = "/companyCalendar";
  var LINK_TO_PROJECTS = "/listProject";
  var DIRECTION_NEWS = "https://websitetc.lifetex.vn/";

  var LINK_TO_EVENTS = "/CMS";
  var LINK_TO_NEWS = "/CMS";
  var LINK_TO_BOOK_A_CAR_MANAGER = "/AllLogisticsRooms";
  var LINK_TO_PASSPORT = "/passport-requests";
  var LINK_TO_FEED_BACK = "/listRecommendations";
  var LINK_TO_USER_MANAGEMENT = "/manage-list-users";
  var LINK_TO_DHVB = "/mainProcessingManagerCB";
  var LINK_TO_COMPANY_WIDE_PERSONNEL = "/company-wide-personnel";
  var LINK_TO_DEPARTMENT_PERFORMANCE = "/statisticsAndReports";
  var LINK_TO_BOOK_A_CAR_STAFF = "/ListOfRequests";
  var IT_PORTAL_URL = "https://snpit.atlassian.net/servicedesk/customer/portals";

  var KEYCLOAK_USE_ENV_ONLY = true;
  var KEYCLOAK_ISSUER = "https://keycloak.lifetex.vn/realms/master";
  var KEYCLOAK_BASE_URL = "https://keycloak.lifetex.vn";
  var KEYCLOAK_CLIENT_ID = "qlqt";
  var KEYCLOAK_REDIRECT_URI = "http://localhost:3156/api/auth-keycloak/callback";
  var KEYCLOAK_SCOPE = "openid";
  var KEYCLOAK_LOGOUT_REDIRECT_URI = (typeof window !== "undefined" && window.location ? window.location.origin : "") + "/login";

  var LINK_TO_PASSPORT_TP = "/passport-requests-dv";
  var LINK_TO_PASSPORT_CB = "/my-request";
  var LINK_TO_INCOMING_DOCUMENTS_CB = "/mainProcessingManagerCB";
  var LINK_TO_INCOMING_DOCUMENTS_TP = "/mainProcessingManager";
  var LINK_TO_INCOMING_DOCUMENTS_GD = "/directorDirection";
  var LINK_TO_OUTGOING_DOCUMENTS_CB = "/draftForSignatureOfficers";
  var LINK_TO_OUTGOING_DOCUMENTS_TP = "/draftForSignatureOfficers";
  var LINK_TO_OUTGOING_DOCUMENTS_GD = "/PendingProcessingDepartmentHead";
  var LINK_TO_MEETINGS_GD = "/companyCalendarDirector";
  var LINK_TO_FEED_BACK_TP = "/feedbackSuggestionsPACT";
  var LINK_TO_FEED_BACK_GD = "/feedbackSuggestionsPACT";
  var LINK_TO_BOOK_A_CAR_TP = "/ListCars";

  // file template
  var IMPORT_FILE_TEMPLE = "https://vpstc.lifetex.vn:356/api/files/download/86803";

  var logger = (function () {
    var customLogger = {};
    var consoleMethods = ["log", "warn", "error", "info", "debug", "table", "trace"];

    consoleMethods.forEach(function (method) {
      if (isProduction) {
        customLogger[method] = function () {};
      } else {
        customLogger[method] = typeof console !== "undefined" && console[method] ? console[method].bind(console) : function () {};
      }
    });
    return customLogger;
  })();

  var configMap = {
    isProduction: isProduction,
    isDev: isDev,
    TITLE_APP: TITLE_APP,
    SERVICE_ID: SERVICE_ID,
    APP_BASE_URL: APP_BASE_URL,
    APP_DHVB: APP_DHVB,
    APP_BASE_CAMUNDA: APP_BASE_CAMUNDA,
    URL_ONLYOFFICE: URL_ONLYOFFICE,
    APP_WEB_SOCKET_BASE_URL: APP_WEB_SOCKET_BASE_URL,
    APP_WEB_SOCKET_URL: APP_WEB_SOCKET_URL,
    URL_TOOL_EDIT_OFFICE: URL_TOOL_EDIT_OFFICE,
    URL_DOWLOAD_TOOL_EDIT_WORD: URL_DOWLOAD_TOOL_EDIT_WORD,
    URL_DOWLOAD_TOOL_EDIT_WORD_MAC: URL_DOWLOAD_TOOL_EDIT_WORD_MAC,
    URL_FILE_EXAMPLE: URL_FILE_EXAMPLE,
    APP_TOOL_SIGN_DIGITAL: APP_TOOL_SIGN_DIGITAL,
    APP_CHAT_URL: APP_CHAT_URL,
    APP_BASE_SIGN_DIGITAL: APP_BASE_SIGN_DIGITAL,
    DOCUMENT_APP_LOCAL: DOCUMENT_APP_LOCAL,
    DOCUMENT_APP: DOCUMENT_APP,
    APP_BASE_URL_SIGN_USB_TOKEN: APP_BASE_URL_SIGN_USB_TOKEN,
    ROLE_ADMIN: ROLE_ADMIN,
    LINK_TO_TASKS: LINK_TO_TASKS,
    LINK_TO_MEETINGS: LINK_TO_MEETINGS,
    LINK_TO_PROJECTS: LINK_TO_PROJECTS,
    DIRECTION_NEWS: DIRECTION_NEWS,
    LINK_TO_EVENTS: LINK_TO_EVENTS,
    LINK_TO_NEWS: LINK_TO_NEWS,
    LINK_TO_BOOK_A_CAR_MANAGER: LINK_TO_BOOK_A_CAR_MANAGER,
    LINK_TO_PASSPORT: LINK_TO_PASSPORT,
    LINK_TO_FEED_BACK: LINK_TO_FEED_BACK,
    LINK_TO_USER_MANAGEMENT: LINK_TO_USER_MANAGEMENT,
    LINK_TO_DHVB: LINK_TO_DHVB,
    LINK_TO_COMPANY_WIDE_PERSONNEL: LINK_TO_COMPANY_WIDE_PERSONNEL,
    LINK_TO_DEPARTMENT_PERFORMANCE: LINK_TO_DEPARTMENT_PERFORMANCE,
    LINK_TO_BOOK_A_CAR_STAFF: LINK_TO_BOOK_A_CAR_STAFF,
    IT_PORTAL_URL: IT_PORTAL_URL,
    KEYCLOAK_USE_ENV_ONLY: KEYCLOAK_USE_ENV_ONLY,
    KEYCLOAK_ISSUER: KEYCLOAK_ISSUER,
    KEYCLOAK_BASE_URL: KEYCLOAK_BASE_URL,
    KEYCLOAK_CLIENT_ID: KEYCLOAK_CLIENT_ID,
    KEYCLOAK_REDIRECT_URI: KEYCLOAK_REDIRECT_URI,
    KEYCLOAK_SCOPE: KEYCLOAK_SCOPE,
    KEYCLOAK_LOGOUT_REDIRECT_URI: KEYCLOAK_LOGOUT_REDIRECT_URI,
    LINK_TO_PASSPORT_TP: LINK_TO_PASSPORT_TP,
    LINK_TO_PASSPORT_CB: LINK_TO_PASSPORT_CB,
    LINK_TO_INCOMING_DOCUMENTS_CB: LINK_TO_INCOMING_DOCUMENTS_CB,
    LINK_TO_INCOMING_DOCUMENTS_TP: LINK_TO_INCOMING_DOCUMENTS_TP,
    LINK_TO_INCOMING_DOCUMENTS_GD: LINK_TO_INCOMING_DOCUMENTS_GD,
    LINK_TO_OUTGOING_DOCUMENTS_CB: LINK_TO_OUTGOING_DOCUMENTS_CB,
    LINK_TO_OUTGOING_DOCUMENTS_TP: LINK_TO_OUTGOING_DOCUMENTS_TP,
    LINK_TO_OUTGOING_DOCUMENTS_GD: LINK_TO_OUTGOING_DOCUMENTS_GD,
    LINK_TO_MEETINGS_GD: LINK_TO_MEETINGS_GD,
    LINK_TO_FEED_BACK_TP: LINK_TO_FEED_BACK_TP,
    LINK_TO_FEED_BACK_GD: LINK_TO_FEED_BACK_GD,
    LINK_TO_BOOK_A_CAR_TP: LINK_TO_BOOK_A_CAR_TP,
    IMPORT_FILE_TEMPLE: IMPORT_FILE_TEMPLE,
    logger: logger,
  };

  if (globalObj) {
    for (var key in configMap) {
      if (Object.prototype.hasOwnProperty.call(configMap, key)) {
        globalObj[key] = configMap[key];
      }
    }
    globalObj.logger = logger;
    globalObj.appConfig = {
      apiUrl: APP_DHVB,
      logger: logger,
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = configMap;
    module.exports.logger = logger;
    module.exports.appConfig = configMap;
    module.exports.default = configMap;
  }
})();
