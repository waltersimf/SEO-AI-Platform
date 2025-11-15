import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-4xl text-center space-y-8">
        <div className="flex justify-center mb-8">
          <Icons.logo className="h-20 w-20 text-primary" />
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Welcome to <span className="text-primary">Forgeline</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          SEO AI Platform - Team collaboration with AI teammate for agencies
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link href="/auth/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">🤖 AI Teammate</h3>
            <p className="text-sm text-muted-foreground">
              AI that participates in team chat, analyzes data, and creates tasks
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">📊 Real-time Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Google Search Console, Analytics, PageSpeed, and more
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">✅ Task Management</h3>
            <p className="text-sm text-muted-foreground">
              Built-in task manager with AI-powered planning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
