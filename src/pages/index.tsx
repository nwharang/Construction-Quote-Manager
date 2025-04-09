import type { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';

// This page will redirect to the dashboard for authenticated users
// or show the sign in page for unauthenticated users
export default function Home() {
  // This component won't be rendered as we're using a server-side redirect
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // If the user is authenticated, redirect to the dashboard
  if (session) {
    return {
      redirect: {
        destination: '/admin/dashboard',
        permanent: false,
      },
    };
  }

  // If not authenticated, redirect to sign in page
  return {
    redirect: {
      destination: '/auth/signin',
      permanent: false,
    },
  };
};
