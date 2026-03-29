const Loader = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-emerald-500/40 border-t-emerald-400" />
        <div className="absolute inset-3 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 opacity-70" />
      </div>
    </div>
  );
};

export default Loader;