'use client';

interface AppHeaderProps {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showDivider?: boolean;
}

const AppHeader = ({ title, left, right, showDivider = true }: AppHeaderProps) => {
  return (
    <div>
      <div className="flex items-center justify-between pt-4 pb-2">
        <div className="flex items-center space-x-4">
          {left && <div>{left}</div>}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl tracking-tight font-medium"
            style={{
              backgroundImage: 'linear-gradient(to right, #2563eb, #7e22ce)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}
          >
            {title}
          </h1>
        </div>
        {right && <div className="flex items-center space-x-4">{right}</div>}
      </div>
      {showDivider && <hr className="border-t border-gray-600 mb-6" />}
    </div>
  );
};

export default AppHeader;
