import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// Toast imports removed - toasts can interfere with modal behavior
import { CheckCircle, Mail, ArrowLeft, AlertCircle } from "lucide-react";

import { Redirect, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import AuthLayout from "@/components/AuthLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Form schemas
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  // Toast functionality removed
  const [location, setLocation] = useLocation();
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">(
    "signup",
  ); // Default to signup form
  const [isForgotSubmitted, setIsForgotSubmitted] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "", rememberMe: false });
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [loginError, setLoginError] = useState<string>("");
  const [registerError, setRegisterError] = useState<string>("");
  const isDevelopment =
    window.location.hostname === "localhost" ||
    window.location.hostname.includes("127.0.0.1");

  const forgotForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle mode query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get("mode");

    if (mode === "signup") {
      setAuthMode("signup");
    } else if (mode === "forgot") {
      setAuthMode("forgot");
    }
  }, []);

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/app" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(""); // Clear previous errors
    try {
      await loginMutation.mutateAsync({
        email: loginData.email,
        password: loginData.password,
        rememberMe: loginData.rememberMe,
      });
      console.log("Welcome back! Successfully logged in.");
      // Redirect to dashboard after successful login
      setLocation("/app");
    } catch (error: any) {
      console.error("Login failed:", error);

      // Check if we have detailed error info from the server
      const isDevelopment =
        window.location.hostname === "localhost" ||
        window.location.hostname.includes("127.0.0.1");
      let errorMessage =
        "Login failed. Please try again or contact support if the problem continues.";
      let developerDetails = null;

      // Handle different types of login errors
      if (
        error.message?.includes("Invalid email or password") ||
        error.message?.includes("401")
      ) {
        errorMessage =
          "Incorrect email or password. Please check your credentials and try again.";
      } else if (error.message?.includes("required")) {
        errorMessage = error.message;
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        errorMessage =
          "Connection error. Please check your internet connection and try again.";
      }

      // In development, show additional details if available
      if (isDevelopment && error.details) {
        developerDetails = error.details;
        console.log("Development error details:", developerDetails);
      }

      setLoginError(errorMessage);

      // Store developer details separately for optional display
      (window as any).lastLoginErrorDetails = developerDetails;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(""); // Clear previous errors
    try {
      await registerMutation.mutateAsync(registerData);
      console.log("Account created! Welcome to Public Prep.");
      // Redirect to dashboard after successful registration
      setLocation("/app");
    } catch (error: any) {
      console.error("Registration failed:", error);

      // Check if we have detailed error info from the server
      const isDevelopment =
        window.location.hostname === "localhost" ||
        window.location.hostname.includes("127.0.0.1");
      let errorMessage =
        "Registration failed. Please try again or contact support if the problem continues.";
      let developerDetails = null;

      // Handle different types of registration errors
      if (error.message?.includes("already exists")) {
        errorMessage =
          "An account with this email already exists. Please log in or use a different email address.";
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message?.includes("Password")) {
        errorMessage = error.message;
      } else if (error.message?.includes("required")) {
        errorMessage = error.message;
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        errorMessage =
          "Connection error. Please check your internet connection and try again.";
      }

      // In development, show additional details if available
      if (isDevelopment && error.details) {
        developerDetails = error.details;
        console.log("Development error details:", developerDetails);
      }

      setRegisterError(errorMessage);

      // Store developer details separately for optional display
      (window as any).lastRegisterErrorDetails = developerDetails;
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordForm) => {
    setIsForgotLoading(true);

    try {
      const response = await apiRequest(
        "POST",
        "/api/auth/forgot-password",
        data,
      );

      if (response) {
        setIsForgotSubmitted(true);
        console.log(
          "Reset link sent! Check your email for password reset instructions.",
        );
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      console.error("Error: Failed to send reset email. Please try again.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Render forgot password success state
  if (authMode === "forgot" && isForgotSubmitted) {
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
                Check your email
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                We've sent password reset instructions to your email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-6">
              <div className="glass rounded-xl p-4 border border-green-200/50">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong className="text-green-700">Next steps:</strong>
                  <br />
                  1. Check your email inbox
                  <br />
                  2. Click the reset link in the email
                  <br />
                  3. Enter your new password
                  <br />
                  4. Sign in with your new password
                </p>
              </div>

              <Button
                onClick={() => {
                  setAuthMode("login");
                  setIsForgotSubmitted(false);
                }}
                variant="outline"
                className="w-full h-12 border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-xl transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>

              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Didn't receive the email? Check your spam folder or try again in
                a few minutes.
              </p>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full">
        {authMode === "login" ? (
          <div className="auth-scale-in">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 shimmer"></div>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Welcome back
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="login-email"
                      className="text-gray-700 font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your.name@publicprep.ie"
                      value={loginData.email}
                      onChange={(e) => {
                        setLoginData({ ...loginData, email: e.target.value });
                        if (loginError) setLoginError(""); // Clear error on typing
                      }}
                      className="h-12 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl transition-all duration-300 hover:border-purple-300"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="login-password"
                      className="text-gray-700 font-medium"
                    >
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => {
                        setLoginData({
                          ...loginData,
                          password: e.target.value,
                        });
                        if (loginError) setLoginError(""); // Clear error on typing
                      }}
                      className="h-12 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl transition-all duration-300 hover:border-purple-300"
                      required
                    />
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={loginData.rememberMe}
                      onCheckedChange={(checked) =>
                        setLoginData({ ...loginData, rememberMe: !!checked })
                      }
                    />
                    <Label
                      htmlFor="remember-me"
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Remember me for 30 days
                    </Label>
                  </div>

                  {/* Login Error Message */}
                  {loginError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-red-700 text-sm font-medium">
                            {loginError}
                          </p>
                          {isDevelopment &&
                            (window as any).lastLoginErrorDetails && (
                              <details className="mt-2">
                                <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                                  Developer Details (Development Only)
                                </summary>
                                <pre className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 overflow-x-auto">
                                  {JSON.stringify(
                                    (window as any).lastLoginErrorDetails,
                                    null,
                                    2,
                                  )}
                                </pre>
                              </details>
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Logging in...
                      </div>
                    ) : (
                      "Sign In to Your Account"
                    )}
                  </Button>

                  <div className="flex justify-center space-x-4 text-sm pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("signup");
                        setLoginError(""); // Clear login errors when switching forms
                      }}
                      className="text-purple-600 hover:text-purple-700 font-medium underline underline-offset-4 transition-colors"
                    >
                      Need an account? Sign up here
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={() => setAuthMode("forgot")}
                      className="text-purple-600 hover:text-purple-700 font-medium underline underline-offset-4 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : authMode === "signup" ? (
          <div className="auth-scale-in">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 shimmer"></div>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Create an account
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Get started with your interview preparation journey
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-gray-700 font-medium"
                      >
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={registerData.firstName}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            firstName: e.target.value,
                          })
                        }
                        className="h-12 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl transition-all duration-300 hover:border-purple-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-gray-700 font-medium"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={registerData.lastName}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            lastName: e.target.value,
                          })
                        }
                        className="h-12 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl transition-all duration-300 hover:border-purple-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="register-email"
                      className="text-gray-700 font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your.name@publicprep.ie"
                      value={registerData.email}
                      onChange={(e) => {
                        setRegisterData({
                          ...registerData,
                          email: e.target.value,
                        });
                        if (registerError) setRegisterError(""); // Clear error on typing
                      }}
                      className="h-12 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl transition-all duration-300 hover:border-purple-300"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="register-password"
                      className="text-gray-700 font-medium"
                    >
                      Password
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a strong password"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          password: e.target.value,
                        })
                      }
                      className="h-12 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl transition-all duration-300 hover:border-purple-300"
                      required
                    />
                  </div>

                  {/* Registration Error Message */}
                  {registerError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-red-700 text-sm font-medium">
                            {registerError}
                          </p>
                          {isDevelopment &&
                            (window as any).lastRegisterErrorDetails && (
                              <details className="mt-2">
                                <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                                  Developer Details (Development Only)
                                </summary>
                                <pre className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 overflow-x-auto">
                                  {JSON.stringify(
                                    (window as any).lastRegisterErrorDetails,
                                    null,
                                    2,
                                  )}
                                </pre>
                              </details>
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating account...
                      </div>
                    ) : (
                      "Create Your Account"
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setRegisterError(""); // Clear registration errors when switching forms
                      }}
                      className="text-purple-600 hover:text-purple-700 font-medium underline underline-offset-4 transition-colors"
                    >
                      Already have an account? Sign in here
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Forgot Password Form
          <div className="auth-scale-in">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 shimmer"></div>
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center floating">
                  <Mail className="w-10 h-10 text-purple-600" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Forgot your password?
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <Form {...forgotForm}>
                  <form
                    onSubmit={forgotForm.handleSubmit(handleForgotPassword)}
                    className="space-y-5"
                  >
                    <FormField
                      control={forgotForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Email address
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your.name@publicprep.ie"
                              className="h-12 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl transition-all duration-300 hover:border-purple-300"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                      disabled={isForgotLoading}
                    >
                      {isForgotLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending reset link...
                        </div>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setAuthMode("login")}
                        className="text-purple-600 hover:text-purple-700 font-medium underline underline-offset-4 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2 inline" />
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
