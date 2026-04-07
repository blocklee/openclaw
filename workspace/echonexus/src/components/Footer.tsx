import React from 'react';
import { Github, Twitter, Globe, MessageSquare } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center gap-2 mb-6 md:mb-0">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-primary font-bold text-xl">E</div>
            <h2 className="text-2xl font-bold">EchoNexus</h2>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Github size={24} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Twitter size={24} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <MessageSquare size={24} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Globe size={24} />
            </a>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
          <p>© 2026 EchoNexus. 能力即资产，调用即分润。</p>
          <p className="mt-2">
            <a href="#" className="text-primary hover:underline">文档</a> | 
            <a href="#" className="text-primary hover:underline ml-2">GitHub</a> | 
            <a href="#" className="text-primary hover:underline ml-2">协议</a>
          </p>
        </div>
      </div>
    </footer>
  );
};
