import './globals.css';

export const metadata = {
  title: 'LifeOS — Autonomous Productivity',
  description: 'LifeOS: Connect Gmail and Google Calendar to orchestrate your deep work automatically.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
