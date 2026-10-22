sap.ui.define(["sap/ui/core/mvc/Controller"], (Controller) => {
  "use strict";
  return Controller.extend("project1.controller.Base", {
    getModel(sName) {
      return this.getView().getModel(sName);
    },
    setModel(oModel, sName) {
      return this.getView().setModel(oModel, sName);
    },
    getResourceBundle() {
      return this.getOwnerComponent().getModel("i18n").getResourceBundle();
    }
  });
});
