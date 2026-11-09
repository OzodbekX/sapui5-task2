sap.ui.define(
  [
    "project1/controller/Base.controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/library",
    "project1/util/ProductValidator",
  ],
  (BaseController, MessageToast, MessageBox, coreLibrary, ProductValidator) => {
    "use strict";

    const { ValueState } = coreLibrary;

    const ODATA_MODEL = "odataV2";
    const DELETE_GROUP_ID = "deleteProducts";

    const TEXT_INPUT_IDS = ["v2InputName", "v2InputDesc"];
    const NUMBER_INPUT_IDS = ["v2InputId", "v2InputRating", "v2InputPrice"];
    const INTEGER_INPUT_IDS = ["v2InputId", "v2InputRating"];
    const RELEASE_DATE_ID = "v2InputRelDate";
    const DISCONTINUED_DATE_ID = "v2InputDiscDate";
    const DIALOG_INPUT_IDS = [
      ...TEXT_INPUT_IDS,
      ...NUMBER_INPUT_IDS,
      RELEASE_DATE_ID,
      DISCONTINUED_DATE_ID,
    ];

    return BaseController.extend("project1.controller.ProductsV2Tab", {
      _getValue(id) {
        return this.byId(id).getValue().trim();
      },

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
            name: "project1.view.fragments.AddProductV2Dialog",
          });
        }
        return this._pDialog;
      },

      _resetDialog() {
        DIALOG_INPUT_IDS.forEach((id) => {
          const control = this.byId(id);
          if (control) {
            control.setDateValue?.(null);
            control.setValue("");
            control.setValueState(ValueState.None);
            control.setValueStateText("");
          }
        });
      },

      _validateDialog() {
        const byId = (id) => this.byId(id);
        return ProductValidator.validateProductDialog({
          textInputs: TEXT_INPUT_IDS.map(byId),
          numberInputs: NUMBER_INPUT_IDS.map(byId),
          integerInputs: INTEGER_INPUT_IDS.map(byId),
          releasePicker: byId(RELEASE_DATE_ID),
          discontinuedPicker: byId(DISCONTINUED_DATE_ID),
          texts: this._getTexts(),
        });
      },

      _readProduct() {
        return {
          ID: Number(this._getValue("v2InputId")),
          Name: this._getValue("v2InputName"),
          Description: this._getValue("v2InputDesc"),
          ReleaseDate: this.byId(RELEASE_DATE_ID).getDateValue(),
          DiscontinuedDate:
            this.byId(DISCONTINUED_DATE_ID).getDateValue() || null,
          Rating: Number(this._getValue("v2InputRating")),
          Price: Number(this._getValue("v2InputPrice")).toFixed(2),
        };
      },

      _setDialogMode(dialog, editPath) {
        this._editPath = editPath;
        this.byId("v2InputId").setEditable(!editPath);
        dialog.setTitle(
          this.getResourceBundle().getText(
            editPath ? "editProductDialogTitle" : "addProductDialogTitle",
          ),
        );
      },

      _fillDialog(product) {
        this.byId("v2InputId").setValue(String(product.ID));
        this.byId("v2InputName").setValue(product.Name);
        this.byId("v2InputDesc").setValue(product.Description);
        this.byId(RELEASE_DATE_ID).setDateValue(product.ReleaseDate || null);
        // The mock server serializes a null DiscontinuedDate as /Date(0)/.
        const discontinued = product.DiscontinuedDate;
        this.byId(DISCONTINUED_DATE_ID).setDateValue(
          discontinued && discontinued.getTime() !== 0 ? discontinued : null,
        );
        this.byId("v2InputRating").setValue(String(product.Rating ?? ""));
        this.byId("v2InputPrice").setValue(String(product.Price ?? ""));
      },

      async onAddV2Product() {
        const dialog = await this._loadDialog();
        this._resetDialog();
        this._setDialogMode(dialog, null);
        dialog.open();
      },

      async onEditV2Product(event) {
        const ctx = event.getSource().getBindingContext(ODATA_MODEL);
        const dialog = await this._loadDialog();
        this._resetDialog();
        this._setDialogMode(dialog, ctx.getPath());
        this._fillDialog(ctx.getObject());
        dialog.open();
      },

      async onCancelV2Product() {
        // Inputs are not bound to the model, so closing discards any edits.
        this._resetDialog();
        this._editPath = null;
        (await this._loadDialog()).close();
      },

      onV2InputLiveChange(event) {
        ProductValidator.validateText(event.getSource(), this._getTexts());
      },

      onV2DateChange(event) {
        ProductValidator.validateDate(event.getSource(), this._getTexts());
      },

      async onSaveV2Product() {
        if (!this._validateDialog()) {
          return;
        }
        const bundle = this.getResourceBundle();
        const product = this._readProduct();
        const dialog = await this._loadDialog();
        if (dialog.getBusy()) {
          return;
        }
        const model = this.getModel(ODATA_MODEL);
        const editPath = this._editPath;
        const handlers = {
          success: () => {
            dialog.setBusy(false);
            dialog.close();
            this._resetDialog();
            this._editPath = null;
            MessageToast.show(
              bundle.getText(editPath ? "updateSuccess" : "createSuccess"),
            );
          },
          error: (err) => {
            dialog.setBusy(false);
            MessageBox.error(
              bundle.getText(editPath ? "updateError" : "createError", [
                this.getODataErrorText(err),
              ]),
            );
          },
        };
        dialog.setBusy(true);
        if (editPath) {
          model.update(editPath, product, handlers);
        } else {
          model.create("/Products", product, handlers);
        }
      },

      onDeleteV2Products() {
        const table = this.byId("odataV2Table");
        const contexts = table.getSelectedContexts();
        const bundle = this.getResourceBundle();

        if (!contexts.length) {
          MessageToast.show(bundle.getText("selectRecordToDelete"));
          return;
        }

        const model = this.getModel(ODATA_MODEL);
        const paths = contexts.map((ctx) => ctx.getPath());

        const deferred = model.getDeferredGroups();
        if (!deferred.includes(DELETE_GROUP_ID)) {
          model.setDeferredGroups([...deferred, DELETE_GROUP_ID]);
        }

        paths.forEach((path) =>
          model.remove(path, { groupId: DELETE_GROUP_ID }),
        );

        const discardPending = () => model.resetChanges(paths, true);
        const showError = (err) =>
          MessageBox.error(
            bundle.getText("deleteError", [this.getODataErrorText(err)]),
          );

        model.submitChanges({
          groupId: DELETE_GROUP_ID,
          success: (data) => {
            const failed = (data?.__batchResponses || []).filter(
              (r) => r.response && Number(r.response.statusCode) >= 400,
            );
            if (failed.length) {
              discardPending();
              showError(failed[0].response);
              return;
            }
            table.removeSelections(true);
            MessageToast.show(
              bundle.getText("deleteSuccess", [contexts.length]),
            );
          },
          error: (err) => {
            discardPending();
            showError(err);
          },
        });
      },
    });
  },
);
