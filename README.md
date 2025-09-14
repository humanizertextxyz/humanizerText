# AI Text Humanizer

Transform AI-generated content into natural, human-like text that passes all detection tools.

## 🚀 Live Application

**Live Demo**: https://humanizertext-551ee.web.app

## ✨ Features

### AI Text Humanization
- **Advanced Humanization**: Transform AI-generated text into natural, human-like content
- **Multiple Writing Styles**: Professional, Casual, Academic, Creative
- **Custom Instructions**: Add specific requirements for your content
- **Word Count Tracking**: Monitor usage with daily/monthly limits

### AI Detection
- **ZeroGPT Integration**: Real-time AI detection using ZeroGPT API
- **Detailed Analysis**: Get comprehensive feedback on text authenticity
- **Multiple Detection Services**: Simulated results from various AI detection tools
- **Highlighted Sentences**: See which parts are flagged as AI-generated

### User Management
- **Authentication**: Secure signup/login with email or Google
- **Subscription Tiers**: Free, Pro, Premium, and Platinum plans
- **Usage Tracking**: Monitor daily and monthly word usage
- **History**: Save and manage your humanization history

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Material-UI** for responsive design
- **Firebase Authentication** for user management
- **Firebase Firestore** for data storage

### Backend
- **Firebase Functions** for serverless backend
- **ZeroGPT API** for AI detection
- **Firebase Hosting** for deployment

### Database Structure
```typescript
users/{userId}/
  - email: string
  - displayName: string
  - createdAt: timestamp
  - subscription: { type, status, stripeCustomerId?, currentPeriodEnd? }
  - usage: { dailyWordsUsed, monthlyWordsUsed, lastResetDate }

history/{historyId}/
  - userId, originalText, humanizedText, timestamp
  - wordCount, writingStyle, textLength, customInstructions?
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Firebase CLI
- Python 3.7+ (for AI detection scripts)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/humanizertextxyz/humanizer.git
   cd humanizer
   ```

2. **Install frontend dependencies**
   ```bash
   cd humanizer-frontend
   npm install
   ```

3. **Install Firebase Functions dependencies**
   ```bash
   cd ../functions
   npm install
   ```

4. **Set up Firebase**
   ```bash
   firebase login
   firebase use your-project-id
   ```

5. **Deploy**
   ```bash
   # Deploy functions
   firebase deploy --only functions
   
   # Build and deploy frontend
   cd ../humanizer-frontend
   npm run build
   cd ..
   firebase deploy --only hosting
   ```

## 📁 Project Structure

```
humanizer/
├── humanizer-frontend/     # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── pages/          # Application pages
│   │   ├── firebase/       # Firebase configuration
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── functions/              # Firebase Cloud Functions
│   └── src/
│       └── index.ts        # Function definitions
├── public/                 # Static hosting files
└── *.py                    # Python AI detection scripts
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication, Firestore, Functions, and Hosting
3. Update `humanizer-frontend/src/firebase/config.ts` with your config
4. Deploy Firestore rules and indexes

### ZeroGPT Integration
The AI detection feature uses ZeroGPT's API through Firebase Functions to:
- Maintain API security
- Handle rate limiting
- Store detection history
- Provide detailed analysis results

## 📊 Subscription Plans

| Plan | Price | Daily Words | Monthly Words | Features |
|------|-------|-------------|---------------|----------|
| Free | $0 | 1,500 | - | Basic humanization, AI detection |
| Pro | $19.99 | - | 20,000 | Advanced options, priority support |
| Premium | $29.99 | - | 50,000 | Unlimited processing, API access |
| Platinum | $49.99 | - | 150,000 | White-label options, premium support |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Application**: https://humanizertext-551ee.web.app
- **Firebase Console**: https://console.firebase.google.com/project/humanizertext-551ee/overview
- **GitHub Repository**: https://github.com/humanizertextxyz/humanizer

## 📞 Support

For support, email support@humanizertext.com or create an issue in this repository.
