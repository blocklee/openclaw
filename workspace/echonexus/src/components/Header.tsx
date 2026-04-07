import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, ExternalLink } from 'lucide-react';
import { useStore } from '../store';
import { shortenAddress } from '../utils';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const account = useStore(state => state.account);
  const setAccount = useStore(state => state.setAccount);

  // 模拟连接钱包
  const handleConnect = async () => {
    // 在实际实现中，这里会调用 wagmi 的 connect
    // demo 中使用模拟地址
    setAccount('0x742d35Cc6634C0532925a3b8865C43C53bdf950c');
  };

  const handleDisconnect = () => {
    setAccount(null);
  };

  const navItems = [
    { path: '/', label: '市场' },
    { path: '/explore', label: '探索' },
    { path: '/create', label: '创建' },
    { path: '/dashboard', label: '控制台' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">E</div>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary text-gradient">EchoNexus</h1>
        </div>

        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`transition-colors ${
                isActive(item.path)
                  ? 'text-primary font-medium'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex gap-3 items-center">
          {account ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-gray-600">
                {shortenAddress(account)}
              </span>
              <button
                onClick={handleDisconnect}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors"
              >
                断开
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Wallet size={16} />
              连接钱包
            </button>
          )}

          <button
            id="menu-toggle"
            className="md:hidden text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`py-2 ${
                  isActive(item.path)
                    ? 'text-primary font-medium'
                    : 'text-gray-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
