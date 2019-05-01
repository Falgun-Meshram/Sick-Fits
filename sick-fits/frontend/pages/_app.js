import App, { Container } from 'next/app';
import { ApolloProvider } from 'react-apollo';

import withData from '../lib/withData';
import Pages from '../components/Pages';

class MyApp extends App {
  static async getInitialProps({ Component, ctx }) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps();
    }
    pageProps.query = ctx.query;
    return { pageProps };
  }

  render() {
    const { Component, apollo, pageProps } = this.props;
    return (
      <Container>
        <ApolloProvider client={apollo}>
          <Pages>
            <Component {...pageProps} />
          </Pages>
        </ApolloProvider>
      </Container>
    );
  }
}

export default withData(MyApp);
