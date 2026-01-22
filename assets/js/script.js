
// DOM Elements
const body = document.querySelector('body');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

// Cart State
let cart = JSON.parse(localStorage.getItem('lumina_cart')) || [];
const RAZORPAY_KEY_ID = "rzp_test_1DP5mmOlF5G5ag";

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    updateCartIcon();
    renderCart(); // Pre-render cart if desired, or wait for open
});

// --- UI Functions ---

function initUI() {
    // 1. Inject Cart Sidebar HTML
    const cartHTML = `
        <div class="cart-overlay" onclick="toggleCart()"></div>
        <div class="cart-sidebar">
            <div class="cart-header">
                <h3>Your Bag</h3>
                <span class="close-cart" onclick="toggleCart()"><i class="fas fa-times"></i></span>
            </div>
            <div class="cart-body" id="cart-items">
                <!-- Items injected here -->
            </div>
            <div class="cart-footer">
                <div class="cart-subtotal">
                    <span>Subtotal</span>
                    <span id="cart-total">₹0</span>
                </div>
                <button class="btn-primary width-100" onclick="checkout()">Proceed to Checkout</button>
            </div>
        </div>
    `;
    body.insertAdjacentHTML('beforeend', cartHTML);

    // 2. Mobile Menu Listeners
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // 3. Header Scroll Effect
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (window.scrollY > 20) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.05)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
        }
    });
}

// --- Cart Navigation ---

function toggleCart() {
    const overlay = document.querySelector('.cart-overlay');
    const sidebar = document.querySelector('.cart-sidebar');

    overlay.classList.toggle('active');
    sidebar.classList.toggle('active');
}

// --- Cart Logic ---

function addToCart(id, name, price, image) {
    // Check if item exists
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }

    saveCart();
    updateCartIcon();
    renderCart();
    // Open cart to show user
    const sidebar = document.querySelector('.cart-sidebar');
    if (!sidebar.classList.contains('active')) {
        toggleCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartIcon();
    renderCart();
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            renderCart();
            updateCartIcon();
        }
    }
}

function saveCart() {
    localStorage.setItem('lumina_cart', JSON.stringify(cart));
}

function updateCartIcon() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');

    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="cart-empty-message">Your cart is empty.<br>Start shopping!</div>';
        cartTotalEl.textContent = '₹0';
        return;
    }

    let subtotal = 0;
    cartContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <div class="cart-item-price">₹${item.price.toLocaleString()}</div>
                    <div class="cart-item-controls">
                        <div class="qty-control">
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                        </div>
                        <span class="remove-item" onclick="removeFromCart('${item.id}')">Remove</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    cartTotalEl.textContent = '₹' + subtotal.toLocaleString();
}

// --- Checkout ---

function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Trigger Razorpay
    openPayment("Lumina Cart Total", subtotal);
}

function openPayment(description, amount) {
    const options = {
        "key": RAZORPAY_KEY_ID,
        "amount": amount * 100, // paise
        "currency": "INR",
        "name": "Lumina Jewelry",
        "description": description,
        "image": "assets/images/earring-gold.png",
        "handler": function (response) {
            // Success
            cart = []; // Clear cart on success
            saveCart();
            renderCart();
            updateCartIcon();
            toggleCart(); // Close cart
            showStatusModal('success', response.razorpay_payment_id);
        },
        "prefill": {},
        "theme": { "color": "#D4AF37" }
    };

    if (window.Razorpay) {
        const rzp1 = new Razorpay(options);
        rzp1.on('payment.failed', function (response) {
            showStatusModal('error', response.error.description);
        });
        rzp1.open();
    } else {
        alert("Payment gateway not loaded.");
    }
}

function showStatusModal(status, message) {
    const existingModal = document.getElementById('status-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'status-modal';
    modal.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 3000;";

    const content = document.createElement('div');
    content.style = "background: #fff; padding: 2.5rem; border-radius: 12px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.2);";

    if (status === 'success') {
        content.innerHTML = `
            <div style="width: 60px; height: 60px; background: #e8f5e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                <i class="fas fa-check" style="font-size: 1.5rem; color: #2ecc71;"></i>
            </div>
            <h2 style="font-family: 'Playfair Display', serif; margin-bottom: 0.5rem;">Payment Successful!</h2>
            <p style="color: #666; margin-bottom: 1rem;">Your order is confirmed.</p>
            <p style="font-size: 0.85rem; color: #999; background: #f9f9f9; padding: 0.5rem; border-radius: 4px;">Ref: ${message}</p>
            <button onclick="document.getElementById('status-modal').remove()" class="btn-primary" style="margin-top: 1.5rem; width: 100%; border: none;">Continue Shopping</button>
        `;
    } else {
        content.innerHTML = `
            <div style="width: 60px; height: 60px; background: #ffebee; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                <i class="fas fa-times" style="font-size: 1.5rem; color: #e74c3c;"></i>
            </div>
            <h2 style="margin-bottom: 0.5rem;">Payment Failed</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">${message}</p>
            <button onclick="document.getElementById('status-modal').remove()" class="btn-primary" style="margin-top: 1rem; width: 100%; border: none;">Try Again</button>
        `;
    }
    modal.appendChild(content);
    document.body.appendChild(modal);
}
