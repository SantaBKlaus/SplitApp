# SplitBill - Fair Bill Splitting Made Easy

A collaborative bill-splitting web application built with Next.js and Firebase. Create rooms, add items, select what you consumed, and automatically calculate fair splits with your friends.

## Features

- 🔐 **Google Sign-In** - Secure authentication with Google
- 👥 **Guest Mode** - Join rooms without creating an account
- 🔗 **Shareable Links** - Easy room sharing via unique URLs
- ⚡ **Real-time Updates** - See changes instantly as others add items
- 💰 **Fair Splitting** - Automatic calculation based on consumption
- 📱 **Responsive Design** - Works on mobile, tablet, and desktop
- ✨ **Modern UI** - Beautiful glassmorphism design with smooth animations

## Prerequisites

- Node.js 18+ installed
- A Firebase project (free tier works fine)

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Authentication** with Google Sign-In:
   - Go to Authentication > Sign-in method
   - Enable Google provider
4. Create a **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in production mode (or test mode for development)
5. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Click the web icon (</>) to create a web app
   - Copy the configuration object

### 2. Local Project Setup

1. Navigate to the project directory:
```bash
cd "c:\Users\santa\OneDrive\Desktop\SPLIT APP\split-app"
```

2. Create a `.env.local` file in the root directory:
```bash
cp env.example .env.local
```

3. Edit `.env.local` and add your Firebase configuration:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Install dependencies (already done if you followed the setup):
```bash
npm install
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

### 1. Create a Room
- Sign in with your Google account
- Click "Create New Room" on the home page
- A unique shareable link is generated

### 2. Invite Friends
- Share the room link with your friends
- They can either sign in with Google or join as a guest

### 3. Add Items
- Each person adds the items they ordered
- Enter the item name and price
- Items appear in real-time for everyone

### 4. Select Your Items
- Check the boxes next to items you consumed
- Your share updates automatically
- See the total bill and your individual share

### 5. Submit & Split
- Once you're done selecting, click "Submit My Selections"
- When everyone submits, the split is complete
- See your final share amount

## Project Structure

```
split-app/
├── app/                    # Next.js app directory
│   ├── join/[roomId]/     # Room join page
│   ├── login/             # Login page
│   ├── room/[roomId]/     # Main room interface
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── AuthGuard.tsx     # Protected route wrapper
├── contexts/              # React contexts
│   └── AuthContext.tsx   # Authentication context
├── lib/                   # Utilities and helpers
│   ├── firebase/         # Firebase configuration
│   │   ├── auth.ts       # Authentication utils
│   │   ├── config.ts     # Firebase init
│   │   └── firestore.ts  # Database operations
│   └── calculations.ts   # Split calculations
└── env.example           # Environment variables template
```

## Key Technologies

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type safety
- **Firebase Auth** - Google Sign-In & Anonymous auth
- **Firestore** - Real-time database
- **Tailwind CSS** - Utility-first styling

## Build for Production

```bash
npm run build
npm start
```

## Deploy

### Vercel (Recommended)
1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
Works on any platform that supports Next.js (Netlify, AWS, etc.)

## Troubleshooting

**Firebase errors on load:**
- Make sure `.env.local` file exists with correct values
- Verify all Firebase services are enabled in your project

**Authentication not working:**
- Check that Google Sign-In is enabled in Firebase Console
- Ensure your domain is authorized in Firebase

**Real-time updates not working:**
- Verify Firestore rules allow read/write access
- Check browser console for errors

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
