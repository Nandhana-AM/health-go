import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/health_go_db")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkeyhealthgo2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 Hours
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

