console.log('script.js loaded');

// Set API base URL (true for local, false for production)
const IS_LOCAL = false; // Change to false for Render deployment
const API_BASE_URL = IS_LOCAL ? 'http://localhost:3000' : 'https://farmers-market.onrender.com';

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
const loginNavBtn = document.querySelector('.auth-btn.login-nav-btn');
const registerNavBtn = document.querySelector('.auth-btn.register-nav-btn');
const authSection = document.getElementById('auth-section');
const loginContainer = document.querySelector('.form-container.login-container');
const registerContainer = document.querySelector('.form-container.register-container');
const registerLink = document.querySelector('.register-link');
const loginLink = document.querySelector('.login-link');
const loginForm = document.querySelector('.login-form');
const registerForm = document.querySelector('.register-form');
const logoutBtn = document.querySelector('.auth-btn.logout-btn');
const userInfo = document.querySelector('.user-info');
const usernameDisplay = document.querySelector('.username');
const userRoleDisplay = document.querySelector('.user-role');
const addProductSection = document.querySelector('.add-product-section');
const addProductForm = document.querySelector('.add-product-form');
const statusMessage = document.querySelector('.status-message');
const transactionList = document.querySelector('.transaction-list');
const contactForm = document.querySelector('.contact-form');
const newsletterForm = document.querySelector('.newsletter-form');

// Refresh button
const refreshProductsBtn = document.createElement('button');
refreshProductsBtn.className = 'btn btn-secondary refresh-products-btn';
refreshProductsBtn.textContent = 'Refresh Products';
refreshProductsBtn.style.marginLeft = '10px';

// State
let cart = [];
let currentFilter = 'all';
const INR_RATE = 83;
let productPollingInterval = null;

// Initialize
function init() {
    console.log('Initializing app');
    checkUserLogin();
    fetchProducts('all', '');
    setupEventListeners();
    updateCartDisplay();
}

// Set up event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');

    // Menu Toggle
    if (!menuToggle) {
        console.error('menuToggle not found (.menu-toggle)');
    } else {
        console.log('menuToggle found');
        menuToggle.addEventListener('click', () => {
            console.log('Menu toggle clicked');
            if (navLinks) navLinks.classList.toggle('active');
            else console.error('navLinks not found (.nav-links)');
        });
    }

    // Theme Toggle
    if (!themeToggle) {
        console.error('themeToggle not found (.theme-toggle)');
    } else {
        console.log('themeToggle found');
        themeToggle.addEventListener('click', () => {
            console.log('Theme toggle clicked');
            toggleTheme();
        });
    }

    // Login Button
    if (!loginNavBtn) {
        console.error('loginNavBtn not found (.auth-btn.login-nav-btn)');
    } else {
        console.log('loginNavBtn found');
        loginNavBtn.addEventListener('click', () => {
            console.log('Login button clicked');
            hideAllSections();
            if (authSection) authSection.style.display = 'block';
            if (loginContainer) loginContainer.style.display = 'block';
            if (registerContainer) registerContainer.style.display = 'none';
        });
    }

    // Register Button
    if (!registerNavBtn) {
        console.error('registerNavBtn not found (.auth-btn.register-nav-btn)');
    } else {
        console.log('registerNavBtn found');
        registerNavBtn.addEventListener('click', () => {
            console.log('Register button clicked');
            hideAllSections();
            if (authSection) authSection.style.display = 'block';
            if (loginContainer) loginContainer.style.display = 'none';
            if (registerContainer) registerContainer.style.display = 'block';
        });
    }

    // Cart Toggle
    if (!cartToggle) {
        console.error('cartToggle not found (.cart-toggle)');
    } else {
        console.log('cartToggle found');
        cartToggle.addEventListener('click', () => {
            console.log('Cart toggle clicked');
            hideAllSections();
            if (cartSection) cartSection.style.display = 'block';
            updateCartDisplay();
        });
    }

    // Transactions Toggle
    if (!transactionsToggle) {
        console.error('transactionsToggle not found (.transactions-toggle)');
    } else {
        console.log('transactionsToggle found');
        transactionsToggle.addEventListener('click', () => {
            console.log('Transactions toggle clicked');
            hideAllSections();
            if (transactionsSection) transactionsSection.style.display = 'block';
            fetchTransactions();
        });
    }

    // Filter Buttons
    if (!filterButtons.length) console.error('filterButtons not found (.filter-btn)');
    else {
        console.log('filterButtons found:', filterButtons.length);
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log(`Filter button clicked: ${button.getAttribute('data-filter')}`);
                currentFilter = button.getAttribute('data-filter');
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                fetchProducts(currentFilter, productSearch ? productSearch.value : '');
            });
        });
    }

    // Product Search
    if (!productSearch) console.error('productSearch not found (.product-search)');
    else {
        console.log('productSearch found');
        productSearch.addEventListener('input', () => {
            console.log('Product search input:', productSearch.value);
            fetchProducts(currentFilter, productSearch.value);
        });
    }

    // Continue Shopping
    if (!continueShoppingBtn) console.error('continueShoppingBtn not found (.continue-shopping)');
    else {
        console.log('continueShoppingBtn found');
        continueShoppingBtn.addEventListener('click', () => {
            console.log('Continue shopping clicked');
            hideAllSections();
            document.getElementById('products').scrollIntoView();
        });
    }

    // Checkout
    if (!checkoutBtn) console.error('checkoutBtn not found (.checkout-btn)');
    else {
        console.log('checkoutBtn found');
        checkoutBtn.addEventListener('click', () => {
            console.log('Checkout button clicked');
            processCheckout();
        });
    }

    // Register Link
    if (!registerLink) console.error('registerLink not found (.register-link)');
    else {
        console.log('registerLink found');
        registerLink.addEventListener('click', (e) => {
            console.log('Register link clicked');
            e.preventDefault();
            if (loginContainer) loginContainer.style.display = 'none';
            if (registerContainer) registerContainer.style.display = 'block';
        });
    }

    // Login Link
    if (!loginLink) console.error('loginLink not found (.login-link)');
    else {
        console.log('loginLink found');
        loginLink.addEventListener('click', (e) => {
            console.log('Login link clicked');
            e.preventDefault();
            if (loginContainer) loginContainer.style.display = 'block';
            if (registerContainer) registerContainer.style.display = 'none';
        });
    }

    // Login Form
    if (!loginForm) console.error('loginForm not found (.login-form)');
    else {
        console.log('loginForm found');
        loginForm.addEventListener('submit', (e) => {
            console.log('Login form submitted');
            handleLogin(e);
        });
    }

    // Register Form
    if (!registerForm) console.error('registerForm not found (.register-form)');
    else {
        console.log('registerForm found');
        registerForm.addEventListener('submit', (e) => {
            console.log('Register form submitted');
            handleRegister(e);
        });
    }

    // Logout Button
    if (!logoutBtn) console.error('logoutBtn not found (.auth-btn.logout-btn)');
    else {
        console.log('logoutBtn found');
        logoutBtn.addEventListener('click', () => {
            console.log('Logout button clicked');
            handleLogout();
        });
    }

    // Add Product Form
    if (!addProductForm) console.error('addProductForm not found (.add-product-form)');
    else {
        console.log('addProductForm found');
        addProductForm.addEventListener('submit', (e) => {
            console.log('Add product form submitted');
            handleAddProduct(e);
        });
    }

    // Contact Form
    if (!contactForm) console.error('contactForm not found (.contact-form)');
    else {
        console.log('contactForm found');
        contactForm.addEventListener('submit', (e) => {
            console.log('Contact form submitted');
            handleContactForm(e);
        });
    }

    // Newsletter Form
    if (!newsletterForm) console.error('newsletterForm not found (.newsletter-form)');
    else {
        console.log('newsletterForm found');
        newsletterForm.addEventListener('submit', (e) => {
            console.log('Newsletter form submitted');
            handleNewsletterSubscription(e);
        });
    }

    // Refresh Products
    if (!refreshProductsBtn) console.error('refreshProductsBtn not found');
    else {
        console.log('refreshProductsBtn found');
        refreshProductsBtn.addEventListener('click', () => {
            console.log('Refresh products clicked');
            fetchProducts(currentFilter, productSearch ? productSearch.value : '');
            showStatusMessage('Products refreshed');
        });
    }

    // Outside Click
    document.addEventListener('click', (e) => {
        if (
            !e.target.closest('.cart-section') &&
            !e.target.closest('.cart-toggle') &&
            !e.target.closest('.transactions-section') &&
            !e.target.closest('.transactions-toggle') &&
            !e.target.closest('.auth-section') &&
            !e.target.closest('.auth-btn.login-nav-btn') &&
            !e.target.closest('.auth-btn.register-nav-btn') &&
            !e.target.closest('.add-product-section') &&
            !e.target.closest('.nav-links')
        ) {
            console.log('Outside click detected, hiding sections');
            hideAllSections();
            if (navLinks) navLinks.classList.remove('active');
        }
    });

    // Nav Items
    document.querySelectorAll('.nav-item').forEach(item => {
        console.log('Nav item found:', item.textContent);
        item.addEventListener('click', function () {
            console.log('Nav item clicked:', this.textContent);
            document.querySelectorAll('.nav-item').forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Append Refresh Button
    const filterBar = document.querySelector('.filter-options');
    if (filterBar) {
        console.log('filterBar found, appending refresh button');
        filterBar.appendChild(refreshProductsBtn);
    } else {
        console.error('filterBar not found (.filter-options)');
    }
}

// Fetch products
function fetchProducts(category, search) {
    let url = `${API_BASE_URL}/api/products`;
    if (category !== 'all' || search) {
        url += '?';
        if (category !== 'all') url += `category=${category}`;
        if (search) url += `${category !== 'all' ? '&' : ''}search=${encodeURIComponent(search)}`;
    }
    console.log('Fetching products from:', url);
    return fetch(url, { credentials: 'include' })
        .then(response => {
            console.log('Products response status:', response.status);
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
            console.log('Fetched products:', data);
            renderProducts(data);
            return data;
        })
        .catch(error => {
            console.error('Error fetching products:', error.message);
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
    if (!productGrid) {
        console.error('productGrid not found (.product-grid)');
        return;
    }
    productGrid.innerHTML = '';
    if (products === null) {
        productGrid.innerHTML = '<p class="empty-products-message">Please log in to view products.</p>';
        filterButtons.forEach(btn => btn.disabled = true);
        if (productSearch) productSearch.disabled = true;
        if (refreshProductsBtn) refreshProductsBtn.disabled = true;
        return;
    }
    filterButtons.forEach(btn => btn.disabled = false);
    if (productSearch) productSearch.disabled = false;
    if (refreshProductsBtn) refreshProductsBtn.disabled = false;
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
        const addToCartBtn = productCard.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                console.log(`Add to cart clicked: ${product.product_id}`);
                addToCart(product.product_id);
            });
        } else {
            console.error('add-to-cart-btn not found in product card');
        }
        const viewDetailsBtn = productCard.querySelector('.view-details-btn');
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', () => {
                console.log(`View details clicked: ${product.product_id}`);
                showProductDetails(product.product_id);
            });
        } else {
            console.error('view-details-btn not found in product card');
        }
    });
}

// Add to cart
function addToCart(productId) {
    fetch(`${API_BASE_URL}/api/products/${productId}`, { credentials: 'include' })
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
                if (authSection) authSection.style.display = 'block';
                if (loginContainer) loginContainer.style.display = 'block';
                if (registerContainer) registerContainer.style.display = 'none';
            }
        });
}

// Update cart display
function updateCartDisplay() {
    if (!cartCount) console.error('cartCount not found (.cart-count)');
    else cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);

    if (!cartItems) {
        console.error('cartItems not found (.cart-items)');
        return;
    }
    cartItems.innerHTML = '';
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart-message">Your cart is empty. Start shopping now!</div>';
        if (cartSubtotal) cartSubtotal.textContent = '₹0.00';
        if (cartTotalAmount) cartTotalAmount.textContent = '₹0.00';
        return;
    }
    let subtotal = 0;
    const promises = cart.map(item =>
        fetch(`${API_BASE_URL}/api/products/${item.productId}`, { credentials: 'include' })
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
                const decreaseBtn = cartItemElement.querySelector('.decrease-btn');
                if (decreaseBtn) decreaseBtn.addEventListener('click', () => updateCartItemQuantity(item.productId, item.quantity - 1));
                const increaseBtn = cartItemElement.querySelector('.increase-btn');
                if (increaseBtn) increaseBtn.addEventListener('click', () => updateCartItemQuantity(item.productId, item.quantity + 1));
                const quantityInput = cartItemElement.querySelector('.quantity-input');
                if (quantityInput) quantityInput.addEventListener('change', (e) => updateCartItemQuantity(item.productId, parseInt(e.target.value)));
                const removeBtn = cartItemElement.querySelector('.cart-item-remove');
                if (removeBtn) removeBtn.addEventListener('click', () => removeCartItem(item.productId));
            });
            const total = subtotal + 5;
            if (cartSubtotal) cartSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
            if (cartTotalAmount) cartTotalAmount.textContent = `₹${total.toFixed(2)}`;
        })
        .catch(error => {
            console.error('Error updating cart:', error);
            showStatusMessage('Failed to update cart. Please try again.', true);
        });
}

// Update cart item quantity
function updateCartItemQuantity(productId, newQuantity) {
    fetch(`${API_BASE_URL}/api/products/${productId}`, { credentials: 'include' })
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
                if (authSection) authSection.style.display = 'block';
                if (loginContainer) loginContainer.style.display = 'block';
                if (registerContainer) registerContainer.style.display = 'none';
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
            fetch(`${API_BASE_URL}/api/products/${item.productId}`, { credentials: 'include' })
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
                    return fetch(`${API_BASE_URL}/api/buy_product`, {
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
            if (transactionsSection) transactionsSection.style.display = 'block';
            fetchTransactions();
            fetchProducts(currentFilter, productSearch ? productSearch.value : '');
        })
        .catch(error => {
            console.error('Checkout error:', error);
            showStatusMessage(error.message || 'Failed to process purchase. Please try again.', true);
            if (error.message.includes('Please login')) {
                hideAllSections();
                if (authSection) authSection.style.display = 'block';
                if (loginContainer) loginContainer.style.display = 'block';
                if (registerContainer) registerContainer.style.display = 'none';
            }
        });
}

// Fetch transactions
function fetchTransactions() {
    fetch(`${API_BASE_URL}/api/transactions`, { credentials: 'include' })
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
                if (authSection) authSection.style.display = 'block';
                if (loginContainer) loginContainer.style.display = 'block';
                if (registerContainer) registerContainer.style.display = 'none';
            }
        });
}

// Render transactions
function renderTransactions(transactions) {
    if (!transactionList) {
        console.error('transactionList not found (.transaction-list)');
        return;
    }
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
    fetch(`${API_BASE_URL}/api/products/${productId}`, { credentials: 'include' })
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
            const modalClose = modalOverlay.querySelector('.modal-close');
            if (modalClose) modalClose.addEventListener('click', closeModal);
            const addToCartModalBtn = modalOverlay.querySelector('.add-to-cart-modal-btn');
            if (addToCartModalBtn) addToCartModalBtn.addEventListener('click', () => {
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
                if (authSection) authSection.style.display = 'block';
                if (loginContainer) loginContainer.style.display = 'block';
                if (registerContainer) registerContainer.style.display = 'none';
            }
        });
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
    })
        .then(response => {
            console.log('Login response status:', response.status);
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err.error));
            }
            return response.json();
        })
        .then(data => {
            console.log('Login data:', data);
            updateUserInterface(data.user);
            if (loginForm) loginForm.reset();
            hideAllSections();
            showStatusMessage(`Welcome back, ${data.user.username}!`);
            fetchProducts(currentFilter, productSearch ? productSearch.value : '');
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
    fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password, role })
    })
        .then(response => {
            console.log('Register response status:', response.status);
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err.error));
            }
            return response.json();
        })
        .then(data => {
            console.log('Register data:', data);
            updateUserInterface(data.user);
            if (registerForm) registerForm.reset();
            hideAllSections();
            showStatusMessage('Registration successful!');
            fetchProducts(currentFilter, productSearch ? productSearch.value : '');
            startProductPolling();
        })
        .catch(error => {
            console.error('Register error:', error);
            showStatusMessage(error || 'Registration failed. Please try again.', true);
        });
}

// Handle logout
function handleLogout() {
    fetch(`${API_BASE_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include'
    })
        .then(response => {
            console.log('Logout response status:', response.status);
            if (!response.ok) throw new Error('Logout failed');
            return response.json();
        })
        .then(() => {
            updateUserInterface(null);
            cart = [];
            updateCartDisplay();
            hideAllSections();
            showStatusMessage('You have been logged out');
            fetchProducts(currentFilter, productSearch ? productSearch.value : '');
            stopProductPolling();
        })
        .catch(error => {
            console.error('Logout error:', error);
            showStatusMessage('Logout failed. Please try again.', true);
        });
}

// Update UI based on user state
function updateUserInterface(user) {
    console.log('Updating UI for user:', user);
    if (user) {
        if (loginNavBtn) loginNavBtn.style.display = 'none';
        if (registerNavBtn) registerNavBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (userInfo) userInfo.style.display = 'inline-block';
        if (usernameDisplay) usernameDisplay.textContent = user.username;
        if (userRoleDisplay) userRoleDisplay.textContent = `(${user.role})`;
        if (addProductSection) addProductSection.style.display = user.role === 'farmer' ? 'block' : 'none';
    } else {
        if (loginNavBtn) loginNavBtn.style.display = 'inline-block';
        if (registerNavBtn) registerNavBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        if (addProductSection) addProductSection.style.display = 'none';
    }
}

// Check if user is logged in
function checkUserLogin() {
    fetch(`${API_BASE_URL}/api/user`, { credentials: 'include' })
        .then(response => {
            console.log('Check user response status:', response.status);
            if (!response.ok) throw new Error('Not logged in');
            return response.json();
        })
        .then(data => {
            console.log('Check user data:', data);
            if (data.loggedIn) {
                updateUserInterface(data.user);
                fetchProducts(currentFilter, productSearch ? productSearch.value : '');
                startProductPolling();
            } else {
                updateUserInterface(null);
                fetchProducts(currentFilter, productSearch ? productSearch.value : '');
                stopProductPolling();
            }
        })
        .catch(error => {
            console.error('Error checking user:', error);
            updateUserInterface(null);
            fetchProducts(currentFilter, productSearch ? productSearch.value : '');
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
    fetch(`${API_BASE_URL}/api/add_product`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    })
        .then(response => {
            console.log('Add product response status:', response.status);
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err.error));
            }
            return response.json();
        })
        .then(data => {
            console.log('Add product data:', data);
            if (addProductForm) addProductForm.reset();
            showStatusMessage('Product added successfully!');
            fetchProducts(currentFilter, productSearch ? productSearch.value : '');
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
    fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    })
        .then(response => {
            console.log('Contact form response status:', response.status);
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err.error));
            }
            return response.json();
        })
        .then(() => {
            if (contactForm) contactForm.reset();
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
    fetch(`${API_BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
    })
        .then(response => {
            console.log('Newsletter response status:', response.status);
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err.error));
            }
            return response.json();
        })
        .then(() => {
            if (newsletterForm) newsletterForm.reset();
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

// Load theme
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
        fetchProducts(currentFilter, productSearch ? productSearch.value : '').catch(() => {
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

// Capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Hide all sections
function hideAllSections() {
    if (cartSection) cartSection.style.display = 'none';
    if (transactionsSection) transactionsSection.style.display = 'none';
    if (authSection) authSection.style.display = 'none';
    if (addProductSection) {
        addProductSection.style.display = userInfo && userInfo.style.display === 'inline-block' && userRoleDisplay && userRoleDisplay.textContent.includes('farmer') ? 'block' : 'none';
    }
}

// Show status message
function showStatusMessage(message, isError = false) {
    if (!statusMessage) {
        console.error('statusMessage not found (.status-message)');
        return;
    }
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${isError ? 'error' : ''}`;
    statusMessage.style.display = 'block';
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');
    loadTheme();
    init();
});