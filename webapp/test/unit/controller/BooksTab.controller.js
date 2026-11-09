/*global QUnit*/

sap.ui.define(
  [
    "project1/controller/BooksTab.controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/thirdparty/sinon",
  ],
  function (Controller, JSONModel, sinon) {
    "use strict";

    QUnit.module("BooksTab Controller", {
      beforeEach: function () {
        this.oBookModel = new JSONModel({
          books: [
            { ID: 1, Name: "Dune", Author: "Frank Herbert", Genre: "SciFi", AvailableQuantity: 3, EditMode: false },
            { ID: 2, Name: "Emma", Author: "Jane Austen", Genre: "Romance", AvailableQuantity: 5, EditMode: false },
          ],
          genres: [{ key: "", text: "All" }, { key: "SciFi", text: "SciFi" }],
        });

        this.oSetModelSpy = sinon.spy();
        this.oFilterSpy = sinon.spy();
        this.oDialogStub = { open: sinon.spy(), close: sinon.spy() };

        this.oControls = {
          titleFilterInput: { getValue: () => "" },
          genreFilterSelect: { getSelectedKey: () => "" },
          bookTable: { getBinding: () => ({ filter: this.oFilterSpy }) },
        };

        this.oController = new Controller();
        this.oController.getResourceBundle = () => ({ getText: (sKey) => sKey });
        this.oController.getView = () => ({
          setModel: this.oSetModelSpy,
          getModel: () => this.oBookModel,
        });
        this.oController.byId = (sId) => this.oControls[sId];
        this.oController.loadFragment = () => Promise.resolve(this.oDialogStub);
      },
    });

    function createRowEvent(oModel, iIndex) {
      var oContext = oModel.getContext("/books/" + iIndex);
      return {
        getSource: function () {
          return { getBindingContext: function () { return oContext; } };
        },
      };
    }

    QUnit.test("onInit should create the book model", function (assert) {
      this.oController.onInit();
      assert.ok(this.oSetModelSpy.calledOnce, "setModel was called once");
      assert.strictEqual(this.oSetModelSpy.firstCall.args[1], "bookModel", "model is named bookModel");
    });

    QUnit.test("onEditTitle should switch the row to edit mode", function (assert) {
      this.oController.onEditTitle(createRowEvent(this.oBookModel, 0));

      assert.strictEqual(this.oBookModel.getProperty("/books/0/EditMode"), true, "row 0 is in edit mode");
      assert.strictEqual(this.oBookModel.getProperty("/books/1/EditMode"), false, "row 1 is untouched");
    });

    QUnit.test("onSaveTitle should switch the row back to display mode", function (assert) {
      this.oBookModel.setProperty("/books/0/EditMode", true);

      this.oController.onSaveTitle(createRowEvent(this.oBookModel, 0));

      assert.strictEqual(this.oBookModel.getProperty("/books/0/EditMode"), false, "row 0 left edit mode");
    });

    QUnit.test("onAddRecord should initialize newBook and open the dialog", async function (assert) {
      await this.oController.onAddRecord();

      assert.strictEqual(this.oBookModel.getProperty("/newBook/ID"), "B003", "next ID was generated on /newBook");
      assert.ok(this.oDialogStub.open.calledOnce, "dialog.open was called once");
    });

    QUnit.test("onSaveBook should add a valid record to the model", async function (assert) {
      var iBefore = this.oBookModel.getProperty("/books").length;
      this.oBookModel.setProperty("/newBook", {
        ID: "B003",
        Name: "Foundation",
        Author: "Isaac Asimov",
        Genre: "SciFi",
        ReleaseDate: "1951-05-01",
        AvailableQuantity: 4,
      });
      this.oController._validateDialog = () => true;

      await this.oController.onSaveBook();

      assert.strictEqual(this.oBookModel.getProperty("/books").length, iBefore + 1, "one record was added");
      assert.ok(this.oDialogStub.close.calledOnce, "dialog.close was called once");
    });

    QUnit.test("onFilter should apply a filter to the table binding", function (assert) {
      this.oControls.titleFilterInput.getValue = () => "Dune";
      this.oControls.genreFilterSelect.getSelectedKey = () => "SciFi";

      this.oController.onFilter();

      assert.ok(this.oFilterSpy.calledOnce, "binding.filter was called once");
    });

    QUnit.test("onFilter with empty inputs should not break", function (assert) {
      this.oController.onFilter();
      assert.ok(this.oFilterSpy.calledOnce, "filter was still called (with no active filters)");
    });
  },
);
