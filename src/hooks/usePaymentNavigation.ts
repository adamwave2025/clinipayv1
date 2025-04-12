
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

export function usePaymentNavigation() {
  const navigate = useNavigate();
  const { linkId } = useParams<{ linkId: string }>();
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get('error');

  const navigateToFailedPage = useCallback(() => {
    const failedUrl = `/payment/failed${linkId ? `?link_id=${linkId}` : ''}`;
    navigate(failedUrl);
  }, [navigate, linkId]);

  return {
    linkId,
    errorParam,
    navigateToFailedPage
  };
}
