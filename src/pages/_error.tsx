// src/pages/_error.tsx
import { NextPage } from 'next';
import NotFound from '../components/errors/NotFound';

interface ErrorProps {
  statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <NotFound 
      title="Error Occurred"
      message={
        statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'
      }
    />
  );
};

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;