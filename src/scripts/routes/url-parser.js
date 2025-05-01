function extractPathnameSegments(path) {
  // Handle empty paths
  if (!path || path === "/") {
    return {
      resource: null,
      id: null,
    };
  }

  const splitUrl = path.split("/");

  return {
    resource: splitUrl[1] || null,
    id: splitUrl[2] || null,
  };
}

function constructRouteFromSegments(pathSegments) {
  if (!pathSegments || (!pathSegments.resource && !pathSegments.id)) {
    return "/";
  }

  let pathname = "";

  if (pathSegments.resource) {
    pathname = pathname.concat(`/${pathSegments.resource}`);
  }

  if (pathSegments.id) {
    pathname = pathname.concat("/:id");
  }

  return pathname || "/";
}

export function getActivePathname() {
  // Extract hash without the # symbol, and handle empty hash
  const hash = window.location.hash;

  if (!hash || hash === "" || hash === "#") {
    return "/";
  }

  return hash.replace("#", "");
}

export function getActiveRoute() {
  const pathname = getActivePathname();
  const urlSegments = extractPathnameSegments(pathname);
  return constructRouteFromSegments(urlSegments);
}

export function parseActivePathname() {
  const pathname = getActivePathname();
  return extractPathnameSegments(pathname);
}

export function getRoute(pathname) {
  const urlSegments = extractPathnameSegments(pathname);
  return constructRouteFromSegments(urlSegments);
}

export function parsePathname(pathname) {
  return extractPathnameSegments(pathname);
}
