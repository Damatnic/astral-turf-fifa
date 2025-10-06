/**
 * Mobile-Optimized Webpack Configuration
 * 
 * This configuration targets a 30% bundle size reduction through:
 * 1. Code splitting for mobile-specific components
 * 2. Tree shaking and dead code elimination
 * 3. Asset optimization and compression
 * 4. Lazy loading strategies
 */

const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  const isAnalyze = env && env.analyze;

  return {
    mode: isDevelopment ? 'development' : 'production',
    
    entry: {
      main: './src/index.tsx',
      // Separate mobile bundle for code splitting
      mobile: './src/components/tactics/mobile/index.ts',
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isDevelopment 
        ? '[name].bundle.js' 
        : '[name].[contenthash:8].bundle.js',
      chunkFilename: isDevelopment
        ? '[name].chunk.js'
        : '[name].[contenthash:8].chunk.js',
      publicPath: '/',
      clean: true,
    },

    optimization: {
      minimize: !isDevelopment,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true, // Remove console.log in production
              drop_debugger: true,
              pure_funcs: ['console.info', 'console.debug', 'console.warn'],
              passes: 2,
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],

      // Optimize bundle splitting
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor bundle for React and core libs
          vendor: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
            name: 'vendor',
            priority: 20,
            reuseExistingChunk: true,
          },

          // Framer Motion bundle (large animation lib)
          framerMotion: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: 'framer-motion',
            priority: 15,
            reuseExistingChunk: true,
          },

          // UI libraries (lucide-react, etc.)
          ui: {
            test: /[\\/]node_modules[\\/](lucide-react|@radix-ui)[\\/]/,
            name: 'ui-libs',
            priority: 10,
            reuseExistingChunk: true,
          },

          // Mobile-specific components
          mobile: {
            test: /[\\/]src[\\/]components[\\/]tactics[\\/]mobile[\\/]/,
            name: 'mobile-components',
            priority: 12,
            reuseExistingChunk: true,
            minSize: 10000,
          },

          // Common utilities used across the app
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            minSize: 5000,
          },
        },
      },

      // Module IDs optimization
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
    },

    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: isDevelopment,
                compilerOptions: {
                  module: 'esnext',
                },
              },
            },
          ],
          exclude: /node_modules/,
        },

        // CSS optimization
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: true,
                  localIdentName: isDevelopment
                    ? '[name]__[local]--[hash:base64:5]'
                    : '[hash:base64:8]',
                },
              },
            },
            'postcss-loader',
          ],
        },

        // Image optimization
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 8kb - inline smaller images
            },
          },
          generator: {
            filename: 'images/[name].[hash:8][ext]',
          },
        },

        // Font optimization
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash:8][ext]',
          },
        },
      ],
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@mobile': path.resolve(__dirname, 'src/components/tactics/mobile'),
      },
      // Only include necessary polyfills
      fallback: {
        crypto: false,
        stream: false,
        buffer: false,
      },
    },

    plugins: [
      // Environment variables
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(
          isDevelopment ? 'development' : 'production'
        ),
        'process.env.MOBILE_OPTIMIZED': JSON.stringify(true),
      }),

      // Gzip compression for production
      !isDevelopment &&
        new CompressionPlugin({
          filename: '[path][base].gz',
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192, // Only compress files > 8kb
          minRatio: 0.8,
        }),

      // Bundle analyzer (run with --env analyze)
      isAnalyze &&
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: 'bundle-report.html',
          openAnalyzer: true,
        }),

      // Progress plugin for build feedback
      new webpack.ProgressPlugin(),
    ].filter(Boolean),

    // Performance hints
    performance: {
      maxEntrypointSize: 512000, // 500kb
      maxAssetSize: 256000, // 250kb
      hints: isDevelopment ? false : 'warning',
    },

    // Development server config
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 3000,
      hot: true,
      historyApiFallback: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },

    // Source maps for debugging
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',

    // Stats configuration
    stats: {
      assets: true,
      chunks: true,
      modules: false,
      entrypoints: true,
      performance: true,
      timings: true,
    },
  };
};
