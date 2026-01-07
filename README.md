# QuikSkill LMS Frontend

React-based frontend for the QuikSkill Learning Management System.

## Features

- **Super Admin Onboarding Wizard**: Create and provision new tenant portals
- **GST Validation**: Real-time validation of Indian GST numbers
- **Provisioning Flow**: Visual feedback during tenant creation
- **Modern UI**: Built with Tailwind CSS and React Hooks
- **Clean Architecture**: Separated business logic and UI components

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file:

```env
VITE_API_URL=https://quikskillsbackend.moreyeahs.in
```

## Running the App

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   └── OnboardingWizard.tsx
├── pages/            # Page components
│   ├── SuperAdminOnboarding.tsx
│   └── Dashboard.tsx
├── hooks/            # Custom React hooks
│   └── useTenantOnboarding.ts
├── utils/            # Utility functions
│   ├── api.ts
│   └── gstValidator.ts
└── App.tsx           # Main app component
```

## GST Number Format

The GST validator follows the Indian GST format:
- 15 characters
- Pattern: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`
- Example: `27AABCU9603R1ZM`

