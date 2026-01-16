import Link from 'next/link'
import './globals.css'

export default function NotFound() {
  return (
    <html lang="en">
        <body>
            <div className="flex flex-col items-center justify-center min-h-screen text-center bg-primary text-white">
              <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
              <p className="text-lg mb-8">The page you are looking for does not exist.</p>
              <Link href="/" className="px-6 py-2 text-lg font-semibold text-primary bg-white rounded-md hover:bg-gray-200">
                Go back home
              </Link>
            </div>
        </body>
    </html>
  );
}
