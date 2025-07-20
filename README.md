# Bus Tracker - Real-time Bus Location Tracking

A modern, responsive web application for tracking bus locations in real-time using Firebase Firestore database and interactive maps.

## Features

### 🚌 Real-time Bus Tracking
- Live bus location updates from Firestore database
- Interactive map with custom bus markers
- Real-time data synchronization

### 🗺️ Interactive Map
- OpenStreetMap integration using Leaflet
- Zoom and pan capabilities
- Custom bus icons with status indicators
- Click-to-select bus functionality

### 📱 Responsive Design
- Mobile-first responsive layout
- Collapsible sidebar for mobile devices
- Touch-friendly interface
- Optimized for all screen sizes

### 🎯 Bus Management
- Bus list with status indicators
- Detailed bus information panel
- Search and filter capabilities
- Connection status monitoring

## Technology Stack

- **Frontend**: React 19 with Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Maps**: Leaflet + React Leaflet
- **Database**: Firebase Firestore
- **Icons**: Lucide React
- **Build Tool**: Vite

## Firebase Firestore Data Structure

The application expects bus data in the following format:

```json
{
  "buses": {
    "bus-001": {
      "busId": "B001",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "route": "Route 1",
      "status": "active",
      "speed": 25,
      "heading": 90,
      "lastUpdated": "2025-06-24T19:30:00Z"
    }
  }
}
```

### Required Fields
- `latitude` (number): Bus latitude coordinate
- `longitude` (number): Bus longitude coordinate
- `status` (string): Bus status ("active", "inactive", "maintenance")

### Optional Fields
- `busId` (string): Human-readable bus identifier
- `route` (string): Bus route information
- `speed` (number): Current speed in km/h
- `heading` (number): Direction in degrees (0-360)
- `lastUpdated` (timestamp): Last update timestamp

## Setup Instructions

### 1. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore database
3. Update the Firebase configuration in `src/lib/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 2. Firestore Security Rules

Set up Firestore security rules to allow read access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /buses/{document} {
      allow read: if true;
      allow write: if false; // Adjust based on your needs
    }
  }
}
```

### 3. Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

## Demo Data

The application includes demo data for testing purposes when no real Firestore data is available. This includes three sample buses with different statuses and locations in the New York City area.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Features

- Real-time data synchronization
- Efficient marker updates
- Responsive image loading
- Optimized bundle size

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

