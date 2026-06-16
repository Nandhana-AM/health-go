# Health Go | Premium Organic Shop & Wellness AI Assistant

Health Go is a full-stack, enterprise-grade e-commerce web application specializing in integrity-sourced, traditional organic products (primarily from Tamil Nadu, India). The platform features real-time inventory management, secure token-based user authentication, and Go-Bot—a smart, context-aware AI wellness chatbot powered by Groq's Llama-3.3-70B model with a seamless offline fallback.

---

## System Architecture

The application is structured as a decoupled client-server architecture with a relational database layer and third-party LLM integrations.

```mermaid
graph TD
    %% Frontend Layer
    subgraph Frontend [Angular Client - Port 4200]
        UI[Angular Components <br> Navbar, Hero, Catalog, Cart, Chatbot]
        State[Angular Signals <br> Cart, Auth, Products]
        Local[Local Storage <br> JWT Token Session]
        
        %% Services
        APIService[ApiService]
        ChatService[ChatbotService]
        ProdService[ProductService]
        CartService[CartService]
    end

    %% Backend Layer
    subgraph Backend [FastAPI Server - Port 8000]
        API[FastAPI Endpoints <br> Auth, Products, Orders, Chatbot]
        AuthLib[Auth Guard <br> PyJWT, Passlib Bcrypt]
        ORM[SQLAlchemy ORM]
    end

    %% External & DB Layer
    subgraph Data [Data & External API Layer]
        DB[(PostgreSQL Database)]
        Groq[Groq API Cloud <br> Llama 3.3 70B Model]
    end

    %% Connections
    UI <--> State
    State <--> APIService
    APIService <--> |JSON API / HTTP Bearer| API
    ChatService --> APIService
    ProdService --> APIService
    CartService --> APIService
    Local <--> APIService

    API <--> AuthLib
    API <--> ORM
    ORM <--> |Connection Pool / SQL| DB
    API <--> |HTTPS Request| Groq
```

### Key Architectural Layers:
1. **Frontend (Angular 22.0.x)**: A highly interactive UI built with custom Vanilla CSS variables for dark-mode-ready styling, Outfit & Inter typography, and responsive grid layouts. Application state is managed reactively using Angular Signals (e.g., cart items, user session state).
2. **Backend (FastAPI)**: An asynchronous Python API server handling user authentication, order processing transactions, and database operations.
3. **Database (PostgreSQL)**: Stores user credentials, product catalog, orders, and individual order line items with relational integrity constraints.
4. **AI Layer (Groq Cloud)**: Connects to Groq's low-latency API to query the `llama-3.3-70b-versatile` model, injecting database product data dynamically as system context.

---

## Core Pipeline Flows

### 1. User Authentication Pipeline
This flow secures customer sessions and order history through JSON Web Tokens (JWT).

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant FE as Angular Client
    participant BE as FastAPI Server
    participant DB as PostgreSQL
    
    User->>FE: Enters Email & Password
    FE->>BE: POST /api/auth/login
    BE->>DB: Query User by Email
    DB-->>BE: User Record (Hashed Password)
    BE->>BE: Verify Password (Bcrypt Context)
    
    alt Credentials Valid
        BE->>BE: Generate JWT Token (Sub: Email, Exp: 24h)
        BE-->>FE: Return Token (access_token, token_type)
        FE->>FE: Save Token to LocalStorage (health_go_token)
        FE->>FE: Update currentUser Signal
    else Credentials Invalid
        BE-->>FE: 401 Unauthorized (Error Message)
        FE->>User: Display Toast Alert
    end
```

*   **Password Hashing**: Implemented using `passlib[bcrypt]` to secure passwords prior to database insertion.
*   **Session Persistence**: The frontend checks local storage during initialization, requests the `/api/auth/me` endpoint to validate, and re-populates state signals.

---

### 2. Concurrent-Safe Transactional Checkout Flow
To prevent race conditions where multiple users buy the last item simultaneously, the backend utilizes database-level row locking.

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant FE as Angular Cart Drawer
    participant BE as FastAPI Server
    participant DB as PostgreSQL (Transaction)
    
    User->>FE: Clicks Checkout
    FE->>BE: POST /api/orders (Authorization: Bearer JWT)
    Note over BE: Starts DB Transaction
    
    loop For Each Item in Order
        BE->>DB: SELECT with_for_update() FROM products WHERE id = ?
        Note over DB: Locks row for modification
        DB-->>BE: Product Stock Quantity
        
        alt Quantity Available >= Requested
            BE->>DB: UPDATE stock_quantity = stock_quantity - requested
            BE->>BE: Calculate Subtotal Costs
        else Insufficient Stock
            BE->>DB: Rollback Transaction
            BE-->>FE: 400 Bad Request ("Insufficient stock for...")
            Note over FE: Displays warning toast
        end
    end
    
    BE->>DB: INSERT INTO orders & order_items
    BE->>DB: Commit Transaction
    DB-->>BE: Confirm Commit
    BE-->>FE: 201 Created (Order Receipt)
    FE->>FE: Clear Cart Signal & Reload Catalog
```

*   **Row-Level Locking (`with_for_update()`)**: Lock-selects row updates in PostgreSQL, forcing concurrent threads attempting to check out the same product to queue sequentially, preventing negative stock levels.
*   **Automatic Delivery Calculation**: If order subtotal is `< Rs 500`, a flat `Rs 50` delivery fee is appended. For orders `>= Rs 500`, the delivery fee is set to `Rs 0` (FREE).

---

### 3. AI Chatbot ("Go-Bot") Wellness Assistant Flow
Go-Bot acts as a conversational assistant. It knows the current stock levels, product benefits, and ingredient lists.

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant FE as Chatbot Widget
    participant BE as FastAPI Server
    participant DB as PostgreSQL
    participant AI as Groq API Cloud
    
    User->>FE: Types "What are the benefits of Karupatti?"
    FE->>BE: POST /api/chatbot (Body: message)
    BE->>DB: SELECT * FROM products
    DB-->>BE: List of Products & Metadata
    BE->>BE: Check for GROQ_API_KEY in Environment
    
    alt GROQ_API_KEY Available (Online AI Mode)
        BE->>BE: Compile Product Context & System Prompts
        BE->>AI: Send Prompt to llama-3.3-70b-versatile (JSON Mode)
        AI-->>BE: JSON Response (text, matched_product_id, suggestions)
        BE-->>FE: Return ChatbotResponse Schema
    else GROQ_API_KEY Missing (Offline Mode Fallback)
        BE->>BE: Apply Local Regex / Rule-based string parsing
        BE-->>FE: Return local matching response + fallback advice
    end
    
    FE->>FE: Render Markdown Response
    alt matched_product_id is Present
        FE->>FE: Render Interactive Mini Product Card in chat history
    end
    FE->>User: Display Message & Suggestion Chips
```

*   **Dynamic Context Injection**: The backend serializes all catalog items (ID, category, price, ingredients, benefits, stock status) into a JSON context block and feeds it inside the system prompt to the LLM.
*   **Response Formatting**: The LLM is directed to format comparisons or multiple products inside a markdown table (`| Product | Price | Benefits |`) and output suggestions.
*   **Client-Side Resiliency**: If the entire backend is offline, the Angular `ChatbotService` catches the error and executes its own client-side parsing pipeline to serve recommendations without interrupting the user experience.

---

## Repository Structure

```text
organic-prod-chatbot/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py          # JWT, hashing, & authentication guards
│   │   ├── config.py        # Environmental configuration loader
│   │   ├── database.py      # SQLAlchemy setup & session dependency injection
│   │   ├── main.py          # FastAPI server, CORS middleware, & endpoint routers
│   │   ├── models.py        # SQLAlchemy relational schema mapping
│   │   └── schemas.py       # Pydantic schemas for verification/serialization
│   ├── .env                 # API Keys and database credentials
│   ├── requirements.txt     # Python backend dependencies
│   └── seed.py              # Script to seed 15 traditional organic products
├── src/
│   ├── app/
│   │   ├── components/      # UI Components (Navbar, Hero, Product List, Chatbot, etc.)
│   │   ├── services/        # Services for State (Cart, Chatbot, Product, Api)
│   │   ├── app.css          # Main UI shell styling
│   │   ├── app.html         # Base layout router outlet/app elements
│   │   ├── app.ts           # Root component class
│   │   └── app.config.ts    # Providers configuration
│   ├── index.html           # Main HTML document & Google Fonts
│   ├── main.ts              # Angular boostrapper
│   └── styles.css           # Design tokens, resets, utility configurations
├── POSTGRES_SETUP.md        # Database-specific setup instructions
└── README.md                # General project guide
```

---

## Step-by-Step Implementation Guide

Follow these sequential steps to run the complete stack on your local machine.

### Prerequisites
*   **Python**: Version 3.10 or higher.
*   **Node.js**: Version 20 or higher (with NPM).
*   **PostgreSQL**: Local server instance running.

---

### Step 1: PostgreSQL Setup
1. Verify PostgreSQL is installed and running on port `5432`.
2. Connect to your PostgreSQL server and create a database named `health_go_db`.
   *(Detailed setup steps using pgAdmin 4 are available in the POSTGRES_SETUP.md guide)*.

---

### Step 2: Configure and Seed Backend
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create a Python Virtual Environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   *   **Windows (PowerShell)**: `.\venv\Scripts\Activate.ps1`
   *   **macOS / Linux**: `source venv/bin/activate`
4. Install the backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Configure environmental variables. Create or edit the `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/health_go_db
   JWT_SECRET=supersecretkeyhealthgo2026
   GROQ_API_KEY=your_groq_api_key_here
   ```
   *Note: Replace the credentials in `DATABASE_URL` with your local database username and password if different.*
6. Seed the organic product catalog:
   ```bash
   python seed.py
   ```
   *This initializes the PostgreSQL tables and inserts 15 traditional Tamil Nadu items with detailed ingredients, color gradients, and benefit descriptions.*

---

### Step 3: Run Backend Server
Start the Uvicorn development server from inside the `backend/` directory:
```bash
uvicorn app.main:app --reload
```
The backend API is now running locally at `http://127.0.0.1:8000/`. You can view interactive Swagger API documentation at `http://127.0.0.1:8000/docs`.

---

### Step 4: Configure and Run Frontend
1. Open a new terminal and navigate to the project root directory:
   ```bash
   cd ..
   ```
2. Install the frontend Node.js packages:
   ```bash
   npm install
   ```
3. Run the Angular development server:
   ```bash
   npm run start
   ```
4. Open your web browser and navigate to `http://localhost:4200/`.

---

## API Endpoints Reference

### Authentication (`/api/auth`)
*   `POST /api/auth/register` - Registers a new user. Takes `{ email, password }`.
*   `POST /api/auth/login` - Logs in a user. Returns a signed JWT token.
*   `GET /api/auth/me` - Decodes bearer token to return the current authenticated user's profile.

### Product Catalog (`/api/products`)
*   `GET /api/products` - Returns a JSON array of all active organic products.
*   `GET /api/products/{id}` - Returns data regarding a single product matching the ID.

### Orders (`/api/orders`)
*   `POST /api/orders` - Requires Authorization header. Places a new purchase order. Takes list of `{ product_id, quantity }` and `{ delivery_fee }`. Automatically locks catalog rows during transaction to adjust stock safely.
*   `GET /api/orders` - Requires Authorization header. Returns historical purchase orders for the logged-in customer.

### Chatbot (`/api/chatbot`)
*   `POST /api/chatbot` - Query Go-Bot. Takes `{ message }`. Evaluates inputs against the loaded product index and returns formatted text, suggestions, and optionally a matching product identifier.

---

## Verification and Testing

### Running Frontend Tests
*   To launch the unit tests using the Angular test runner (configured with Vitest):
    ```bash
    npm run test
    ```
*   To compile the web application for optimized production static file hosting:
    ```bash
    npm run build
    ```
