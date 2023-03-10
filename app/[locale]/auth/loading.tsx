import { FiLoader } from 'react-icons/fi';

export default function Loading() {
  return (
    <div className="text-center text-blue-300">
      <FiLoader className="inline-block animate-spin text-3xl" />
    </div>
  );
}
