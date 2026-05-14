/** @type {import('next').NextConfig} */
const nextConfig = {
  // ================================================================
  // Standalone output — required for Node.js deploy (Hostinger)
  // ================================================================
  output: "standalone",

  // ================================================================
  // Image optimization — allow external sources
  // ================================================================
  images: {
    remotePatterns: [
      // Supabase Storage (logos de propostas, avatares, etc.)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Domínio próprio
      {
        protocol: "https",
        hostname: "crm2g.com",
      },
      {
        protocol: "https",
        hostname: "www.crm2g.com",
      },
    ],
    // Formatos modernos
    formats: ["image/avif", "image/webp"],
  },

  // ================================================================
  // Security headers
  // ================================================================
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Força HTTPS por 2 anos
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Impede clickjacking
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Impede MIME sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Controla informações de referência
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          // Restringe permissões do browser
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // DNS prefetch
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      // Cache agressivo para assets estáticos
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache para fontes
      {
        source: "/fonts/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // ================================================================
  // Configurações de performance
  // ================================================================
  poweredByHeader:   false,  // Remove header "X-Powered-By: Next.js"
  compress:          true,   // Gzip/Brotli
  reactStrictMode:   true,

  // ================================================================
  // Redirects: www → apex
  // ================================================================
  async redirects() {
    return [
      {
        source:      "/:path*",
        has:         [{ type: "host", value: "www.crm2g.com" }],
        destination: "https://crm2g.com/:path*",
        permanent:   true,
      },
    ];
  },
};

export default nextConfig;
