from flask import Flask, request, jsonify, send_from_directory
from pymongo import MongoClient
from bson import ObjectId
import os
from datetime import datetime
from flask_cors import CORS
from flask_mail import Mail, Message

# Initialize Flask app
app = Flask(__name__)

# Add CORS support for development
CORS(app)

# Mail settings
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'neehapraveen.projects@gmail.com' 
app.config['MAIL_PASSWORD'] = 'ufnw eeed cdbk xhtv'     # Replace with your app password

mail = Mail(app)

# Use environment variables for MongoDB connection
MONGO_URI = os.environ.get('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client.blooming_dale

# Serve static files
@app.route('/')
def serve_static():
    return send_from_directory('static', 'index.html')

@app.route('/<path:filename>')
def serve_static_file(filename):
    return send_from_directory('static', filename)

# API routes with better error handling
@app.route('/api/products')
def get_products():
    products = list(db.Product.find())
    for product in products:
        product['_id'] = str(product['_id'])
    return jsonify(products)

@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        # Get the order data from request
        data = request.get_json()
        print("Received order data:", data)  # Debug log

        if not data or 'items' not in data or 'total_amount' not in data:
            return jsonify({"error": "Invalid order data"}), 400

        # Create order document
        order = {
            'total_amount': float(data['total_amount']),
            'status': 'pending',
            'created_at': datetime.utcnow(),
            'items': []
        }

        # Add items to order
        for item in data['items']:
            order_item = {
                'product_id': str(item['product_id']),  # Store as string
                'name': item['name'],
                'quantity': int(item['quantity']),
                'price': float(item['price'])
            }
            order['items'].append(order_item)

        print("Saving order:", order)  # Debug log

        # Insert order into database
        result = db.Order.insert_one(order)
        
        # Return success response
        return jsonify({
            'message': 'Order created successfully',
            'order_id': str(result.inserted_id)
        }), 201

    except Exception as e:
        print("Error creating order:", str(e))  # Debug log
        return jsonify({"error": str(e)}), 500

# Initialize database with sample products
def init_db():
    try:
        # Check existing products
        existing_products = db.Product.count_documents({})
        print(f"Existing products: {existing_products}")
        
        if existing_products == 0:
            sample_products = [
                {
                    'name': "Red Roses",
                    'price': 49.99,
                    'image': "./images/redroses.jpg"
                },
                {
                    'name': "White Roses",
                    'price': 39.99,
                    'image': "./images/whiteroses.jpg"
                },
                {
                    'name': "Tulips",
                    'price': 34.99,
                    'image': "./images/tulips.jpg"
                },
                {
                    'name': "White Lilies",
                    'price': 44.99,
                    'image': "./images/whitelilies.jpg"
                },
                {
                    'name': "Pink Lilies",
                    'price': 44.99,
                    'image': "./images/pinklilies.jpg"
                },
                {
                    'name': "Orchids",
                    'price': 44.99,
                    'image': "./images/orchids.jpg"
                }
            ]
            result = db.Product.insert_many(sample_products)
            print(f"Added {len(result.inserted_ids)} products to database")
            print("Sample products inserted successfully!")
    except Exception as e:
        print(f"Error initializing database: {e}")

# Initialize database
init_db()

# Add contact form endpoint
@app.route('/api/contact', methods=['POST'])
def handle_contact():
    try:
        data = request.get_json()
        
        # Create contact document
        contact = {
            'name': data['name'],
            'email': data['email'],
            'phone': data.get('phone', ''),
            'message': data['message'],
            'created_at': datetime.utcnow()
        }
        
        # Save to database
        db.Contact.insert_one(contact)
        return jsonify({"message": "Message sent successfully"}), 201
        
    except Exception as e:
        print(f"Error handling contact: {e}")
        return jsonify({"error": str(e)}), 500

# Add error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
