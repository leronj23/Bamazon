const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require('console.table');

// create the connection information for the sql database
var connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "yourRootPassword",
    database: "bamazon"
});

connection.connect(function (err) {
    if (err) throw err;
    //console.log("connected as id " + connection.threadId);

    afterConnection();
});

function afterConnection() {
    connection.query('SELECT item_id, product_name, FORMAT(price, 2) AS price FROM products', function (err, res) {
        if (err) throw err;

        console.log(res);

        let tableData = [];

        res.forEach(element => {

            tableData.push({
                "Id": element.item_id,
                "Product Name": element.product_name,
                "Price": `$${element.price}`
            });
        });

        const table = cTable.getTable(tableData);
        console.log(table);

        askQuestions();
    });
}

function askQuestions() {
    inquirer
        .prompt([
            {
                name: "item_id",
                type: "input",
                message: "What's the ID of the product you want to buy?",
                validate: function (value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            },
            {
                name: "buyTotal",
                type: "input",
                message: "How many do you want to buy?",
                validate: function (value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            }
        ])
        .then(function (answers) {

            checkInventory(answers);
        });
}

function checkInventory(answers) {
    connection.query(`SELECT stock_quantity, price FROM products WHERE item_id = '${answers.item_id}'`,
        function (err, res) {
            if (err) throw err;

            if (parseInt(answers.buyTotal) > parseInt(res[0].stock_quantity)) {

                insufficient();
            }
            else {

                let newStock_quantity = parseInt(res[0].stock_quantity) - parseInt(answers.buyTotal);

                fulfillOrder(answers.item_id, res[0].price, answers.buyTotal, newStock_quantity);
            }
        });
}

function insufficient() {

    console.log("Insufficient quantity!");

    inquirer
        .prompt([
            {
                name: "question",
                type: "confirm",
                message: "Would like to try another order?"
            }
        ])
        .then(function (answer) {

            if (answer.question) {

                askQuestions();
            }
            else {

                connection.end();
            }
        });
}

function fulfillOrder(id, price, buyTotal, newStock_quantity) {

    var query = connection.query(
        "UPDATE products SET ? WHERE ?",
        [
            {
                "stock_quantity": newStock_quantity
            },
            {
                item_id: id
            }
        ],
        function (err, res) {

            let totalPrice = price * buyTotal;

            console.log('Your order has been processed.');
            console.log('Your total is $' + totalPrice);

            connection.end();
        }
    );
}