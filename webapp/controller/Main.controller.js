sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";
    return Controller.extend("project1.controller.Main", {
        onInit() {
             const oData = {
               books: [
                    { ID: "B001", Name: "The Great Gatsby", Author: "F. Scott Fitzgerald", Genre: "Classic", ReleaseDate: "1925-04-10", AvailableQuantity: 12 },
                    { ID: "B002", Name: "To Kill a Mockingbird", Author: "Harper Lee", Genre: "Fiction", ReleaseDate: "1960-07-11", AvailableQuantity: 5 },
                    { ID: "B003", Name: "1984", Author: "George Orwell", Genre: "Dystopian", ReleaseDate: "1949-06-08", AvailableQuantity: 8 },
                    { ID: "B004", Name: "Pride and Prejudice", Author: "Jane Austen", Genre: "Romance", ReleaseDate: "1813-01-28", AvailableQuantity: 15 },
                    { ID: "B005", Name: "The Hobbit", Author: "J.R.R. Tolkien", Genre: "Fantasy", ReleaseDate: "1937-09-21", AvailableQuantity: 7 }
                ]
            };
            const oModel = new JSONModel(oData);
            this.getView().setModel(oModel,'bookModel');
        }
    });
});