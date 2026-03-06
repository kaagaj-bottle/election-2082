import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { Spinner } from '@/components/ui/Spinner';

const HomePage = lazy(() => import('@/features/home/HomePage'));
const CandidatesPage = lazy(() => import('@/features/candidates/CandidatesPage'));
const CandidateDetailPage = lazy(() => import('@/features/candidates/CandidateDetailPage'));
const PartiesPage = lazy(() => import('@/features/parties/PartiesPage'));
const GeographyPage = lazy(() => import('@/features/geography/GeographyPage'));
const StatsPage = lazy(() => import('@/features/stats/StatsPage'));
const GuidelinesPage = lazy(() => import('@/features/guidelines/GuidelinesPage'));
const ResultsPage = lazy(() => import('@/features/results/ResultsPage'));
const ProvinceResultsPage = lazy(() => import('@/features/results/ProvinceResultsPage'));
const NewsPage = lazy(() => import('@/features/news/NewsPage'));
const MapPage = lazy(() => import('@/features/map/MapPage'));
const HotSeatsPage = lazy(() => import('@/features/hotseats/HotSeatsPage'));

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
        path: '/results',
        element: (
          <SuspenseWrapper>
            <ResultsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/results/province/:provinceId',
        element: (
          <SuspenseWrapper>
            <ProvinceResultsPage />
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
      {
        path: '/stats',
        element: (
          <SuspenseWrapper>
            <StatsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/guidelines',
        element: (
          <SuspenseWrapper>
            <GuidelinesPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/news',
        element: (
          <SuspenseWrapper>
            <NewsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/hotseats',
        element: (
          <SuspenseWrapper>
            <HotSeatsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/map',
        element: (
          <SuspenseWrapper>
            <MapPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
]);
