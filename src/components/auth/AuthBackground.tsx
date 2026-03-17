export function AuthBackground() {
  return (
    <>
      {/* Animated 3D Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-linear-to-br from-sky-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-linear-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-linear-to-br from-teal-200/20 to-cyan-200/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* 3D Floating Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-40 left-10 w-16 h-16 bg-linear-to-br from-sky-400 to-sky-500 rounded-2xl shadow-2xl transform rotate-12 animate-float" />
        <div className="absolute top-60 right-20 w-12 h-12 bg-linear-to-br from-blue-400 to-blue-500 rounded-xl shadow-2xl transform -rotate-12 animate-float-delay-1" />
        <div className="absolute bottom-40 right-40 w-14 h-14 bg-linear-to-br from-teal-400 to-teal-500 rounded-2xl shadow-2xl transform rotate-6 animate-float-delay-2" />
        <div className="absolute bottom-60 left-32 w-10 h-10 bg-linear-to-br from-indigo-400 to-indigo-500 rounded-xl shadow-2xl transform -rotate-6 animate-float-delay-3" />
      </div>
    </>
  );
}
