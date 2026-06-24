'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

const DEFAULT_URL =
  process.env.NEXT_PUBLIC_RULETA_URL ?? 'http://localhost:3000/ruleta'

export function QRDisplay() {
  const [url,     setUrl]     = useState(DEFAULT_URL)
  const [dataUrl, setDataUrl] = useState('')
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    QRCode.toDataURL(url, {
      width:  400,
      margin: 2,
      color:  { dark: '#0D0D12', light: '#FFFFFF' },
    })
      .then(setDataUrl)
      .catch(console.error)
  }, [url])

  function handleDownload() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'qr-ruleta.png'
    a.click()
  }

  function handlePrint() {
    if (!dataUrl) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html>
        <head><title>QR Ruleta</title></head>
        <body style="text-align:center;padding:48px;font-family:sans-serif;background:#fff">
          <img src="${dataUrl}" style="width:280px;height:280px" />
          <p style="margin-top:16px;color:#333;font-size:14px;word-break:break-all">${url}</p>
        </body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* QR image */}
      <div className="flex justify-center">
        {dataUrl ? (
          <div className="bg-white rounded-2xl p-4">
            <img src={dataUrl} alt="QR Code" className="w-48 h-48 block" />
          </div>
        ) : (
          <div className="w-56 h-56 bg-white/5 rounded-2xl flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#7C5CFC] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* URL editable */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-white/40 uppercase tracking-wide font-medium">
          URL del QR
        </label>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="bg-[#0D0D12] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C5CFC] transition-colors"
        />
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleDownload}
          disabled={!dataUrl}
          className="flex-1 py-2.5 bg-[#7C5CFC] hover:bg-[#6a4de0] text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors"
        >
          Descargar PNG
        </button>
        <button
          onClick={handlePrint}
          disabled={!dataUrl}
          className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors border border-white/10"
        >
          Imprimir
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl transition-colors border border-white/10"
        >
          {copied ? '¡Copiado!' : 'Copiar URL'}
        </button>
      </div>
    </div>
  )
}
