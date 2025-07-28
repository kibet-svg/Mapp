# 🌰 Carya - Job, Marketplace & Community Platform

Carya is a comprehensive platform that combines job posting, marketplace functionality, and real-time chat features with an elegant orange-themed design. Users can find jobs, buy/sell products and services, and connect with others through dedicated chat rooms.

## ✨ Features

### 🏢 Job Platform
- **Post & Browse Jobs**: Create detailed job postings with salary ranges, requirements, and benefits
- **Smart Filtering**: Filter jobs by category, type, location, and search terms
- **Social Features**: Like, comment, and share job posts
- **Application System**: Apply for jobs directly through the platform
- **Categories**: Technology, Design, Marketing, Sales, Healthcare, Education, Finance

### 🛒 Marketplace
- **Products & Services**: Sell physical products or offer services
- **Condition Ratings**: Rate products from new to poor condition
- **Price Filtering**: Search by price range and category
- **Reviews & Ratings**: Rate and review products/services
- **Favorites System**: Save items for later viewing

### 💬 Real-time Chat
- **Public Chat Rooms**: Join themed discussion rooms
- **Private Messaging**: Direct messaging between users
- **Room Categories**: General, Jobs, Marketplace, Tech, Design, Business
- **Real-time Updates**: Instant message delivery with Socket.IO
- **Room Management**: Create and manage chat rooms

### 🎨 Design Features
- **Orange Color Palette**: Modern, warm orange-themed design
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Accessibility**: Focus states and keyboard navigation support
- **Toast Notifications**: Real-time feedback for user actions

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- MongoDB (optional - will use in-memory storage if not available)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd carya
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

5. **Open your browser**
```
http://localhost:3000
```

## 🏗️ Architecture

### Backend Structure
```
server.js              # Main server file with Express & Socket.IO
models/
  ├── User.js          # User authentication & profiles
  ├── Job.js           # Job postings with comments & sharing
  ├── Product.js       # Marketplace items with reviews
  └── ChatRoom.js      # Chat rooms and messages
routes/
  ├── auth.js          # Authentication endpoints
  ├── jobs.js          # Job CRUD operations
  ├── marketplace.js   # Product/service operations
  └── chat.js          # Chat functionality
```

### Frontend Structure
```
public/
  ├── index.html       # Main HTML structure
  ├── styles.css       # Orange-themed CSS styles
  └── app.js           # Frontend JavaScript application
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - User logout

### Jobs
- `GET /api/jobs` - Get all jobs (with filtering)
- `POST /api/jobs` - Create new job posting
- `GET /api/jobs/:id` - Get specific job
- `PUT /api/jobs/:id` - Update job (owner only)
- `DELETE /api/jobs/:id` - Delete job (owner only)
- `POST /api/jobs/:id/apply` - Apply for job
- `POST /api/jobs/:id/like` - Like/unlike job
- `POST /api/jobs/:id/comment` - Add comment
- `POST /api/jobs/:id/share` - Share job

### Marketplace
- `GET /api/marketplace` - Get all products/services
- `POST /api/marketplace` - Create new listing
- `GET /api/marketplace/:id` - Get specific item
- `PUT /api/marketplace/:id` - Update listing
- `DELETE /api/marketplace/:id` - Delete listing
- `POST /api/marketplace/:id/review` - Add review
- `POST /api/marketplace/:id/favorite` - Add/remove favorite

### Chat
- `GET /api/chat/rooms` - Get public chat rooms
- `GET /api/chat/rooms/my` - Get user's joined rooms
- `POST /api/chat/rooms` - Create new room
- `GET /api/chat/rooms/:id` - Get room details & messages
- `POST /api/chat/rooms/:id/join` - Join room
- `POST /api/chat/rooms/:id/leave` - Leave room
- `POST /api/chat/rooms/:id/messages` - Send message

## 🎨 Orange Color Palette

The design uses a carefully crafted orange color scheme:

- **Primary Orange**: `#ff6b35` - Main actions and highlights
- **Primary Dark**: `#e55a2b` - Hover states and active elements  
- **Secondary Orange**: `#ffa726` - Secondary actions
- **Accent Orange**: `#ff9800` - Badges and ratings
- **Light Gradients**: Subtle orange gradients for backgrounds
- **Neutral Colors**: Gray scale for text and borders

## 🌐 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📱 Mobile Responsive

Carya is fully responsive with:
- Mobile-first CSS design
- Touch-friendly interface
- Optimized layouts for all screen sizes
- Progressive enhancement

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting (can be added)

## 🚀 Deployment

### Using Node.js
```bash
npm install
npm start
```

### Using Docker (optional)
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
```
PORT=3000
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=mongodb://localhost:27017/carya
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Font Awesome** for icons
- **Google Fonts** for Inter font family
- **Socket.IO** for real-time functionality
- **Express.js** for the robust backend framework
- **MongoDB** for flexible data storage

## 📞 Support

For support, email support@carya.com or create an issue in the repository.

---

**Built with ❤️ and lots of ☕ by the Carya Team** 
