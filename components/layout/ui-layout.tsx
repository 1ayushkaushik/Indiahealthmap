import { Navbar } from "./navbar";

interface UI_LayoutProps {
  children: React.ReactNode;
}

const UI_Layout: React.FC<UI_LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-2 sm:space-y-4">
        {children}
      </div>
    </div>
  )
}

export default UI_Layout;