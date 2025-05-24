# TexTurn Hub - Next.js Application

A Next.js application for managing textile waste, facilitating waste exchanges, and showcasing products made from recycled materials.

## Features

- User authentication with role-based access control (admin, company, artisan, user)
- Company profiles for textile waste providers
- Artisan profiles for creators of recycled products
- Textile waste management and marketplace
- Product creation and showcase
- Messaging system for communication between users
- File upload system for images

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js
- **File Storage**: Local filesystem (configurable for cloud storage)

## Prerequisites

- Node.js (v18 or higher)
- MySQL database
- npm or yarn

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/texturn_hub_next.git
   cd texturn_hub_next
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/texturn-hub"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_NAME="TexTurn Hub"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_STORAGE_PROVIDER="local"
   ```

4. Set up the database:
   ```
   npm run prisma:migrate
   npm run db:seed
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.


## Migration from Laravel

This Next.js application is a migration from a Laravel-based version of TexTurn Hub. If you're migrating from the Laravel application, follow these steps:

1. Set up both applications on your local machine
2. Configure the environment variables in `.env.local` for both database connections
3. Run the migration process using the provided scripts

For detailed migration instructions, refer to the [MIGRATION.md](MIGRATION.md) document.

The migration process includes:
- Database schema conversion from Laravel Eloquent to Prisma
- Data migration from the Laravel database to the Next.js database
- File transfer for uploaded images and assets
- Authentication system migration from Laravel Sanctum to NextAuth.js

## Default Users

After running the seed script, the following users will be available:

- Admin: admin@example.com / admin123
- Company: company@example.com / company123
- Artisan: artisan@example.com / artisan123
- Regular user: user@example.com / user123

## Folder Structure

- `app/` - Next.js application code (pages, components, etc.)
- `app/api/` - API routes
- `prisma/` - Prisma schema and migrations
- `lib/` - Utility functions and helpers
- `public/` - Static assets
- `types/` - TypeScript type definitions

## Development

- Database UI: `npm run prisma:studio`
- Lint code: `npm run lint`
- Build for production: `npm run build`
- Start production server: `npm run start`

## License

MIT