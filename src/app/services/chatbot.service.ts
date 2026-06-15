import { Injectable, inject } from '@angular/core';
import { ProductService, Product } from './product.service';
import { CartService } from './cart.service';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[]; // Quick-reply option suggestions
  matchedProduct?: Product; // For rendering a mini product card in chat log
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly apiService = inject(ApiService);

  constructor() {}

  // Generate chatbot response with a realistic delay to simulate typing
  async getResponse(query: string): Promise<ChatMessage> {
    const timestamp = new Date();
    const id = Math.random().toString(36).substring(2, 9);
    
    try {
      // 1. Call the backend AI endpoint
      const res = await firstValueFrom(this.apiService.queryChatbot(query));
      
      // 2. Resolve matched product if backend returned a product ID
      let matchedProduct: Product | undefined;
      if (res.matched_product_id) {
        matchedProduct = this.productService.getProducts().find(p => p.id === res.matched_product_id);
      }
      
      return {
        id,
        sender: 'bot',
        text: res.text,
        timestamp,
        suggestions: res.suggestions,
        matchedProduct
      };
    } catch (err) {
      console.error('AI Chatbot error, falling back to offline processing:', err);
      // 3. Fallback to local rule-based processor if backend is unreachable or errors out
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.processQuery(query));
        }, 500);
      });
    }
  }

  private processQuery(query: string): ChatMessage {
    const text = query.toLowerCase().trim();
    const id = Math.random().toString(36).substring(2, 9);
    const timestamp = new Date();

    // Default suggestions
    const defaultSuggestions = [
      'Tell me about Karupatti',
      'What are the benefits of Garlic?',
      'Do you have filter coffee?',
      'What are the delivery charges?',
      'Show products under ₹150'
    ];

    // 1. Greetings
    if (text === 'hi' || text === 'hello' || text === 'hey' || text === 'hello bot' || text === 'help') {
      return {
        id,
        sender: 'bot',
        text: 'Hello! I am Go-Bot, your Health Go organic wellness assistant. 🌿\n\nI can help you explore our farm-fresh products, explain their health benefits, list ingredients, or check shipping rates. What can I do for you today?',
        timestamp,
        suggestions: defaultSuggestions
      };
    }

    // 2. Shipping & Delivery
    if (text.includes('shipping') || text.includes('delivery') || text.includes('charge') || text.includes('cost') || text.includes('fee')) {
      const freeLimit = 500;
      const fee = 50;
      return {
        id,
        sender: 'bot',
        text: `We deliver in eco-friendly packaging across the region!\n\n• Orders above ₹${freeLimit}: FREE Delivery 🎉\n• Orders below ₹${freeLimit}: Flat delivery fee of ₹${fee}.\n\nYour current cart total is ₹${this.cartService.totalPrice()}.`,
        timestamp,
        suggestions: ['Show products under ₹150', 'Do you have filter coffee?']
      };
    }

    // 3. Price-based filtering queries (e.g. "under 150", "below 100", "cheap")
    const priceLimitMatch = text.match(/(?:under|below|less than|within)\s*(?:rs|inr|₹)?\s*(\d+)/i);
    if (priceLimitMatch) {
      const limit = parseInt(priceLimitMatch[1], 10);
      const matchingProducts = this.productService.getProducts().filter(p => p.price <= limit);
      
      if (matchingProducts.length > 0) {
        const productListString = matchingProducts.map(p => `• ${p.name} - ₹${p.price} (${p.quantity})`).join('\n');
        return {
          id,
          sender: 'bot',
          text: `Here are the organic products matching your budget of under ₹${limit}:\n\n${productListString}\n\nType a product's name to view its detailed ingredients or add it to your cart!`,
          timestamp,
          suggestions: [matchingProducts[0].name, 'What are the delivery charges?']
        };
      } else {
        return {
          id,
          sender: 'bot',
          text: `I couldn't find any products priced under ₹${limit}. Our lowest-priced item is ${this.getCheapestProduct().name} at ₹${this.getCheapestProduct().price}.`,
          timestamp,
          suggestions: ['Show products under ₹150']
        };
      }
    }

    if (text.includes('cheap') || text.includes('low price') || text.includes('affordable')) {
      const cheapest = this.getCheapestProduct();
      return {
        id,
        sender: 'bot',
        text: `Our most affordable organic item is ${cheapest.name} at ₹${cheapest.price} for a ${cheapest.quantity}. Would you like to check it out?`,
        timestamp,
        matchedProduct: cheapest,
        suggestions: ['Tell me about Pearl Millet', 'What are the delivery charges?']
      };
    }

    // 4. Product search matches (checking ingredients or names)
    const products = this.productService.getProducts();
    let matchedProduct: Product | undefined;

    // Search by exact name keyword match
    for (const p of products) {
      const nameParts = p.name.toLowerCase().split(/\s+/);
      const isMatch = nameParts.some(part => {
        // Skip common words
        if (part === 'organic' || part === 'fresh' || part === 'sweet' || part === 'powder' || part === 'traditional' || part === 'blend') {
          return false;
        }
        return text.includes(part);
      }) || text.includes(p.name.toLowerCase()) || (p.emoji && text.includes(p.emoji));

      if (isMatch) {
        matchedProduct = p;
        break;
      }
    }

    if (matchedProduct) {
      const p = matchedProduct;
      const detailsMsg = `Here are the details for ${p.name} (${p.quantity}):\n\n` +
                         `💰 Price: ₹${p.price}\n` +
                         `🌱 Ingredients: ${p.ingredients.join(', ')}\n` +
                         `💪 Benefits: \n${p.benefits.map(b => `  • ${b}`).join('\n')}\n\n` +
                         `You can add this product to your cart using the card below!`;

      return {
        id,
        sender: 'bot',
        text: detailsMsg,
        timestamp,
        matchedProduct: p,
        suggestions: ['Do you have filter coffee?', 'What are the delivery charges?']
      };
    }

    // 5. Query matches benefits or ingredients general keyword
    if (text.includes('benefit') || text.includes('health') || text.includes('good for')) {
      return {
        id,
        sender: 'bot',
        text: 'All our products have specific health benefits! Which item are you curious about?\n\nTry typing: "Tell me about Kambu", "What are the benefits of Garlic?", or "Why is Turmeric healthy?".',
        timestamp,
        suggestions: ['What are the benefits of Garlic?', 'Tell me about Karupatti']
      };
    }

    if (text.includes('ingredient') || text.includes('made of') || text.includes('contains')) {
      return {
        id,
        sender: 'bot',
        text: 'We focus on 100% clean, additive-free ingredients. Which product\'s ingredients would you like to inspect?\n\nTry typing: "Ingredients in Jasmine Tea" or "What is inside Kumbakonam Coffee?".',
        timestamp,
        suggestions: ['Do you have filter coffee?', 'Tell me about Karupatti']
      };
    }

    // 6. Fallback response
    return {
      id,
      sender: 'bot',
      text: `I'm not sure I understood that query correctly. 😅\n\nI can answer questions regarding product pricing, health benefits, ingredients, and delivery. Try selecting one of the suggested topics below:`,
      timestamp,
      suggestions: defaultSuggestions
    };
  }

  private getCheapestProduct(): Product {
    const products = this.productService.getProducts();
    return products.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
  }
}
