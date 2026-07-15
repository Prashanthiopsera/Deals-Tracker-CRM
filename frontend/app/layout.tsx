import './globals.css';

export const metadata = {
  title: 'P7VC CRM',
  description: 'Deal tracking and relationship intelligence for P7VC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
