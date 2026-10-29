sap.ui.define(
  [
    "project1/controller/Base.controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/library",
    "sap/ui/core/library",
  ],
  (
    BaseController,
    JSONModel,
    Filter,
    FilterOperator,
    MessageToast,
    coreLibrary,
  ) => {
  (
    BaseController,
    JSONModel,
    Filter,
    FilterOperator,
    MessageToast,
    Dialog,
    Button,
    Text,
    mobileLibrary,
  ) => {
    "use strict";
    const DialogType = mobileLibrary.DialogType;
    const ButtonType = mobileLibrary.ButtonType;
    const { ValueState } = coreLibrary;

    return BaseController.extend("project1.controller.Main", {
      _getEmptyBook() {
        return {
          ID: "",
          Name: "",
          Author: "",
          Genre: "",
          ReleaseDate: null,
          AvailableQuantity: "",
          EditMode: false,
        };
      },
      _resetValidationStates() {
        const aInputIds = [
          "inputBookId",
          "inputBookName",
          "inputBookAuthor",
          "inputBookGenre",
          "inputBookReleaseDate",
          "inputBookQuantity",
        ];
        aInputIds.forEach((sId) => {
          const oControl = this.byId(sId);
          if (oControl) {
            oControl.setValueState(ValueState.None);
          }
        });
      },
      onInit() {
        const oData = {
          books: [
            {
              ID: "B001",
              Name: "The Great Gatsby",
              Author: "F. Scott Fitzgerald",
              Genre: "Classic",
              ReleaseDate: new Date("1925-04-10T00:00:00"),
              AvailableQuantity: 12,
              EditMode: false,
            },
            {
              ID: "B002",
              Name: "To Kill a Mockingbird",
              Author: "Harper Lee",
              Genre: "Fiction",
              ReleaseDate: new Date("1960-07-11T00:00:00"),
              AvailableQuantity: 5,
              EditMode: false,
            },
            {
              ID: "B003",
              Name: "1984",
              Author: "George Orwell",
              Genre: "Dystopian",
              ReleaseDate: new Date("1949-06-08T00:00:00"),
              AvailableQuantity: 8,
              EditMode: false,
            },
            {
              ID: "B004",
              Name: "Pride and Prejudice",
              Author: "Jane Austen",
              Genre: "Romance",
              ReleaseDate: new Date("1813-01-28T00:00:00"),
              AvailableQuantity: 15,
              EditMode: false,
            },
            {
              ID: "B005",
              Name: "The Hobbit",
              Author: "J.R.R. Tolkien",
              Genre: "Fantasy",
              ReleaseDate: new Date("1937-09-21T00:00:00"),
              AvailableQuantity: 7,
              EditMode: false,
            },
          ],
        };
        const aGenres = [...new Set(oData.books.map((book) => book.Genre))];
        oData.genres = [
          { key: "", text: this.getResourceBundle().getText("allGenres") },
        ].concat(aGenres.map((g) => ({ key: g, text: g })));
        this.setModel(new JSONModel(oData), "bookModel");
      },

      async onAddRecord() {
        this.getModel("bookModel").setProperty(
          "/newBook",
          this._getEmptyBook(),
        );
        if (!this.oAddBookDialog) {
          this.oAddBookDialog = await this.loadFragment({
            name: "project1.view.fragments.AddBookDialog",
          });
        }
        this._resetValidationStates();
        this.oAddBookDialog.open();
      },
      onCancelAddBook() {
        this.getModel("bookModel").setProperty(
          "/newBook",
          this._getEmptyBook(),
        );
        this._resetValidationStates();
        this.oAddBookDialog.close();
      },
      _validateBookDialog() {
        const oBundle = this.getResourceBundle();
        const sRequiredText = oBundle.getText("requiredField");
        let bIsValid = true;

        // 1. Validate text inputs (ID, Name, Author, Genre)
        const aTextInputIds = [
          "inputBookId",
          "inputBookName",
          "inputBookAuthor",
          "inputBookGenre",
        ];
        aTextInputIds.forEach((sId) => {
          const oInput = this.byId(sId);
          if (!oInput.getValue().trim()) {
            oInput.setValueState(ValueState.Error);
            oInput.setValueStateText(sRequiredText);
            bIsValid = false;
          } else {
            oInput.setValueState(ValueState.None);
          }
        });

        // 2. Validate Release Date
        const oDatePicker = this.byId("inputBookReleaseDate");
        if (!oDatePicker.getDateValue() || !oDatePicker.isValidValue()) {
          oDatePicker.setValueState(ValueState.Error);
          oDatePicker.setValueStateText(sRequiredText);
          bIsValid = false;
        } else {
          oDatePicker.setValueState(ValueState.None);
        }

        // 3. Validate Available Quantity (not empty, valid number >= 0)
        const oQtyInput = this.byId("inputBookQuantity");
        const sQty = oQtyInput.getValue().trim();
        const nQty = Number(sQty);
        if (sQty === "" || isNaN(nQty) || nQty < 0) {
          oQtyInput.setValueState(ValueState.Error);
          oQtyInput.setValueStateText(oBundle.getText("invalidQuantity"));
          bIsValid = false;
        } else {
          oQtyInput.setValueState(ValueState.None);
        }

        return bIsValid;
      },

      onSaveBook() {
        if (!this._validateBookDialog()) {
          MessageToast.show(
            this.getResourceBundle().getText("validationError"),
          );
          return;
        }

        const oModel = this.getModel("bookModel");
        const oNewBook = oModel.getProperty("/newBook");
        const aBooks = oModel.getProperty("/books");

        aBooks.push({
          ID: oNewBook.ID.trim(),
          Name: oNewBook.Name.trim(),
          Author: oNewBook.Author.trim(),
          Genre: oNewBook.Genre.trim(),
          ReleaseDate: oNewBook.ReleaseDate,
          AvailableQuantity: Number(oNewBook.AvailableQuantity),
          EditMode: false,
        });

        // Also add the genre to the filter dropdown if it's new
        const aGenres = oModel.getProperty("/genres");
        const sGenre = oNewBook.Genre.trim();
        if (!aGenres.some((g) => g.key === sGenre)) {
          aGenres.push({ key: sGenre, text: sGenre });
          oModel.setProperty("/genres", aGenres);
        }

        oModel.setProperty("/books", aBooks);
        this.oAddBookDialog.close();
      },
      onDeleteRecord() {
        const oTable = this.byId("bookTable");
        const aContexts = oTable.getSelectedContexts();
        const oBundle = this.getResourceBundle();

        if (!aContexts.length) {
          MessageToast.show(oBundle.getText("selectRecordToDelete"));
          return;
        }

        if (!this.oApproveDialog) {
          this.oApproveDialog = new Dialog({
            type: DialogType.Message,
            title: oBundle.getText("confirmTitle"),
            content: new Text({
              text: oBundle.getText("confirmDeleteText"),
            }),
            beginButton: new Button({
              type: ButtonType.Emphasized,
              text: oBundle.getText("yes"),
              press: () => {
                const oModel = this.getModel("bookModel");
                const aBooks = oModel.getProperty("/books");
                oTable
                  .getSelectedContexts()
                  .map((oCtx) => Number(oCtx.getPath().split("/").pop()))
                  .sort((a, b) => b - a)
                  .forEach((i) => aBooks.splice(i, 1));
                oModel.setProperty("/books", aBooks);
                oTable.removeSelections(true);
                this.oApproveDialog.close();
              },
            }),
            endButton: new Button({
              text: oBundle.getText("no"),
              press: () => {
                this.oApproveDialog.close();
              },
            }),
          });
        }

        this.oApproveDialog.open();
      },
      onFilter() {
        const sTitle = this.byId("titleFilterInput").getValue();
        const sGenre = this.byId("genreFilterSelect").getSelectedKey();
        const aFilters = [];
        if (sTitle) {
          aFilters.push(new Filter("Name", FilterOperator.Contains, sTitle));
        }
        if (sGenre) {
          aFilters.push(new Filter("Genre", FilterOperator.EQ, sGenre));
        }
        this.byId("bookTable").getBinding("items").filter(aFilters);
      },
      onEditTitle(oEvent) {
        const oContext = oEvent.getSource().getBindingContext("bookModel");
        this.getModel("bookModel").setProperty(
          oContext.getPath() + "/EditMode",
          true,
        );
      },
      onSaveTitle(oEvent) {
        const oContext = oEvent.getSource().getBindingContext("bookModel");
        this.getModel("bookModel").setProperty(
          oContext.getPath() + "/EditMode",
          false,
        );
      },
    });
  },
);
