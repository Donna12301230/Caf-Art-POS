import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Palette, Users, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 coffee-gradient rounded-2xl flex items-center justify-center">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">CaféArt POS</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The comprehensive point-of-sale platform that brings together coffee culture and artistic creativity
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Coffee className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Coffee Shop POS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Complete point-of-sale system with order management, inventory tracking, and payment processing
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Palette className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-lg">Artist Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Platform for local artists to showcase and sell their artwork with automated commission tracking
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-secondary-foreground" />
              </div>
              <CardTitle className="text-lg">Multi-Role Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Role-based permissions for administrators, managers, and cashiers with secure authentication
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-chart-4" />
              </div>
              <CardTitle className="text-lg">Analytics & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comprehensive reporting on sales, inventory, and artist performance with real-time analytics
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-md mx-auto floating-card">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Sign in to access your CaféArt POS dashboard and start managing your coffee shop with creative flair.
              </p>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="w-full coffee-gradient text-white hover:opacity-90 transition-opacity"
                data-testid="button-login"
              >
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>CaféArt POS v2.1.0 - Bringing together coffee culture and artistic creativity</p>
        </div>
      </div>
    </div>
  );
}
