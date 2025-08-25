"use client";

import React, { useEffect, useState } from 'react';
import { YouTubePlayer } from './YouTubePlayer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function YouTubePlayerTest() {
  const [testResults, setTestResults] = useState<{
    cspTest: 'loading' | 'pass' | 'fail';
    apiTest: 'loading' | 'pass' | 'fail';
  }>({
    cspTest: 'loading',
    apiTest: 'loading'
  });

  useEffect(() => {
    // Test CSP by trying to load YouTube iframe API
    const testCSP = () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.onload = () => {
          setTestResults(prev => ({ ...prev, cspTest: 'pass' }));
        };
        script.onerror = () => {
          setTestResults(prev => ({ ...prev, cspTest: 'fail' }));
        };
        document.head.appendChild(script);
      } catch (error) {
        setTestResults(prev => ({ ...prev, cspTest: 'fail' }));
      }
    };

    // Test YouTube API availability
    const testAPI = () => {
      const checkAPI = () => {
        if (typeof window !== 'undefined' && (window as any).YT) {
          setTestResults(prev => ({ ...prev, apiTest: 'pass' }));
        } else {
          setTimeout(checkAPI, 1000);
        }
      };
      
      setTimeout(() => {
        if (testResults.apiTest === 'loading') {
          setTestResults(prev => ({ ...prev, apiTest: 'fail' }));
        }
      }, 5000);
      
      checkAPI();
    };

    testCSP();
    testAPI();
  }, []);

  const getStatusIcon = (status: 'loading' | 'pass' | 'fail') => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: 'loading' | 'pass' | 'fail') => {
    switch (status) {
      case 'loading':
        return 'Testing...';
      case 'pass':
        return 'Passed';
      case 'fail':
        return 'Failed';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>YouTube Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>CSP Configuration</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.cspTest)}
              <span className="text-sm">{getStatusText(testResults.cspTest)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>YouTube API Loading</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.apiTest)}
              <span className="text-sm">{getStatusText(testResults.apiTest)}</span>
            </div>
          </div>

          {testResults.cspTest === 'fail' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                CSP is blocking YouTube iframe API. Check your Content Security Policy configuration.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sample Video Player</CardTitle>
        </CardHeader>
        <CardContent>
          <YouTubePlayer
            videoId="dQw4w9WgXcQ"
            title="Test Video"
            className="max-w-md"
          />
        </CardContent>
      </Card>
    </div>
  );
}