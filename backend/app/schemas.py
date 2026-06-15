from pydantic import BaseModel, EmailStr
from typing import List, Optional
import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Product Schemas
class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    quantity_description: str
    stock_quantity: int
    color_theme: str
    emoji: Optional[str] = None
    svg_path: Optional[str] = None
    ingredients: List[str]
    benefits: List[str]

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True

# Order Schemas
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    delivery_fee: float

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_purchase: float
    product: ProductResponse

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    total_price: float
    delivery_fee: float
    status: str
    created_at: datetime.datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


# Chatbot Schemas
class ChatbotQuery(BaseModel):
    message: str

class ChatbotResponse(BaseModel):
    text: str
    matched_product_id: Optional[int] = None
    suggestions: List[str]

