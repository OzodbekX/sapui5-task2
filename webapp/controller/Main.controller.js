sap.ui.define(
  [
    "project1/controller/Base.controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/library",
    "project1/model/bookData",
    "project1/util/BookValidator",
    "project1/util/IdGenerator",
    "project1/model/formatter",
  ],
  (
    BaseController,
    JSONModel,
    Filter,
    FilterOperator,
    MessageToast,
    MessageBox,
    coreLibrary,
    BookData,
    BookValidator,
    IdGenerator,
    formatter,
  ) => {
    "use strict";

    const { ValueState } = coreLibrary;

    const BOOK_MODEL = "bookModel";
    const ODATA_MODEL = "odataV2";
    const DELETE_GROUP_ID = "deleteProducts";
    const FILTER_DEBOUNCE_MS = 300;
    const MODEL_SIZE_LIMIT = 1000;

    const TEXT_INPUT_IDS = ["inputBookName", "inputBookAuthor", "inputBookGenre"];
    const DIALOG_INPUT_IDS = [
      ...TEXT_INPUT_IDS,
      "inputBookReleaseDate",
      "inputBookQuantity",
    ];

    const indexFromContext = (ctx) => Number(ctx.getPath().split("/").pop());

    return BaseController.extend("project1.controller.Main", {
      formatter,

      onInit() {
        const books = BookData.createBooks();
        const genres = [...new Set(books.map((book) => book.Genre))];
        const bundle = this.getResourceBundle();

        const model = new JSONModel({
          books,
          genres: [
            { key: "", text: bundle.getText("allGenres") },
            ...genres.map((genre) => ({ key: genre, text: genre })),
          ],
        });
        model.setSizeLimit(MODEL_SIZE_LIMIT);

        this.setModel(model, BOOK_MODEL);
      },

      onExit() {
        clearTimeout(this._filterTimer);
      },

      _getEmptyBook() {
        return BookData.createEmptyBook();
      },

      _resetValidationStates() {
        DIALOG_INPUT_IDS.forEach((id) => {
          this.byId(id)?.setValueState(ValueState.None);
        });
      },

      _getODataErrorText(err) {
        try {
          return JSON.parse(err.responseText || err.body).error.message.value;
        } catch (e) {
          return err.message || err.statusText || "";
        }
      },

      _loadAddBookDialog() {
        if (!this._pAddBookDialog) {
          this._pAddBookDialog = this.loadFragment({
            name: "project1.view.fragments.AddBookDialog",
          });
        }
        return this._pAddBookDialog;
      },

      async onAddRecord() {
        const model = this.getModel(BOOK_MODEL);
        const newBook = this._getEmptyBook();
        newBook.ID = IdGenerator.generateNextId(model.getProperty("/books"));
        model.setProperty("/newBook", newBook);

        const dialog = await this._loadAddBookDialog();
        this._resetValidationStates();
        dialog.open();
      },

      async onCancelAddBook() {
        this.getModel(BOOK_MODEL).setProperty("/newBook", this._getEmptyBook());
        this._resetValidationStates();
        (await this._loadAddBookDialog()).close();
      },

      _validateBookDialog() {
        const bundle = this.getResourceBundle();

        return BookValidator.validateBookDialog({
          textInputs: TEXT_INPUT_IDS.map((id) => this.byId(id)),
          datePicker: this.byId("inputBookReleaseDate"),
          quantityInput: this.byId("inputBookQuantity"),
          requiredText: bundle.getText("requiredField"),
          invalidQuantityText: bundle.getText("invalidQuantity"),
        });
      },

      async onSaveBook() {
        if (!this._validateBookDialog()) {
          MessageToast.show(this.getResourceBundle().getText("validationError"));
          return;
        }

        const model = this.getModel(BOOK_MODEL);
        const newBook = model.getProperty("/newBook");
        const genre = newBook.Genre.trim();

        const book = {
          ID: newBook.ID,
          Name: newBook.Name.trim(),
          Author: newBook.Author.trim(),
          Genre: genre,
          ReleaseDate: newBook.ReleaseDate,
          AvailableQuantity: Number(newBook.AvailableQuantity),
          EditMode: false,
        };

        model.setProperty("/books", [...model.getProperty("/books"), book]);

        const genres = model.getProperty("/genres");
        if (!genres.some((g) => g.key === genre)) {
          model.setProperty("/genres", [...genres, { key: genre, text: genre }]);
        }

        (await this._loadAddBookDialog()).close();
      },

      onDeleteRecord() {
        const table = this.byId("bookTable");
        const bundle = this.getResourceBundle();
        const contexts = table.getSelectedContexts();

        if (!contexts.length) {
          MessageToast.show(bundle.getText("selectRecordToDelete"));
          return;
        }

        MessageBox.confirm(bundle.getText("confirmDeleteText"), {
          title: bundle.getText("confirmTitle"),
          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
          emphasizedAction: MessageBox.Action.YES,
          onClose: (action) => {
            if (action !== MessageBox.Action.YES) {
              return;
            }
            const toRemove = new Set(contexts.map(indexFromContext));
            const model = this.getModel(BOOK_MODEL);
            model.setProperty(
              "/books",
              model.getProperty("/books").filter((_, i) => !toRemove.has(i)),
            );
            table.removeSelections(true);
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

        paths.forEach((path) => model.remove(path, { groupId: DELETE_GROUP_ID }));

        const discardPending = () => model.resetChanges(paths, true);

        model.submitChanges({
          groupId: DELETE_GROUP_ID,
          success: (data) => {
            const failed = (data?.__batchResponses || []).filter(
              (r) => r.response && Number(r.response.statusCode) >= 400,
            );
            if (failed.length) {
              discardPending();
              MessageBox.error(
                bundle.getText("deleteError", [
                  this._getODataErrorText(failed[0].response),
                ]),
              );
              return;
            }
            table.removeSelections(true);
            MessageToast.show(bundle.getText("deleteSuccess", [contexts.length]));
          },
          error: (err) => {
            discardPending();
            MessageBox.error(
              bundle.getText("deleteError", [this._getODataErrorText(err)]),
            );
          },
        });
      },

      _applyFilters() {
        const title = this.byId("titleFilterInput").getValue().trim();
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

      onFilter() {
        clearTimeout(this._filterTimer);
        this._applyFilters();
      },

      onFilterLiveChange() {
        clearTimeout(this._filterTimer);
        this._filterTimer = setTimeout(
          () => this._applyFilters(),
          FILTER_DEBOUNCE_MS,
        );
      },

      _setEditMode(event, value) {
        const context = event.getSource().getBindingContext(BOOK_MODEL);
        this.getModel(BOOK_MODEL).setProperty(`${context.getPath()}/EditMode`, value);
      },

      onEditTitle(event) {
        this._setEditMode(event, true);
      },

      onSaveTitle(event) {
        this._setEditMode(event, false);
      },
    });
  },
);