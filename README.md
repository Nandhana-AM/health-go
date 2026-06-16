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

## Component Diagram

The following diagram details the interactions between the modular components of both the frontend client and backend service layers.

```mermaid
graph TB
    subgraph FrontendComponents [Angular Frontend Components]
        Root[App Component]
        Nav[Navbar Component]
        Hero[Hero Component]
        ProdList[Product List Component]
        ProdCard[Product Card Component]
        Cart[Cart Drawer Component]
        Chat[Chatbot Component]
        Auth[Auth Modal Component]
        Orders[Order History Component]
    end

    subgraph FrontendServices [Angular Services]
        S_Api[ApiService]
        S_Prod[ProductService]
        S_Cart[CartService]
        S_Chat[ChatbotService]
    end

    subgraph BackendModules [FastAPI Backend]
        B_Main[main.py - Endpoints & Routing]
        B_Auth[auth.py - JWT & Password Hash]
        B_DB[database.py - SQLAlchemy Session]
        B_Models[models.py - SQLAlchemy Entities]
        B_Schemas[schemas.py - Pydantic Validation]
        B_Config[config.py - Env Settings]
    end

    subgraph DatabaseLayer [PostgreSQL Database]
        T_Users[users table]
        T_Products[products table]
        T_Orders[orders table]
        T_Items[order_items table]
    end

    %% Component relationships
    Root --> Nav
    Root --> Hero
    Root --> ProdList
    Root --> Cart
    Root --> Chat
    Root --> Auth
    Root --> Orders
    ProdList --> ProdCard

    %% Component to service relationships
    Nav & Auth & Orders --> S_Api
    ProdList --> S_Prod
    ProdCard & Cart --> S_Cart
    Chat --> S_Chat

    %% Service to API relationships
    S_Prod & S_Cart & S_Chat & S_Api --> S_Api
    S_Api --> |HTTP JSON| B_Main

    %% Backend internal relationships
    B_Main --> B_Auth
    B_Main --> B_Schemas
    B_Main --> B_DB
    B_DB --> B_Models
    B_Models --> B_Config

    %% DB relationships
    B_Models --> T_Users
    B_Models --> T_Products
    B_Models --> T_Orders
    B_Models --> T_Items
```

### Key Frontend Components & Services:
*   **App Component**: Orchestrates the overlay modals and coordinates top-level layouts.
*   **Navbar Component**: Manages application access status, links, and triggers.
*   **Product List & Card Components**: Present product catalog items and allow additions to the shopping cart.
*   **Cart Drawer Component**: Manages item selections, computes delivery fees, and submits purchase transactions.
*   **Chatbot Component**: Hosts the wellness assistant chat container.
*   **ApiService**: The central communication channel for HTTP operations. Maintains the current user token session.
*   **ProductService & CartService**: Maintain catalog caches and reactive shopping states using Angular Signals.
*   **ChatbotService**: Processes conversations by querying the server-side LLM backend or executing client-side fallback rule parsing.

### Key Backend Components:
*   **main.py**: Initiates the FastAPI server instance, configures CORS rules, and serves route operations.
*   **auth.py**: Manages password cryptography using Bcrypt and web token operations.
*   **database.py**: Establishes SQLAlchemy connection pools and session management.
*   **models.py & schemas.py**: Define PostgreSQL table relations and handle Pydantic schema validation.

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
