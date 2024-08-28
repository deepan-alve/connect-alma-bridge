export const Hero = () => {
  return (
    <div className="relative h-48 w-full overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1562774053-701939374585?w=1600&h=400&fit=crop"
        alt="University Campus"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="mb-2 flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white">
              <span className="text-2xl font-bold">AC</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">ALUMNI CAREER</h1>
          <p className="text-xl md:text-2xl font-light tracking-wide">NETWORKING HUB</p>
        </div>
      </div>
    </div>
  );
};
