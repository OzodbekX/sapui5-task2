sap.ui.define(
  [
    "project1/controller/Base.controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
  ],
  (BaseController, JSONModel, Filter, FilterOperator, MessageToast) => {
    "use strict";
    return BaseController.extend("project1.controller.Main", {
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
      onAddRecord() {
        const oModel = this.getModel("bookModel");
        const aBooks = oModel.getProperty("/books");
        aBooks.push({
          ID: "",
          Name: "",
          Author: "",
          Genre: "",
          ReleaseDate: null,
          AvailableQuantity: null,
        });
        oModel.setProperty("/books", aBooks);
      },
      onDeleteRecord() {
        const oTable = this.byId("bookTable");
        const aContexts = oTable.getSelectedContexts();
        if (!aContexts.length) {
          MessageToast.show(
            this.getResourceBundle().getText("selectRecordToDelete"),
          );
          return;
        }
        const oModel = this.getModel("bookModel");
        const aBooks = oModel.getProperty("/books");
        aContexts
          .map((oCtx) => Number(oCtx.getPath().split("/").pop()))
          .sort((a, b) => b - a)
          .forEach((i) => aBooks.splice(i, 1));
        oModel.setProperty("/books", aBooks);
        oTable.removeSelections(true);
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
        this.getModel("bookModel").setProperty(oContext.getPath()+"/EditMode",true);
      },
      onSaveTitle(oEvent){
        const oContext=oEvent.getSource().getBindingContext("bookModel");
        this.getModel("bookModel").setProperty(oContext.getPath()+"/EditMode",false);
      }
    });
  },
);
