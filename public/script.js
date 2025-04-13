// DOM Elements
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const themeToggle = document.querySelector('.theme-toggle');
const productGrid = document.querySelector('.product-grid');
const filterButtons = document.querySelectorAll('.filter-btn');
const productSearch = document.querySelector('.product-search');
const cartToggle = document.querySelector('.cart-toggle');
const cartSection = document.querySelector('.cart-section');
const transactionsToggle = document.querySelector('.transactions-toggle');
const transactionsSection = document.querySelector('.transactions-section');
const cartItems = document.querySelector('.cart-items');
const cartSubtotal = document.querySelector('.cart-subtotal');
const cartTotalAmount = document.querySelector('.cart-total-amount');
const cartCount = document.querySelector('.cart-count');
const continueShoppingBtn = document.querySelector('.continue-shopping');
const checkoutBtn = document.querySelector('.checkout-btn');
const loginNavBtn = document.querySelector('.login-nav-btn');
const registerNavBtn = document.querySelector('.register-nav-btn');
const authSection = document.getElementById('auth-section');
const loginContainer = document.querySelector('.login-container');
const registerContainer = document.querySelector('.register-container');
const registerLink = document.querySelector('.register-link');
const loginLink = document.querySelector('.login-link');
const loginForm = document.querySelector('.login-form');
const registerForm = document.querySelector('.register-form');
const logoutBtn = document.querySelector('.logout-btn');
const userInfo = document.querySelector('.user-info');
const usernameDisplay = document.querySelector('.username');
const userRoleDisplay = document.querySelector('.user-role');
const addProductSection = document.querySelector('.add-product-section');
const addProductForm = document.querySelector('.add-product-form');
const statusMessage = document.querySelector('.status-message');
const transactionList = document.querySelector('.transaction-list');
const contactForm = document.querySelector('.contact-form');
const newsletterForm = document.querySelector('.newsletter-form');

// New: Refresh button
const refreshProductsBtn = document.createElement('button');
refreshProductsBtn.className = 'btn btn-secondary refresh-products-btn';
refreshProductsBtn.textContent = 'Refresh Products';
refreshProductsBtn.style.marginLeft = '10px';

// State
let cart = [];
let currentFilter = 'all';
const INR_RATE = 83; // USD to INR conversion rate
let productPollingInterval = null;

// Initialize
function init() {
    checkUserLogin();
    fetchProducts('all', '');
    setupEventListeners();
    updateCartDisplay();
}

// Set up event listeners
function setupEventListeners() {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    themeToggle.addEventListener('click', toggleTheme);

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentFilter = button.getAttribute('data-filter');
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            fetchProducts(currentFilter, productSearch.value);
        });
    });

    productSearch.addEventListener('input', () => {
        fetchProducts(currentFilter, productSearch.value);
    });

    cartToggle.addEventListener('click', () => {
        hideAllSections();
        cartSection.style.display = 'block';
        updateCartDisplay();
    });

    transactionsToggle.addEventListener('click', () => {
        hideAllSections();
        transactionsSection.style.display = 'block';
        fetchTransactions();
    });

    continueShoppingBtn.addEventListener('click', () => {
        hideAllSections();
        document.getElementById('products').scrollIntoView();
    });

    checkoutBtn.addEventListener('click', processCheckout);

    loginNavBtn.addEventListener('click', () => {
        hideAllSections();
        authSection.style.display = 'block';
        loginContainer.style.display = 'block';
        registerContainer.style.display = 'none';
    });

    registerNavBtn.addEventListener('click', () => {
        hideAllSections();
        authSection.style.display = 'block';
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
    });

    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
    });

    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.style.display = 'block';
        registerContainer.style.display = 'none';
    });

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
    addProductForm.addEventListener('submit', handleAddProduct);
    contactForm.addEventListener('submit', handleContactForm);
    newsletterForm.addEventListener('submit', handleNewsletterSubscription);

    refreshProductsBtn.addEventListener('click', () => {
        fetchProducts(currentFilter, productSearch.value);
        showStatusMessage('Products refreshed');
    });

    document.addEventListener('click', (e) => {
        if (
            !e.target.closest('.cart-section') &&
            !e.target.closest('.cart-toggle') &&
            !e.target.closest('.transactions-section') &&
            !e.target.closest('.transactions-toggle') &&
            !e.target.closest('.auth-section') &&
            !e.target.closest('.login-nav-btn') &&
            !e.target.closest('.register-nav-btn') &&
            !e.target.closest('.add-product-section') &&
            !e.target.closest('.nav-links')
        ) {
            hideAllSections();
            navLinks.classList.remove('active');
        }
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.nav-item').forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const filterBar = document.querySelector('.filter-bar');
    if (filterBar) filterBar.appendChild(refreshProductsBtn);
}

// Fetch products from backend
function fetchProducts(category, search) {
    let url = 'http://localhost:3000/api/products';
    if (category !== 'all' || search) {
        url += '?';
        if (category !== 'all') url += `category=${category}`;
        if (search) url += `${category !== 'all' ? '&' : ''}search=${encodeURIComponent(search)}`;
    }
    console.log('Fetching products from:', url); // Debug
    return fetch(url, { credentials: 'include' })
        .then(response => {
            console.log('Products response status:', response.status); // Debug
            if (response.status === 401) {
                throw new Error('Please login to view products');
            }
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Failed to fetch products');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched products:', data); // Debug
            renderProducts(data);
            return data;
        })
        .catch(error => {
            console.error('Error fetching products:', error.message); // Debug
            if (error.message.includes('Please login')) {
                renderProducts(null);
            } else {
                showStatusMessage('Unable to load products. Please try again later.', true);
                renderProducts([]);
            }
            throw error;
        });
}

// Render products
function renderProducts(products) {
    productGrid.innerHTML = '';
    if (products === null) {
        productGrid.innerHTML = '<p class="empty-products-message">Please log in to view products.</p>';
        filterButtons.forEach(btn => btn.disabled = true);
        productSearch.disabled = true;
        refreshProductsBtn.disabled = true;
        return;
    }
    filterButtons.forEach(btn => btn.disabled = false);
    productSearch.disabled = false;
    refreshProductsBtn.disabled = false;
    if (!products || products.length === 0) {
        productGrid.innerHTML = '<p class="empty-products-message">No products found matching your criteria.</p>';
        return;
    }
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        const priceINR = (product.price * INR_RATE).toFixed(2);
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image_url || 'https://via.placeholder.com/500'}" alt="${product.product_name}">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.product_name}</h3>
                <p class="product-price">₹${priceINR}</p>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <span>Category: ${capitalizeFirstLetter(product.category)}</span>
                    <span>Stock: ${product.stock_quantity}</span>
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart-btn" data-id="${product.product_id}">Add to Cart</button>
                    <button class="btn btn-secondary view-details-btn" data-id="${product.product_id}">Details</button>
                </div>
            </div>
        `;
        productGrid.appendChild(productCard);
        productCard.querySelector('.add-to-cart-btn').addEventListener('click', () => addToCart(product.product_id));
        productCard.querySelector('.view-details-btn').addEventListener('click', () => showProductDetails(product.product_id));
    });
}

// Add to cart
function addToCart(productId) {
    fetch(`http://localhost:3000/api/products/${productId}`, { credentials: 'include' })
        .then(response => {
            if (!response.ok) throw new Error('Product not found');
            return response.json();
        })
        .then(product => {
            if (product.stock_quantity <= 0) {
                showStatusMessage('This product is out of stock', true);
                return;
            }
            const existingItem = cart.find(item => item.productId === productId);
            if (existingItem) {
                if (existingItem.quantity >= product.stock_quantity) {
                    showStatusMessage(`Only ${product.stock_quantity} available`, true);
                    return;
                }
                existingItem.quantity += 1;
            } else {
                cart.push({ productId, quantity: 1 });
            }
            updateCartDisplay();
            showStatusMessage('Added to cart');
        })
        .catch(error => {
            console.error('Error adding to cart:', error);
            showStatusMessage('Failed to add to cart. Please try again.', true);
            if (error.message.includes('Please login')) {
                hideAllSections();
                authSection.style.display = 'block';
                loginContainer.style.display = 'block';
                registerContainer.style.display = 'none';
            }
        });
}

// Update cart display
function updateCartDisplay() {
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    cartItems.innerHTML = '';
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart-message">Your cart is empty. Start shopping now!</div>';
        cartSubtotal.textContent = '₹0.00';
        cartTotalAmount.textContent = '₹5.00';
        return;
    }
    let subtotal = 0;
    const promises = cart.map(item =>
        fetch(`http://localhost:3000/api/products/${item.productId}`, { credentials: 'include' })
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch product');
                return response.json();
            })
            .then(product => {
                if (product.stock_quantity < item.quantity) {
                    item.quantity = product.stock_quantity;
                    if (item.quantity === 0) return null;
                    showStatusMessage(`Adjusted quantity for ${product.product_name} to ${item.quantity} due to stock`, true);
                }
                const priceINR = product.price * INR_RATE;
                subtotal += priceINR * item.quantity;
                return { item, product, priceINR };
            })
            .catch(error => {
                console.error(`Error fetching product ${item.productId}:`, error);
                return null;
            })
    );
    Promise.all(promises)
        .then(results => {
            cart = cart.filter((_, i) => results[i] !== null);
            results.filter(r => r !== null).forEach(({ item, product, priceINR }) => {
                const cartItemElement = document.createElement('div');
                cartItemElement.className = 'cart-item';
                cartItemElement.innerHTML = `
                    <div class="cart-item-image">
                        <img src="${product.image_url || 'https://via.placeholder.com/500'}" alt="${product.product_name}">
                    </div>
                    <div class="cart-item-info">
                        <h3 class="cart-item-title">${product.product_name}</h3>
                        <p class="cart-item-price">₹${priceINR.toFixed(2)} × ${item.quantity}</p>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn decrease-btn" data-id="${item.productId}">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${product.stock_quantity}" data-id="${item.productId}">
                            <button class="quantity-btn increase-btn" data-id="${item.productId}">+</button>
                            <button class="cart-item-remove" data-id="${item.productId}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                cartItems.appendChild(cartItemElement);
                cartItemElement.querySelector('.decrease-btn').addEventListener('click', () => updateCartItemQuantity(item.productId, item.quantity - 1));
                cartItemElement.querySelector('.increase-btn').addEventListener('click', () => updateCartItemQuantity(item.productId, item.quantity + 1));
                cartItemElement.querySelector('.quantity-input').addEventListener('change', (e) => updateCartItemQuantity(item.productId, parseInt(e.target.value)));
                cartItemElement.querySelector('.cart-item-remove').addEventListener('click', () => removeCartItem(item.productId));
            });
            const total = subtotal + 5;
            cartSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
            cartTotalAmount.textContent = `₹${total.toFixed(2)}`;
        })
        .catch(error => {
            console.error('Error updating cart:', error);
            showStatusMessage('Failed to update cart. Please try again.', true);
        });
}

// Update cart item quantity
function updateCartItemQuantity(productId, newQuantity) {
    fetch(`http://localhost:3000/api/products/${productId}`, { credentials: 'include' })
        .then(response => {
            if (!response.ok) throw new Error('Product not found');
            return response.json();
        })
        .then(product => {
            if (newQuantity <= 0) {
                removeCartItem(productId);
                return;
            }
            if (newQuantity > product.stock_quantity) {
                showStatusMessage(`Only ${product.stock_quantity} available`, true);
                return;
            }
            const cartItem = cart.find(item => item.productId === productId);
            if (cartItem) {
                cartItem.quantity = newQuantity;
                updateCartDisplay();
            }
        })
        .catch(error => {
            console.error('Error checking stock:', error);
            showStatusMessage('Failed to update quantity. Please try again.', true);
            if (error.message.includes('Please login')) {
                hideAllSections();
                authSection.style.display = 'block';
                loginContainer.style.display = 'block';
                registerContainer.style.display = 'none';
            }
        });
}

// Remove cart item
function removeCartItem(productId) {
    cart = cart.filter(item => item.productId !== productId);
    updateCartDisplay();
    showStatusMessage('Item removed from cart');
}

// Process checkout
function processCheckout() {
    if (cart.length === 0) {
        showStatusMessage('Your cart is empty', true);
        return;
    }
    Promise.all(
        cart.map(item =>
            fetch(`http://localhost:3000/api/products/${item.productId}`, { credentials: 'include' })
                .then(response => {
                    if (!response.ok) throw new Error('Product not found');
                    return response.json();
                })
                .then(product => {
                    if (product.stock_quantity < item.quantity) {
                        throw new Error(`Insufficient stock for ${product.product_name}. Only ${product.stock_quantity} available.`);
                    }
                    return item;
                })
        )
    )
        .then(validItems => {
            return Promise.all(
                validItems.map(item => {
                    console.log(`Sending buy_product for product ${item.productId}, quantity ${item.quantity}`);
                    return fetch('http://localhost:3000/api/buy_product', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ product_id: item.productId, quantity: item.quantity })
                    }).then(response => {
                        console.log(`Response for product ${item.productId}:`, response.status);
                        if (!response.ok) {
                            return response.json().then(err => {
                                console.error(`Error for product ${item.productId}:`, err);
                                return Promise.reject(err.error);
                            });
                        }
                        return response.json();
                    });
                })
            );
        })
        .then(results => {
            console.log('Checkout successful:', results);
            cart = [];
            updateCartDisplay();
            showStatusMessage('Order placed successfully!');
            hideAllSections();
            transactionsSection.style.display = 'block';
            fetchTransactions();
            fetchProducts(currentFilter, productSearch.value);
        })
        .catch(error => {
            console.error('Checkout error:', error);
            showStatusMessage(error.message || 'Failed to process purchase. Please try again.', true);
            if (error.message.includes('Please login')) {
                hideAllSections();
                authSection.style.display = 'block';
                loginContainer.style.display = 'block';
                registerContainer.style.display = 'none';
            }
        });
}

// Fetch transactions
function fetchTransactions() {
    fetch('http://localhost:3000/api/transactions', { credentials: 'include' })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch transactions');
            return response.json();
        })
        .then(data => {
            renderTransactions(data);
        })
        .catch(error => {
            console.error('Error fetching transactions:', error);
            showStatusMessage('Failed to load transactions. Please try again.', true);
            if (error.message.includes('Please login')) {
                hideAllSections();
                authSection.style.display = 'block';
                loginContainer.style.display = 'block';
                registerContainer.style.display = 'none';
            }
        });
}

// Render transactions
function renderTransactions(transactions) {
    transactionList.innerHTML = '';
    if (transactions.length === 0) {
        transactionList.innerHTML = '<div class="empty-transactions-message">You haven\'t made any purchases yet.</div>';
        return;
    }
    transactions.forEach(transaction => {
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction-item';
        const formattedDate = new Date(transaction.date).toLocaleDateString();
        transactionElement.innerHTML = `
            <div class="transaction-header">
                <div>Order #${transaction.transaction_id}</div>
                <div>${formattedDate}</div>
            </div>
            <div class="transaction-body">
                <h3>Items</h3>
                <div class="transaction-products"></div>
                <div class="transaction-footer">
                    <div class="transaction-totals">
                        <div>Subtotal: ₹${(transaction.total_amount * INR_RATE).toFixed(2)}</div>
                        <div>Shipping: ₹5.00</div>
                        <div><strong>Total: ₹${((transaction.total_amount * INR_RATE) + 5).toFixed(2)}</strong></div>
                    </div>
                </div>
            </div>
        `;
        const transactionProducts = transactionElement.querySelector('.transaction-products');
        transaction.items.forEach(item => {
            const productElement = document.createElement('div');
            productElement.className = 'transaction-product';
            productElement.innerHTML = `
                <div class="transaction-product-image">
                    <img src="${item.image_url || 'https://via.placeholder.com/500'}" alt="${item.product_name}">
                </div>
                <div class="transaction-product-info">
                    <h4>${item.product_name}</h4>
                    <p>₹${(item.price_per_unit * INR_RATE).toFixed(2)} × ${item.quantity}</p>
                </div>
            `;
            transactionProducts.appendChild(productElement);
        });
        transactionList.appendChild(transactionElement);
    });
}

// Show product details
function showProductDetails(productId) {
    fetch(`http://localhost:3000/api/products/${productId}`, { credentials: 'include' })
        .then(response => {
            if (!response.ok) throw new Error('Product not found');
            return response.json();
        })
        .then(product => {
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'modal-overlay';
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content product-detail-modal';
            const priceINR = (product.price * INR_RATE).toFixed(2);
            modalContent.innerHTML = `
                <button class="modal-close"><i class="fas fa-times"></i></button>
                <div class="product-detail-container">
                    <div class="product-detail-image">
                        <img src="${product.image_url || 'https://via.placeholder.com/500'}" alt="${product.product_name}">
                    </div>
                    <div class="product-detail-info">
                        <h2>${product.product_name}</h2>
                        <p class="product-detail-price">₹${priceINR}</p>
                        <div class="product-detail-meta">
                            <span class="product-detail-category">Category: ${capitalizeFirstLetter(product.category)}</span>
                            <span class="product-detail-stock">Stock: ${product.stock_quantity} available</span>
                        </div>
                        <p class="product-detail-description">${product.description}</p>
                        <div class="product-detail-actions">
                            <button class="btn btn-primary add-to-cart-modal-btn" data-id="${product.product_id}">Add to Cart</button>
                        </div>
                    </div>
                </div>
            `;
            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);
            document.body.style.overflow = 'hidden';
            modalOverlay.querySelector('.modal-close').addEventListener('click', closeModal);
            modalOverlay.querySelector('.add-to-cart-modal-btn').addEventListener('click', () => {
                addToCart(product.product_id);
                closeModal();
            });
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) closeModal();
            });
            function closeModal() {
                document.body.removeChild(modalOverlay);
                document.body.style.overflow = '';
            }
        })
        .catch(error => {
            console.error('Error fetching product:', error);
            showStatusMessage('Failed to load product details. Please try again.', true);
            if (error.message.includes('Please login')) {
                hideAllSections();
                authSection.style.display = 'block';
                loginContainer.style.display = 'block';
                registerContainer.style.display = 'none';
            }
        });
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
    })
        .then(response => {
            console.log('Login response status:', response.status); // Debug
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err.error));
            }
            return response.json();
        })
        .then(data => {
            console.log('Login data:', data); // Debug
            updateUserInterface(data.user);
            loginForm.reset();
            hideAllSections();
            showStatusMessage(`Welcome back, ${data.user.username}!`);
            fetchProducts(currentFilter, productSearch.value);
            startProductPolling();
        })
        .catch(error => {
            console.error('Login error:', error);
            showStatusMessage(error || 'Login failed. Please check your credentials.', true);
        });
}

// Handle register
function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password, role })
    })
        .then(response => {
            console.log('Register response status:', response.status); // Debug
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err.error));
            }
            return response.json();
        })
        .then(data => {
            console.log('Register data:', data); // Debug
            updateUserInterface(data.user);
            registerForm.reset();
            hideAllSections();
            showStatusMessage('Registration successful!');
            fetchProducts(currentFilter, productSearch.value);
            startProductPolling();
        })
        .catch(error => {
            console.error('Register error:', error);
            showStatusMessage(error || 'Registration failed. Please try again.', true);
        });
}

// Handle logout
function handleLogout() {
    fetch('http://localhost:3000/api/logout', {
        method: 'POST',
        credentials: 'include'
    })
        .then(response => {
            console.log('Logout response status:', response.status); // Debug
            if (!response.ok) throw new Error('Logout failed');
            return response.json();
        })
        .then(() => {
            updateUserInterface(null);
            cart = [];
            updateCartDisplay();
            hideAllSections();
            showStatusMessage('You have been logged out');
            fetchProducts(currentFilter, productSearch.value);
            stopProductPolling();
        })
        .catch(error => {
            console.error('Logout error:', error);
            showStatusMessage('Logout failed. Please try again.', true);
        });
}

// Update UI based on user state
function updateUserInterface(user) {
    console.log('Updating UI for user:', user); // Debug
    if (user) {
        loginNavBtn.style.display = 'none';
        registerNavBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        userInfo.style.display = 'inline-block';
        usernameDisplay.textContent = user.username;
        userRoleDisplay.textContent = `(${user.role})`;
        addProductSection.style.display = user.role === 'farmer' ? 'block' : 'none';
    } else {
        loginNavBtn.style.display = 'inline-block';
        registerNavBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        userInfo.style.display = 'none';
        addProductSection.style.display = 'none';
    }
}

// Check if user is logged in
function checkUserLogin() {
    fetch('http://localhost:3000/api/user', { credentials: 'include' })
        .then(response => {
            console.log('Check user response status:', response.status); // Debug
            if (!response.ok) throw new Error('Not logged in');
            return response.json();
        })
        .then(data => {
            console.log('Check user data:', data); // Debug
            if (data.loggedIn) {
                updateUserInterface(data.user);
                fetchProducts(currentFilter, productSearch.value);
                startProductPolling();
            } else {
                updateUserInterface(null);
                fetchProducts(currentFilter, productSearch.value);
                stopProductPolling();
            }
        })
        .catch(error => {
            console.error('Error checking user:', error);
            updateUserInterface(null);
            fetchProducts(currentFilter, productSearch.value);
            stopProductPolling();
        });
}

// Handle add product
function handleAddProduct(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('product_name', document.getElementById('product-name').value);
    formData.append('category', document.getElementById('product-category').value);
    formData.append('description', document.getElementById('product-description').value);
    const priceINR = parseFloat(document.getElementById('product-price').value);
    formData.append('price', (priceINR / INR_RATE).toFixed(2));
    formData.append('stock_quantity', document.getElementById('product-stock').value);
    const imageFile = document.getElementById('product-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    const imageUrl = document.getElementById('product-image-url').value;
    if (imageUrl) {
        formData.append('image_url', imageUrl);
    }
    fetch('http://localhost:3000/api/add_product', {
        method: 'POST',
        credentials: 'include',
        body: formData
    })
        .then(response => {
            console.log('Add product response status:', response.status); // Debug
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err.error));
            }
            return response.json();
        })
        .then(data => {
            console.log('Add product data:', data); // Debug
            addProductForm.reset();
            showStatusMessage('Product added successfully!');
            fetchProducts(currentFilter, productSearch.value);
        })
        .catch(error => {
            console.error('Error adding product:', error);
            showStatusMessage(error || 'Failed to add product. Please try again.', true);
        });
}

// Handle contact form submission
function handleContactForm(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email').value,
        message: document.getElementById('contact-message').value
    };
    fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    })
        .then(response => {
            console.log('Contact form response status:', response.status); // Debug
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err.error));
            }
            return response.json();
        })
        .then(() => {
            contactForm.reset();
            showStatusMessage('Thank you for your message!');
        })
        .catch(error => {
            console.error('Contact form error:', error);
            showStatusMessage(error || 'Failed to send message. Please try again.', true);
        });
}

// Handle newsletter subscription
function handleNewsletterSubscription(e) {
    e.preventDefault();
    const email = newsletterForm.querySelector('input[type="email"]').value;
    fetch('http://localhost:3000/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
    })
        .then(response => {
            console.log('Newsletter response status:', response.status); // Debug
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err.error));
            }
            return response.json();
        })
        .then(() => {
            newsletterForm.reset();
            showStatusMessage('Thank you for subscribing!');
        })
        .catch(error => {
            console.error('Newsletter error:', error);
            showStatusMessage(error || 'Failed to subscribe. Please try again.', true);
        });
}

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    const icon = themeToggle.querySelector('i');
    if (icon) icon.className = document.body.classList.contains('dark-mode') ? 'fas fa-sun' : 'fas fa-moon';
}

// Load theme on page load
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = themeToggle.querySelector('i');
        if (icon) icon.className = 'fas fa-sun';
    }
}

// Start product polling
function startProductPolling() {
    stopProductPolling();
    productPollingInterval = setInterval(() => {
        fetchProducts(currentFilter, productSearch.value).catch(() => {
            // Silent catch
        });
    }, 30000);
}

// Stop product polling
function stopProductPolling() {
    if (productPollingInterval) {
        clearInterval(productPollingInterval);
        productPollingInterval = null;
    }
}

// Utility: Capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Utility: Hide all sections
function hideAllSections() {
    cartSection.style.display = 'none';
    transactionsSection.style.display = 'none';
    authSection.style.display = 'none';
    addProductSection.style.display = document.querySelector('.user-info').style.display === 'inline-block' && document.querySelector('.user-role').textContent.includes('farmer') ? 'block' : 'none';
}

// Utility: Show status message
function showStatusMessage(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
    statusMessage.style.display = 'block';
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    init();
});