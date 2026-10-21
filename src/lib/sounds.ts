let context: AudioContext | null = null

/**
 * Campanita breve al completar una tarea: un arpegio ascendente Do–Mi–Sol
 * sintetizado con Web Audio, sin archivos de audio.
 * Debe llamarse desde un clic para que el navegador permita reproducir sonido.
 */
export function playCompleteSound() {
  try {
    context ??= new AudioContext()
    if (context.state === "suspended") void context.resume()

    const now = context.currentTime
    const master = context.createGain()
    master.gain.value = 0.12
    master.connect(context.destination)

    ;[1046.5, 1318.5, 1568].forEach((freq, i) => {
      const start = now + i * 0.07
      // Fundamental más un armónico suave para que suene a campana.
      for (const [multiple, level] of [[1, 1], [2, 0.25]]) {
        const osc = context!.createOscillator()
        const gain = context!.createGain()
        osc.type = "sine"
        osc.frequency.value = freq * multiple
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(level, start + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6)
        osc.connect(gain).connect(master)
        osc.start(start)
        osc.stop(start + 0.6)
      }
    })
  } catch {
    // Sin soporte de audio: se completa en silencio.
  }
}
