import toast from 'react-hot-toast';

/**
 * 用户反馈工具类
 */
export class UserFeedback {
  /**
   * 成功消息
   */
  static success(message: string, options?: any) {
    return toast.success(message, {
      ...options,
      className: 'toast-success',
    });
  }

  /**
   * 错误消息
   */
  static error(message: string, options?: any) {
    return toast.error(message, {
      ...options,
      className: 'toast-error',
    });
  }

  /**
   * 信息消息
   */
  static info(message: string, options?: any) {
    return toast(message, {
      ...options,
      icon: 'ℹ️',
      className: 'toast-info',
      style: {
        background: '#3b82f6',
        color: '#fff',
      },
    });
  }

  /**
   * 警告消息
   */
  static warning(message: string, options?: any) {
    return toast(message, {
      ...options,
      icon: '⚠️',
      className: 'toast-warning',
      style: {
        background: '#f59e0b',
        color: '#fff',
      },
    });
  }

  /**
   * 加载消息
   */
  static loading(message: string, options?: any) {
    return toast.loading(message, {
      ...options,
      className: 'toast-loading',
    });
  }

  /**
   * Promise处理
   */
  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: any
  ) {
    return toast.promise(promise, messages, options);
  }

  /**
   * 自定义消息
   */
  static custom(content: React.ReactNode, options?: any) {
    return toast.custom(content, options);
  }

  /**
   * 移除消息
   */
  static dismiss(toastId?: string) {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }

  /**
   * 游戏相关反馈
   */
  static gameAction(action: string, result: 'success' | 'error' | 'info') {
    const messages = {
      fold: '弃牌',
      check: '过牌',
      call: '跟注',
      raise: '加注',
      allin: '全下',
    };

    const actionName = messages[action.toLowerCase() as keyof typeof messages] || action;
    
    switch (result) {
      case 'success':
        return this.success(`${actionName}成功`);
      case 'error':
        return this.error(`${actionName}失败`);
      default:
        return this.info(actionName);
    }
  }

  /**
   * 成就解锁
   */
  static achievement(name: string, description?: string) {
    return this.custom(
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">成就解锁！</p>
          <p className="text-sm text-gray-500">{name}</p>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
      </div>,
      {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#fff',
          color: '#111827',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        },
      }
    );
  }

  /**
   * 等级提升
   */
  static levelUp(newLevel: number) {
    return this.custom(
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">等级提升！</p>
          <p className="text-sm text-gray-500">恭喜达到 {newLevel} 级</p>
        </div>
      </div>,
      {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#fff',
          color: '#111827',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        },
      }
    );
  }

  /**
   * 网络错误
   */
  static networkError(retry?: () => void) {
    return this.custom(
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">网络连接失败</span>
        </div>
        {retry && (
          <button
            onClick={() => {
              this.dismiss();
              retry();
            }}
            className="ml-4 text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            重试
          </button>
        )}
      </div>,
      {
        duration: 5000,
        style: {
          background: '#fff',
          color: '#111827',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      }
    );
  }

  /**
   * 复制成功
   */
  static copied() {
    return this.success('已复制到剪贴板', {
      duration: 2000,
      icon: '📋',
    });
  }

  /**
   * 保存成功
   */
  static saved() {
    return this.success('保存成功', {
      duration: 2000,
      icon: '💾',
    });
  }

  /**
   * 删除确认
   */
  static confirmDelete(onConfirm: () => void, itemName?: string) {
    return this.custom(
      <div className="p-4">
        <p className="text-sm font-medium text-gray-900 mb-3">
          确定要删除{itemName ? ` "${itemName}"` : '这个项目'}吗？
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              this.dismiss();
              onConfirm();
            }}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            删除
          </button>
          <button
            onClick={() => this.dismiss()}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            取消
          </button>
        </div>
      </div>,
      {
        duration: Infinity,
        position: 'top-center',
        style: {
          background: '#fff',
          color: '#111827',
          padding: '0',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          maxWidth: '320px',
        },
      }
    );
  }
}