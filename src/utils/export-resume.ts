export async function downloadResume(content: string, filename: string, format: 'pdf' | 'docx' | 'txt') {
  switch (format) {
    case 'pdf':
      await downloadAsPDF(content, filename)
      break
    case 'txt':
      downloadAsText(content, filename)
      break
    case 'docx':
      // Implement Word export
      break
  }
}

async function downloadAsPDF(htmlContent: string, filename: string) {
  // Create print-friendly version
  const printWindow = window.open('', '', 'width=800,height=600')
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>${filename}</title>
        <style>
          @media print {
            body { margin: 0; }
            @page { size: letter; margin: 0.5in; }
          }
        </style>
      </head>
      <body>${htmlContent}</body>
    </html>
  `)
  
  printWindow.document.close()
  printWindow.focus()
  
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

function downloadAsText(content: string, filename: string) {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '')
  
  const blob = new Blob([text], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.txt`
  a.click()
  window.URL.revokeObjectURL(url)
}

export async function emailResume(content: string, email: string) {
  const response = await fetch('/api/email-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, email })
  })
  
  return response.json()
}