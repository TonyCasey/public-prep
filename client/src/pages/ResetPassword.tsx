import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
// Toast system disabled to prevent modal interference
import { apiRequest } from "@/lib/queryClient";
import AuthLayout from "@/components/AuthLayout";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password confirmation is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [location] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  // Toast disabled to prevent modal interference

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Extract token from URL query parameters
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const resetToken = urlParams.get('token');
    
    if (!resetToken) {
      setTokenError("Invalid reset link. Please request a new password reset.");
      return;
    }
    
    setToken(resetToken);
  }, [location]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      console.error("Invalid reset token");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/reset-password', {
        token,
        newPassword: data.newPassword
      });
      
      if ((response as any).message) {
        setIsSubmitted(true);
        console.log("Password updated successfully");
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      const errorMessage = error.message || "Failed to reset password. Please try again.";
      
      if (errorMessage.includes("Invalid or expired")) {
        setTokenError("This reset link has expired or is invalid. Please request a new password reset.");
      } else {
        console.error("Reset password error:", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenError) {
    return (
      <AuthLayout showHero={false}>
        <div className="auth-scale-in">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 shimmer"></div>
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center floating">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Invalid reset link
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                {tokenError}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-6">
              <Link href="/forgot-password">
                <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                  Request New Reset Link
                </Button>
              </Link>
              
              <Link href="/auth">
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-gray-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    );
  }

  if (isSubmitted) {
    return (
      <AuthLayout showHero={false}>
        <div className="auth-scale-in">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 shimmer"></div>
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center floating">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Password updated!
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Your password has been successfully updated. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Link href="/auth">
                <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                  Sign In Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="auth-scale-in">
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 shimmer"></div>
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center floating">
              <Lock className="w-10 h-10 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Reset your password
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Enter your new password below. Make sure it's secure and easy to remember.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">New password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your new password"
                          {...field}
                          disabled={isLoading}
                          className="h-12 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl transition-all duration-300 hover:border-purple-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Confirm new password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your new password"
                          {...field}
                          disabled={isLoading}
                          className="h-12 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl transition-all duration-300 hover:border-purple-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  disabled={isLoading || !token}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating password...
                    </div>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <Link href="/auth">
                  <span className="text-purple-600 hover:text-purple-500 font-medium cursor-pointer hover:underline transition-all duration-200">
                    Sign in here
                  </span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}