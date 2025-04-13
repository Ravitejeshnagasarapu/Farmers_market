require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const fs = require('fs');
const mysql = require('mysql');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection with retry logic
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
});

// Retry connection up to 3 times
let connectionAttempts = 0;
const maxRetries = 3;

function connectToDatabase() {
    db.connect((err) => {
        if (err) {
            console.error('Error connecting to MySQL:', err);
            if (connectionAttempts < maxRetries) {
                connectionAttempts++;
                console.log(`Retrying connection (${connectionAttempts}/${maxRetries})...`);
                setTimeout(connectToDatabase, 2000);
            } else {
                console.error('Max retries reached. Exiting.');
                process.exit(1);
            }
            return;
        }
        console.log('Connected to MySQL');
        initializeDatabase();
    });
}

connectToDatabase();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://farmers-market.onrender.com' : 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/Uploads', express.static(path.join(__dirname, 'public', 'Uploads')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-please-set-in-env', // Fallback for safety
    resave: false,
    saveUninitialized: false, // Changed to false to avoid unnecessary sessions
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Adjust for cross-site requests
    }
}));

// Initialize database and tables
function initializeDatabase() {
    db.query('CREATE DATABASE IF NOT EXISTS farmers_market', (err) => {
        if (err) {
            console.error('Error creating database:', err);
            process.exit(1);
        }
        console.log('Database checked/created');
        db.query('USE farmers_market', (err) => {
            if (err) {
                console.error('Error selecting database:', err);
                process.exit(1);
            }
            console.log('Using farmers_market database');

            // Create tables in order to respect foreign key dependencies
            const tables = [
                {
                    name: 'Users',
                    query: `
                        CREATE TABLE IF NOT EXISTS Users (
                            user_id INT AUTO_INCREMENT PRIMARY KEY,
                            username VARCHAR(255) NOT NULL UNIQUE,
                            email VARCHAR(255) NOT NULL UNIQUE,
                            password VARCHAR(255) NOT NULL,
                            role ENUM('customer', 'farmer', 'admin') NOT NULL DEFAULT 'customer'
                        )
                    `,
                    seed: () => {
                        db.query('SELECT COUNT(*) as count FROM Users', (err, results) => {
                            if (err) {
                                console.error('Error checking Users table:', err);
                                return;
                            }
                            if (results[0].count === 0) {
                                const demoUsers = [
                                    ['customer', 'customer@example.com', bcrypt.hashSync('password123', 10), 'customer'],
                                    ['farmer', 'farmer@example.com', bcrypt.hashSync('password123', 10), 'farmer']
                                ];
                                demoUsers.forEach(user => {
                                    db.query('INSERT INTO Users (username, email, password, role) VALUES (?, ?, ?, ?)', user, (err) => {
                                        if (err) console.error(`Error adding demo user ${user[0]}:`, err);
                                        else console.log(`Demo user '${user[0]}' added`);
                                    });
                                });
                            }
                        });
                    }
                },
                {
                    name: 'Products',
                    query: `
                        CREATE TABLE IF NOT EXISTS Products (
                            product_id INT AUTO_INCREMENT PRIMARY KEY,
                            farmer_id INT,
                            product_name VARCHAR(255) NOT NULL,
                            description TEXT,
                            category VARCHAR(100),
                            price DECIMAL(10, 2),
                            stock_quantity INT,
                            image_url VARCHAR(255),
                            FOREIGN KEY (farmer_id) REFERENCES Users(user_id) ON DELETE CASCADE
                        )
                    `
                },
                {
                    name: 'Transactions',
                    query: `
                        CREATE TABLE IF NOT EXISTS Transactions (
                            transaction_id INT AUTO_INCREMENT PRIMARY KEY,
                            buyer_id INT,
                            transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                            total_amount DECIMAL(10, 2),
                            FOREIGN KEY (buyer_id) REFERENCES Users(user_id)
                        )
                    `
                },
                {
                    name: 'Transaction_Items',
                    query: `
                        CREATE TABLE IF NOT EXISTS Transaction_Items (
                            item_id INT AUTO_INCREMENT PRIMARY KEY,
                            transaction_id INT,
                            product_id INT,
                            quantity INT,
                            price_per_unit DECIMAL(10, 2),
                            FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id),
                            FOREIGN KEY (product_id) REFERENCES Products(product_id)
                        )
                    `
                },
                {
                    name: 'Contact_Submissions',
                    query: `
                        CREATE TABLE IF NOT EXISTS Contact_Submissions (
                            submission_id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            email VARCHAR(255) NOT NULL,
                            message TEXT NOT NULL,
                            submission_date DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    `
                },
                {
                    name: 'Newsletter_Subscriptions',
                    query: `
                        CREATE TABLE IF NOT EXISTS Newsletter_Subscriptions (
                            subscription_id INT AUTO_INCREMENT PRIMARY KEY,
                            email VARCHAR(255) NOT NULL UNIQUE,
                            subscription_date DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    `
                },
                {
                    name: 'Action_Logs',
                    query: `
                        CREATE TABLE IF NOT EXISTS Action_Logs (
                            log_id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT,
                            action VARCHAR(255) NOT NULL,
                            details TEXT,
                            action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES Users(user_id)
                        )
                    `
                }
            ];

            // Create tables sequentially to avoid dependency issues
            async function createTables() {
                for (const table of tables) {
                    try {
                        db.query(table.query, (err) => {
                            if (err) {
                                console.error(`Error creating ${table.name} table:`, err);
                                process.exit(1);
                            }
                            console.log(`${table.name} table ready`);
                            if (table.seed) table.seed();
                        });
                    } catch (err) {
                        console.error(`Error creating ${table.name} table:`, err);
                        process.exit(1);
                    }
                }
            }

            createTables();
        });
    });
}

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'Uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|svg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only image files (jpeg, jpg, png, svg) are allowed!'));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Please login to continue' });
}

function isFarmer(req, res, next) {
    if (req.session.user && req.session.user.role === 'farmer') {
        return next();
    }
    res.status(403).json({ error: 'Only farmers can perform this action' });
}

function isCustomer(req, res, next) {
    if (req.session.user && req.session.user.role === 'customer') {
        return next();
    }
    res.status(403).json({ error: 'Only customers can perform this action' });
}

// Action logging
function logUserAction(userId, action, details) {
    db.query(
        'INSERT INTO Action_Logs (user_id, action, details, action_date) VALUES (?, ?, ?, NOW())',
        [userId, action, details],
        (err) => {
            if (err) console.error('Error logging action:', err);
        }
    );
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/user', (req, res) => {
    if (req.session.user) {
        const { password, ...user } = req.session.user; // Ensure password is not sent
        res.json({ loggedIn: true, user });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    console.log(`Login attempt for username: ${username}`);
    db.query(
        'SELECT * FROM Users WHERE username = ?',
        [username],
        (err, users) => {
            if (err) {
                console.error('Database error during login:', err);
                return res.status(500).json({ error: 'Server error' });
            }
            if (users.length === 0) {
                console.log(`No user found for username: ${username}`);
                return res.status(401).json({ error: 'Invalid username or password' });
            }
            bcrypt.compare(password, users[0].password, (err, match) => {
                if (err) {
                    console.error('Bcrypt error during login:', err);
                    return res.status(500).json({ error: 'Server error' });
                }
                if (!match) {
                    console.log(`Password mismatch for username: ${username}`);
                    return res.status(401).json({ error: 'Invalid username or password' });
                }
                req.session.user = {
                    user_id: users[0].user_id,
                    username: users[0].username,
                    email: users[0].email,
                    role: users[0].role
                };
                console.log(`Successful login for username: ${username}, role: ${users[0].role}`);
                logUserAction(users[0].user_id, 'login', `User ${username} logged in`);
                res.json({ success: true, user: req.session.user });
            });
        }
    );
});

app.post('/api/register', (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    console.log(`Register attempt for username: ${username}, role: ${role}`);
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ error: 'Failed to register' });
        }
        db.query('SELECT * FROM Users WHERE username = ? OR email = ?', [username, email], (err, existingUsers) => {
            if (err) {
                console.error('Error checking existing user:', err);
                return res.status(500).json({ error: 'Failed to register' });
            }
            if (existingUsers.length > 0) {
                const conflict = existingUsers.find(user => user.username === username) ? 'Username' : 'Email';
                console.log(`${conflict} already exists: ${username} or ${email}`);
                return res.status(409).json({ error: `${conflict} already exists` });
            }
            db.query(
                'INSERT INTO Users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [username, email, hash, role === 'farmer' ? 'farmer' : 'customer'],
                (err, result) => {
                    if (err) {
                        console.error('Registration error:', err);
                        return res.status(500).json({ error: 'Failed to register' });
                    }
                    req.session.user = {
                        user_id: result.insertId,
                        username,
                        email,
                        role: role === 'farmer' ? 'farmer' : 'customer'
                    };
                    console.log(`Successful registration for username: ${username}, role: ${role}`);
                    logUserAction(result.insertId, 'register', `User ${username} registered as ${role}`);
                    res.json({ success: true, user: req.session.user });
                }
            );
        });
    });
});

app.post('/api/logout', (req, res) => {
    const userId = req.session.user?.user_id;
    const username = req.session.user?.username;
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Failed to logout' });
        }
        console.log(`Successful logout for username: ${username || 'unknown'}`);
        if (userId) {
            logUserAction(userId, 'logout', `User ${username} logged out`);
        }
        res.json({ success: true });
    });
});

app.get('/api/products', isAuthenticated, (req, res) => {
    let query = 'SELECT * FROM Products WHERE stock_quantity > 0';
    const params = [];
    if (req.query.category && req.query.category !== 'all') {
        query += ' AND category = ?';
        params.push(req.query.category);
    }
    if (req.query.search) {
        const searchTerm = `%${req.query.search}%`;
        query += ' AND (product_name LIKE ? OR description LIKE ? OR category LIKE ?)';
        params.push(searchTerm, searchTerm, searchTerm);
    }
    console.log('Products query:', query, 'Params:', params);
    db.query(query, params, (err, products) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
        console.log(`Fetched ${products.length} products`);
        res.json(products);
    });
});

app.get('/api/products/:id', isAuthenticated, (req, res) => {
    const productId = parseInt(req.params.id);
    console.log(`Fetching product ID: ${productId}`);
    db.query('SELECT * FROM Products WHERE product_id = ?', [productId], (err, products) => {
        if (err) {
            console.error('Error fetching product:', err);
            return res.status(500).json({ error: 'Failed to fetch product' });
        }
        if (products.length === 0) {
            console.log(`Product ID ${productId} not found`);
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(products[0]);
    });
});

app.post('/api/add_product', isAuthenticated, isFarmer, upload.single('image'), (req, res) => {
    try {
        const { product_name, description, category, price, stock_quantity } = req.body;
        if (!product_name || !category || !price || !stock_quantity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const imagePath = req.file ? `/Uploads/${req.file.filename}` : (req.body.image_url || '/Uploads/default-product.jpg');
        console.log(`Adding product: ${product_name} by farmer ${req.session.user.user_id}`);
        db.query(
            'INSERT INTO Products (farmer_id, product_name, description, category, price, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.session.user.user_id, product_name, description, category, parseFloat(price), parseInt(stock_quantity), imagePath],
            (err, result) => {
                if (err) {
                    console.error('Error adding product:', err);
                    return res.status(500).json({ error: 'Failed to add product' });
                }
                console.log(`Added product ID: ${result.insertId}`);
                logUserAction(req.session.user.user_id, 'add_product', `Added product: ${product_name}`);
                db.query('SELECT * FROM Products WHERE product_id = ?', [result.insertId], (err, products) => {
                    if (err || products.length === 0) {
                        return res.json({ success: true, product_id: result.insertId });
                    }
                    res.json({ success: true, product: products[0] });
                });
            }
        );
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

app.put('/api/products/:id', isAuthenticated, isFarmer, upload.single('image'), (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        db.query(
            'SELECT * FROM Products WHERE product_id = ? AND farmer_id = ?',
            [productId, req.session.user.user_id],
            (err, products) => {
                if (err) {
                    console.error('Error checking product:', err);
                    return res.status(500).json({ error: 'Server error' });
                }
                if (products.length === 0) {
                    console.log(`Product ID ${productId} not found or no permission for farmer ${req.session.user.user_id}`);
                    return res.status(403).json({ error: 'Product not found or no permission' });
                }
                const { product_name, description, category, price, stock_quantity } = req.body;
                const imagePath = req.file ? `/Uploads/${req.file.filename}` : null;
                let updateQuery = 'UPDATE Products SET ';
                const updateValues = [];
                if (product_name) {
                    updateQuery += 'product_name = ?, ';
                    updateValues.push(product_name);
                }
                if (description) {
                    updateQuery += 'description = ?, ';
                    updateValues.push(description);
                }
                if (category) {
                    updateQuery += 'category = ?, ';
                    updateValues.push(category);
                }
                if (price) {
                    updateQuery += 'price = ?, ';
                    updateValues.push(parseFloat(price));
                }
                if (stock_quantity) {
                    updateQuery += 'stock_quantity = ?, ';
                    updateValues.push(parseInt(stock_quantity));
                }
                if (imagePath) {
                    updateQuery += 'image_url = ?, ';
                    updateValues.push(imagePath);
                }
                if (updateValues.length === 0) {
                    return res.status(400).json({ error: 'No fields to update' });
                }
                updateQuery = updateQuery.slice(0, -2);
                updateQuery += ' WHERE product_id = ?';
                updateValues.push(productId);
                console.log(`Updating product ID: ${productId}`);
                db.query(updateQuery, updateValues, (err) => {
                    if (err) {
                        console.error('Error updating product:', err);
                        return res.status(500).json({ error: 'Failed to update product' });
                    }
                    console.log(`Updated product ID: ${productId}`);
                    logUserAction(req.session.user.user_id, 'update_product', `Updated product ID: ${productId}`);
                    db.query('SELECT * FROM Products WHERE product_id = ?', [productId], (err, products) => {
                        if (err || products.length === 0) {
                            return res.json({ success: true });
                        }
                        res.json({ success: true, product: products[0] });
                    });
                });
            }
        );
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

app.delete('/api/products/:id', isAuthenticated, isFarmer, (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        db.query(
            'SELECT * FROM Products WHERE product_id = ? AND farmer_id = ?',
            [productId, req.session.user.user_id],
            (err, products) => {
                if (err) {
                    console.error('Error checking product:', err);
                    return res.status(500).json({ error: 'Server error' });
                }
                if (products.length === 0) {
                    console.log(`Product ID ${productId} not found or no permission for farmer ${req.session.user.user_id}`);
                    return res.status(403).json({ error: 'Product not found or no permission' });
                }
                const imagePath = products[0].image_url;
                if (imagePath && imagePath !== '/Uploads/default-product.jpg' && imagePath.startsWith('/Uploads/')) {
                    const fullPath = path.join(__dirname, 'public', imagePath);
                    if (fs.existsSync(fullPath)) {
                        try {
                            fs.unlinkSync(fullPath);
                            console.log(`Deleted image: ${imagePath}`);
                        } catch (err) {
                            console.error(`Error deleting image ${imagePath}:`, err);
                        }
                    }
                }
                db.query('DELETE FROM Products WHERE product_id = ?', [productId], (err) => {
                    if (err) {
                        console.error('Error deleting product:', err);
                        return res.status(500).json({ error: 'Failed to delete product' });
                    }
                    console.log(`Deleted product ID: ${productId}`);
                    logUserAction(req.session.user.user_id, 'delete_product', `Deleted product ID: ${productId}`);
                    res.json({ success: true });
                });
            }
        );
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

app.post('/api/buy_product', isAuthenticated, isCustomer, (req, res) => {
    try {
        console.log('Buy product request:', req.body);
        const { product_id, quantity } = req.body;
        const productId = parseInt(product_id);
        const requestedQuantity = parseInt(quantity);
        if (isNaN(productId) || isNaN(requestedQuantity) || requestedQuantity <= 0) {
            console.log('Invalid product_id or quantity:', { product_id, quantity });
            return res.status(400).json({ error: 'Invalid product ID or quantity' });
        }
        db.query(
            'SELECT * FROM Products WHERE product_id = ? AND stock_quantity >= ?',
            [productId, requestedQuantity],
            (err, products) => {
                if (err) {
                    console.error('Error checking product:', err);
                    return res.status(500).json({ error: 'Server error' });
                }
                if (products.length === 0) {
                    console.log(`Product ${productId} not found or stock too low (requested: ${requestedQuantity})`);
                    return res.status(400).json({ error: 'Product not found or not enough stock' });
                }
                const product = products[0];
                console.log(`Found product: ${product.product_name}, stock: ${product.stock_quantity}`);
                db.beginTransaction((err) => {
                    if (err) {
                        console.error('Transaction error:', err);
                        return res.status(500).json({ error: 'Server error' });
                    }
                    db.query(
                        'INSERT INTO Transactions (buyer_id, transaction_date, total_amount) VALUES (?, NOW(), ?)',
                        [req.session.user.user_id, product.price * requestedQuantity],
                        (err, result) => {
                            if (err) {
                                console.error('Error creating transaction:', err);
                                return db.rollback(() => {
                                    res.status(500).json({ error: 'Failed to process purchase' });
                                });
                            }
                            const transactionId = result.insertId;
                            console.log(`Created transaction ID: ${transactionId}`);
                            db.query(
                                'INSERT INTO Transaction_Items (transaction_id, product_id, quantity, price_per_unit) VALUES (?, ?, ?, ?)',
                                [transactionId, productId, requestedQuantity, product.price],
                                (err) => {
                                    if (err) {
                                        console.error('Error creating transaction item:', err);
                                        return db.rollback(() => {
                                            res.status(500).json({ error: 'Failed to process purchase' });
                                        });
                                    }
                                    db.query(
                                        'UPDATE Products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
                                        [requestedQuantity, productId],
                                        (err) => {
                                            if (err) {
                                                console.error('Error updating stock:', err);
                                                return db.rollback(() => {
                                                    res.status(500).json({ error: 'Failed to process purchase' });
                                                });
                                            }
                                            console.log(`Updated stock for product ${productId}: -${requestedQuantity}`);
                                            db.commit((err) => {
                                                if (err) {
                                                    console.error('Error committing transaction:', err);
                                                    return db.rollback(() => {
                                                        res.status(500).json({ error: 'Failed to process purchase' });
                                                    });
                                                }
                                                console.log(`Transaction ${transactionId} committed`);
                                                logUserAction(req.session.user.user_id, 'purchase', `Bought ${requestedQuantity} of product ID: ${productId}`);
                                                res.json({
                                                    success: true,
                                                    transaction: {
                                                        transaction_id: transactionId,
                                                        date: new Date().toISOString(),
                                                        product_name: product.product_name,
                                                        quantity: requestedQuantity,
                                                        price_per_unit: product.price,
                                                        total_price: product.price * requestedQuantity
                                                    },
                                                    total: product.price * requestedQuantity
                                                });
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                });
            }
        );
    } catch (error) {
        console.error('Error purchasing product:', error);
        res.status(500).json({ error: 'Failed to complete purchase' });
    }
});

app.get('/api/transactions', isAuthenticated, (req, res) => {
    try {
        let query;
        let queryParams = [];
        if (req.session.user.role === 'customer') {
            query = `
                SELECT t.transaction_id, t.transaction_date, t.total_amount,
                       ti.quantity, ti.price_per_unit,
                       p.product_id, p.product_name, p.image_url, p.category
                FROM Transactions t
                JOIN Transaction_Items ti ON t.transaction_id = ti.transaction_id
                JOIN Products p ON ti.product_id = p.product_id
                WHERE t.buyer_id = ?
                ORDER BY t.transaction_date DESC
            `;
            queryParams = [req.session.user.user_id];
        } else if (req.session.user.role === 'farmer') {
            query = `
                SELECT t.transaction_id, t.transaction_date, t.total_amount,
                       ti.quantity, ti.price_per_unit,
                       p.product_id, p.product_name, p.image_url, p.category
                FROM Transactions t
                JOIN Transaction_Items ti ON t.transaction_id = ti.transaction_id
                JOIN Products p ON ti.product_id = p.product_id
                WHERE p.farmer_id = ?
                ORDER BY t.transaction_date DESC
            `;
            queryParams = [req.session.user.user_id];
        } else {
            console.log(`Unauthorized role for transactions: ${req.session.user.role}`);
            return res.status(403).json({ error: 'Unauthorized role' });
        }
        console.log(`Fetching transactions for user ID: ${req.session.user.user_id}, role: ${req.session.user.role}`);
        db.query(query, queryParams, (err, results) => {
            if (err) {
                console.error('Error fetching transactions:', err);
                return res.status(500).json({ error: 'Failed to fetch transactions' });
            }
            const transactionMap = new Map();
            results.forEach(row => {
                if (!transactionMap.has(row.transaction_id)) {
                    transactionMap.set(row.transaction_id, {
                        transaction_id: row.transaction_id,
                        date: row.transaction_date,
                        total_amount: row.total_amount,
                        items: []
                    });
                }
                transactionMap.get(row.transaction_id).items.push({
                    product_id: row.product_id,
                    product_name: row.product_name,
                    quantity: row.quantity,
                    price_per_unit: row.price_per_unit,
                    image_url: row.image_url,
                    category: row.category
                });
            });
            const transactions = Array.from(transactionMap.values());
            console.log(`Fetched ${transactions.length} transactions`);
            res.json(transactions);
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        console.log('Contact form missing fields:', { name, email, message });
        return res.status(400).json({ error: 'All fields are required' });
    }
    db.query(
        'INSERT INTO Contact_Submissions (name, email, message) VALUES (?, ?, ?)',
        [name, email, message],
        (err) => {
            if (err) {
                console.error('Error storing contact submission:', err);
                return res.status(500).json({ error: 'Failed to submit message' });
            }
            console.log(`Contact submission stored: ${name}, ${email}`);
            if (req.session.user) {
                logUserAction(req.session.user.user_id, 'contact_submission', `Submitted contact form: ${name}, ${email}`);
            }
            res.json({ success: true, message: 'Thank you for your message!' });
        }
    );
});

app.post('/api/subscribe', (req, res) => {
    const { email } = req.body;
    if (!email) {
        console.log('Newsletter subscription missing email');
        return res.status(400).json({ error: 'Email is required' });
    }
    db.query(
        'INSERT INTO Newsletter_Subscriptions (email) VALUES (?)',
        [email],
        (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log(`Email already subscribed: ${email}`);
                    return res.status(409).json({ error: 'Email already subscribed' });
                }
                console.error('Error storing newsletter subscription:', err);
                return res.status(500).json({ error: 'Failed to subscribe' });
            }
            console.log(`Newsletter subscription added: ${email}`);
            if (req.session.user) {
                logUserAction(req.session.user.user_id, 'newsletter_subscription', `Subscribed to newsletter: ${email}`);
            }
            res.json({ success: true, message: 'Thank you for subscribing!' });
        }
    );
});

// Catch-all route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    console.log(`404: Endpoint not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Deployed website: ${process.env.NODE_ENV === 'production' ? 'https://farmers-market.onrender.com' : `http://localhost:${PORT}`}`);
});
