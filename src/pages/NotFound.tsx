import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-2xl text-muted-foreground">Page not found</p>
        <p className="text-sm text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="pt-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            ← Return to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
