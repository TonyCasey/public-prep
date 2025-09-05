export default function TestRoutePage() {
  console.log('TestRoutePage: Component mounted');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Simple Test Route</h1>
        <p>If you can see this, protected routes are working!</p>
      </div>
    </div>
  );
}