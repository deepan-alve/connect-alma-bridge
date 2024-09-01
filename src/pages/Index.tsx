import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, TrendingUp, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    message: string;
    details?: string;
  }>({ connected: false, message: "Testing connection..." });

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log("🔍 Testing Supabase connection...");
        console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
        console.log("Supabase Key exists:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
        
        // Test 1: Check if client is created
        if (!supabase) {
          setDbStatus({ 
            connected: false, 
            message: "❌ Supabase client not initialized",
            details: "Check src/lib/supabase.ts"
          });
          console.error("❌ Supabase client is null");
          return;
        }

        // Test 2: Try to query a table (we'll use skills table)
        const { data, error } = await supabase
          .from('skills')
          .select('count');
        
        if (error) {
          console.error("❌ Supabase connection error:", error);
          setDbStatus({ 
            connected: false, 
            message: `❌ Connection Failed: ${error.message}`,
            details: error.hint || "Check your .env.local credentials and database setup"
          });
          return;
        }

        console.log("✅ Supabase connected successfully!");
        console.log("Skills table data:", data);
        setDbStatus({ 
          connected: true, 
          message: "✅ Supabase Connected Successfully!",
          details: `Database is ready. ${data?.[0]?.count || 0} skills in database.`
        });

      } catch (err: any) {
        console.error("❌ Unexpected error:", err);
        setDbStatus({ 
          connected: false, 
          message: "❌ Connection Error",
          details: err.message || "Unknown error occurred"
        });
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      
      <div className="container mx-auto px-4 py-12">
        {/* Database Connection Status */}
        <Card className={`mb-6 ${dbStatus.connected ? 'border-green-500' : 'border-yellow-500'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${dbStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              <div className="flex-1">
                <p className="font-semibold">{dbStatus.message}</p>
                {dbStatus.details && (
                  <p className="text-sm text-muted-foreground mt-1">{dbStatus.details}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">+12 this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alumni Network</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,845</div>
              <p className="text-xs text-muted-foreground">Active members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">Students placed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Rated</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8/5</div>
              <p className="text-xs text-muted-foreground">Platform rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Featured Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Explore Job Opportunities
              </CardTitle>
              <CardDescription>
                Discover exclusive positions posted by alumni and partner companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Access a curated job board with opportunities specifically tailored for our alumni network. 
                Connect directly with hiring managers and get referrals from fellow alumni.
              </p>
              <Button asChild className="w-full">
                <Link to="/jobs">Browse Jobs</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Connect with Alumni
              </CardTitle>
              <CardDescription>
                Network with professionals who share your background
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Build meaningful connections with alumni across industries. Get mentorship, 
                career advice, and insights from those who've walked the path before you.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/profile">View Profiles</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
