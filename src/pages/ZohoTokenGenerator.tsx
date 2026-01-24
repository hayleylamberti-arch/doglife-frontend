import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, ExternalLink } from 'lucide-react';

const CLIENT_ID = '1000.WFJZPVV0Z5YWCNPQ7TJO7ZZI8YI7HJ';
const CLIENT_SECRET = '7e6c8ed88bae3f11ad8eed1b9fc74e84a7a16ee2f6';
const REDIRECT_URI = 'https://doglife.replit.app/auth/zoho/callback';
const SCOPES = 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL';

export function ZohoTokenGenerator() {
  const [authCode, setAuthCode] = useState('');
  const [result, setResult] = useState<{
    type: 'loading' | 'success' | 'error';
    message: string;
    token?: string;
  } | null>(null);

  const startOAuth = () => {
    const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=${SCOPES}&client_id=${CLIENT_ID}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.open(authUrl, '_blank');
  };

  const exchangeCode = async () => {
    if (!authCode.trim()) {
      setResult({
        type: 'error',
        message: 'Please enter the authorization code'
      });
      return;
    }

    setResult({
      type: 'loading',
      message: 'Exchanging code for tokens...'
    });

    try {
      const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          code: authCode.trim()
        })
      });

      const data = await response.json();

      if (data.error) {
        setResult({
          type: 'error',
          message: `Zoho Error: ${data.error} - ${data.error_description || 'Unknown error'}`
        });
        return;
      }

      if (data.refresh_token) {
        setResult({
          type: 'success',
          message: 'Tokens generated successfully!',
          token: data.refresh_token
        });
      } else {
        setResult({
          type: 'error',
          message: 'No refresh token received. Please try again.'
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const copyToken = () => {
    if (result?.token) {
      navigator.clipboard.writeText(result.token);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-orange-600">
              🔑 Zoho CRM Token Generator for DogLife
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid gap-6">
          {/* Step 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Authorize Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Click the button below to authorize DogLife to access your Zoho CRM:
              </p>
              <Button onClick={startOAuth} className="w-full sm:w-auto">
                <ExternalLink className="mr-2 h-4 w-4" />
                Authorize Zoho CRM Access
              </Button>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 2: Enter Authorization Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                After authorization, you'll be redirected back with a code in the URL. Paste it here:
              </p>
              <Input
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Paste the authorization code here..."
                className="font-mono"
              />
              <Button 
                onClick={exchangeCode} 
                disabled={!authCode.trim() || result?.type === 'loading'}
                className="w-full sm:w-auto"
              >
                {result?.type === 'loading' ? 'Generating...' : 'Generate Refresh Token'}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card>
              <CardContent className="pt-6">
                {result.type === 'loading' && (
                  <Alert>
                    <AlertDescription>🔄 {result.message}</AlertDescription>
                  </Alert>
                )}

                {result.type === 'error' && (
                  <Alert variant="destructive">
                    <AlertDescription>❌ {result.message}</AlertDescription>
                  </Alert>
                )}

                {result.type === 'success' && result.token && (
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">
                        ✅ {result.message}
                      </AlertDescription>
                    </Alert>

                    <div>
                      <h4 className="font-semibold mb-2">🔑 Refresh Token (Copy this to Replit Secrets):</h4>
                      <div className="bg-gray-100 p-3 rounded border font-mono text-sm break-all relative">
                        {result.token}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyToken}
                          className="absolute top-2 right-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">📋 Instructions:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>Copy the refresh token above</li>
                        <li>Go to your Replit project</li>
                        <li>Open the Secrets panel (key icon in sidebar)</li>
                        <li>Find <code className="bg-gray-200 px-1 rounded">ZOHO_REFRESH_TOKEN</code></li>
                        <li>Replace the value with the token above</li>
                        <li>Save the secret</li>
                      </ol>
                      <p className="text-sm text-orange-600 mt-2 font-medium">
                        <strong>Note:</strong> Keep this token secure - it provides access to your Zoho CRM!
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}