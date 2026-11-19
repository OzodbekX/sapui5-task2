sap.ui.define(
  [
    "project1/controller/Base.controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/library",
    "sap/ui/core/Messaging",
    "project1/util/ProductValidator",
  ],
  (
    BaseController,
    MessageToast,
    MessageBox,
    coreLibrary,
    Messaging,
    ProductValidator,
  ) => {
    "use strict";
    const { ValueState, MessageType } = coreLibrary;

    const ODATA_MODEL = "odataV4";
    const DELETE_GROUP_ID = "deleteProductsV4";
    const CREATE_GROUP_ID = "createProductV4";
    const TEXT_INPUT_IDS = ["v4InputName", "v4InputDesc"];
    const NUMBER_INPUT_IDS = ["v4InputId", "v4InputRating", "v4InputPrice"];
    const INTEGER_INPUT_IDS = ["v4InputId", "v4InputRating"];
    const RELEASE_DATE_ID = "v4InputRelDate";
    const DISCONTINUED_DATE_ID = "v4InputDiscDate";
    const DIALOG_INPUT_IDS = [
      ...TEXT_INPUT_IDS,
      ...NUMBER_INPUT_IDS,
      RELEASE_DATE_ID,
      DISCONTINUED_DATE_ID,
    ];

    return BaseController.extend("project1.controller.ProductsV4Tab", {
      _getTexts() {
        const bundle = this.getResourceBundle();
        return {
          required: bundle.getText("requiredField"),
          invalidNumber: bundle.getText("invalidNumber"),
          invalidInteger: bundle.getText("invalidInteger"),
          invalidDate: bundle.getText("invalidDate"),
          discontinuedBeforeRelease: bundle.getText(
            "discontinuedBeforeRelease",
          ),
        };
      },
      _loadDialog() {
        if (!this._pDialog) {
          this._pDialog = this.loadFragment({
            name: "project1.view.fragments.AddProductV4Dialog",
          });
        }
        return this._pDialog;
      },
      _resetDialog() {
        DIALOG_INPUT_IDS.forEach((id) => {
          const control = this.byId(id);
          if (control) {
            control.setValueState(ValueState.None);
            control.setValueStateText("");
          }
        });
      },
      _validateDialog() {
        const byId = this.byId.bind(this);
        return ProductValidator.validateProductDialog({
          textInputs: TEXT_INPUT_IDS.map(byId),
          numberInputs: NUMBER_INPUT_IDS.map(byId),
          integerInputs: INTEGER_INPUT_IDS.map(byId),
          releasePicker: byId(RELEASE_DATE_ID),
          discontinuedPicker: byId(DISCONTINUED_DATE_ID),
          texts: this._getTexts(),
        });
      },
      _getLastBackendError() {
        const errors = Messaging.getMessageModel()
          .getData()
          .filter((msg) => msg.getType() === MessageType.Error);
        return errors.length ? errors[errors.length - 1].getMessage() : "";
      },
      async onAddV4Product() {
        const dialog = await this._loadDialog();
        this._resetDialog();
        const binding = this.byId("odataV4Table").getBinding("items");
        this._oCtx = binding.create({
          ID: null,
          Name: "",
          Description: "",
          ReleaseDate: null,
          DiscontinuedDate: null,
          Rating: null,
          Price: null,
        });

        this._oCtx.created().catch(() => {});
        dialog.setBindingContext(this._oCtx, ODATA_MODEL);
        dialog.open();
      },
      async onCancelV4Product() {
        const dialog = await this._loadDialog();
        if (this._oCtx) {
          this._oCtx.delete();
          this._oCtx = null;
        }
        dialog.setBindingContext(null, ODATA_MODEL);
        this._resetDialog();
        dialog.close();
      },
      onV4InputLiveChange(event) {
        ProductValidator.validateText(event.getSource(), this._getTexts());
      },

      onV4DateChange(event) {
        ProductValidator.validateDate(event.getSource(), this._getTexts());
      },
      async onSaveV4Product() {
        if (!this._validateDialog()) {
          return;
        }
        const dialog = await this._loadDialog();
        if (dialog.getBusy()) {
          return;
        }
        const model = this.getModel(ODATA_MODEL);
        const bundle = this.getResourceBundle();
        const binding = this.byId("odataV4Table").getBinding("items");

        // fires when the backend has answered the POST: success = true / false
        const createCompleted = new Promise((resolve) => {
          binding.attachEventOnce("createCompleted", (event) =>
            resolve(event.getParameter("success")),
          );
        });

        Messaging.removeAllMessages();
        dialog.setBusy(true);
        try {
          model.submitBatch(CREATE_GROUP_ID);
          const success = await createCompleted;
          if (!success) {
            MessageBox.error(
              bundle.getText("createError", [this._getLastBackendError()]),
            );
            return;
          }
          this._oCtx = null;
          dialog.setBindingContext(null, ODATA_MODEL);
          this._resetDialog();
          dialog.close();
          MessageToast.show(bundle.getText("createSuccess"));
        } catch (err) {
          MessageBox.error(bundle.getText("createError", [err.message]));
        } finally {
          dialog.setBusy(false);
        }
      },
      async onDeleteV4Products() {
        const table = this.byId("odataV4Table");
        const contexts = table.getSelectedContexts();
        const bundle = this.getResourceBundle();
        if (!contexts.length) {
          MessageToast.show(bundle.getText("selectRecordToDelete"));
          return;
        }
        const deletePromises = contexts.map((ctx) =>
          ctx.delete(DELETE_GROUP_ID),
        );
        this.getModel(ODATA_MODEL).submitBatch(DELETE_GROUP_ID);
        try {
          await Promise.all(deletePromises);
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
