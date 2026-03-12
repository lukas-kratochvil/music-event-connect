const Header = () => (
  <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
    <div className="container mx-auto flex h-16 items-center px-4">
      <h1 className="text-xl font-bold tracking-tight">Music Event Connect</h1>
      <nav className="ml-auto flex gap-4 text-sm font-medium">
        <div>Log in to Spotify</div>
      </nav>
    </div>
  </header>
);

export default Header;
