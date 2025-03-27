import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Construction Quotes',
  description: 'Create and manage quotes for construction projects',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
