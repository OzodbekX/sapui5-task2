/*global QUnit*/

sap.ui.define(
  ["project1/controller/ProductsV2Tab.controller", "sap/ui/thirdparty/sinon"],
  function (Controller, sinon) {
    "use strict";

    QUnit.module("ProductsV2Tab Controller", {
      beforeEach: function () {
        this.oCreatedCtx = { getPath: () => "/Products('tmp')" };
        this.oModelStub = {
          createEntry: sinon.stub().returns(this.oCreatedCtx),
          deleteCreatedEntry: sinon.spy(),
          resetChanges: sinon.spy(),
          hasPendingChanges: sinon.stub().returns(true),
          submitChanges: sinon.spy(),
          getDeferredGroups: sinon.stub().returns(["changes"]),
          setDeferredGroups: sinon.spy(),
          remove: sinon.spy(),
        };

        this.oDialogStub = {
          open: sinon.spy(),
          close: sinon.spy(),
          setTitle: sinon.spy(),
          setBindingContext: sinon.spy(),
          getBusy: sinon.stub().returns(false),
          setBusy: sinon.spy(),
        };

        this.oControls = {};
        [
          "v2InputId",
          "v2InputName",
          "v2InputDesc",
          "v2InputRelDate",
          "v2InputDiscDate",
          "v2InputRating",
          "v2InputPrice",
        ].forEach((sId) => {
          this.oControls[sId] = {
            setEditable: sinon.spy(),
            setValueState: sinon.spy(),
            setValueStateText: sinon.spy(),
          };
        });

        this.oController = new Controller();
        this.oController.getResourceBundle = () => ({
          getText: (sKey) => sKey,
        });
        this.oController.getModel = () => this.oModelStub;
        this.oController.byId = (sId) => this.oControls[sId];
        this.oController.loadFragment = () =>
          Promise.resolve(this.oDialogStub);
      },
    });

    QUnit.test(
      "onAddV2Product creates a transient entry and binds the dialog",
      async function (assert) {
        await this.oController.onAddV2Product();

        assert.ok(
          this.oModelStub.createEntry.calledOnceWith("/Products"),
          "createEntry was called for /Products",
        );
        assert.ok(
          this.oDialogStub.setBindingContext.calledOnceWith(
            this.oCreatedCtx,
            "odataV2",
          ),
          "dialog bound to created entry context",
        );
        assert.ok(
          this.oControls.v2InputId.setEditable.calledWith(true),
          "ID input is editable in Add mode",
        );
        assert.ok(this.oDialogStub.open.calledOnce, "dialog opened");
      },
    );

    QUnit.test(
      "onEditV2Product binds the dialog to the selected row context",
      async function (assert) {
        var oRowCtx = { getPath: () => "/Products(1)" };
        var oEvent = {
          getSource: () => ({ getBindingContext: () => oRowCtx }),
        };

        await this.oController.onEditV2Product(oEvent);

        assert.ok(
          this.oDialogStub.setBindingContext.calledOnceWith(
            oRowCtx,
            "odataV2",
          ),
          "dialog bound to row context",
        );
        assert.ok(
          this.oControls.v2InputId.setEditable.calledWith(false),
          "ID input is read-only in Edit mode",
        );
        assert.ok(this.oDialogStub.open.calledOnce, "dialog opened");
      },
    );

    QUnit.test(
      "onCancelV2Product deletes the transient entry when cancelling Add",
      async function (assert) {
        await this.oController.onAddV2Product();
        this.oDialogStub.setBindingContext.resetHistory();

        await this.oController.onCancelV2Product();

        assert.ok(
          this.oModelStub.deleteCreatedEntry.calledOnceWith(this.oCreatedCtx),
          "deleteCreatedEntry called with transient context",
        );
        assert.strictEqual(
          this.oController._oCtx,
          null,
          "_oCtx cleared after cancel",
        );
        assert.ok(
          this.oDialogStub.setBindingContext.calledOnceWith(null, "odataV2"),
          "dialog binding context cleared",
        );
        assert.ok(this.oDialogStub.close.calledOnce, "dialog closed");
      },
    );

    QUnit.test(
      "onCancelV2Product resets changes on the edited path when cancelling Edit",
      async function (assert) {
        var oRowCtx = { getPath: () => "/Products(1)" };
        await this.oController.onEditV2Product({
          getSource: () => ({ getBindingContext: () => oRowCtx }),
        });

        await this.oController.onCancelV2Product();

        assert.ok(
          this.oModelStub.resetChanges.calledOnceWith(["/Products(1)"], true),
          "resetChanges called for edited path",
        );
        assert.strictEqual(
          this.oController._editPath,
          null,
          "_editPath cleared",
        );
        assert.ok(this.oDialogStub.close.calledOnce, "dialog closed");
      },
    );

    QUnit.test(
      "onSaveV2Product submits pending changes and closes dialog on success",
      async function (assert) {
        this.oController._validateDialog = () => true;
        await this.oController.onAddV2Product();
        this.oDialogStub.setBindingContext.resetHistory();

        await this.oController.onSaveV2Product();

        assert.ok(
          this.oModelStub.submitChanges.calledOnce,
          "submitChanges called",
        );
        var oCallbacks = this.oModelStub.submitChanges.firstCall.args[0];
        oCallbacks.success({ __batchResponses: [] });

        assert.strictEqual(this.oController._oCtx, null, "_oCtx cleared");
        assert.ok(
          this.oDialogStub.setBindingContext.calledOnceWith(null, "odataV2"),
          "dialog binding context cleared",
        );
        assert.ok(this.oDialogStub.close.calledOnce, "dialog closed");
      },
    );
  },
);
