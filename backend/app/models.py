import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
  __tablename__ = "users"

  id = Column(Integer, primary_key=True, index=True)
  email = Column(String(255), unique=True, index=True, nullable=False)
  password_hash = Column(String(255), nullable=False)
  created_at = Column(DateTime, default=datetime.datetime.utcnow)

  # Relationship to Orders placed by this user
  orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")


class Product(Base):
  __tablename__ = "products"

  id = Column(Integer, primary_key=True, index=True)
  name = Column(String(255), unique=True, index=True, nullable=False)
  category = Column(String(100), nullable=False)
  price = Column(Float, nullable=False)
  quantity_description = Column(String(100), nullable=False)
  stock_quantity = Column(Integer, default=10, nullable=False) # Current stock count
  color_theme = Column(String(255), nullable=False)
  emoji = Column(String(50), nullable=True)
  svg_path = Column(Text, nullable=True)
  ingredients = Column(JSON, nullable=False) # Stored as JSON array
  benefits = Column(JSON, nullable=False)    # Stored as JSON array


class Order(Base):
  __tablename__ = "orders"

  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
  total_price = Column(Float, nullable=False)
  delivery_fee = Column(Float, nullable=False)
  status = Column(String(50), default="completed")
  created_at = Column(DateTime, default=datetime.datetime.utcnow)

  # Relationships
  user = relationship("User", back_populates="orders")
  items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
  __tablename__ = "order_items"

  id = Column(Integer, primary_key=True, index=True)
  order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
  product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
  quantity = Column(Integer, nullable=False)
  price_at_purchase = Column(Float, nullable=False)

  # Relationships
  order = relationship("Order", back_populates="items")
  product = relationship("Product")
