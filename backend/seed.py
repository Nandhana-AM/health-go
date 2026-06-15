import os
import sys

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import Product

# Ensure tables are created in PostgreSQL
print("Initializing database tables...")
Base.metadata.create_all(bind=engine)

def seed_products():
    db = SessionLocal()
    try:
        # Clear existing products to prevent duplicates
        print("Clearing stale products...")
        db.query(Product).delete()
        db.commit()

        # 15 Traditional Tamil Nadu Organic Products
        products_to_seed = [
            Product(
                id=1,
                name="Kodaikanal Hill Garlic (Malaipoondu)",
                category="Vegetables",
                price=250,
                quantity_description="250g pack",
                stock_quantity=8, # 8 units in stock
                color_theme="linear-gradient(135deg, #d8f3dc 0%, #74c69d 100%)",
                emoji="🧄",
                svg_path="M12 2C8.5 2 6 5.5 6 9c0 5 6 13 6 13s6-8 6-13c0-3.5-2.5-7-6-7zm0 10c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z",
                ingredients=["100% Organic Geographical Indication (GI) Tagged Kodaikanal Hill Garlic"],
                benefits=["Exceptionally high medicinal antioxidant content", "Strong traditional cure for respiratory health", "Helps regulate blood pressure naturally"]
            ),
            Product(
                id=2,
                name="Ooty Fresh Strawberries",
                category="Fruits",
                price=180,
                quantity_description="250g pack",
                stock_quantity=12,
                color_theme="linear-gradient(135deg, #ffccd5 0%, #ff4d6d 100%)",
                emoji="🍓",
                svg_path="M12 2c-.5 0-1 .5-1 1s.5 1 1 1c1.5 0 3 1.5 3 3 0 .5.5 1 1 1s1-.5 1-1c0-2.5-2-4.5-5-4.5zM8.5 7c-1.5 0-2.5 1.5-2.5 3 0 .5.5 1 1 1s1-.5 1-1c0-.5.5-1 1-1 .5 0 1-.5 1-1s-.5-1-1.5-1z",
                ingredients=["Organic Vine-Ripened Strawberries grown in Nilgiris Hills"],
                benefits=["Rich in immune-boosting Vitamin C", "Abundant in skin-glowing antioxidants", "Natural cooling property for hot seasons"]
            ),
            Product(
                id=3,
                name="Mappillai Samba Rice (Bridegroom Rice)",
                category="Grains & Seeds",
                price=120,
                quantity_description="1kg bag",
                stock_quantity=15,
                color_theme="linear-gradient(135deg, #fefae0 0%, #dda15e 100%)",
                emoji="🌾",
                svg_path="M12 3v18M8 6l4-2 4 2M6 10l6-3 6 3M4 14l8-4 8 4M2 18l10-5 10 5",
                ingredients=["100% Organic Traditional Red Rice variety of Tamil Nadu"],
                benefits=["Extremely rich in dietary fiber and essential iron", "Boosts strength, endurance, and immune defenses", "Improves digestion and releases steady energy"]
            ),
            Product(
                id=4,
                name="Madurai Jasmine Herbal Tea",
                category="Beverages",
                price=220,
                quantity_description="100g box",
                stock_quantity=10,
                color_theme="linear-gradient(135deg, #e8f5e9 0%, #4caf50 100%)",
                emoji="🍵",
                svg_path="M2 10h20v2a8 8 0 0 1-16 0v-2zm3-6h14v2H5V4zm16 8h2v2a2 2 0 0 1-2 2h-2v-4z",
                ingredients=["Organic Sun-Dried Jasmine Buds from Madurai", "Premium Green Tea Leaves"],
                benefits=["Aromatic scent calms the nervous system and relieves stress", "High in natural polyphenols and catechins", "Promotes glowing, healthy skin hydration"]
            ),
            Product(
                id=5,
                name="Udangudi Karupatti (Palm Jaggery)",
                category="Superfoods",
                price=190,
                quantity_description="500g block",
                stock_quantity=5, # Limited stock to test stock checking
                color_theme="linear-gradient(135deg, #ffedd5 0%, #fdba74 100%)",
                emoji="🌴",
                svg_path="M12 2C8.5 2 6 5.5 6 9c0 4.5 4 7 4 11h4c0-4 4-6.5 4-11c0-3.5-2.5-7-6-7z",
                ingredients=["100% Pure Organic Palm Tree Sap Sap (Padaneer) without chemical agents"],
                benefits=["Rich source of Iron, Potassium, and active minerals", "Traditional digestive aid after meals", "Excellent healthy low-glycemic sweetener"]
            ),
            Product(
                id=6,
                name="Cold-Pressed Sesame Oil (Chekku Nallennai)",
                category="Superfoods",
                price=340,
                quantity_description="1 Litre bottle",
                stock_quantity=6,
                color_theme="linear-gradient(135deg, #fffbeb 0%, #fbbf24 100%)",
                emoji="🧴",
                svg_path="M12 2v20M6 8h12M8 14h8",
                ingredients=["Organic Sesame Seeds", "Palm Jaggery (added during traditional wood pressing)"],
                benefits=["Excellent for cardiovascular health", "Traditional sesame oil cooling agent for body massage", "Contains high unsaturated healthy lipids"]
            ),
            Product(
                id=7,
                name="Kumbakonam Filter Coffee Blend",
                category="Beverages",
                price=190,
                quantity_description="250g pack",
                stock_quantity=20,
                color_theme="linear-gradient(135deg, #fffbeb 0%, #fbbf24 100%)",
                emoji="☕",
                svg_path="M2 10h20v2a8 8 0 0 1-16 0v-2zm3-6h14v2H5V4zm16 8h2v2a2 2 0 0 1-2 2h-2v-4z",
                ingredients=["75% Organic Coffee Beans (Chikmagalur)", "25% Organic Chicory Root Powder"],
                benefits=["Provides smooth, slow-release mental focus", "Aromatic brew rich in natural coffee antioxidants", "Authentic South Indian filter coffee experience"]
            ),
            Product(
                id=8,
                name="Ooty Sweet Baby Carrots",
                category="Vegetables",
                price=90,
                quantity_description="500g bag",
                stock_quantity=14,
                color_theme="linear-gradient(135deg, #e2f0d9 0%, #a2d28f 100%)",
                emoji="🥕",
                svg_path="M12 22s-7-4-7-11c0-4 3-7 7-7s7 3 7 7c0 7-7 11-7 11z",
                ingredients=["100% Freshly Harvested Organic Sweet Carrots from Ooty Hills"],
                benefits=["High content of Vitamin A and Beta-Carotene", "Supports optimal eye and vision health", "Crunchy, dietary-fiber rich snack"]
            ),
            Product(
                id=9,
                name="Salem Manjal (Turmeric Powder)",
                category="Superfoods",
                price=110,
                quantity_description="200g pack",
                stock_quantity=25,
                color_theme="linear-gradient(135deg, #fffbeb 0%, #f59e0b 100%)",
                emoji="🟡",
                svg_path="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-8a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z",
                ingredients=["100% Organic Salem Turmeric Roots (Salem Manjal)"],
                benefits=["Exceptional high concentration of active Curcumin", "Strongest natural anti-inflammatory properties", "Improves digestion and boosts natural immunity"]
            ),
            Product(
                id=10,
                name="Organic Kambu (Pearl Millet)",
                category="Grains & Seeds",
                price=80,
                quantity_description="1kg bag",
                stock_quantity=18,
                color_theme="linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 100%)",
                emoji="🌾",
                svg_path="M12 22s-8-4-8-10c0-4.42 3.58-8 8-8s8 3.58 8 8c0 6-8 10-8 10z",
                ingredients=["100% Certified Organic Pearl Millet (Kambu) Seeds"],
                benefits=["Helps maintain optimal body temperature in hot seasons", "High protein and dietary fiber content", "Gluten-free traditional grain alternative"]
            ),
            Product(
                id=11,
                name="Pollachi Tender Coconut (Elaneer)",
                category="Beverages",
                price=60,
                quantity_description="1 unit",
                stock_quantity=2, # VERY LOW stock to test stock limits
                color_theme="linear-gradient(135deg, #d8f3dc 0%, #95d5b2 100%)",
                emoji="🥥",
                svg_path="M12 2C8.5 2 6 5.5 6 9c0 5 6 13 6 13s6-8 6-13c0-3.5-2.5-7-6-7zm0 10c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z",
                ingredients=["100% Raw Organic Tender Coconut Water from Pollachi groves"],
                benefits=["Provides ultimate natural isotonic hydration", "Extremely rich in Potassium and minerals", "Cools the body and settles digestive acids"]
            ),
            Product(
                id=12,
                name="Chettinad Spicy Masala Blend",
                category="Superfoods",
                price=130,
                quantity_description="200g pack",
                stock_quantity=10,
                color_theme="linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)",
                emoji="🌶️",
                svg_path="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-8a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z",
                ingredients=["Organic Coriander", "Organic Cumin", "Organic Cardamom", "Organic Cloves", "Organic Red Chillies", "Organic Fennel"],
                benefits=["Promotes rapid gastrointestinal digestion", "High thermogenic and metabolism boosting spices", "Rich in natural volatile oils and antioxidants"]
            ),
            Product(
                id=13,
                name="Dried Panruti Jackfruit Slices",
                category="Fruits",
                price=140,
                quantity_description="150g pack",
                stock_quantity=7,
                color_theme="linear-gradient(135deg, #fffbeb 0%, #fef08a 100%)",
                emoji="🥭",
                svg_path="M12 2c-.5 0-1 .5-1 1s.5 1 1 1c1.5 0 3 1.5 3 3 0 .5.5 1 1 1s1-.5 1-1c0-2.5-2-4.5-5-4.5zM8.5 7c-1.5 0-2.5 1.5-2.5 3 0 .5.5 1 1 1s1-.5 1-1c0-.5.5-1 1-1 .5 0 1-.5 1-1s-.5-1-1.5-1z",
                ingredients=["Organic Shade-Dried Sweet Jackfruit Slices from Panruti orchards"],
                benefits=["Natural energy booster rich in fructose", "Provides critical minerals and Vitamin B6", "High dietary fiber promotes gut satiety"]
            ),
            Product(
                id=14,
                name="Traditional Ragi Flour (Keppai)",
                category="Grains & Seeds",
                price=70,
                quantity_description="1kg bag",
                stock_quantity=16,
                color_theme="linear-gradient(135deg, #f5f5f4 0%, #d6d3d1 100%)",
                emoji="🌾",
                svg_path="M12 3v18M8 6l4-2 4 2M6 10l6-3 6 3M4 14l8-4 8 4M2 18l10-5 10 5",
                ingredients=["100% Organic Stone-Milled Finger Millet (Ragi/Keppai) flour"],
                benefits=["Exceptionally high Calcium content for bone strength", "Excellent low-glycemic meal options", "Provides highly bioavailable iron and protein"]
            ),
            Product(
                id=15,
                name="Tuticorin Sun-Dried Sea Salt",
                category="Superfoods",
                price=45,
                quantity_description="1kg pack",
                stock_quantity=30,
                color_theme="linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                emoji="🧂",
                svg_path="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-8a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z",
                ingredients=["100% Organic Unrefined Sea Salt harvested from solar pans in Tuticorin"],
                benefits=["Maintains natural trace sea minerals", "Free from chemical anti-caking or bleaching agents", "Supports optimal hydration and nerve functions"]
            )
        ]

        # Add products and commit
        print("Inserting organic products...")
        db.add_all(products_to_seed)
        db.commit()
        print("Database seeding completed successfully! Added 15 organic items.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_products()
