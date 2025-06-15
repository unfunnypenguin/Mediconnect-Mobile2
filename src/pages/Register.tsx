import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import { ActivityIcon } from 'lucide-react';

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/70 backdrop-blur-lg">
        <div className="container flex h-14 items-center px-4">
          <div className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-display font-semibold">MediConnect</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <RegisterForm />
        </div>
      </main>
      
      <footer className="py-4 border-t bg-muted/40">
        <div className="container px-4">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} MediConnect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Register;
