// Product data will now be fetched from the backend
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Fetch products from backend
async function fetchProducts() {
    const productContainer = document.getElementById('product-container');
    const response = await fetch('/api/products');
    const data = await response.json();
    products = data;
    displayProducts();
}

// Display products
function displayProducts() {
    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = '';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">₹${product.price.toFixed(2)}</p>
                <button class="add-to-cart" onclick="addToCart('${product._id}')">Add to Cart</button>
            </div>
        `;
        productContainer.appendChild(productCard);
    });
}

// Add to cart functionality
function addToCart(productId) {
    const product = products.find(p => p._id === productId);
    cart.push(product);
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartDisplay();
}

// Update cart count
function updateCartCount() {
    document.getElementById('cart-count').textContent = cart.length;
}

// Update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    cartItems.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    } else {
        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.innerHTML = `
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p class="item-price">₹${item.price.toFixed(2)}</p>
                </div>
                <button onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i> Remove
                </button>
            `;
            cartItems.appendChild(cartItem);
            total += item.price;
        });
    }

    cartTotal.textContent = total.toFixed(2);
}

// Remove from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    // Update localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartDisplay();
}

// Place order
async function placeOrder() {
    try {
        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }

        const orderData = {
            total_amount: cart.reduce((sum, item) => sum + item.price, 0),
            items: cart.map(item => ({
                product_id: item._id,
                name: item.name,  // Add name
                quantity: 1,
                price: item.price
            }))
        };

        console.log('Sending order data:', orderData); // Debug log

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        console.log('Order response:', response); // Debug log

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to place order');
        }

        const result = await response.json();
        console.log('Order result:', result); // Debug log

        alert('Order placed successfully!');
        cart = [];
        localStorage.removeItem('cart'); // Clear localStorage
        updateCartCount();
        updateCartDisplay();
        document.getElementById('cart-modal').style.display = 'none';
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order: ' + error.message);
    }
}

// Cart modal functionality
const cartModal = document.getElementById('cart-modal');
const cartLink = document.querySelector('a[href="#cart"]');

cartLink.addEventListener('click', (e) => {
    e.preventDefault();
    cartModal.style.display = 'block';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.style.display = 'none';
    }
});

// Contact form handling
document.getElementById('contact-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form elements directly
    const form = document.getElementById('contact-form');
    const formData = {
        name: form.querySelector('input[type="text"]').value,
        email: form.querySelector('input[type="email"]').value,
        phone: form.querySelector('input[type="tel"]').value,
        message: form.querySelector('textarea').value
    };

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Thank you for your message! We will get back to you soon.');
            form.reset();
        } else {
            alert('Error sending message. Please try again.');
        }
    } catch (error) {
        alert('Error sending message. Please try again.');
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    fetchProducts();
    updateCartCount();
    updateCartDisplay();
});