
document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "https://sproutly-production-6c2d.up.railway.app/api/plants";

    // ==============================
    // PLANT SEARCH AND CATEGORY FILTER
    // ==============================

    const searchInput = document.getElementById("plantSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const plantCards = document.querySelectorAll(".plant-card");
    const noPlants = document.getElementById("noPlants");

    function filterPlants() {
        const searchText = searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

        const selectedCategory = categoryFilter
            ? categoryFilter.value
            : "all";

        let visibleCount = 0;

        plantCards.forEach(function (card) {
            const heading = card.querySelector("h3");
            const plantName = heading
                ? heading.textContent.toLowerCase()
                : "";

            const category = card.dataset.category;
            const matchesSearch = plantName.includes(searchText);
            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory;

            if (matchesSearch && matchesCategory) {
                card.style.display = "";
                visibleCount++;
            } else {
                card.style.display = "none";
            }
        });

        if (noPlants) {
            noPlants.hidden = visibleCount !== 0;
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterPlants);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", filterPlants);
    }

    // ==============================
    // CART AND DATABASE PLANT IDS
    // ==============================

    let cart = [];
    let databasePlants = [];

    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const checkoutBtn = document.getElementById("checkoutBtn");

    // Match website plant names with database names
    function normalizeName(name) {
        const aliases = {
            "rose plant": "rose",
            "areca palm": "areca plant",
            "hibiscus (gudhal)": "hibiscus",
            "lemon plant": "lemon",
            "jasmine (mogra)": "jasmine"
        };

        const cleanName = name.toLowerCase().trim();
        return aliases[cleanName] || cleanName;
    }

    async function loadPlants() {
        try {
            const response = await fetch(API_URL + "/plants");

            if (!response.ok) {
                throw new Error("Could not load plants.");
            }

            databasePlants = await response.json();

            document.querySelectorAll(".cart-btn").forEach(function (button) {
                const card = button.closest(".plant-card");
                const heading = card ? card.querySelector("h3") : null;

                if (!heading) return;

                const websiteName =
                    button.dataset.name || heading.textContent.trim();

                const matchedPlant = databasePlants.find(function (plant) {
                    return normalizeName(plant.name) ===
                        normalizeName(websiteName);
                });

                if (matchedPlant) {
                    button.dataset.plantId = matchedPlant.plant_id;
                } else {
                    button.disabled = true;
                    button.textContent = "Unavailable";
                }
            });

            console.log("Plants loaded from database:", databasePlants);
        } catch (error) {
            console.error("Plant loading error:", error);
            alert("Could not connect to the plant database. Please refresh the page.");
        }
    }

    // ==============================
    // RENDER CART
    // ==============================

    function renderCart() {
        if (!cartItems || !cartTotal) return;

        if (cart.length === 0) {
            cartItems.innerHTML =
                '<p class="empty-cart">Your cart is empty. Add some plants! 🌱</p>';
            cartTotal.textContent = "₹0";
            return;
        }

        cartItems.innerHTML = "";
        let total = 0;

        cart.forEach(function (item, index) {
            total += item.price * item.quantity;

            const div = document.createElement("div");
            div.className = "cart-item";

            div.innerHTML = `
                <div>
                    <h4>${item.name}</h4>
                    <p>₹${item.price} × ${item.quantity}</p>
                </div>
                <div class="cart-actions">
                    <button type="button" data-action="minus" data-index="${index}">−</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-action="plus" data-index="${index}">+</button>
                    <button type="button" class="remove-btn" data-action="remove" data-index="${index}">Remove</button>
                </div>
            `;

            cartItems.appendChild(div);
        });

        cartTotal.textContent = "₹" + total;
    }

    // ==============================
    // ADD TO CART
    // ==============================

    function addToCart(plantId, name, price) {
        if (!plantId || !name || !Number.isFinite(price) || price <= 0) {
            alert("Plant details are missing. Please refresh the page.");
            return;
        }

        const existingItem = cart.find(function (item) {
            return item.plant_id === plantId;
        });

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                plant_id: plantId,
                name: name,
                price: price,
                quantity: 1
            });
        }

        renderCart();

        const shoppingCart = document.getElementById("shoppingCart");

        if (shoppingCart) {
            shoppingCart.scrollIntoView({ behavior: "smooth" });
        }
    }

    document.querySelectorAll(".cart-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            const card = button.closest(".plant-card");
            if (!card) return;

            const heading = card.querySelector("h3");
            const priceElement = card.querySelector(".plant-price");

            if (!heading || !priceElement) return;

            const plantId = Number(button.dataset.plantId);
            const name = button.dataset.name || heading.textContent.trim();
            const price = Number(
                priceElement.textContent.replace(/[^\d.]/g, "")
            );

            addToCart(plantId, name, price);
        });
    });

    // ==============================
    // CART QUANTITY AND REMOVE
    // ==============================

    if (cartItems) {
        cartItems.addEventListener("click", function (event) {
            const button = event.target.closest("button[data-action]");
            if (!button) return;

            const index = Number(button.dataset.index);
            const action = button.dataset.action;

            if (!Number.isInteger(index) || !cart[index]) return;

            if (action === "plus") {
                cart[index].quantity++;
            } else if (action === "minus") {
                cart[index].quantity--;

                if (cart[index].quantity <= 0) {
                    cart.splice(index, 1);
                }
            } else if (action === "remove") {
                cart.splice(index, 1);
            }

            renderCart();
        });
    }

    // ==============================
    // CHECKOUT BUTTON
    // ==============================

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", function () {
            if (cart.length === 0) {
                alert("Please add plants to your cart first! 🌱");
                return;
            }

            const checkoutSection =
                document.getElementById("checkoutSection");

            if (checkoutSection) {
                checkoutSection.hidden = false;
                checkoutSection.scrollIntoView({ behavior: "smooth" });
            }
        });
    }

    // ==============================
    // PLACE ORDER IN MYSQL DATABASE
    // ==============================

    const checkoutForm = document.getElementById("checkoutForm");

    if (checkoutForm) {
        checkoutForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (cart.length === 0) {
                alert("Your cart is empty! Please add plants first. 🌱");
                return;
            }

            const customerName =
                document.getElementById("customerName").value.trim();

            const customerPhone =
                document.getElementById("customerPhone").value.trim();

            const customerAddress =
                document.getElementById("customerAddress").value.trim();

            const paymentMethod =
                document.getElementById("paymentMethod").value;

            if (
                !customerName ||
                !customerPhone ||
                !customerAddress ||
                !paymentMethod
            ) {
                alert("Please fill in all the required details.");
                return;
            }

            const orderData = {
                customer_name: customerName,
                mobile: customerPhone,
                address: customerAddress,
                payment_method: paymentMethod,
                items: cart.map(function (item) {
                    return {
                        plant_id: item.plant_id,
                        quantity: item.quantity
                    };
                })
            };

            const submitButton =
                checkoutForm.querySelector('button[type="submit"]');

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Placing Order...";
            }

            try {
                const response = await fetch(API_URL + "/orders", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(orderData)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Could not place your order."
                    );
                }

                alert(
                    "🎉 Order Placed Successfully!\n\n" +
                    "Thank you, " + customerName + "!\n" +
                    "Your order has been saved in the database."
                );

                cart = [];
                renderCart();
                checkoutForm.reset();

                const checkoutSection =
                    document.getElementById("checkoutSection");

                if (checkoutSection) {
                    checkoutSection.hidden = true;
                }
            } catch (error) {
                console.error("Order error:", error);
                alert(
                    "Order could not be placed.\n\n" +
                    error.message +
                    "\n\nPlease check your details and try again."
                );
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = "Place My Order 🌱";
                }
            }
        });
    }

    // INITIALIZE
    renderCart();
    loadPlants();
});