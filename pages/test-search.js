// pages/test-search.js
import ManualSearchForm from '../components/ManualSearchForm'

export default function TestSearch() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Job Aggregator Test</h1>
        <ManualSearchForm />
      </div>
    </div>
  )
}