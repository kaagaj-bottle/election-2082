import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { Spinner } from '@/components/ui/Spinner';

const HomePage = lazy(() => import('@/features/home/HomePage'));
const CandidatesPage = lazy(() => import('@/features/candidates/CandidatesPage'));
const CandidateDetailPage = lazy(() => import('@/features/candidates/CandidateDetailPage'));
const PartiesPage = lazy(() => import('@/features/parties/PartiesPage'));
const GeographyPage = lazy(() => import('@/features/geography/GeographyPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size="lg" />
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: (
          <SuspenseWrapper>
            <HomePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/candidates',
        element: (
          <SuspenseWrapper>
            <CandidatesPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/candidates/:id',
        element: (
          <SuspenseWrapper>
            <CandidateDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/parties',
        element: (
          <SuspenseWrapper>
            <PartiesPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/geography',
        element: (
          <SuspenseWrapper>
            <GeographyPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
]);
