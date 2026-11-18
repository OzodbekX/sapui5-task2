sap.ui.define(
  [
    "project1/controller/Base.controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
  ],
  (BaseController, MessageToast, MessageBox) => {
    "use strict";
    const ODATA_MODEL = "odataV4";
    const DELETE_GROUP_ID = "deleteProductsV4";

    return BaseController.extend("project1.controller.ProductsV4Tab", {
      async onDeleteV4Products() {
        const table = this.byId("odataV4Table");
        const contexts = table.getSelectedContexts();
        const bundle = this.getResourceBundle();
        if (!contexts.length) {
          MessageBox.show(bundle.getText("selectRecordToDelete"));
          return;
        }
        const detetePromises = contexts.map((ctx) =>
          ctx.delete(DELETE_GROUP_ID),
        );
        this.getModel(ODATA_MODEL).submitBatch(DELETE_GROUP_ID);
        try {
          await Promise.all(detetePromises);
          table.removeSelections(true);
          MessageToast.show(bundle.getText("deleteSuccess", [contexts.length]));
        } catch (err) {
          MessageBox.error(
            bundle.getText("deleteError", [this.getODataErrorText(err)]),
          );
        }
      },
    });
  },
);
