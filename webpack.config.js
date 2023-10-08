import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin'

const Modes = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
};

const __dirname = path.resolve();

export default (env, { mode }) => {
    const isProduction = mode === Modes.PRODUCTION;

    return {
        mode,
        entry: path.join(__dirname, 'src', 'main.tsx'),
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.jsx'],
        },
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, 'build'),
            publicPath: '/',
        },
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)?$/,
                    use: 'ts-loader',
                    exclude: [/node_modules/, /dex-runtime/],
                    resolve: {
                        fullySpecified: false
                    }
                },
                // {
                //     test: /\.?js$/,
                //     exclude: [/node_modules/, path.resolve('../dex-runtime/node_modules/**')],
                //     use: {
                //         loader: 'babel-loader',
                //     },
                //     resolve: {
                //         fullySpecified: true
                //     }
                // },
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.(png|jp(e*)g|gif|webp|avif)$/,
                    use: ['file-loader'],
                },
                {
                    test: /\.svg$/,
                    use: ['@svgr/webpack'],
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: path.join(__dirname, 'index.html'),
                // favicon: path.join(__dirname, 'src', 'assets/images/favicon.ico'),
            }),
        ],

        performance: {
            maxEntrypointSize: Infinity,
            maxAssetSize: 1024 ** 2,
        },

        devtool: isProduction ? 'source-map' : 'inline-source-map',

        devServer: {
            host: 'localhost',
            port: 3000,
            historyApiFallback: true,
        },
    };
};