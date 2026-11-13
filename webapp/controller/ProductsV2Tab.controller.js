sap.ui.define(
  [
    "project1/controller/Base.controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/library",
    "project1/util/ProductValidator",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
  ],
  (
    BaseController,
    MessageToast,
    MessageBox,
    coreLibrary,
    ProductValidator,
    Filter,
    FilterOperator,
    Sorter,
  ) => {
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

      _applyProductFilter(query) {
        const filters = [];
        if (query) {
          filters.push(
            new Filter({
              path: "Name",
              operator: FilterOperator.Contains,
              value1: query,
              caseSensitive: false,
            }),
          );
        }
        this.byId("odataV2Table").getBinding("items").filter(filters);
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

      async onAddV2Product() {
        const dialog = await this._loadDialog();
        this._resetDialog();
        this._setDialogMode(dialog, null);
        const model = this.getModel(ODATA_MODEL);
        this._oCtx = model.createEntry("/Products", {
          properties: {
            ID: null,
            Name: "",
            Description: "",
            ReleaseDate: null,
            DiscontinuedDate: null,
            Rating: null,
            Price: null,
          },
        });
        dialog.setBindingContext(this._oCtx, ODATA_MODEL);
        dialog.open();
      },

      async onEditV2Product(event) {
        const ctx = event.getSource().getBindingContext(ODATA_MODEL);
        const dialog = await this._loadDialog();
        this._resetDialog();
        this._setDialogMode(dialog, ctx.getPath());
        dialog.setBindingContext(ctx, ODATA_MODEL);
        dialog.open();
      },

      async onCancelV2Product() {
        const dialog = await this._loadDialog();
        const model = this.getModel(ODATA_MODEL);
        if (this._oCtx) {
          model.deleteCreatedEntry(this._oCtx);
          this._oCtx = null;
        } else if (this._editPath) {
          model.resetChanges([this._editPath], true);
        }
        this._editPath = null;
        dialog.setBindingContext(null, ODATA_MODEL);
        this._resetDialog();
        dialog.close();
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
        const dialog = await this._loadDialog();
        if (dialog.getBusy()) {
          return;
        }
        const model = this.getModel(ODATA_MODEL);
        if (!model.hasPendingChanges()) {
          dialog.close();
          return;
        }

        const bundle = this.getResourceBundle();
        const editPath = this._editPath;
        const showError = (err) =>
          MessageBox.error(
            bundle.getText(editPath ? "updateError" : "createError", [
              this.getODataErrorText(err),
            ]),
          );

        dialog.setBusy(true);
        model.submitChanges({
          success: (data) => {
            dialog.setBusy(false);
            const failed = (data?.__batchResponses || []).filter(
              (r) => r.response && Number(r.response.statusCode) >= 400,
            );
            if (failed.length) {
              showError(failed[0].response);
              return;
            }
            this._oCtx = null;
            this._editPath = null;
            dialog.setBindingContext(null, ODATA_MODEL);
            dialog.close();
            this._resetDialog();
            MessageToast.show(
              bundle.getText(editPath ? "updateSuccess" : "createSuccess"),
            );
          },
          error: (err) => {
            dialog.setBusy(false);
            showError(err);
          },
        });
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

      onFilterV2Products(event) {
        const query = (event.getParameter("value") ?? "").trim();
        this._applyProductFilter(query);
      },

      onSortV2Products(event) {
        const selectedItem = event.getParameter("selectedItem");
        const columnKey = selectedItem.getKey();
        const sorters = [];
        if (columnKey) {
          sorters.push(new Sorter(columnKey, true));
        }
        this.byId("odataV2Table").getBinding("items").sort(sorters);
      },
    });
  },
);