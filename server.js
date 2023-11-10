const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/moneyTrackerDB', { useNewUrlParser: true, useUnifiedTopology: true });

// Define Transaction schema
const transactionSchema = {
    description: String,
    amount: Number,
    type: String, // 'expense' or 'income'
    date: {
        type: Date,
        default: Date.now
    }
};
const Transaction = mongoose.model('Transaction', transactionSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    // Fetch all transactions from the database
    Transaction.find({})
        .exec()  // Use exec() to execute the query
        .then(transactions => {
            // Calculate the sums of income and expenses
            const income = transactions.reduce((total, transaction) => {
                return transaction.type === 'income' ? total + transaction.amount : total;
            }, 0);

            const expenses = transactions.reduce((total, transaction) => {
                return transaction.type === 'expense' ? total + transaction.amount : total;
            }, 0);

            res.render('index', { transactions, income, expenses });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/add-transaction', (req, res) => {
    res.render('add-transaction');
});

app.post('/add-transaction', (req, res) => {
    // Create a new transaction and save it to the database
    const newTransaction = new Transaction({
        description: req.body.description,
        amount: req.body.amount,
        type: req.body.type
    });

    newTransaction.save()
        .then(() => {
            res.redirect('/');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});


app.get('/overview', (req, res) => {
    // Fetch all transactions from the database
    Transaction.find({})
        .exec()  // Use exec() to execute the query
        .then(transactions => {
            res.render('overview', { transactions: transactions });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/edit-transaction/:transactionId', (req, res) => {
    const transactionId = req.params.transactionId;

    // Find a specific transaction by ID in the database
    Transaction.findOne({ _id: transactionId }).exec()
    .then(transaction => {
        res.render('edit-transaction', { transaction: transaction });
    })
    .catch(err => {
        console.error(err);
        res.status(500).send('Internal Server Error');
    });
});

app.post('/edit-transaction/:transactionId', (req, res) => {
    const transactionId = req.params.transactionId;

    // Update the specified transaction in the database
    Transaction.updateOne(
        { _id: transactionId },
        { $set: { description: req.body.description, amount: req.body.amount, type: req.body.type } }
    ).exec()
        .then(() => {
            res.redirect('/overview');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/delete-transaction/:transactionId', (req, res) => {
    const transactionId = req.params.transactionId;

    // Delete the specified transaction from the database
    Transaction.deleteOne({ _id: transactionId }).exec()
    .then(() => {
        res.redirect('/overview');
    })
    .catch(err => {
        console.error(err);
        res.status(500).send('Internal Server Error');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
