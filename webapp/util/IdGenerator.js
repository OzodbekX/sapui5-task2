sap.ui.define([], () => {
  "use strict";

  const generateNextId = (items, prefix = "B", length = 3) => {
    const max = (items || []).reduce((currentMax, item) => {
      const number = parseInt(String(item.ID).replace(/\D/g, ""), 10);
      return Number.isNaN(number) ? currentMax : Math.max(currentMax, number);
    }, 0);

    return prefix + String(max + 1).padStart(length, "0");
  };

  return {
    generateNextId,
  };
});
