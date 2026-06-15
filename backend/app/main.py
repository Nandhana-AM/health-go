from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.database import engine, get_db, Base
from app.models import User, Product, Order, OrderItem
from app.schemas import (
    UserCreate, UserResponse, Token, 
    ProductResponse, OrderCreate, OrderResponse,
    ChatbotQuery, ChatbotResponse
)
import httpx
import json
from app.config import GROQ_API_KEY
from app.auth import (
    hash_password, verify_password, 
    create_access_token, get_current_user
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Health Go API",
    description="Full-stack backend API for Health Go Organic Products Shop",
    version="1.0.0"
)

# Configure CORS Middleware
# Allows the Angular frontend (usually running on port 4200) to communicate with this API
origins = [
    "http://localhost:4200",
    "http://127.0.0.1:4200"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account is already registered with this email."
        )
    
    # Create new user
    hashed_pwd = hash_password(user_in.password)
    new_user = User(email=user_in.email, password_hash=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/api/auth/login", response_model=Token)
def login(credentials: UserCreate, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# --- PRODUCTS ENDPOINTS ---

@app.get("/api/products", response_model=List[ProductResponse])
def read_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id).all()


@app.get("/api/products/{product_id}", response_model=ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product


# --- ORDERS ENDPOINTS ---

@app.post("/api/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    order_in: OrderCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item."
        )

    # Initialize order costs
    total_items_price = 0.0
    order_items_to_create = []

    try:
        # We check and deduct stock for each product in a locked query loop
        # using with_for_update() to prevent concurrent stock check race conditions!
        for item in order_in.items:
            product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item.product_id} does not exist."
                )
            
            # Stock check
            if item.quantity > product.stock_quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.name}'. Only {product.stock_quantity} left, you requested {item.quantity}."
                )

            # Deduct stock
            product.stock_quantity -= item.quantity
            item_cost = product.price * item.quantity
            total_items_price += item_cost

            # Stage the OrderItem model
            order_item = OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                price_at_purchase=product.price
            )
            order_items_to_create.append(order_item)

        # Create Order record
        final_total = total_items_price + order_in.delivery_fee
        new_order = Order(
            user_id=current_user.id,
            total_price=final_total,
            delivery_fee=order_in.delivery_fee,
            status="completed"
        )
        db.add(new_order)
        db.flush() # Flushes order to get new_order.id

        # Bind items to the order id and save
        for item in order_items_to_create:
            item.order_id = new_order.id
            db.add(item)

        db.commit()
        db.refresh(new_order)
        return new_order

    except HTTPException as he:
        # Re-raise explicit HTTP exceptions from loops
        db.rollback()
        raise he
    except Exception as e:
        # Roll back on system failures
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while placing your order: {str(e)}"
        )


@app.get("/api/orders", response_model=List[OrderResponse])
def get_orders(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Retrieve orders for the authenticated user, descending by date
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    return orders


@app.post("/api/chatbot", response_model=ChatbotResponse)
async def chatbot_query(query: ChatbotQuery, db: Session = Depends(get_db)):
    # 1. Fetch current products for context
    products = db.query(Product).all()
    products_context = []
    for p in products:
        products_context.append({
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "price": p.price,
            "quantity": p.quantity_description,
            "stock": p.stock_quantity,
            "ingredients": p.ingredients,
            "benefits": p.benefits
        })
    
    # 2. Check if GROQ_API_KEY is configured
    if not GROQ_API_KEY:
        # Fallback simple rule-based chatbot matching frontend logic if API key is missing
        text = query.message.lower().strip()
        
        # Simple greetings
        if text in ["hi", "hello", "hey", "help"]:
            return ChatbotResponse(
                text="Hello! I am Go-Bot. (Note: Groq AI key is not set, running in offline mode) 🌿\n\nI can help you explore our products or answer questions about delivery.",
                suggestions=["Tell me about Karupatti", "What are the delivery charges?"],
                matched_product_id=None
            )
        elif "delivery" in text or "shipping" in text or "charge" in text or "cost" in text or "fee" in text:
            return ChatbotResponse(
                text="We offer FREE delivery for orders above ₹500! For orders below ₹500, there is a flat fee of ₹50.",
                suggestions=["Show products under ₹150", "Do you have filter coffee?"],
                matched_product_id=None
            )
        
        # Look for matching products
        matched_id = None
        for p in products:
            if any(part in text for part in p.name.lower().split() if part not in ["organic", "fresh", "traditional"]):
                matched_id = p.id
                break
        
        if matched_id:
            p = db.query(Product).filter(Product.id == matched_id).first()
            return ChatbotResponse(
                text=f"Here are the details for **{p.name}**:\n\n• Price: ₹{p.price} ({p.quantity_description})\n• Ingredients: {', '.join(p.ingredients)}\n• Benefits:\n" + "\n".join(f"  • {b}" for b in p.benefits),
                suggestions=["What are the delivery charges?", "Do you have filter coffee?"],
                matched_product_id=p.id
            )
            
        return ChatbotResponse(
            text="I couldn't process your request as the Groq AI API key is not configured. Please add `GROQ_API_KEY` to the backend `.env` file to enable the smart wellness assistant. 🌿",
            suggestions=["Tell me about Karupatti", "What are the delivery charges?"],
            matched_product_id=None
        )

    # 3. If GROQ_API_KEY is configured, call Groq API
    system_prompt = (
        "You are 'Go-Bot', a friendly and knowledgeable AI organic wellness assistant for the 'Health Go' shop.\n"
        "Your goal is to help customers explore our organic products, understand their health benefits, list ingredients, "
        "and answer queries about shipping/delivery. Use the following store products as your source of truth:\n\n"
        f"{json.dumps(products_context, indent=2)}\n\n"
        "Delivery Policy:\n"
        "- Orders above ₹500 get FREE delivery!\n"
        "- Orders below ₹500 have a flat delivery fee of ₹50.\n\n"
        "Guidelines:\n"
        "1. Be helpful, concise, and polite.\n"
        "2. If a customer is asking about a specific product, set `matched_product_id` to that product's integer ID. If not, set it to null.\n"
        "3. Provide 2 to 4 quick-reply text suggestions in the `suggestions` array for what the user might ask next.\n"
        "4. If multiple products are shown/recommended, you MUST format the product list inside the 'text' field as a markdown table. "
        "The table MUST have exactly these columns: `| Product | Price | Benefits |`. "
        "Inside the 'Benefits' cell, format them as a bullet list separated by `<br>` tags (e.g. `- Benefit 1<br>- Benefit 2`).\n"
        "5. You MUST respond ONLY with a JSON object in this format:\n"
        "{\n"
        "  \"text\": \"Your friendly text response (markdown formatted, use emoji where appropriate)\",\n"
        "  \"matched_product_id\": <null or product ID integer>,\n"
        "  \"suggestions\": [\"suggested query 1\", \"suggested query 2\"]\n"
        "}"
    )

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query.message}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.7
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Error from Groq API: {response.text}"
                )
            
            result_data = response.json()
            content_str = result_data["choices"][0]["message"]["content"]
            parsed_content = json.loads(content_str)
            
            return ChatbotResponse(
                text=parsed_content.get("text", "Sorry, I encountered an issue processing the response."),
                matched_product_id=parsed_content.get("matched_product_id"),
                suggestions=parsed_content.get("suggestions", ["Tell me about Karupatti", "What are the delivery charges?"])
            )
            
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse chatbot response from AI model."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while contacting the chatbot AI: {str(e)}"
        )

