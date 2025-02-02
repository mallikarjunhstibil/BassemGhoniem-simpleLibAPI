// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const bookRoutes = require('./routes/bookRoutes');
const authorRoutes = require('./routes/authorRoutes');
const borrowerRoutes = require('./routes/borrowerRoutes');

const app = express();
app.use(bodyParser.json());
app.use('/books', bookRoutes);
app.use('/authors', authorRoutes);
app.use('/borrowers', borrowerRoutes);

const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
    app.listen(PORT, () => console.log(Server running on port ${PORT}));
}).catch(err => console.log(err));

// config/database.js
const { Sequelize } = require('sequelize');
module.exports = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
});

// models/index.js
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Book = require('./book')(sequelize, Sequelize);
const Author = require('./author')(sequelize, Sequelize);
const Borrower = require('./borrower')(sequelize, Sequelize);
Book.belongsTo(Author);
Borrower.belongsToMany(Book, { through: 'BorrowedBooks' });
Book.belongsToMany(Borrower, { through: 'BorrowedBooks' });
module.exports = { sequelize, Book, Author, Borrower };

// models/book.js
module.exports = (sequelize, DataTypes) => sequelize.define('Book', {
    title: { type: DataTypes.STRING, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: false }
});

// models/author.js
module.exports = (sequelize, DataTypes) => sequelize.define('Author', {
    name: { type: DataTypes.STRING, allowNull: false }
});

// models/borrower.js
module.exports = (sequelize, DataTypes) => sequelize.define('Borrower', {
    name: { type: DataTypes.STRING, allowNull: false }
});

// routes/bookRoutes.js
const router = require('express').Router();
const { Book } = require('../models');
router.post('/', async (req, res) => {
    try {
        const book = await Book.create(req.body);
        res.status(201).json(book);
    } catch (error) { res.status(400).json(error); }
});
router.get('/', async (req, res) => res.json(await Book.findAll()));
router.put('/:id', async (req, res) => {
    await Book.update(req.body, { where: { id: req.params.id } });
    res.json({ message: 'Book updated' });
});
router.delete('/:id', async (req, res) => {
    await Book.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Book deleted' });
});
module.exports = router;

// routes/authorRoutes.js
const authorRouter = require('express').Router();
const { Author } = require('../models');
authorRouter.post('/', async (req, res) => res.json(await Author.create(req.body)));
authorRouter.get('/', async (req, res) => res.json(await Author.findAll()));
authorRouter.put('/:id', async (req, res) => {
    await Author.update(req.body, { where: { id: req.params.id } });
    res.json({ message: 'Author updated' });
});
authorRouter.delete('/:id', async (req, res) => {
    await Author.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Author deleted' });
});
module.exports = authorRouter;

// routes/borrowerRoutes.js
const borrowerRouter = require('express').Router();
const { Borrower, Book } = require('../models');
borrowerRouter.post('/', async (req, res) => res.json(await Borrower.create(req.body)));
borrowerRouter.post('/:id/checkout', async (req, res) => {
    const borrower = await Borrower.findByPk(req.params.id);
    const book = await Book.findByPk(req.body.bookId);
    await borrower.addBook(book);
    res.json({ message: 'Book checked out' });
});
borrowerRouter.post('/:id/return', async (req, res) => {
    const borrower = await Borrower.findByPk(req.params.id);
    const book = await Book.findByPk(req.body.bookId);
    await borrower.removeBook(book);
    res.json({ message: 'Book returned' });
});
module.exports = borrowerRouter;
