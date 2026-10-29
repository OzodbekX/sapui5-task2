sap.ui.define([], () => {
  "use strict";
  const createBooks = () => [
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
  ];
  const createEmptyBook = () => ({
    ID: "",
    Name: "",
    Author: "",
    Genre: "",
    ReleaseDate: null,
    AvailableQuantity: "",
    EditMode: false,
  });
  return {
    createBooks,
    createEmptyBook,
  };
});
