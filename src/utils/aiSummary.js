const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

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
          return model.name
        }
      }
      
      const firstModel = models.find(m => m.supportedGenerationMethods?.includes('generateContent'))
      if (firstModel) {
        return firstModel.name
      }
    }
  } catch (error) {
    console.error('모델 목록 조회 오류:', error)
  }
  
  return 'models/gemini-2.5-flash'
}

let cachedModel = null

const generateSummary = async (messages, roomName) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API 키가 설정되지 않았습니다.')
  }

  if (!cachedModel) {
    cachedModel = await getAvailableModel()
  }

  const modelName = cachedModel || 'models/gemini-2.5-flash'
  const apiUrl = `${GEMINI_API_BASE}/${modelName}:generateContent`

  const conversationText = messages
    .map((msg) => {
      const time = new Date(msg.created_at).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return `[${time}] ${msg.user}: ${msg.text}`
    })
    .join('\n')

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
                text: `다음은 "${roomName}" 채팅방의 대화 내용입니다. 이 대화를 간결하고 명확하게 요약해주세요. 주요 주제, 중요한 정보, 결정 사항 등을 포함해주세요.\n\n대화 내용:\n${conversationText}`,
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
        throw new Error('Gemini API 키가 유효하지 않습니다.')
      } else if (response.status === 404) {
        cachedModel = null
        const fallbackModel = await getAvailableModel()
        if (fallbackModel && fallbackModel !== modelName) {
          cachedModel = fallbackModel
          return generateSummary(messages, roomName)
        }
        throw new Error('사용 가능한 모델을 찾을 수 없습니다.')
      } else if (response.status === 429) {
        throw new Error('API 사용량 한도 초과. 잠시 후 다시 시도해주세요.')
      } else {
        throw new Error(`Gemini API 오류: ${response.status}`)
      }
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]
    
    if (!candidate) {
      throw new Error('AI 응답을 받을 수 없습니다.')
    }

    const parts = candidate.content?.parts || []
    const fullText = parts
      .map(part => part.text || '')
      .join('')
      .trim()

    if (!fullText) {
      throw new Error('AI 응답이 비어있습니다.')
    }

    return fullText
  } catch (error) {
    console.error('AI 요약 생성 오류:', error)
    throw error
  }
}

export default generateSummary
