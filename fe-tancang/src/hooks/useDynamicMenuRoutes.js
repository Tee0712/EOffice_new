import React, { lazy, Suspense, useCallback, useContext, useEffect, useMemo, useState } from "react";
// import Loading from "@components/Loading/Loading";
// import { CircularProgress } from "@mui/material";


import {
  // API_SIDE_BAR_MENU,
} from "@EnvironmentFile/constants/urlConfig";
import { ensureUserPermissions } from "@redux/slices/managementUsersSlice";
import { ensureAuthority } from "@redux/slices/Authority/authoritySlice";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "@AuthContext/AuthProvider";
import { routes } from "@routers/RouterConfig";
import { getSideBarMenu } from "@redux/slices/ManagerMenu/managementMenuSlice";
// import { SkyBox } from "@styles/SkyStyles";

// import { styled } from "@mui/material/styles";
import { RouteLoading } from "@components/Loading/RouteLoading";

const LazyTableView = lazy(() => import("./DynamicRouteWrappers/LazyTableView"));
const LazyFormAdd = lazy(() => import("./DynamicRouteWrappers/LazyFormAdd"));
const LazyPopupView = lazy(() => import("./DynamicRouteWrappers/LazyPopupView"));
const sortByOrder = (a, b, groupCodes = []) => {
  // Ưu tiên "Điều hành văn bản" lên đầu nếu là văn thư TCT
  if (groupCodes.includes("vanthutct")) {
    const isADHV = a.title === "Điều hành văn bản" || a.name === "Điều hành văn bản";
    const isBDHV = b.title === "Điều hành văn bản" || b.name === "Điều hành văn bản";
    if (isADHV && !isBDHV) return -1;
    if (!isADHV && isBDHV) return 1;
  }

  const getPriority = (order) => {
    if (order == null) return 2;   // null hoặc undefined → cuối
    if (order === 0) return 1;      // order = 0 → giữa
    return 0;                       // order > 0 → đầu
  };
  const pa = getPriority(a.order);
  const pb = getPriority(b.order);
  if (pa !== pb) return pa - pb;
  if (pa === 0) return a.order - b.order; // cùng nhóm >0 thì sort tăng dần
  return 0;
};

const applyPermissionRecursive = (items, parentHidden = false) => {
  return items
    .map((item) => {
      if (item.hidden === true || parentHidden === true) {
        return null;
      }

      const subItems = item.subItems
        ? applyPermissionRecursive(item.subItems, false)
        : [];

      if (!item.path && subItems.length === 0) {
        return null;
      }

      return {
        ...item,
        subItems,
      };
    })
    .filter(Boolean);
};

const buildMenuTree = (menuItems = []) => {
  const IGNORED_ROOT_CODES = [
    'MEAL_CALENDAR', 'MEAL_MY_BOOKINGS', 'MEAL_DASHBOARD', 'MEAL_CHECKIN',
    'MEAL_MENU', 'MEAL_RECONCILIATION', 'MEAL_SUPPLIERS', 'MEAL_HISTORY', 'MEAL_SETTINGS'
  ];
  const IGNORED_ROOT_NAMES = [
    'LỊCH ĐĂNG KÝ', 'ĐĂNG KÝ CỦA TÔI', 'DASHBOARD TỔNG HỢP', 'CHECK-IN SUẤT ĂN',
    'QUẢN LÝ MENU', 'ĐỐI SOÁT SUẤT ĂN', 'QUẢN LÝ NHÀ CUNG CẤP', 'LỊCH SỬ ĐĂNG KÝ', 'CÀI ĐẶT HỆ THỐNG'
  ];

  const filteredItems = menuItems.filter(item => {
    const parentId = item.parent || item.parent_id;
    if (!parentId) {
      const code = item.code || '';
      const name = (item.name || item.title || '').trim().toUpperCase();
      if (IGNORED_ROOT_CODES.includes(code) || IGNORED_ROOT_NAMES.includes(name)) {
        return false;
      }
    }
    return true;
  });

  const menuMap = {};

  filteredItems.forEach((item) => {
    const key = item._id || item.id;
    menuMap[key] = { ...item, subItems: [] };
  });

  const roots = [];
  filteredItems.forEach((item) => {
    const key = item._id || item.id;
    const parentId = item.parent || item.parent_id;
    if (parentId && menuMap[parentId]) {
      menuMap[parentId].subItems.push(menuMap[key]);
      return;
    }

    roots.push(menuMap[key]);
  });

  return roots;
};

const buildStaticRouteMap = (routeItems, map = new Map()) => {
  routeItems.forEach((route) => {
    if (route.codeRouter) {
      map.set(route.codeRouter, route);
    }

    if (route.subItems?.length) {
      buildStaticRouteMap(route.subItems, map);
    }
  });

  return map;
};

// Super Admin: lấy trực tiếp tất cả static routes từ RouterConfig
const CANTEEN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-8.03c2.09-.13 3.75-1.85 3.75-3.97V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>`;

const convertStaticRoutesToMenuRoutes = (staticRoutes, isSuperAdmin = false) => {
  if (!Array.isArray(staticRoutes)) return [];

  return staticRoutes
    .map((route) => {
      if (!route || route.hidden === true) return null;

      const subItems = route.subItems
        ? convertStaticRoutesToMenuRoutes(route.subItems, isSuperAdmin)
        : [];

      return {
        _id: route.path || route.codeRouter || Math.random().toString(),
        path: route.path,
        element: route.element,
        title: route.title,
        icon: route.icon || null,
        hidden: false, // Super admin thấy hết
        order: route.order || 0,
        subItems,
        codeRouter: route.codeRouter || null,
        settingIcon: route.settingIcon || (route.path === "/canteen" ? CANTEEN_SVG : null),
        count: null,
        parent: null,
        collapsed: false,
      };
    })
    .filter(Boolean);
};

const mapMenuToRoute = (menu, context) => {
  const mappedSubItems = (menu.subItems || [])
    .map((subMenu) => mapMenuToRoute(subMenu, context))
    .filter(Boolean)
    .sort((a, b) => sortByOrder(a, b, context.groupCodes));

  const hasVisibleSubItems = mappedSubItems.some((subItem) => !subItem.hidden);

  if (menu.dynamicMenu) {
    const fnType = menu.function?.type;
    const fnCode = menu.function?.code;
    const rawPath = menu.function?.path || "";
    const path = rawPath && !rawPath.startsWith("/") ? `/${rawPath}` : rawPath;
    const isGroupOnly = !fnType && !path;

    let element;
    let hidden = isGroupOnly ? mappedSubItems.length === 0 : false;

    switch (fnType) {
      case "list":
      case "fullList":
      case "completeList":
      case "automatic":
      case "custom":
        element = (
          <Suspense key={fnCode} fallback={<RouteLoading />}>
            <LazyTableView fnCode={fnCode} />
          </Suspense>
        );
        if (!isGroupOnly && !context.isSuperAdmin) {
          hidden = !context.permissionSet.has(fnCode);
        }
        break;

      case "popup":
        element = (
          <Suspense key={fnCode} fallback={<RouteLoading />}>
            <LazyPopupView fnCode={fnCode} />
          </Suspense>
        );
        if (!isGroupOnly && !context.isSuperAdmin) {
          hidden = true;
        }
        break;

      case "form":
      default:
        element = (
          <Suspense key={fnCode} fallback={<RouteLoading />}>
            <LazyFormAdd fnCode={fnCode} />
          </Suspense>
        );
        if (!isGroupOnly && !context.isSuperAdmin) {
          hidden = true;
        }
        break;
    }

    if (isGroupOnly && hasVisibleSubItems) {
      hidden = false;
    }

    return {
      title: menu.name,
      icon: null,
      order: menu.order || 0,
      isReport: menu.isReport,
      hidden,
      path,
      element,
      subItems: mappedSubItems,
      settingIcon: menu.settingIcon,
      count: menu.function?.count,
      functionCode: menu.function?.code || null,
      parent: menu.parent || null,
      collapsed: menu.collapsed || false,
    };
  }

  const matchedRoute = context.staticRouteMap.get(menu.codeRouter);

  // Super Admin bypass: nếu là super admin, luôn trả về route
  // không cần matchedRoute
  if (context.isSuperAdmin) {
    // Nếu có matchedRoute thì dùng nó
    // Nếu không có matchedRoute, vẫn trả về menu với hidden=false
    if (!matchedRoute) {
      // Nếu có subItems thì trả về menu cha
      if (menu.subItems?.length) {
        return {
          title: menu.name,
          icon: null,
          order: menu.order || 0,
          hidden: false,
          path: null,
          element: null,
          subItems: mappedSubItems,
          settingIcon: menu.settingIcon,
          count: menu.function?.count,
          functionCode: menu.function?.code || null,
          parent: menu.parent || null,
          collapsed: menu.collapsed || false,
        };
      }
      // Nếu là menu đơn lẻ (không có subItems), tạo route cơ bản từ menu
      return {
        title: menu.name,
        icon: null,
        order: menu.order || 0,
        hidden: false,
        path: menu.path || null,
        element: menu.path ? (
          <Suspense key={menu.path} fallback={<RouteLoading />}>
            <LazyTableView fnCode={menu.function?.code} />
          </Suspense>
        ) : null,
        subItems: [],
        settingIcon: menu.settingIcon,
        count: menu.function?.count,
        functionCode: menu.function?.code || null,
        parent: menu.parent || null,
        collapsed: menu.collapsed || false,
      };
    }
  } else if (!matchedRoute) {
    return null;
  }

  const isStaticGroupOnly = !matchedRoute.path && matchedRoute.subItems;

  const hasPermission = menu.isReport
    ? context.reportPermissionSet.has(menu.codeBC)
    : context.staticPermissionSet.has(menu._id) || context.roleSet.has(menu._id);

  let hidden = context.isSuperAdmin
    ? false
    : (isStaticGroupOnly ? !hasVisibleSubItems : !hasPermission);

  const hasMappedSubItems = mappedSubItems.length > 0;
  const hasRouteSubItems = matchedRoute.subItems?.length > 0;
  const hasRoutePath = !!matchedRoute.path;

  if (!hasMappedSubItems && !hasRouteSubItems && !hasRoutePath) {
    hidden = true;
  }

  return {
    path: matchedRoute.path,
    element: matchedRoute.element,
    title: matchedRoute.title,
    icon: matchedRoute.icon,
    hidden,
    order: menu.order || 0,
    subItems: hasMappedSubItems
      ? mappedSubItems
      : (matchedRoute.subItems || []).map((route) => ({ ...route })),
    settingIcon: menu.settingIcon,
    count: menu.function?.count,
    functionCode: menu.function?.code || null,
    parent: menu.parent || null,
    collapsed: menu.collapsed || false,
  };
};

export function useDynamicMenuRoutes() {
  const { user } = useContext(AuthContext);
  const { sideBarMenu, sideBarMenuFetched } = useSelector((state) => state.menu);
  const userPermissions = useSelector((state) => state.users.userPermissions);
  const isSuperAdminFromState = useSelector((state) => state.users.isSuperAdmin);
  const authorityData = useSelector((state) => state.authority?.data);
  const [dynamicRoutes, setDynamicRoutes] = useState([]);
  const dispatch = useDispatch();

  const staticRouteMap = useMemo(() => buildStaticRouteMap(routes), []);

  useEffect(() => {
    if (!user) {
      setDynamicRoutes([]);
      return;
    }

    if (!sideBarMenuFetched) {
      dispatch(getSideBarMenu());
    }
  }, [dispatch, user, sideBarMenuFetched]);

  const fetchAndBuildRoutes = useCallback(async () => {
    try {
      if (!user) {
        setDynamicRoutes([]);
        return;
      }

      let userData = userPermissions;
      let isSuperAdmin = isSuperAdminFromState === true;

      if (!userData) {
        try {
          const fetchedAction = await dispatch(ensureUserPermissions(user.user.user));
          const fetched = fetchedAction?.payload || fetchedAction;
          userData = fetched || userData;
          if (userData?.isSuperAdmin) {
            isSuperAdmin = true;
          }
        } catch (err) {
          logger.error("Error fetching user permissions:", err);
          userData = null;
        }
      }

      const menuItems = sideBarMenu || [];

      // Lấy root Meal/Canteen route từ static routes
      const getMealStaticRoutes = (routeItems) => {
        const result = [];

        const findMealRoute = (items) => {
          for (const item of items) {
            const isTopMealRoute =
              item.path === "/canteen" ||
              item.path === "/meals" ||
              item.title === "Quản lý ăn ca" ||
              item.title === "QUẢN LÝ ĂN CA" ||
              item.codeRouter === "CANTEEN_MANAGEMENT";

            if (isTopMealRoute && item.hidden !== true) {
              const { element, ...rest } = item;
              result.push({
                ...rest,
                title: "QUẢN LÝ ĂN CA",
                name: "QUẢN LÝ ĂN CA",
                codeRouter: item.codeRouter || "CANTEEN_MANAGEMENT",
                hidden: false,
                order: item.order ?? 9,
                settingIcon: item.settingIcon || CANTEEN_SVG,
                icon: item.icon || null,
                subItems:
                  item.subItems?.map((sub) => {
                    const { element: subEl, ...subRest } = sub;
                    return {
                      ...subRest,
                      hidden: false,
                    };
                  }) || [],
              });
              return;
            }

            if (item.subItems?.length) {
              findMealRoute(item.subItems);
            }
          }
        };

        findMealRoute(routeItems);
        return result;
      };

      // Super Admin: lấy trực tiếp all static routes thay vì process từ menu
      if (isSuperAdmin) {
        const allStaticRoutes = convertStaticRoutesToMenuRoutes(routes, isSuperAdmin);

        allStaticRoutes.forEach((route) => {
          if (route.title === "DASHBOARD" || route.title === "TRANG CHỦ") {
            homeRoute = route;
            return;
          }
          mappedRoutes.push(route);
        });

        mappedRoutes.sort((a, b) => sortByOrder(a, b, user?.user?.groupCodes || []));
        const orderedRoutes = homeRoute ? [homeRoute, ...mappedRoutes] : mappedRoutes;
        setDynamicRoutes(applyPermissionRecursive(orderedRoutes));
        return;
      }

      // Non-super admin: vẫn cần xử lý để có permission context
      if (!menuItems.length) {
        // Không có menu items, chỉ hiển thị Meal routes
        const mealStaticRoutes = getMealStaticRoutes(routes);
        mealStaticRoutes.sort((a, b) => sortByOrder(a, b, user?.user?.groupCodes || []));
        setDynamicRoutes(applyPermissionRecursive(mealStaticRoutes));
        return;
      }

      // Xây dựng context cho việc map menu
      const baseRoles = userData?.roles || [];
      const staticPermissions = userData?.staticPermissions?.map((item) => item._id) || [];
      const reportPermissions = userData?.reportPermission || [];

      let resolvedAuthorityData = authorityData;
      if (!resolvedAuthorityData?.roles?.length && user) {
        try {
          const fetchedAuthAction = await dispatch(ensureAuthority());
          resolvedAuthorityData = fetchedAuthAction?.payload || fetchedAuthAction;
        } catch (err) {
          logger.error("Error fetching authority:", err);
        }
      }

      const mergedRoles = Array.isArray(resolvedAuthorityData?.roles)
        ? [...baseRoles, ...resolvedAuthorityData.roles]
        : baseRoles;

      const roleSet = new Set(mergedRoles);
      const staticPermissionSet = new Set(staticPermissions);
      const permissionSet = new Set([...roleSet, ...staticPermissionSet]);
      const reportPermissionSet = new Set(reportPermissions);

      const context = {
        permissionSet,
        roleSet,
        staticPermissionSet,
        reportPermissionSet,
        staticRouteMap,
        groupCodes: user?.user?.groupCodes || [],
        isSuperAdmin,
      };

      const roots = buildMenuTree(menuItems);

      let homeRoute = null;
      const mappedRoutes = [];

      // Lấy Meal routes trước khi thêm vào mappedRoutes
      const mealStaticRoutes = getMealStaticRoutes(routes);

      roots.forEach((root) => {
        const mapped = mapMenuToRoute(root, context);
        if (!mapped) {
          return;
        }

        if (root.name === "DASHBOARD" || root.name === "TRANG CHỦ") {
          homeRoute = mapped;
          return;
        }

        mappedRoutes.push(mapped);
      });

      // Bổ sung các static top-level routes từ RouterConfig nếu chưa có từ API
      const staticMenuRoutes = convertStaticRoutesToMenuRoutes(routes, false);
      staticMenuRoutes.forEach((staticRoute) => {
        if (!staticRoute || staticRoute.hidden) return;
        const exists = mappedRoutes.some(
          (r) =>
            (r.codeRouter && r.codeRouter === staticRoute.codeRouter) ||
            r.title === staticRoute.title ||
            (r.path && staticRoute.path && r.path === staticRoute.path)
        );
        if (!exists) {
          mappedRoutes.push(staticRoute);
        }
      });

      // Thêm Meal routes vào menu nếu chưa có
      if (mealStaticRoutes.length > 0) {
        mealStaticRoutes.forEach((mealRoute) => {
          const exists = mappedRoutes.some(
            (r) =>
              (r.codeRouter && r.codeRouter === mealRoute.codeRouter) ||
              r.title === mealRoute.title ||
              (r.path && mealRoute.path && r.path === mealRoute.path)
          );
          if (!exists) {
            mappedRoutes.push(mealRoute);
          }
        });
      }

      // Deduplicate toàn bộ routes
      const uniqueMappedRoutes = [];
      const seenKeys = new Set();
      mappedRoutes.forEach((route) => {
        const key = route.codeRouter || route.title || route.path;
        if (key && !seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueMappedRoutes.push(route);
        }
      });

      uniqueMappedRoutes.sort((a, b) => sortByOrder(a, b, user?.user?.groupCodes || []));

      const orderedRoutes = homeRoute ? [homeRoute, ...uniqueMappedRoutes] : uniqueMappedRoutes;
      setDynamicRoutes(applyPermissionRecursive(orderedRoutes));
    } catch (error) {
      logger.error("Error fetching menu routes:", error);
      setDynamicRoutes([]);
    }
  }, [authorityData, dispatch, sideBarMenu, staticRouteMap, user, userPermissions, isSuperAdminFromState]);

  useEffect(() => {
    fetchAndBuildRoutes();
  }, [fetchAndBuildRoutes]);

  return dynamicRoutes;
}

export default useDynamicMenuRoutes;
