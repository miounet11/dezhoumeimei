'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Next.js 15 Server Actions for form handling

export async function joinGameAction(formData: FormData) {
  const gameId = formData.get('gameId') as string
  const buyIn = parseInt(formData.get('buyIn') as string)
  
  if (!gameId || !buyIn || buyIn <= 0) {
    return { 
      error: 'Invalid game ID or buy-in amount',
      success: false 
    }
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/game/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId,
        buyIn,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to join game')
    }

    const result = await response.json()
    
    // 重新验证相关数据
    revalidateTag('game-data')
    revalidateTag(`game-${gameId}`)
    revalidatePath('/game')
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Join game error:', error)
    return {
      error: 'Failed to join game. Please try again.',
      success: false,
    }
  }
}

export async function updateProfileAction(formData: FormData) {
  const name = formData.get('name') as string
  const bio = formData.get('bio') as string
  const avatar = formData.get('avatar') as string
  
  if (!name || name.trim().length < 2) {
    return { 
      error: 'Name must be at least 2 characters long',
      success: false 
    }
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.trim(),
        bio: bio?.trim() || '',
        avatar: avatar || '',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to update profile')
    }

    const result = await response.json()
    
    // 重新验证用户相关数据
    revalidateTag('user-profile')
    revalidateTag('user-stats')
    revalidatePath('/profile')
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Update profile error:', error)
    return {
      error: 'Failed to update profile. Please try again.',
      success: false,
    }
  }
}

export async function startTrainingSessionAction(formData: FormData) {
  const sessionType = formData.get('sessionType') as string
  const difficulty = formData.get('difficulty') as string
  const duration = parseInt(formData.get('duration') as string)
  
  if (!sessionType || !difficulty || !duration) {
    return { 
      error: 'Missing required training parameters',
      success: false 
    }
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/training/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionType,
        difficulty,
        duration,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to start training session')
    }

    const result = await response.json()
    
    // 重新验证训练相关数据
    revalidateTag('training-data')
    revalidateTag('user-stats')
    revalidatePath('/ai-training')
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Start training session error:', error)
    return {
      error: 'Failed to start training session. Please try again.',
      success: false,
    }
  }
}

export async function submitCompanionInteractionAction(formData: FormData) {
  const companionId = formData.get('companionId') as string
  const interactionType = formData.get('interactionType') as string
  const message = formData.get('message') as string
  
  if (!companionId || !interactionType) {
    return { 
      error: 'Missing companion interaction parameters',
      success: false 
    }
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/companions/interact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companionId,
        interactionType,
        message: message || '',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to interact with companion')
    }

    const result = await response.json()
    
    // 重新验证陪伴系统数据
    revalidateTag('companion-data')
    revalidateTag(`companion-${companionId}`)
    revalidatePath('/companion-center')
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Companion interaction error:', error)
    return {
      error: 'Failed to interact with companion. Please try again.',
      success: false,
    }
  }
}

// 游戏动作Server Action
export async function submitGameActionServerAction(formData: FormData) {
  const gameId = formData.get('gameId') as string
  const action = formData.get('action') as string
  const amount = formData.get('amount') ? parseInt(formData.get('amount') as string) : undefined
  
  if (!gameId || !action) {
    return { 
      error: 'Missing game action parameters',
      success: false 
    }
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/game/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId,
        action,
        amount,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to submit game action')
    }

    const result = await response.json()
    
    // 重新验证游戏状态
    revalidateTag('game-data')
    revalidateTag(`game-${gameId}`)
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Game action error:', error)
    return {
      error: 'Failed to submit game action. Please try again.',
      success: false,
    }
  }
}

// 处理设置更新
export async function updateSettingsAction(formData: FormData) {
  const settings = {
    notifications: formData.get('notifications') === 'on',
    soundEnabled: formData.get('soundEnabled') === 'on',
    autoFold: formData.get('autoFold') === 'on',
    showStatistics: formData.get('showStatistics') === 'on',
    theme: formData.get('theme') as string || 'light',
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/user/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    })

    if (!response.ok) {
      throw new Error('Failed to update settings')
    }

    const result = await response.json()
    
    // 重新验证设置数据
    revalidateTag('user-settings')
    revalidatePath('/settings')
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Update settings error:', error)
    return {
      error: 'Failed to update settings. Please try again.',
      success: false,
    }
  }
}