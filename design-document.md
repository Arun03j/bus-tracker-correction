# Live Location Tracking Design Document

## 1. Introduction
This document outlines the design and implementation plan for integrating live location tracking into the bus tracking application. The primary goal is to allow specific, authorized users to share their real-time location (latitude and longitude) from their mobile devices, store this data in a Firestore database, and display it on the map alongside existing bus data. Additionally, the user interface will be adjusted to accommodate these new features, including moving the account profile to the left side, below the bus tracker title.

## 2. Requirements

### 2.1 Functional Requirements
- **User Opt-in for Location Sharing**: Only designated users (verified by email) can enable live location sharing.
- **Real-time Location Updates**: The application must capture and transmit the user's current latitude and longitude at regular intervals.
- **Firestore Data Storage**: Live location data must be stored securely in a Firestore collection, associated with the user's ID.
- **Map Integration**: The live location of authorized users must be displayed on the map as distinct markers.
- **Admin Control**: The system should allow administrators to designate which users are authorized to share their location (via email verification).
- **UI Adjustment**: The user account profile section needs to be relocated to the left sidebar, below the main bus tracker title.

### 2.2 Non-Functional Requirements
- **Performance**: Location updates should be near real-time with minimal latency.
- **Security**: User location data must be protected and accessible only to authorized personnel.
- **Privacy**: Clear consent mechanisms for location sharing must be in place.
- **Scalability**: The system should be able to handle a growing number of users and location updates.
- **Battery Efficiency**: Location tracking should be optimized to minimize battery consumption on mobile devices.

## 3. Technical Design

### 3.1 Firebase Firestore Data Model
We will create a new Firestore collection, e.g., `userLocations`, to store the live location data. Each document in this collection will represent a user's current location.

**`userLocations` Collection Structure:**
- **Document ID**: `[user_uid]` (Firebase Authentication User ID)
- **Fields:**
    - `latitude`: `number` (Current latitude of the user)
    - `longitude`: `number` (Current longitude of the user)
    - `timestamp`: `timestamp` (Server timestamp of the last update)
    - `email`: `string` (User's email, for easy identification and permission management)

### 3.2 Firebase Security Rules
Firestore security rules will be crucial to ensure that:
- Users can only write to their own `userLocations` document.
- Only authenticated users can read from the `userLocations` collection.
- An additional rule will be implemented to restrict location sharing to specific, pre-approved email addresses. This will be managed by a separate collection, e.g., `authorizedLocationSharers`.

**`authorizedLocationSharers` Collection Structure:**
- **Document ID**: `[user_email]` (User's email address)
- **Fields:**
    - `authorized`: `boolean` (True if authorized, false otherwise)

### 3.3 Live Location Sharing (Frontend)

#### 3.3.1 User Permissions and Opt-in
- Upon login, the application will check if the authenticated user's email is present and marked as `authorized: true` in the `authorizedLocationSharers` collection.
- If authorized, a UI element (e.g., a toggle switch or button) will be displayed, allowing the user to enable/disable live location sharing.
- Before enabling, the application will request browser/device location permissions.

#### 3.3.2 Geolocation API
- The browser's `Geolocation API` (`navigator.geolocation.watchPosition`) will be used to get continuous location updates.
- Error handling for permission denial or location unavailability will be implemented.

#### 3.3.3 Sending Data to Firestore
- Location updates will be debounced or throttled to avoid excessive writes to Firestore and conserve battery.
- The `latitude`, `longitude`, `timestamp`, and `email` will be sent to the `userLocations` collection using Firebase SDK.

### 3.4 Displaying Live Locations on Map (Frontend)
- The `BusMap.jsx` component will be updated to fetch data from the `userLocations` collection in real-time using Firestore listeners.
- Custom markers will be used to differentiate user locations from bus locations.
- The map will dynamically update as user locations change.

### 3.5 UI Adjustments
- The `UserProfile` component will be moved from its current position to the left sidebar, below the `Bus Tracker` title.
- This will involve modifying the `App.jsx` layout and potentially adjusting CSS for proper alignment and responsiveness.

## 4. Implementation Plan (Phased Approach)

### Phase 1: Plan and Design Location Tracking & Permissions (Current Phase)
- Research best practices for mobile location tracking and battery optimization.
- Define Firestore data models and security rules for `userLocations` and `authorizedLocationSharers`.
- Outline UI/UX for location sharing opt-in and status display.

### Phase 2: Implement Backend for User Permissions
- Set up Firestore security rules for `userLocations` and `authorizedLocationSharers`.
- Create a mechanism (e.g., a simple admin interface or direct Firestore entry) to manage `authorizedLocationSharers`.

### Phase 3: Implement Frontend for Live Location Sharing
- Implement the `Geolocation API` to get user location.
- Develop logic to check user authorization for location sharing.
- Create UI for location sharing opt-in/opt-out.
- Implement Firestore write operations for `userLocations` with throttling.

### Phase 4: Update Map to Display Live User Locations
- Modify `BusMap.jsx` to fetch and display `userLocations` from Firestore.
- Add distinct markers for user locations.
- Ensure real-time updates for user markers.

### Phase 5: Adjust UI for Account Profile
- Relocate `UserProfile` component to the left sidebar.
- Adjust layout and styling in `App.jsx` and `App.css` to accommodate the new placement.

### Phase 6: Test and Deploy
- Thoroughly test all new features: location sharing, data storage, map display, and UI changes.
- Deploy the updated application.

