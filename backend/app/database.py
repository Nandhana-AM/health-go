from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import DATABASE_URL

# Create the SQLAlchemy engine
# pool_pre_ping=True checks for stale database connections automatically
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# SessionLocal is the session maker instance
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()

# FastAPI database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
