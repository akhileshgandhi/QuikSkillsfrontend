import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

// Set worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfProgressViewerProps {
  fileUrl: string;
  courseId: string;
  lessonId: string;
  title?: string;
  initialPage?: number;
  onComplete?: () => void;
}

const PdfProgressViewer: React.FC<PdfProgressViewerProps> = ({
  fileUrl,
  courseId,
  lessonId,
  title = 'PDF Document',
  initialPage = 1,
  onComplete,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [, setViewedPages] = useState<Set<number>>(new Set([initialPage]));
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Load PDF and setup intersection observer
  useEffect(() => {
    if (!numPages || !containerRef.current) return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(
              entry.target.getAttribute('data-page-number') || '1',
            );
            setViewedPages((prev) => {
              const newSet = new Set(prev);
              newSet.add(pageNum);
              const newProgress = Math.round((newSet.size / numPages) * 100);
              setProgress(newProgress);

              // Check completion (95%)
              if (newProgress >= 95 && !isCompleted) {
                setIsCompleted(true);
                handleComplete();
              }

              return newSet;
            });
          }
        });
      },
      { threshold: 0.7 }, // 70% of the page must be visible
    );

    // Observe all page wrappers
    const pages = containerRef.current.querySelectorAll('.pdf-page-wrapper');
    pages.forEach((page) => {
      observerRef.current?.observe(page);
    });

    // Scroll to initial page
    if (initialPage > 1) {
      const targetPage = containerRef.current.querySelector(
        `[data-page-number="${initialPage}"]`,
      );
      if (targetPage) {
        targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [numPages, initialPage, isCompleted]);

  // Track current page on scroll
  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      const pages = containerRef.current?.querySelectorAll('.pdf-page-wrapper');
      if (!pages) return;

      const scrollPosition = (containerRef.current?.scrollTop || 0) + 200; // Offset for header

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const pageTop = page.offsetTop;
        const pageBottom = pageTop + page.offsetHeight;

        if (scrollPosition >= pageTop && scrollPosition < pageBottom) {
          const pageNum = parseInt(page.getAttribute('data-page-number') || '1');
          setCurrentPage(pageNum);
          break;
        }
      }
    };

    containerRef.current.addEventListener('scroll', handleScroll);
    return () => {
      containerRef.current?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleComplete = async () => {
    try {
      await api.post('/learner/complete-resource', {
        courseId,
        subModuleId: lessonId,
        type: 'pdf',
        percentRead: progress,
        lastPageSeen: currentPage,
      });

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Failed to sync PDF progress', err);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    setError('Failed to load PDF. Please try again.');
    setLoading(false);
    console.error('PDF load error:', error);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Header with Progress */}
      <div className="sticky top-0 z-10 bg-white p-4 shadow-sm flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {isCompleted && (
            <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              Completed
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Page {currentPage} of {numPages || '...'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-64 bg-slate-200 rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm font-bold text-gray-700 min-w-[3rem] text-right">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center p-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-semibold mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mt-4"
            >
              Reload PDF
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        </div>
      )}

      {/* PDF Content */}
      {!loading && !error && numPages && (
        <div
          ref={containerRef}
          className="overflow-y-auto p-8 space-y-4 flex flex-col items-center"
        >
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="text-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading document...</p>
              </div>
            }
            error={
              <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <p className="text-red-600">Failed to load PDF</p>
              </div>
            }
          >
            {Array.from(new Array(numPages), (_el, index) => (
              <div
                key={`page_${index + 1}`}
                data-page-number={index + 1}
                className="pdf-page-wrapper shadow-lg mb-8 bg-white"
              >
                <Page
                  pageNumber={index + 1}
                  width={Math.min(800, window.innerWidth - 64)}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </div>
            ))}
          </Document>
        </div>
      )}

      {/* Completion Warning */}
      {progress < 95 && !isCompleted && (
        <div className="sticky bottom-0 bg-yellow-50 border-t border-yellow-200 p-3 text-center">
          <p className="text-sm text-yellow-800">
            Please scroll through at least 95% of the document to proceed to the next lesson.
          </p>
        </div>
      )}
    </div>
  );
};

export default PdfProgressViewer;

