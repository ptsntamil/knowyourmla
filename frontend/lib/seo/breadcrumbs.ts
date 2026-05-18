/**
 * Standardizes breadcrumb item generation for different templates.
 */
export const getBreadcrumbs = (items: { name: string; item: string }[]) => {
  return items.map((item) => ({
    name: item.name,
    item: item.item
  }));
};

/**
 * Predefined common breadcrumb paths.
 */
export const commonBreadcrumbs = {
  home: { name: "Home", item: "/tn" },
  districts: { name: "Districts", item: "/tn" }, // Home acts as district list
  parties: { name: "Parties", item: "/parties" },
  mlaList: { name: "MLA List", item: "/tn/mla/list" },
  elections: { name: "Elections", item: "/tn/elections" }
};
