/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" }
    ]
  },
  async redirects() {
    return [
      {
        source: '/player',
        destination: '/',
        permanent: false,
      },
      {
        source: '/favorites',
        destination: '/',
        permanent: false,
      },
      {
        source: '/history',
        destination: '/',
        permanent: false,
      },
      {
        source: '/settings',
        destination: '/',
        permanent: false,
      },
      {
        source: '/about',
        destination: '/',
        permanent: false,
      }
    ]
  }
};

export default nextConfig;
