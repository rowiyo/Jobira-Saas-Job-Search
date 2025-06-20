import { JoobleSearch } from '@/components/jooble-search';

export default function TestJooblePage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Test Jooble Integration</h1>
      <JoobleSearch />
    </div>
  );
}