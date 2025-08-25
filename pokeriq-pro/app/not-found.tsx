'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl shadow-xl mb-8">
          <span className="text-4xl">🃏</span>
        </div>
        
        {/* 404内容 */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">页面不存在</h2>
          <p className="text-gray-600 mb-8">
            抱歉，您访问的页面可能已被移动、删除或从未存在过。
          </p>
        </div>
        
        {/* 操作按钮 */}
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition"
          >
            回到首页
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            返回上一页
          </button>
        </div>
        
        {/* 帮助信息 */}
        <div className="mt-8 text-sm text-gray-500">
          <p>如果您认为这是一个错误，请联系客服</p>
          <div className="mt-4 flex justify-center space-x-6">
            <span>📧 support@pokeriq.pro</span>
            <span>📞 400-123-4567</span>
          </div>
        </div>
      </div>
    </div>
  );
}