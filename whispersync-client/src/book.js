class Book {
  constructor({ asin, title, authors, ...rest }) {
    this.asin = asin
    this.title = title
    this.authors = authors
    Object.assign(this, rest)
  }
}

module.exports = Book
