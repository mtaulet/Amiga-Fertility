export async function transcribeAudio(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const region = process.env.AZURE_SPEECH_REGION ?? 'swedencentral'
  const key = process.env.AZURE_SPEECH_KEY

  if (!key) throw new Error('AZURE_SPEECH_KEY not configured')

  const url = `https://${region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-11-15`

  const form = new FormData()
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
  form.append('audio', new Blob([arrayBuffer], { type: mimeType || 'audio/mpeg' }), filename)
  form.append('definition', JSON.stringify({ locales: ['en-US'], profanityFilterMode: 'None' }))

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': key },
    body: form,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Azure Speech transcription failed (${response.status}): ${text}`)
  }

  const result = await response.json()
  return result.combinedPhrases?.[0]?.text ?? ''
}
