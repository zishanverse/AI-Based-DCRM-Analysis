# EstatePro - Premium Real Estate Platform

A full-stack real estate application built with Next.js 15, TypeScript, and modern web technologies. This platform showcases properties, manages client testimonials, and provides comprehensive admin functionality.

## 🏠 Features

### Landing Page
- **Consultation Form**: Users can submit their contact information for property consultations
- **Why Choose Us**: Highlights key benefits including Potential ROI, Design, and Marketing services
- **Our Projects**: Dynamic display of real estate projects fetched from the database
- **Happy Clients**: Client testimonials with images and descriptions
- **Newsletter Subscription**: Email subscription functionality with backend integration

### Admin Panel
- **Project Management**: Add new projects with images, names, and descriptions
- **Client Management**: Add client testimonials with images and designations
- **Contact Form Details**: View all contact form submissions
- **Newsletter Subscribers**: Manage and view all subscribed email addresses

### Technical Features
- **Image Processing**: Automatic image cropping and optimization (450x350) using Sharp
- **Animations**: Smooth scroll animations using GSAP and Framer Motion
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Database**: SQLite with Prisma ORM for data management
- **Toast Notifications**: User feedback with shadcn/ui toast components

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (New York style)
- **Database**: SQLite with Prisma ORM
- **Animations**: GSAP and Framer Motion
- **Image Processing**: Sharp
- **Icons**: Lucide React

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:push
   ```

4. Seed the database with sample data:
   ```bash
   npx tsx prisma/seed.ts
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## 🗂️ Project Structure

```
src/
├── app/
│   ├── admin/                 # Admin panel routes
│   ├── api/                   # API routes
│   │   ├── projects/         # Project CRUD operations
│   │   ├── clients/          # Client CRUD operations
│   │   ├── contact/          # Contact form submissions
│   │   ├── newsletter/       # Newsletter subscriptions
│   │   └── upload/           # Image upload with processing
│   ├── page.tsx              # Landing page
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── Navigation.tsx        # Navigation component
├── hooks/
│   └── use-toast.ts          # Toast notification hook
└── lib/
    └── db.ts                 # Prisma database client
```

## 🚀 Usage

### Landing Page
- Visit `/` to see the main landing page
- Fill out the consultation form to submit contact information
- Browse projects and client testimonials
- Subscribe to the newsletter

### Admin Panel
- Visit `/admin` to access the admin panel
- Add new projects with images and descriptions
- Add client testimonials
- View contact form submissions
- Manage newsletter subscribers

## 📊 Database Schema

The application uses the following main models:

- **Project**: Real estate projects with name, description, and image
- **Client**: Client testimonials with name, description, designation, and image
- **ContactForm**: Contact form submissions with user details
- **Newsletter**: Newsletter subscriber email addresses

## 🎨 Design Features

- **Responsive Design**: Optimized for all screen sizes
- **Modern UI**: Clean, professional interface using shadcn/ui
- **Smooth Animations**: Engaging scroll animations and transitions
- **Accessibility**: Semantic HTML and ARIA support
- **Dark Mode Ready**: Theme support infrastructure

## 📝 Additional Features Implemented

### Image Cropping
- Automatic image processing to 450x350 pixels
- Maintains aspect ratio and quality
- Optimized for web performance

### Animations
- GSAP for hero section animations
- Framer Motion for component transitions
- Intersection Observer for scroll-triggered animations

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes

### Environment Variables
The application uses a `.env` file for database configuration:
```
DATABASE_URL="file:./dev.db"
```

## 📸 Screenshots

The landing page includes:
- Hero section with consultation form
- Service highlights section
- Project gallery
- Client testimonials
- Newsletter subscription

The admin panel provides:
- Tabbed interface for different management sections
- Form inputs for adding projects and clients
- Data tables for viewing submissions and subscribers
- Image upload with preview functionality

## 🤝 Contributing

This project is part of a full-stack development assessment. It demonstrates proficiency in modern web development technologies and best practices.

## 📄 License

This project is for educational and assessment purposes.