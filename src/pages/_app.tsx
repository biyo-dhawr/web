import 'leaflet/dist/leaflet.css'
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Biyo-dhowr | Enterprise Water Monitor</title>
        <meta
          name="description"
          content="Regional water resource management platform for the Awdal Region."
        />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
