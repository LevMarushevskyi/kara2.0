import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Code2, Sparkles, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Code2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Your App</span>
          </div>
          <Button variant="ghost" size="sm">
            Get Started
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm font-medium mb-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Ready to build something amazing</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            Your Blank Canvas
            <span className="block text-muted-foreground mt-2">Starts Here</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-900">
            A modern React template with everything you need to start building. 
            Beautiful design system, powerful components, and ready to customize.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
              Start Building
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              View Docs
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-7 duration-1100">
            <Card className="p-6 hover:shadow-lg transition-shadow bg-card/50 backdrop-blur border-border/50">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Built with Vite for instant hot reload and optimized production builds.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-card/50 backdrop-blur border-border/50">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Beautiful UI</h3>
              <p className="text-sm text-muted-foreground">
                Powered by Tailwind CSS and Shadcn UI with a thoughtful design system.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-card/50 backdrop-blur border-border/50">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Type Safe</h3>
              <p className="text-sm text-muted-foreground">
                Full TypeScript support with excellent developer experience.
              </p>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 mt-12 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Built with Lovable</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">About</a>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
