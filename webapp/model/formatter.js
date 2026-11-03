sap.ui.define(["sap/base/strings/formatMessage"], (formatMessage) => {
  "use strict";
  const publishedYear = (template, date) => {
    if (!date) {
      return "";
    }
    const year = (date instanceof Date ? date : new Date(date)).getFullYear();
    return formatMessage(template, [year]);
  };

  return {
    publishedYear,
  };
});
