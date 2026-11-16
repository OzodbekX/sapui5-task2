sap.ui.define(["project1/controller/Base.controller"], (BaseController) => {
  "use strict";
  return BaseController.extend("project1.controller.Product", {
    onInit() {
      const oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("RouteProduct").attachPatternMatched(this._onObjectMatched, this);
    },
    _onObjectMatched(oEvent) {
      const sProductId = oEvent.getParameter("arguments").ProductID;
      this.getView().bindElement({
        path: `/Products(${sProductId})`,
        model:"odataV2",
        parameters: {
          expand: "Supplier"
        }
      });
    }
  });
});
