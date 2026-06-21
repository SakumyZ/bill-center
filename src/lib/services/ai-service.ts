export async function streamAIAnalyze(
  billsForAI: Array<{ index: number; remark: string; amount: number; type: string }>,
  onProgress: (progress: number) => void
) {
  const response = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bills: billsForAI.map(b => ({
        remark: b.remark,
        amount: b.amount,
        type: b.type
      }))
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'AI 分析失败')
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取响应流')
  }

  const decoder = new TextDecoder()
  let accumulatedText = ''
  let done = false

  while (!done) {
    const { value, done: readerDone } = await reader.read()
    done = readerDone
    if (value) {
      const chunkText = decoder.decode(value, { stream: !done })
      accumulatedText += chunkText

      const matches = [...accumulatedText.matchAll(/"progress"\s*:\s*(\d+)/g)]
      if (matches.length > 0) {
        const latestProgress = Math.min(Math.max(...matches.map(m => parseInt(m[1], 10))), 100)
        onProgress(latestProgress)
      }
    }
  }

  let cleanContent = accumulatedText.trim()
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '')
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '')
  }

  const parsed = JSON.parse(cleanContent)
  return Array.isArray(parsed) ? parsed : parsed.suggestions || parsed.results || [parsed]
}
