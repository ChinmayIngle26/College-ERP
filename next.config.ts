
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
         protocol: 'https',
         hostname: 'placehold.co',
         port: '',
         pathname: '/**',
      },
      {
         protocol: 'https',
         hostname: '**',
      }
    ],
  },
  serverExternalPackages: ['firebase-admin', 'google-auth-library', '@genkit-ai/googleai', '@genkit-ai/next', 'genkit'],
  
  allowedDevOrigins: [
    // For local development
    'http://localhost:9002', 
    'http://localhost:9003',
    'http://localhost:9004', // Added for the new port
    'http://localhost:*',    

    // Specific IDX Preview URLs from warning (ensure both http/https for completeness, though https is typical)
    'https://9003-idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev',
    'http://9003-idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev',
    'https://9004-idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev', // Added for new port
    'http://9004-idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev', // Added for new port
    
    // Original broader wildcards for IDX (keeping these for general IDX usage)
    'https://idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev', // without port as subdomain
    'https://*.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev', 
    'https://*.cloudworkstations.dev', 
  ],
};

export default nextConfig;
