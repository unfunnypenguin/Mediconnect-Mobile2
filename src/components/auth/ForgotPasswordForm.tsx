import React, { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeftIcon, LockIcon, MailIcon, ShieldIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

enum ResetStep {
  EMAIL = 'email',
  VERIFICATION = 'verification',
  NEW_PASSWORD = 'new_password',
  SUCCESS = 'success'
}

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const verificationSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormValues = z.infer<typeof emailSchema>;
type VerificationFormValues = z.infer<typeof verificationSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState<ResetStep>(ResetStep.EMAIL);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Email form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  // Verification form
  const verificationForm = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  });

  // New password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const handleRequestReset = async (values: EmailFormValues) => {
    setIsLoading(true);
    try {
      // Call our custom edge function to send verification code
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email: values.email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }
      
      setUserEmail(values.email);
      setCurrentStep(ResetStep.VERIFICATION);
      toast.success('Verification code sent', {
        description: `A 6-digit code has been sent to ${values.email}`,
      });
    } catch (error: any) {
      toast.error('Failed to send verification code', {
        description: error.message || 'Please try again later',
      });
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (values: VerificationFormValues) => {
    setIsLoading(true);
    
    try {
      // Just move to the next step, we'll verify when updating password
      setCurrentStep(ResetStep.NEW_PASSWORD);
    } catch (error: any) {
      toast.error('Invalid verification code', {
        description: 'Please check the code and try again',
      });
      console.error('Verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (values: PasswordFormValues) => {
    setIsLoading(true);
    
    try {
      // Call our custom edge function to verify code and update password
      const code = verificationForm.getValues().code;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-reset-code-and-update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          email: userEmail,
          code: code,
          newPassword: values.password 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      setCurrentStep(ResetStep.SUCCESS);
      toast.success('Password reset successful', {
        description: 'You can now log in with your new password',
      });
    } catch (error: any) {
      toast.error('Failed to reset password', {
        description: error.message || 'Please try again later',
      });
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    setIsLoading(true);
    
    try {
      // Call our custom edge function to send verification code again
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email: userEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification code');
      }
      
      toast.success('Verification code resent', {
        description: `A new code has been sent to ${userEmail}`,
      });
    } catch (error: any) {
      toast.error('Failed to resend code', {
        description: error.message || 'Please try again later',
      });
      console.error('Resend verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in p-4 sm:p-6 md:p-8">
      <div className="text-center mb-6 md:mb-8">
        {currentStep === ResetStep.EMAIL && (
          <>
            <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight mb-2">Forgot Password?</h1>
            <p className="text-sm text-muted-foreground">Enter your email to receive a password reset code.</p>
          </>
        )}
        {currentStep === ResetStep.VERIFICATION && (
          <>
            <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight mb-2">Verify Code</h1>
            <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to {userEmail}.</p>
          </>
        )}
        {currentStep === ResetStep.NEW_PASSWORD && (
          <>
            <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight mb-2">New Password</h1>
            <p className="text-sm text-muted-foreground">Set your new password.</p>
          </>
        )}
        {currentStep === ResetStep.SUCCESS && (
          <>
            <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight mb-2">Password Reset!</h1>
            <p className="text-sm text-muted-foreground">Your password has been successfully reset.</p>
          </>
        )}
      </div>

      {currentStep === ResetStep.EMAIL && (
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(handleRequestReset)} className="space-y-4">
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 text-base"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Sending Code...</span>
              ) : (
                <>Send Reset Code <MailIcon className="ml-2 h-4 w-4" /></>
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={onBack} className="w-full mt-2">
              <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Login
            </Button>
          </form>
        </Form>
      )}

      {currentStep === ResetStep.VERIFICATION && (
        <Form {...verificationForm}>
          <form onSubmit={verificationForm.handleSubmit(handleVerifyCode)} className="space-y-4">
            <FormField
              control={verificationForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="code">Verification Code</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field} className="w-full justify-center">
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <div className="mx-2">-</div>
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Verifying...</span>
              ) : (
                <>Verify Code <ShieldIcon className="ml-2 h-4 w-4" /></>
              )}
            </Button>
            <Button type="button" variant="link" onClick={resendVerificationCode} className="w-full mt-2 text-sm">
              Resend Code
            </Button>
            <Button type="button" variant="ghost" onClick={onBack} className="w-full mt-2">
              <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Login
            </Button>
          </form>
        </Form>
      )}

      {currentStep === ResetStep.NEW_PASSWORD && (
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(handleResetPassword)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="new-password">New Password</FormLabel>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                        className="pl-10 text-base"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="confirm-password">Confirm New Password</FormLabel>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        className="pl-10 text-base"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Resetting Password...</span>
              ) : (
                <>Reset Password <LockIcon className="ml-2 h-4 w-4" /></>
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={onBack} className="w-full mt-2">
              <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Login
            </Button>
          </form>
        </Form>
      )}

      {currentStep === ResetStep.SUCCESS && (
        <div className="text-center space-y-6">
          <div className="bg-green-100 text-green-700 p-4 rounded-lg flex items-center justify-center gap-2">
            <ShieldIcon className="h-6 w-6" />
            <span>Success!</span>
          </div>
          <Button onClick={onBack} className="w-full">
            Back to Login
          </Button>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
