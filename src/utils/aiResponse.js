const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

const REQUEST_COOLDOWN = 5000
const lastRequestTime = new Map()

const getRandomFallbackResponse = () => {
  const fallbacks = [
    '안녕하세요! 반가워요 😊',
    '오늘 하루는 어땠나요?',
    '재미있는 이야기네요!',
    '그렇군요, 이해했어요.',
    '좋은 하루 보내세요!',
  ]
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

const getAvailableModel = async () => {
  if (!GEMINI_API_KEY) return null

  try {
    const response = await fetch(`${GEMINI_API_BASE}/models?key=${GEMINI_API_KEY}`)
    if (response.ok) {
      const data = await response.json()
      const models = data.models || []
      
      const preferredModels = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-flash-latest',
        'gemini-2.5-pro',
        'gemini-pro-latest',
        'gemini-pro',
      ]
      
      for (const modelName of preferredModels) {
        const model = models.find(m => {
          const name = m.name || ''
          return name.includes(modelName) && m.supportedGenerationMethods?.includes('generateContent')
        })
        if (model) {
          const fullName = model.name
          console.log('선택된 모델:', model.displayName, '(전체 이름:', fullName, ')')
          return fullName
        }
      }
      
      const firstModel = models.find(m => m.supportedGenerationMethods?.includes('generateContent'))
      if (firstModel) {
        const fullName = firstModel.name
        console.log('기본 모델 선택:', firstModel.displayName, '(전체 이름:', fullName, ')')
        return fullName
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error('모델 목록 조회 실패:', response.status, errorData)
    }
  } catch (error) {
    console.error('모델 목록 조회 오류:', error)
  }
  
  console.warn('모델 목록을 가져올 수 없어 기본 모델을 사용합니다.')
  return 'models/gemini-2.5-flash'
}

let cachedModel = null

const generateAIResponse = async (userMessage, roomName, roomId) => {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API 키가 설정되지 않았습니다. 기본 응답을 사용합니다.')
    return getRandomFallbackResponse()
  }

  const now = Date.now()
  const lastRequest = lastRequestTime.get(roomId) || 0
  
  if (now - lastRequest < REQUEST_COOLDOWN) {
    console.log('AI 요청 쿨다운 중...')
    return getRandomFallbackResponse()
  }

  lastRequestTime.set(roomId, now)

  if (!cachedModel) {
    cachedModel = await getAvailableModel()
    console.log('사용 가능한 모델:', cachedModel)
  }

  const modelName = cachedModel || 'models/gemini-2.5-flash'
  const apiUrl = `${GEMINI_API_BASE}/${modelName}:generateContent`

  try {
    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `당신은 "${roomName}" 채팅방의 친근한 AI 챗봇입니다. 사용자들과 자연스럽고 재미있게 대화하세요.\n\n사용자 메시지: ${userMessage}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Gemini API 오류:', errorData)
      
      if (response.status === 401 || response.status === 403) {
        console.error('Gemini API 키가 유효하지 않습니다.')
        return getRandomFallbackResponse()
      } else if (response.status === 404) {
        console.error('Gemini 모델을 찾을 수 없습니다.')
        console.error('시도한 모델:', modelName)
        console.error('API URL:', apiUrl)
        
        cachedModel = null
        const fallbackModel = await getAvailableModel()
        if (fallbackModel && fallbackModel !== modelName) {
          console.log('대체 모델 시도:', fallbackModel)
          cachedModel = fallbackModel
          return generateAIResponse(userMessage, roomName, roomId)
        }
        
        return getRandomFallbackResponse()
      } else if (response.status === 429) {
        console.warn('API 사용량 한도 초과. 기본 응답을 사용합니다.')
        lastRequestTime.set(roomId, now + 120000)
        return getRandomFallbackResponse()
      } else {
        console.error(`Gemini API 오류: ${response.status}`)
        return getRandomFallbackResponse()
      }
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]
    
    if (!candidate) {
      return getRandomFallbackResponse()
    }

    const parts = candidate.content?.parts || []
    const fullText = parts
      .map(part => part.text || '')
      .join('')
      .trim()

    if (!fullText) {
      return getRandomFallbackResponse()
    }

    if (candidate.finishReason === 'MAX_TOKENS') {
      console.warn('응답이 토큰 제한으로 인해 잘렸을 수 있습니다.')
    }

    return fullText
  } catch (error) {
    console.error('AI 응답 생성 오류:', error)
    return getRandomFallbackResponse()
  }
}

export default generateAIResponse
