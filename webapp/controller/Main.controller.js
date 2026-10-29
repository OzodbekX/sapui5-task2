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
    "project1/model/bookData",
    "project1/util/BookValidator",
    "project1/util/IdGenerator",
  ],
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
    coreLibrary,
    BookData,
    BookValidator,
    IdGenerator,
  ) => {
    "use strict";

    const { DialogType, ButtonType } = mobileLibrary;
    const { ValueState } = coreLibrary;

    const DIALOG_INPUT_IDS = [
      "inputBookName",
      "inputBookAuthor",
      "inputBookGenre",
      "inputBookReleaseDate",
      "inputBookQuantity",
    ];

    return BaseController.extend("project1.controller.Main", {
      _getEmptyBook() {
        return BookData.createEmptyBook();
      },

      _resetValidationStates() {
        DIALOG_INPUT_IDS.forEach((id) => {
          this.byId(id)?.setValueState(ValueState.None);
        });
      },

      onInit() {
        const books = BookData.createBooks();
        const genres = [...new Set(books.map((book) => book.Genre))];

        const resourceBundle = this.getResourceBundle();

        this.setModel(
          new JSONModel({
            books,
            genres: [
              {
                key: "",
                text: resourceBundle.getText("allGenres"),
              },
              ...genres.map((genre) => ({
                key: genre,
                text: genre,
              })),
            ],
          }),
          "bookModel",
        );
      },

      async onAddRecord() {
        const model = this.getModel("bookModel");
        const newBook = this._getEmptyBook();
        newBook.ID = IdGenerator.generateNextId(model.getProperty("/books"));
        model.setProperty("/newBook", newBook);

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
        const bundle = this.getResourceBundle();
        const textInputs = [
          "inputBookName",
          "inputBookAuthor",
          "inputBookGenre",
        ].map((id) => this.byId(id));

        return BookValidator.validateBookDialog({
          textInputs,
          datePicker: this.byId("inputBookReleaseDate"),
          quantityInput: this.byId("inputBookQuantity"),
          requiredText: bundle.getText("requiredField"),
          invalidQuantityText: bundle.getText("invalidQuantity"),
        });
      },

      onSaveBook() {
        if (!this._validateBookDialog()) {
          MessageToast.show(
            this.getResourceBundle().getText("validationError"),
          );
          return;
        }

        const model = this.getModel("bookModel");
        const newBook = model.getProperty("/newBook");
        const books = model.getProperty("/books");
        const genre = newBook.Genre.trim();

        books.push({
          ID: newBook.ID,
          Name: newBook.Name.trim(),
          Author: newBook.Author.trim(),
          Genre: genre,
          ReleaseDate: newBook.ReleaseDate,
          AvailableQuantity: Number(newBook.AvailableQuantity),
          EditMode: false,
        });

        const genres = model.getProperty("/genres");
        if (!genres.some((g) => g.key === genre)) {
          genres.push({ key: genre, text: genre });
          model.setProperty("/genres", genres);
        }

        model.setProperty("/books", books);
        this.oAddBookDialog.close();
      },

      onDeleteRecord() {
        const table = this.byId("bookTable");
        const bundle = this.getResourceBundle();

        if (!table.getSelectedContexts().length) {
          MessageToast.show(bundle.getText("selectRecordToDelete"));
          return;
        }

        if (!this.oApproveDialog) {
          this.oApproveDialog = new Dialog({
            type: DialogType.Message,
            title: bundle.getText("confirmTitle"),
            content: new Text({
              text: bundle.getText("confirmDeleteText"),
            }),
            beginButton: new Button({
              type: ButtonType.Emphasized,
              text: bundle.getText("yes"),
              press: () => {
                const model = this.getModel("bookModel");
                const books = model.getProperty("/books");
                table
                  .getSelectedContexts()
                  .map((ctx) => Number(ctx.getPath().split("/").pop()))
                  .sort((a, b) => b - a)
                  .forEach((i) => books.splice(i, 1));
                model.setProperty("/books", books);
                table.removeSelections(true);
                this.oApproveDialog.close();
              },
            }),
            endButton: new Button({
              text: bundle.getText("no"),
              press: () => {
                this.oApproveDialog.close();
              },
            }),
          });
          this.getView().addDependent(this.oApproveDialog);
        }

        this.oApproveDialog.open();
      },

      onFilter() {
        const title = this.byId("titleFilterInput").getValue();
        const genre = this.byId("genreFilterSelect").getSelectedKey();
        const filters = [];
        if (title) {
          filters.push(new Filter("Name", FilterOperator.Contains, title));
        }
        if (genre) {
          filters.push(new Filter("Genre", FilterOperator.EQ, genre));
        }
        this.byId("bookTable").getBinding("items").filter(filters);
      },

      onEditTitle(event) {
        const context = event.getSource().getBindingContext("bookModel");
        this.getModel("bookModel").setProperty(
          context.getPath() + "/EditMode",
          true,
        );
      },

      onSaveTitle(event) {
        const context = event.getSource().getBindingContext("bookModel");
        this.getModel("bookModel").setProperty(
          context.getPath() + "/EditMode",
          false,
        );
      },
    });
  },
);
