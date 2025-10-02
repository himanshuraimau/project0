"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, User } from "lucide-react";

interface DatabaseUser {
  id: string;
  email: string | null;
  creditBalance: number;
  createdAt: string;
  updatedAt: string;
}

export function UserSyncStatus() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatabaseUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      
      if (response.ok) {
        setDbUser(data.user);
      } else {
        setError(data.error || 'Failed to fetch user data');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching database user:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUserInDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.emailAddresses?.[0]?.emailAddress
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDbUser(data.user);
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error creating database user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchDatabaseUser();
    }
  }, [isLoaded, user]);

  if (!isLoaded || !user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading user data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Sync Status
        </CardTitle>
        <CardDescription>
          Check if your Clerk user is properly synced with the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Clerk User Info */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">CLERK USER</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Connected</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div><strong>ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.emailAddresses?.[0]?.emailAddress || 'No email'}</div>
              <div><strong>Created:</strong> {new Date(user.createdAt!).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Database User Info */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">DATABASE USER</h4>
          
          {loading ? (
            <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Checking database...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Error</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <Button 
                onClick={createUserInDatabase}
                size="sm" 
                className="mt-3"
              >
                Create User in Database
              </Button>
            </div>
          ) : dbUser ? (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Synced</span>
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 space-y-1">
                <div><strong>ID:</strong> {dbUser.id}</div>
                <div><strong>Email:</strong> {dbUser.email || 'No email'}</div>
                <div><strong>Credits:</strong> {dbUser.creditBalance.toLocaleString()}</div>
                <div><strong>Created:</strong> {new Date(dbUser.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Not Found</span>
              </div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
                User exists in Clerk but not in database
              </p>
              <Button 
                onClick={createUserInDatabase}
                size="sm" 
                variant="outline"
              >
                Create User in Database
              </Button>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="flex gap-2">
          <Button 
            onClick={fetchDatabaseUser}
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}