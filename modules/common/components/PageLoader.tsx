import { FiLoader } from 'react-icons/fi';

export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <FiLoader className="animate-spin text-3xl text-blue-400" />
    </div>
  );
}
