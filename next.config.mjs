import WebpackObfuscator from 'webpack-obfuscator';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // [SECURITY] Force Webpack over Turbopack to support the Obfuscation layer
  transpilePackages: ['webpack-obfuscator', 'javascript-obfuscator'],
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.plugins.push(
        new WebpackObfuscator({
          rotateStringArray: true,
          stringArray: true,
          stringArrayThreshold: 0.75,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.75,
          deadCodeInjection: true,
          deadCodeInjectionThreshold: 0.4,
          identifierNamesGenerator: 'hexadecimal',
          renameGlobals: false,
          selfDefending: true,
          compact: true,
          splitStrings: true,
          splitStringsChunkLength: 10,
          unicodeEscapeSequence: true
        }, ['_next/static/chunks/webpack-*.js'])
      );
    }
    return config;
  },
};

export default nextConfig;
