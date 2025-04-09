import { Html, Head, Main, NextScript } from 'next/document';
import Document from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="apple-mobile-web-app-title" content="TTXD" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
