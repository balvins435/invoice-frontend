import type { NextPageContext } from 'next';

type ErrorPageProps = {
  statusCode?: number;
};

function ErrorPage({ statusCode }: ErrorPageProps) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: 'system-ui, sans-serif',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div>
        <p style={{ fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55 }}>
          SmartInvoice
        </p>
        <h1 style={{ marginTop: '12px', fontSize: '28px', fontWeight: 700 }}>
          {statusCode ? `Error ${statusCode}` : 'Unexpected error'}
        </h1>
        <p style={{ marginTop: '10px', fontSize: '15px', lineHeight: 1.7, opacity: 0.72 }}>
          The page could not be loaded. Please refresh or return to the dashboard.
        </p>
      </div>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode || err?.statusCode || 404;
  return { statusCode };
};

export default ErrorPage;
