# Construction Quote Manager

A modern web application for construction workers to create and manage job quotes. Built with Next.js, tRPC, and Drizzle ORM.

## Features

- Create and manage professional job quotes
- Track tasks, materials, and costs
- Modern UI with NextUI components
- Dark mode support
- Fully responsive design
- Type-safe API with tRPC
- SQLite database with Drizzle ORM

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [tRPC](https://trpc.io/) - End-to-end typesafe APIs
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [NextUI](https://nextui.org/) - Modern UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Zod](https://zod.dev/) - Schema validation
- [SQLite](https://www.sqlite.org/) - Database

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/construction-quote-manager.git
   cd construction-quote-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/              # Next.js app directory
├── components/       # React components
├── server/          # Server-side code
│   ├── api/         # tRPC API routes
│   └── db/          # Database schema and migrations
└── utils/           # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
